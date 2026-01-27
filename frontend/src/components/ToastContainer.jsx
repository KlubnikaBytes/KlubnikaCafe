// src/components/ToastContainer.jsx

import React from "react";
import { useCart } from "../context/CartContext";
import { FaX } from "react-icons/fa6"; // Make sure you have react-icons: npm install react-icons

const ToastContainer = () => {
  const { toasts, removeToast } = useCart();

  return (
    // Container fixed to the top-right of the viewport
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-4">
      {toasts.map((toast) => (
        // Each toast notification
        <div
          key={toast.id}
          className="flex items-center gap-4 w-80 max-w-sm p-4
                     bg-gray-800 text-white rounded-2xl shadow-2xl 
                     border border-white/20 backdrop-blur-lg
                     animate-slideIn" // This is our custom animation
        >
          {/* Item Image */}
          <img
            src={toast.image}
            alt={toast.title}
            className="h-16 w-16 rounded-lg object-cover shadow-md"
          />
          {/* Item Details */}
          <div className="flex-grow overflow-hidden">
            <p className="font-semibold text-green-400">Added to Cart!</p>
            <p className="font-bold text-white truncate">{toast.title}</p>
            <p className="text-sm text-gray-300">{toast.price}</p>
          </div>
          {/* Close Button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-white transition-colors self-start"
          >
            <FaX size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;