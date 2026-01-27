import React, { useState, useCallback } from "react";
import LocationPicker from "./LocationPicker";

const CheckoutPage = () => {
  // 1. Form State
  const [formData, setFormData] = useState({
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    fullName: "",
  });

  // 2. Map State
  const [deliveryAllowed, setDeliveryAllowed] = useState(false);
  const [coordinates, setCoordinates] = useState(null); // Stores {lat, lng}

  // 3. Handle Map Updates
  const handleLocationUpdate = useCallback(
    (coords, isWithinRange, addressData) => {
      setDeliveryAllowed(isWithinRange);
      setCoordinates(coords); // Save coordinates for the Google Maps Link

      // Auto-fill address fields
      setFormData((prev) => ({
        ...prev,
        street: addressData.formatted_address || prev.street,
        city: addressData.city || prev.city,
        state: addressData.state || prev.state,
        pincode: addressData.pincode || prev.pincode,
      }));
    },
    []
  );

  // 4. Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 5. Submit Handler (Prepares Data for Admin)
  const handleSubmit = async () => {
    if (!formData.houseNo || !formData.fullName || !formData.phone) {
      alert("Please complete all required fields (Name, Phone, House No).");
      return;
    }

    // A. Create a Readable Address String
    const fullReadableAddress = `
      ${formData.houseNo}, 
      ${formData.street}, 
      ${formData.landmark ? "Near " + formData.landmark + "," : ""} 
      ${formData.city}, ${formData.state} - ${formData.pincode}
    `.replace(/\s+/g, " ").trim(); // Cleans up extra spaces

    // B. Create the Maps Link
    const mapsLink = coordinates 
      ? `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
      : "";

    // C. Construct the Final Payload
    const finalOrderData = {
      customer: {
        name: formData.fullName,
        phone: formData.phone,
      },
      // This is the "Proper Understandable Data" for the Admin
      deliveryAddress: fullReadableAddress, 
      googleMapsLink: mapsLink, // Send this if your backend supports extra fields
      location: coordinates,    // Send raw coords if needed
      
      // ... include your cart items and total here
    };

    console.log("🚀 SENDING TO BACKEND:", finalOrderData);
    alert("Order Data Prepared! Check Console.");
    
    // API Call would go here:
    // await fetch('/api/orders', { method: 'POST', body: JSON.stringify(finalOrderData) ... });
  };

  return (
    <div className="p-4 bg-neutral-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4 text-rose-500">Checkout</h1>

      {/* Map Component */}
      <LocationPicker onLocationSelect={handleLocationUpdate} />

      <div className="mt-8 space-y-5 max-w-xl">
        <h3 className="text-xl font-semibold border-b border-gray-700 pb-2">
          2. Personal Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Full Name *"
            className="p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none w-full"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Phone Number *"
            className="p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none w-full"
          />
        </div>

        <h3 className="text-xl font-semibold border-b border-gray-700 pb-2 pt-4">
          3. Delivery Address Details
        </h3>

        {/* House No */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            House No / Flat No *
          </label>
          <input
            name="houseNo"
            value={formData.houseNo}
            onChange={handleInputChange}
            placeholder="e.g. 42-A"
            className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white"
          />
        </div>

        {/* Street / Area (Auto-Filled) */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Street / Area (Auto-filled) *
          </label>
          <textarea
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            rows="2"
            placeholder="Street / Area"
            className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white resize-none"
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Landmark (Optional)
          </label>
          <input
            name="landmark"
            value={formData.landmark}
            onChange={handleInputChange}
            placeholder="e.g. Near City Park"
            className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white"
          />
        </div>

        {/* City & Pincode */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">City *</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pincode *</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleInputChange}
              className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white"
            />
          </div>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">State *</label>
          <input
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full p-3 bg-neutral-800 rounded border border-neutral-700 focus:border-rose-500 outline-none text-white"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!deliveryAllowed}
          className={`w-full py-4 mt-8 font-bold text-lg rounded-xl shadow-lg transition-transform transform active:scale-95 ${
            deliveryAllowed
              ? "bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          {deliveryAllowed ? "Proceed to Pay" : "Location Not Serviceable"}
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;