import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* You can replace this div with your Klubnika Logo if you want */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-t-4 border-neutral-200 border-t-emerald-500"></div>
        <p className="text-lg font-semibold text-neutral-200 animate-pulse">
          Loading Klubnika...
        </p>
      </div>
    </div>
  );
};

export default Loader;