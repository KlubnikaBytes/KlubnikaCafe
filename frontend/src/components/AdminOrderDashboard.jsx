// src/components/AdminOrderDashboard.jsx
import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

const API_URL = import.meta.env.VITE_API_URL;

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();
  const adminToken = localStorage.getItem("klubnikaAdminToken");

  // 1. Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Orders
        const orderRes = await fetch(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const orderData = await orderRes.json();
        const sortedOrders = (Array.isArray(orderData) ? orderData : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);

        // Fetch Delivery Boys
        const dbRes = await fetch(`${API_URL}/admin/delivery-boys`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        
        const dbData = await dbRes.json();

        if (Array.isArray(dbData)) {
            setDeliveryBoys(dbData);
        } else {
            console.error("Failed to load delivery staff:", dbData);
            setDeliveryBoys([]); 
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setDeliveryBoys([]); 

      } finally {
        setLoading(false);
      }
    };
    if (adminToken) fetchData();

  }, [adminToken]);

  // 2. Real-time Listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit("adminJoin");

    const handleNewOrder = (newOrder) => {

      setOrders((prev) => [newOrder, ...prev]);
    };

    const handleStatusUpdate = (payload) => {
      const updatedOrder = payload?.order || payload;
      if (!updatedOrder?._id) return;
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("orderStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [socket]);

  // 3. Update Status Function
  const handleUpdateStatus = async (orderId, newStatus, deliveryBoyId = null) => {

    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ 
            status: newStatus,
            deliveryBoyId: deliveryBoyId 
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const updatedOrder = await res.json(); 


      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? updatedOrder : o))
      );
      
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // 4. Cancel/Reject Function
  const handleCancelOrder = async (orderId, paymentMethodStr) => {
    const reason = prompt("Enter rejection reason:", "Unfortunately we cannot fulfill this order.");
    if (!reason) return; 

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({ reason }),
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to cancel");
        }

        const responseData = await res.json();
        const cancelledOrder = responseData.order || responseData; 

        setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? cancelledOrder : o))
        );
        
        if (paymentMethodStr && (paymentMethodStr.includes("Cash") || paymentMethodStr.includes("Counter"))) {
             alert("Order Cancelled. ⚠️ No refund needed (Unpaid Order).");
        } else {
             alert("Order Cancelled. Refund initiated via Razorpay.");
        }

    } catch (err) {
        alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="text-center text-white mt-10">Loading orders...</div>;

  const activeOrders = orders.filter(
    (o) => o.status !== "Delivered" && o.status !== "Cancelled"
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeOrders.length === 0 && (
        <p className="text-gray-400 text-xl col-span-full text-center">
          No active orders.
        </p>
      )}
      {activeOrders.map((order) => (
        <AdminOrderCard
          key={order._id}
          order={order}
          deliveryBoys={deliveryBoys} 
          onUpdateStatus={handleUpdateStatus}
          onCancelOrder={handleCancelOrder}
        />
      ))}
    </div>
  );
};

