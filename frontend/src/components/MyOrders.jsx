// src/components/MyOrders.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Added Link import
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import OrderCard from "./OrderCard";

const API_URL = import.meta.env.VITE_API_URL;

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const socket = useSocket();

  // 1. Initial Fetch
  useEffect(() => {
    const fetchOrders = async () => {
      // If no token, stop loading immediately (UI will handle the rest)
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

  // 2. Real-time Listener for status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (payload) => {
      console.log("🔔 orderStatusUpdate received in MyOrders:", payload);

      const updatedOrder = payload?.order || payload;

      if (!updatedOrder || !updatedOrder._id) {
        console.warn("⚠️ Invalid orderStatusUpdate payload:", payload);
        return;
      }

      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === updatedOrder._id);
        if (idx === -1) {
          return [updatedOrder, ...prev];
        }
        return prev.map((o) =>
          o._id === updatedOrder._id ? updatedOrder : o
        );
      });
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [socket]);

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
      
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-40 text-center text-white">
        Loading...
      </div>
    );
  }

  // --- NEW: CHECK IF LOGGED IN ---
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

  return (
    <div className="container mx-auto min-h-screen pt-32 pb-20 px-4">
      <h1 className="text-4xl font-extrabold text-center text-white mb-12">
        My Orders
      </h1>
      <div className="max-w-3xl mx-auto space-y-6">
        {orders.length === 0 ? (
          <p className="text-center text-gray-400 text-xl">
            You haven't placed any orders yet.
          </p>
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
