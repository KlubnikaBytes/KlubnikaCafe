import React, { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

// Professional Notification Sound
const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const AdminOrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔊 Audio Ref
  const audioRef = useRef(new Audio(NOTIFICATION_SOUND_URL));

  const { socket } = useSocket();
  const adminToken = localStorage.getItem("klubnikaAdminToken");

  // 1️⃣ SILENT AUDIO PREPARATION
  // This NO LONGER plays sound on load. 
  // It waits for you to click ANYWHERE once (like opening a menu) to silently unlock audio capability.
  useEffect(() => {
    const unlockAudio = () => {
      // Temporarily mute to ensure absolute silence during unlock
      const originalVolume = audioRef.current.volume;
      audioRef.current.volume = 0;

      // Play and immediately pause to satisfy browser security
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 1.0; // Restore volume for real alerts
      }).catch((e) => {
        // If blocked, we ignore it; it will try again on the next click
      });

      // Remove listeners so this only runs once per session
      ["click", "mousemove", "keydown", "touchstart"].forEach(event =>
        document.removeEventListener(event, unlockAudio)
      );
    };

    // Attach listeners to document
    ["click", "mousemove", "keydown", "touchstart"].forEach(event =>
      document.addEventListener(event, unlockAudio)
    );

    // Cleanup
    return () => {
      ["click", "mousemove", "keydown", "touchstart"].forEach(event =>
        document.removeEventListener(event, unlockAudio)
      );
    };
  }, []);

  // 2️⃣ FETCH INITIAL DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const orderRes = await fetch(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const orderData = await orderRes.json();
        const sortedOrders = (Array.isArray(orderData) ? orderData : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders);

        const dbRes = await fetch(`${API_URL}/admin/delivery-boys`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const dbData = await dbRes.json();
        if (Array.isArray(dbData)) setDeliveryBoys(dbData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (adminToken) fetchData();
  }, [adminToken]);

  // 3️⃣ TRIGGER ALERT (Only called by Socket)
  const triggerNewOrderAlert = (order) => {
    // 🔊 Play Sound
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.warn("Browser blocked audio. Click page once to fix."));

    // 🔔 Show Toast
    toast.success(
      <div>
        <p className="font-bold">🔔 New Order Received!</p>
        <p className="text-sm">#{order._id.slice(-6).toUpperCase()} • ₹{order.totalAmount}</p>
      </div>,
      { duration: 5000, position: "top-right" }
    );

    // 🖥️ System Notification
    if (Notification.permission === "granted") {
      new Notification("New Order!", { body: `Amount: ₹${order.totalAmount}` });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  };

  // 4️⃣ SOCKET LISTENERS
  // 4️⃣ SOCKET LISTENERS
  /*useEffect(() => {
    if (!socket) return;

    // Create a dedicated function to join the room
    const joinAdminRoom = () => {
      socket.emit("adminJoin");
      console.log("🛡️ Admin Dashboard: Joined admins room successfully!");
    };

    // 1. If socket is ALREADY connected when this mounts, join immediately
    if (socket.connected) {
      joinAdminRoom();
    }

    // 2. CRITICAL FIX: If socket reconnects (or connects slightly after mount), join the room!
    socket.on("connect", joinAdminRoom);

    const handleNewOrder = (newOrder) => {
      console.log("🔥 REAL-TIME: New Order Received!", newOrder);
      // Add new order to the top of the list instantly
      setOrders((prev) => [newOrder, ...prev]);
      triggerNewOrderAlert(newOrder);
    };

    const handleStatusUpdate = (updatedOrder) => {
      console.log("🔔 REAL-TIME: Order Status Updated", updatedOrder);
      setOrders((prev) => 
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    };

    // Listen for the backend emits
    socket.on("newOrder", handleNewOrder);
    socket.on("orderStatusUpdate", handleStatusUpdate);

    // Proper cleanup to prevent memory leaks and duplicate orders
    return () => {
      socket.off("connect", joinAdminRoom);
      socket.off("newOrder", handleNewOrder);
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [socket]);*/

  // 4️⃣ SOCKET LISTENERS
  // 4️⃣ SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    const joinAdminRoom = () => {
      socket.emit("adminJoin");
      console.log("🛡️ Admin Dashboard: Joined admins room successfully!");
    };

    if (socket.connected) {
      joinAdminRoom();
    }
    socket.on("connect", joinAdminRoom);

    const handleNewOrder = (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      triggerNewOrderAlert(newOrder);
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    };

    // 🔥 THE FIX: When a driver toggles online/offline, fetch the fresh list instantly!
    const handleDeliveryStatusUpdate = async () => {
      console.log("🛵 REAL-TIME: Driver status changed! Refreshing list...");
      try {
        const dbRes = await fetch(`${API_URL}/admin/delivery-boys`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const dbData = await dbRes.json();
        if (Array.isArray(dbData)) setDeliveryBoys(dbData);
      } catch (err) {
        console.error("Failed to refresh delivery boys", err);
      }
    };

    // Add the listeners
    socket.on("newOrder", handleNewOrder);
    socket.on("orderStatusUpdate", handleStatusUpdate);
    socket.on("deliveryStatusUpdate", handleDeliveryStatusUpdate);

    return () => {
      socket.off("connect", joinAdminRoom);
      socket.off("newOrder", handleNewOrder);
      socket.off("orderStatusUpdate", handleStatusUpdate);
      socket.off("deliveryStatusUpdate", handleDeliveryStatusUpdate);
    };
  }, [socket, adminToken]); // Added adminToken to dependencies

  // --- API HANDLERS ---
  const handleUpdateStatus = async (orderId, newStatus, deliveryBoyId = null) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: newStatus, deliveryBoyId: deliveryBoyId }),
      });
      if (!res.ok) throw new Error("Failed");
      const updatedOrder = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed");
      const responseData = await res.json();
      const cancelledOrder = responseData.order || responseData;
      setOrders((prev) => prev.map((o) => (o._id === orderId ? cancelledOrder : o)));
      toast.error("Order Cancelled");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="text-center text-white mt-10">Loading orders...</div>;

  const activeOrders = orders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};

// --- (AdminOrderCard component remains exactly as it is) ---
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
                      if (!selectedBoy) return alert("Please select a delivery person");
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
              {isCOD ? "💰 Collect Cash & Delivered" : (isDineIn ? "Mark Served" : "Mark Delivered")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDashboard;