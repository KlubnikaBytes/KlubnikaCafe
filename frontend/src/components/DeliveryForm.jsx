import React, { useState } from "react";
import LocationPicker from "./LocationPicker";

const DeliveryForm = () => {
  const [deliveryDetails, setDeliveryDetails] = useState({
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const handleLocationSelect = (coords, inRange, addressData) => {
    setDeliveryDetails((prev) => ({
      ...prev,
      city: addressData.city || prev.city,
      state: addressData.state || prev.state,
      pincode: addressData.pincode || prev.pincode,
      street: addressData.area || prev.street,
    }));
  };

  return (
    <div className="text-white">
      <LocationPicker onLocationSelect={handleLocationSelect} />

      <h3 className="text-xl font-semibold mb-3">2. Delivery Address Details</h3>

      <div className="grid grid-cols-2 gap-4">
        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="House No / Flat No *"
          value={deliveryDetails.houseNo}
          onChange={(e) =>
            setDeliveryDetails({ ...deliveryDetails, houseNo: e.target.value })
          }
        />

        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="Street / Area *"
          value={deliveryDetails.street}
          onChange={(e) =>
            setDeliveryDetails({ ...deliveryDetails, street: e.target.value })
          }
        />

        <input
          className="bg-gray-800 p-3 rounded col-span-2"
          placeholder="Landmark (Optional)"
          value={deliveryDetails.landmark}
          onChange={(e) =>
            setDeliveryDetails({ ...deliveryDetails, landmark: e.target.value })
          }
        />

        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="City *"
          value={deliveryDetails.city}
          readOnly
        />

        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="Pincode *"
          value={deliveryDetails.pincode}
          readOnly
        />

        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="State *"
          value={deliveryDetails.state}
          readOnly
        />

        <input
          className="bg-gray-800 p-3 rounded"
          placeholder="Contact Phone *"
          value={deliveryDetails.phone}
          onChange={(e) =>
            setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })
          }
        />
      </div>
    </div>
  );
};

export default DeliveryForm;
