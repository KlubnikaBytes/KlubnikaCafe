import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import OrderCard from "./OrderCard";

const API_URL = import.meta.env.VITE_API_URL;

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth(); // ✅ Ensure 'user' is destructured if available in AuthContext
  
  const { socket } = useSocket();

  // 1. Initial Fetch of Orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  // 2. Real-time Listener & Room Management
  useEffect(() => {
    if (!socket || !token) return;

    // --- 📡 ROOM JOINING LOGIC ---
    // Try to get userId from AuthContext first, then fallback to localStorage
    const userId = user?._id || localStorage.getItem("userId");

    if (userId) {
      console.log(`📡 [SOCKET] MyOrders: Joining private room ${userId}`);
      socket.emit("joinRoom", userId);
      
      // Optional: Add a listener for successful join if your backend emits one
      socket.on("joinedRoom", (roomId) => {
        console.log(`✅ [SOCKET] Successfully confirmed in room: ${roomId}`);
      });
    } else {
      console.warn("⚠️ [SOCKET] No userId found. Real-time updates may not work.");
    }

    // --- 🔔 STATUS UPDATE LISTENER ---
    const handleStatusUpdate = (payload) => {
      console.log("🔔 [SOCKET] Status Update Received:", payload);
      
      // Handle payload regardless of whether it's the raw order or wrapped in an object
      const updatedOrder = payload?.order || payload;

      if (updatedOrder && updatedOrder._id) {
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      }
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);

    // Cleanup on unmount
    return () => {
      console.log("🚫 [SOCKET] Cleaning up MyOrders listeners");
      socket.off("orderStatusUpdate", handleStatusUpdate);
      if (socket.off) socket.off("joinedRoom");
    };
  }, [socket, token, user]); // Added user to dependencies

  // 3. Cancel Handler
  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: "User requested cancellation" })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      
      alert("Order cancelled successfully. Refund initiated.");
      
      // Real-time local update in case socket hasn't fired yet
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Cancelled' } : o));
      
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen pt-40 text-center text-white">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  // Not Logged In State
  if (!token) {
    return (
      <div className="container mx-auto min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-700">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-white mb-4">Login Required</h2>
            <p className="text-gray-400 mb-8">
                Please log in to access your order history and track your deliveries.
            </p>
            <Link 
                to="/auth" 
                className="inline-block px-8 py-3 bg-primary hover:bg-rose-600 text-white rounded-full font-bold shadow-lg transition-all transform hover:scale-105"
            >
                Login Now
            </Link>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="container mx-auto min-h-screen pt-32 pb-20 px-4">
      <h1 className="text-4xl font-extrabold text-center text-white mb-12">
        My Orders
      </h1>
      <div className="max-w-3xl mx-auto space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-3xl border border-dashed border-gray-700">
            <p className="text-gray-400 text-xl">
              You haven't placed any orders yet.
            </p>
            <Link to="/menu" className="text-primary hover:underline mt-4 inline-block">
              Browse Menu
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard 
                key={order._id} 
                order={order} 
                onCancelOrder={handleCancelOrder}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;