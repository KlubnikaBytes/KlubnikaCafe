// src/components/OrderCard.jsx
import React, { useState } from 'react';

const getStatusInfo = (status) => {
  switch (status) {
    case 'Pending':
      return { text: 'Waiting for confirmation...', color: 'text-yellow-400', time: 'Est. 30 mins' };
    case 'Confirmed':
      return { text: 'Your order is confirmed.', color: 'text-blue-400', time: 'Est. 25 mins' };
    case 'Preparing':
      return { text: 'The kitchen is preparing your food.', color: 'text-orange-400', time: 'Est. 20 mins' };
    case 'Out for Delivery':
      return { text: 'On its way to you!', color: 'text-green-400', time: 'Est. 10 mins' };
    case 'Delivered':
      return { text: 'Delivered. Enjoy your meal!', color: 'text-green-500', time: '' };
    case 'Cancelled':
      return { text: 'Order cancelled.', color: 'text-red-500', time: '' };
    default:
      return { text: status, color: 'text-gray-400', time: '' };
  }
};

const OrderCard = ({ order, onCancelOrder }) => {
  const statusInfo = getStatusInfo(order.status);
  const [cancelling, setCancelling] = useState(false);

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handleCancelClick = async () => {
    if(!window.confirm("Are you sure you want to cancel? This will initiate a full refund.")) return;
    
    setCancelling(true);
    // Call the parent function provided by MyOrders
    if(onCancelOrder) {
        await onCancelOrder(order._id);
    }
    setCancelling(false);
  };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 text-white border border-gray-700">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold">Order #{order._id.slice(-6)}</h2>
          <p className="text-sm text-gray-400">{orderDate}</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-bold ${statusInfo.color}`}>
            {statusInfo.text}
          </p>
          <p className="text-sm text-gray-300">{statusInfo.time}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Items</h3>
        {order.items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="flex justify-between text-gray-300">
            <span>{item.quantity} x {item.title}</span>
            <span>{item.price}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-lg font-semibold mb-2">Delivery To:</p>
        <p className="text-gray-300">{order.deliveryAddress}</p>
        
        <div className="flex justify-between items-end mt-4">
            <div className="text-xl font-bold">
                <span>Total Paid: </span>
                <span>₹{order.totalAmount}</span>
            </div>

            {/* Cancel Button - Only visible if Pending */}
            {order.status === 'Pending' && (
                <button
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {cancelling ? "Processing..." : "Cancel Order"}
                </button>
            )}
        </div>
        
        {/* Cancelled Message */}
        {order.status === 'Cancelled' && (
            <div className="mt-4 bg-red-900/20 border border-red-800 p-3 rounded text-center text-red-200 text-sm">
                This order was cancelled. Refund has been initiated.
            </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;