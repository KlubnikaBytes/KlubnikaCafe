import React, { useState, useEffect } from "react";
import { CONTACT } from "../constants";
import { motion } from "framer-motion";
import Loader from "./Loader"; // Import Loader

// Animation for child elements
const fadeInUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// Animation for the container to stagger its children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.2 },
  },
};

// --- Real Google Maps URLs for Kolkata ---
const mapUrl = "https://maps.app.goo.gl/EtyGWearDae4XRPv6"; 
const embedSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d942042.0068812185!2d86.30241394042969!3d22.73375696418645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f7f95fd20e4a93%3A0x6086390c9ce0dc00!2sKlubnika!5e0!3m2!1sen!2sin!4v1763013741261!5m2!1sen!2sin"; 

const Contact = () => {
  const [loading, setLoading] = useState(true);

  // Simulate loading time for smooth transition (optional but looks good)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <motion.div
      id="contact"
      initial="hidden"
      animate="visible"
      className="container mx-auto min-h-screen pt-32 pb-20 px-4"
    >
      {/* Section Title Animation */}
      <motion.h2
        variants={fadeInUp}
        className="mb-12 text-center text-4xl lg:text-5xl font-extrabold text-white"
      >
        Get In Touch
      </motion.h2>

      <motion.div
        variants={containerVariants}
        className="flex flex-col lg:flex-row lg:gap-10 text-neutral-400"
      >
        {/* Contact Info */}
        <div className="flex-1">
          {CONTACT.map((detail) => (
            <motion.p
              key={detail.key}
              variants={fadeInUp}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="my-10 border-b-2 border-dotted border-neutral-700 pb-8 text-center text-xl tracking-tighter lg:text-2xl"
            >
              {detail.value}
            </motion.p>
          ))}
        </div>

        {/* Map Embed */}
        <motion.div
          className="flex-1 flex items-center justify-center my-10 lg:my-0"
          variants={fadeInUp}
        >
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden shadow-lg hover:ring-4 hover:ring-primary transition-all duration-300"
            title="View on Google Maps"
          >
            <iframe
              src={embedSrc}
              allowFullScreen=""
              loading="lazy"
              className="border-0 w-full h-[300px] md:w-[500px] md:h-[450px]"
              referrerPolicy="no-referrer-when-downgrade"
              title="Kolkata Map"
            ></iframe>
          </a>
        </motion.div> 
      </motion.div>
    </motion.div>
  );
};

export default Contact;