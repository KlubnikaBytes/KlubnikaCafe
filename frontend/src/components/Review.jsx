import React, { useState } from "react";
import { REVIEW } from "../constants";
import xaviour from "../assets/xaviour.jpeg";
import customer1 from "../assets/customer1.jpeg";
import customer2 from "../assets/customer2.jpeg";
import customer3 from "../assets/customer3.jpeg";
import customer4 from "../assets/customer4.jpeg";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
// Make sure this matches your actual file name (reviewbg copy.jpeg or reviewbg.jpeg)
import reviewBg from "../assets/reviewbg copy.jpeg"; 

const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.2 },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 50 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  exit: { opacity: 0, scale: 0.7, y: 50 },
};

const Review = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <>
      <motion.section
        id="review"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        // Added scroll-mt-24 and overflow-hidden
        className="relative py-20 overflow-hidden scroll-mt-24" 
      >
        {/* --- Background Image & Fade Overlays --- */}
        {/* FIX: z-0 ensures it is behind text but in front of global background */}
        <div className="absolute inset-0 z-0">
          <img
            src={reviewBg}
            alt="Review Background"
            className="h-full w-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        {/* --- End of Background --- */}

        {/* --- Inner container --- */}
        {/* FIX: z-10 ensures text sits ON TOP of the background image */}
        <div className="container mx-auto px-4 relative z-10">
          {/* Review Content */}
          <motion.div variants={fadeInUp} className="flex flex-col">
            <motion.p
              variants={fadeInUp}
              className="mb-10 text-2xl font-serif italic leading-relaxed tracking-wide text-white/90 lg:mx-40 lg:mt-40 lg:text-5xl"
            >
              {REVIEW.content}
            </motion.p>

            {/* Reviewer Profile */}
            <motion.div
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-6"
            >
              <motion.img
                src={xaviour}
                alt={REVIEW.name}
                className="rounded-full border"
                width={80}
                height={80}
              />
              <div className="tracking-tighter">
                <h6>{REVIEW.name}</h6>
                <p className="text-sm text-neutral-500">{REVIEW.profession}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Customer Images */}
          <motion.div
            variants={containerVariants}
            className="mt-14 flex flex-col items-center justify-center gap-2 md:flex-row"
          >
            {[customer1, customer2, customer3, customer4].map((customer, index) => (
              <motion.img
                key={index}
                src={customer}
                initial={{ opacity: 0, y: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.2 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="h-[300px] w-[200px] rounded-br-3xl rounded-t-3xl object-cover cursor-pointer shadow-lg border border-white/10"
                viewport={{ once: true }}
                alt="Customer photo"
                onClick={() => setSelectedImage(customer)}
              />
            ))}
          </motion.div>
        </div>
        {/* --- End of inner container --- */}
      </motion.section>

      {/* Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button
              className="absolute top-5 right-5 z-50 text-white hover:text-rose-500 transition-colors cursor-pointer"
              onClick={() => setSelectedImage(null)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <FaTimes size={30} />
            </motion.button>
            <motion.div
              className="relative"
              variants={modalVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Enlarged customer view"
                className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl border border-white/20"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Review;