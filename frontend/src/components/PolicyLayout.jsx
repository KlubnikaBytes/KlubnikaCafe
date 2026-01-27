// src/components/PolicyLayout.jsx
import React from "react";

/**
 * A reusable layout component for all policy pages.
 * @param {string} title - The title of the policy page.
 * @param {React.ReactNode} children - The content of the policy.
 */
const PolicyLayout = ({ title, children }) => {
  return (
    // min-h-[60vh] ensures it takes up enough screen space
    <div className="min-h-[60vh] pt-28 pb-10 px-4 sm:px-6 lg:px-8 bg-neutral-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-rose-500 text-center">{title}</h2>
        <div className="bg-neutral-800 p-6 sm:p-10 rounded-lg shadow-xl text-neutral-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PolicyLayout;