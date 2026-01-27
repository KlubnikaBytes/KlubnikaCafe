// src/components/Footer.jsx
import React from "react";
import { SOCIAL_MEDIA_LINKS } from "../constants";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // Import Link

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.2 },
  },
};

const Footer = () => {
  const complianceLinks = [
    { to: "/contact", label: "Contact Us" }, // Already exists, but explicitly listed for compliance
    { to: "/terms", label: "Terms & Conditions" },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/refund", label: "Cancellation & Refund Policy" },
    { to: "/delivery", label: "Shipping & Delivery Policy" },
  ];

  return (
    <motion.div
      className="mb-8 mt-20"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
    >
      {/* Social Media Icons */}
      <motion.div
        variants={staggerContainer}
        className="flex items-center justify-center gap-8 mb-8"
      >
        {SOCIAL_MEDIA_LINKS.map((link, index) => (
          <motion.a
            key={index}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            variants={fadeInUp}
            whileHover={{ scale: 1.2, color: "#f43f5e" }}
            transition={{ duration: 0.3 }}
          >
            {link.icon}
          </motion.a>
        ))}
      </motion.div>

      {/* Primary Footer Navigation Links */}
      <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 text-sm tracking-widest uppercase">
        <Link to="/dishes" className="text-neutral-400 hover:text-rose-500 transition-colors">Menu</Link>
        <span className="text-neutral-700">|</span>
        <Link to="/ratings" className="text-neutral-400 hover:text-rose-500 transition-colors">Rate Us</Link>
        <span className="text-neutral-700">|</span>
        <Link to="/gallery" className="text-neutral-400 hover:text-rose-500 transition-colors">Gallery</Link>
      </motion.div>

      {/* Razorpay Compliance Links (The Mandatory 5) */}
      <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-8 text-xs sm:text-sm tracking-wide">
        {complianceLinks.map((link, index) => (
          <React.Fragment key={link.to}>
            <Link to={link.to} className="text-neutral-500 hover:text-white transition-colors">
              {link.label}
            </Link>
            {index < complianceLinks.length - 1 && <span className="text-neutral-700">|</span>}
          </React.Fragment>
        ))}
      </motion.div>

      {/* Copyright Text */}
      <motion.p
        variants={fadeInUp}
        className="text-center tracking-tighter text-neutral-500"
      >
        &copy; Klubnika. All rights reserved.
      </motion.p>
    </motion.div>
  );
};

export default Footer;