const AdminOrderCard = ({ order, deliveryBoys, onUpdateStatus, onCancelOrder }) => {
  const { status } = order;
  const isDineIn = order.orderType === 'Dine-in';
  const [showAssign, setShowAssign] = useState(false);
  const [selectedBoy, setSelectedBoy] = useState("");
  const paymentMethod = order.paymentMethod || "Unknown";
  const isCOD = paymentMethod.includes("Cash on Delivery");
  const isPayAtCounter = paymentMethod.includes("Pay at Counter");
  let badgeColor = "bg-green-600 text-white border-transparent";
  let badgeText = "💳 ONLINE PAID";
  if (isCOD) {
      badgeColor = "bg-transparent text-yellow-400 border border-yellow-400";
      badgeText = "💰 CASH ON DELIVERY";
  } else if (isPayAtCounter) {
      badgeColor = "bg-transparent text-purple-400 border border-purple-400";
      badgeText = "🏦 PAY AT COUNTER";
  }

  const [copied, setCopied] = useState(false);
  const handleCopyAddress = () => {
    if (order.deliveryAddress) {
      navigator.clipboard.writeText(order.deliveryAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseItemPrice = (priceVal) => {
    if (!priceVal) return 0;
    if (typeof priceVal === 'number') return priceVal;

    const cleanString = priceVal.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleanString) || 0;
  };

  // ✅ FILTER: Only show Delivery Boys who are ONLINE
  // We check if 'isAvailable' is true. 
  // If the field is missing (old data), we default to false (not shown).
  const availableDeliveryBoys = deliveryBoys.filter(boy => boy.isAvailable === true);


  return (
    <div className={`rounded-lg shadow-lg p-5 flex flex-col animate-fadeIn border transition-colors ${isDineIn ? 'bg-gray-800 border-purple-500 hover:border-purple-400' : 'bg-gray-800 border-gray-700 hover:border-rose-500'}`}>
      
      {/* HEADER */}
      <div className="border-b border-gray-700 pb-3 mb-3 flex justify-between items-start">
        <div>
            <h3 className="text-xl font-bold text-white">#{order._id.slice(-6).toUpperCase()}</h3>
            <p className="text-sm text-gray-400">{order.user?.name || "Customer"}</p>
            <p className="text-sm text-gray-400">{order.user?.mobile || "No mobile"}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-bold px-2 py-1 rounded ${isDineIn ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                {isDineIn ? 'DINE-IN' : 'DELIVERY'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                {badgeText}
            </span>
        </div>
      </div>

      {/* LOCATION */}
      <div className="mb-4 bg-gray-900 p-3 rounded-md relative group text-center">
        {isDineIn ? (
            <>
                <h4 className="text-purple-400 text-xs uppercase font-bold tracking-wider mb-1">Table Number</h4>
                <p className="text-4xl font-extrabold text-white">{order.tableNumber}</p>
            </>
        ) : (
            <>
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-primary text-xs uppercase tracking-wider">Delivery Address</h4>
                    <button 
                        onClick={handleCopyAddress}
                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
                    >
                        {copied ? <span className="text-green-400 font-bold">✓ Copied!</span> : <span>Copy</span>}
                    </button>
                </div>
                
                <p className="text-gray-300 text-sm leading-snug break-words mb-2 text-left">
                    {order.deliveryAddress || "No address provided"}
                </p>
                {(order.deliveryCoords) && (
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryCoords?.lat},${order.deliveryCoords?.lng}`}

                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors"
                    >
                        📍 Open in Google Maps
                    </a>
                )}
            </>
        )}
      </div>

      {/* ITEMS */}
      <div className="mb-4 flex-grow">
        <h4 className="font-semibold text-primary mb-1">Items:</h4>
        <div className="max-h-32 overflow-y-auto pr-1">
            <ul className="list-disc list-inside text-gray-300 text-sm">
            {order.items.map((item, i) => {
                const cleanPrice = parseItemPrice(item.price);
                const qty = Number(item.quantity) || 1;
                return (
                    <li key={i} className="flex justify-between">
                        <span>{qty} x {item.title}</span>
                        <span className="text-gray-500 text-xs">₹{(cleanPrice * qty).toFixed(2)}</span>
                    </li>
                );
            })}
            </ul>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-auto space-y-2 pt-3 border-t border-gray-700">
        <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-xs">Total: <b className="text-white text-base">₹{order.totalAmount}</b></span>
            <span className={`font-bold uppercase ${status === 'Pending' ? 'text-yellow-400' : 'text-green-400'}`}>{status}</span>
        </div>

        {status === "Pending" && (
          <div className="flex gap-2">
              <button onClick={() => onUpdateStatus(order._id, "Confirmed")} className="flex-1 py-2 bg-blue-600 rounded-lg font-semibold hover:bg-blue-700 text-sm shadow-lg transition-transform active:scale-95">Confirm</button>
              <button onClick={() => onCancelOrder(order._id, order.paymentMethod)} className="flex-1 py-2 bg-red-600 rounded-lg font-semibold hover:bg-red-700 text-sm shadow-lg transition-transform active:scale-95">Reject</button>
          </div>
        )}
        
        {status === "Confirmed" && (
          <div className="space-y-2">
            <button onClick={() => onUpdateStatus(order._id, "Preparing")} className="w-full py-2 bg-orange-600 rounded-lg font-semibold hover:bg-orange-700 text-sm shadow-lg transition-transform active:scale-95">Start Preparing</button>
            <button onClick={() => onCancelOrder(order._id, order.paymentMethod)} className="w-full py-1 text-red-500 border border-red-500 rounded hover:bg-red-500 hover:text-white text-xs transition-colors">Emergency Cancel</button>
          </div>
        )}
        {/* ASSIGNMENT LOGIC */}
        {status === "Preparing" && (
            <div className="space-y-2">
                {!isDineIn && !showAssign ? (
                    <button 
                        onClick={() => setShowAssign(true)} 
                        className="w-full py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 text-sm shadow-lg transition-transform active:scale-95"
                    >
                        Ready - Assign Delivery
                    </button>
                ) : !isDineIn && showAssign ? (
                    <div className="bg-gray-900 p-2 rounded border border-yellow-500 animate-pulse">
                        
                        {/* ✅ DROPDOWN: Only shows Available Boys */}
                        <select 
                            value={selectedBoy} 
                            onChange={(e) => setSelectedBoy(e.target.value)}
                            className="w-full bg-gray-700 text-white text-xs p-2 rounded mb-2 border border-gray-600"
                        >
                            <option value="">Select Available Delivery Partner</option>
                            {availableDeliveryBoys.length > 0 ? (
                                availableDeliveryBoys.map((boy) => (
                                    <option key={boy._id} value={boy._id}>
                                        🟢 {boy.name} ({boy.vehicleDetails?.vehicleType || 'Bike'})
                                    </option>
                                ))
                            ) : (
                                <option disabled>⚠️ No Delivery Boys Online</option>
                            )}
                        </select>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    if(!selectedBoy) return alert("Please select a delivery person");
                                    onUpdateStatus(order._id, "Out for Delivery", selectedBoy);
                                    setShowAssign(false);
                                }}
                                className="flex-1 bg-green-600 text-white text-[10px] font-bold py-1 rounded"
                            >
                                Dispatch
                            </button>
                            <button 
                                onClick={() => setShowAssign(false)} 
                                className="flex-1 bg-gray-600 text-white text-[10px] font-bold py-1 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => onUpdateStatus(order._id, "Out for Delivery")} 
                        className="w-full py-2 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 text-sm shadow-lg transition-transform active:scale-95"
                    >
                        Mark Ready to Serve
                    </button>
                )}
            </div>
        )}
        
        {status === "Out for Delivery" && (
            <div className="space-y-1">
               {order.deliveryBoyId && (
                   <p className="text-[10px] text-gray-400 italic text-center">
                       Assigned to: {deliveryBoys.find(b => b._id === order.deliveryBoyId)?.name || "Partner"}
                   </p>
               )}
               <button 
                 onClick={() => onUpdateStatus(order._id, "Delivered")} 
                 className={`w-full py-2 rounded-lg font-semibold text-sm shadow-lg transition-transform active:scale-95 ${isCOD ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
               >
                 {isCOD 
                   ? "💰 Collect Cash & Delivered" 
                   : (isDineIn ? "Mark Served" : "Mark Delivered")
                 }
               </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDashboard;

