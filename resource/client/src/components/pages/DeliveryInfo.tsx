// src/pages/DeliveryInfo.tsx
import DeliveryMap from "../Map";

const DeliveryInfo = () => (
  <div className="p-6 max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold mb-4 text-[#1c2b21]">Our Delivery Zones</h2>
    <p className="text-gray-600 mb-4">We currently deliver to the following cities:</p>
    <DeliveryMap />
  </div>
);

export default DeliveryInfo;
