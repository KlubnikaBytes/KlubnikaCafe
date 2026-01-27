import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaX } from "react-icons/fa6";
import Loader from "./Loader"; // Import Loader

// images
import ambience1 from "../assets/gallery/ambience1.jpg";
import ambience2 from "../assets/gallery/ambience2.jpg";
import Cake1 from "../assets/gallery/cake1.jpg";
import Cake2 from "../assets/gallery/cake2.jpg";
import cake3 from "../assets/gallery/cake3.jpg";
import cake4 from "../assets/gallery/cake4.jpg";
import cake5 from "../assets/gallery/cake5.jpg";
import cake6 from "../assets/gallery/cake6.jpg";
import cake7 from "../assets/gallery/cake7.jpg";
import cake8 from "../assets/gallery/cake8.jpg";
import cake9 from "../assets/gallery/cake9.jpg";
import cake10 from "../assets/gallery/cake10.jpg";
import cake11 from "../assets/gallery/cake11.jpg";
import cake12 from "../assets/gallery/cake12.jpg";
import cake13 from "../assets/gallery/cake13.jpg";
import cake14 from "../assets/gallery/cake14.jpg";
import coffee1 from "../assets/gallery/coffee1.jpg";
import customer1 from "../assets/gallery/customer1.jpg";
import customer2 from "../assets/gallery/customer2.jpg";
import customer3 from "../assets/gallery/customer3.jpg";
import customer4 from "../assets/gallery/customer4.jpg";
import customer5 from "../assets/gallery/customer5.jpg";
import customer6 from "../assets/gallery/customer6.jpg";
import FishAndChips from "../assets/gallery/fish-and-chips.jpg";
import food1 from "../assets/gallery/food1.jpg";
import pastry1 from "../assets/gallery/pastry1.jpg";

const allImages = [
  ambience1, ambience2, Cake1, Cake2, cake3, cake4, cake5, cake6, cake7,
  cake8, cake9, cake10, cake11, cake12, cake13, cake14, coffee1, customer1,
  customer2, customer3, customer4, customer5, customer6, FishAndChips, food1, pastry1,
];

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [shuffledImages, setShuffledImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading/processing
    setLoading(true);
    const shuffled = [...allImages].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);
    
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <section className="pt-28 pb-20 container mx-auto px-4 min-h-screen">
        <motion.h2
          className="mb-12 text-center text-5xl font-extrabold tracking-tight text-white drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Our Gallery
        </motion.h2>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shuffledImages.map((src, index) => (
            <motion.div
              key={index}
              className="rounded-lg overflow-hidden shadow-lg cursor-pointer group"
              onClick={() => setSelectedImage(src)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src={src}
                alt={`Gallery ${index}`}
                className="w-full aspect-square object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>

      </section>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute top-6 right-6 text-white text-3xl"
              onClick={() => setSelectedImage(null)}
            >
              <FaX />
            </button>

            <motion.img
              src={selectedImage}
              alt="Selected"
              className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-xl object-contain"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
