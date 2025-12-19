// src/components/Merchandise.jsx
import React from 'react';
import { FaLock, FaClock } from 'react-icons/fa';

const MERCH_ITEMS = [
  {
    id: 1,
    name: "Klubnika Signature Tee",
    price: "₹799",
    image: "https://placehold.co/400x400/1a1a1a/e11d48?text=Signature+Tee",
    tag: "Apparel"
  },
  {
    id: 2,
    name: "Classic Ceramic Mug",
    price: "₹399",
    image: "https://placehold.co/400x400/1a1a1a/e11d48?text=Ceramic+Mug",
    tag: "Accessories"
  },
  {
    id: 3,
    name: "Barista Apron (Black)",
    price: "₹899",
    image: "https://placehold.co/400x400/1a1a1a/e11d48?text=Barista+Apron",
    tag: "Professional"
  },
  {
    id: 4,
    name: "Klubnika Tote Bag",
    price: "₹299",
    image: "https://placehold.co/400x400/1a1a1a/e11d48?text=Tote+Bag",
    tag: "Essentials"
  },
  {
    id: 5,
    name: "Thermal Travel Cup",
    price: "₹599",
    image: "https://placehold.co/400x400/1a1a1a/e11d48?text=Travel+Cup",
    tag: "Accessories"
  }
];

const Merchandise = () => {
  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-900/20 via-neutral-950 to-neutral-950 pointer-events-none"></div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10 animate-fadeIn">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-orange-300 mb-4">
          Klubnika Merch
        </h1>
        <p className="text-neutral-400 text-lg">
          Take a piece of the Klubnika experience home with you. High-quality apparel and accessories.
        </p>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {MERCH_ITEMS.map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl hover:border-rose-500/30 transition-all duration-300"
          >
            {/* Coming Soon Overlay on Card */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaLock className="text-3xl text-rose-500 mb-2" />
                <span className="text-white font-bold tracking-widest uppercase text-sm">Dropping Soon</span>
            </div>

            {/* Badge */}
            <div className="absolute top-4 left-4 z-10 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Coming Soon
            </div>

            {/* Image */}
            <div className="h-64 w-full overflow-hidden bg-neutral-800">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-60"
              />
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors">{item.name}</h3>
                    <span className="text-neutral-500 text-sm border border-neutral-700 px-2 py-0.5 rounded">{item.tag}</span>
                </div>
                <div className="flex justify-between items-end mt-4">
                    <span className="text-2xl font-bold text-neutral-400 blur-[2px] select-none">{item.price}</span>
                    <button disabled className="px-4 py-2 bg-neutral-800 text-neutral-500 rounded-lg text-sm font-semibold cursor-not-allowed">
                        Notify Me
                    </button>
                </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder for layout balance if needed */}
        <div className="hidden lg:flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-2xl p-8 text-neutral-600">
            <div className="text-center">
                <FaClock className="text-4xl mx-auto mb-2 opacity-50" />
                <p>More items loading...</p>
            </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="mt-20 text-center relative z-10">
        <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-rose-500 to-orange-500">
            <div className="bg-black rounded-full px-8 py-4">
                <p className="text-white font-semibold">
                    🔥 Exclusive Launch Offers for early subscribers. Stay tuned!
                </p>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Merchandise;