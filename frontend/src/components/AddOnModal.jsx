import React from "react";
import { FaPlus, FaCheck } from "react-icons/fa6"; // Using Fa6 based on your imports

const AddOnModal = ({
  isOpen,
  onClose,
  item,            // The Pizza object
  addOn,           // The Cheese object
  onAddBasic,      // Function: Add only pizza
  onAddWithAddOn,  // Function: Add pizza + cheese
}) => {
  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-gray-900 p-6 text-center border-b border-white/10">
          <h2 className="text-2xl font-extrabold text-white">
            Level Up Your Pizza? 🍕
          </h2>
          <p className="text-gray-300 text-sm mt-1">
            Don't miss out on the cheesiness!
          </p>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Visual Representation */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Pizza Image */}
            <div className="relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary shadow-lg"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-xs px-2 py-0.5 rounded text-white border border-gray-600 whitespace-nowrap">
                {item.title}
              </span>
            </div>

            <FaPlus className="text-gray-400 text-xl" />

            {/* Cheese Addon Image */}
            <div className="relative">
              <img
                src={addOn.image}
                alt={addOn.title}
                className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400 shadow-lg"
              />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-600 text-xs px-2 py-0.5 rounded text-white font-bold whitespace-nowrap">
                +{addOn.price}
              </span>
            </div>
          </div>

          {/* Offer Text */}
          <div className="bg-gray-800/50 rounded-xl p-4 w-full mb-6 border border-white/5 text-center">
            <h3 className="text-lg font-bold text-white mb-1">Add Extra Cheese</h3>
            <p className="text-gray-400 text-sm">{addOn.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onAddWithAddOn}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 
                         hover:bg-rose-600 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaCheck /> Yes, Add Cheese ({addOn.price})
            </button>
            
            <button
              onClick={onAddBasic}
              className="w-full py-3 bg-transparent text-gray-400 rounded-xl font-semibold text-base 
                         hover:bg-gray-800 hover:text-white transition-all cursor-pointer"
            >
              No, just the pizza
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOnModal;