// src/components/Dishes.jsx
import React, { useState, useRef, useEffect } from "react";
import DishCard from "./DishCard";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import Loader from "./Loader";
import { useSocket } from "../context/SocketContext";

const API_URL = import.meta.env.VITE_API_URL;

const Dishes = () => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeIdx, setActiveIdx] = useState(0);
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 👇 1. Destructure socket here (The Fix)
  const { socket } = useSocket(); 

  // FETCH DATA
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = await res.json();
        setMenuData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // SOCKET EVENTS
  useEffect(() => {
    // 👇 2. Check if socket exists before using it
    if (!socket) return;

    console.log("✅ Using shared socket in Dishes:", socket.id);

    const handleStockUpdate = ({ productId, isInStock }) => {
      console.log("🔔 Real-time Stock Update:", productId, isInStock);
      setMenuData((prevMenu) =>
        prevMenu.map((category) => {
          const updatedItems = category.items
            ? category.items.map((item) =>
                item._id === productId ? { ...item, isInStock } : item
              )
            : [];

          const updatedSubCategories = category.subCategories
            ? category.subCategories.map((subCat) => ({
                ...subCat,
                items: subCat.items.map((item) =>
                  item._id === productId ? { ...item, isInStock } : item
                ),
              }))
            : [];

          return {
            ...category,
            items: updatedItems,
            subCategories: updatedSubCategories,
          };
        })
      );
    };

    socket.on("stockUpdate", handleStockUpdate);

    return () => {
      socket.off("stockUpdate", handleStockUpdate);
    };
  }, [socket]); // 👇 3. Add socket to dependencies

  // SCROLL LOGIC
  const scroll = (scrollOffset) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: scrollOffset,
        behavior: "smooth",
      });
    }
  };

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    return () => window.removeEventListener("resize", checkScrollPosition);
  }, []);

  const visibleCategories = menuData.filter(
    (category) => category.name !== "Addons"
  );
  const activeSection = visibleCategories[activeIdx];
  const gridStyles =
    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10";

  if (loading) return <Loader />;

  if (error) {
    return (
      <section className="container mx-auto py-20 min-h-[80vh]">
        <h2 className="mb-10 text-center text-4xl font-extrabold text-red-500">
          Error: {error}
        </h2>
      </section>
    );
  }

  return (
    <section className="container mx-auto py-20 min-h-[80vh]">
      <h2 className="mb-10 text-center text-4xl font-extrabold tracking-tight text-white drop-shadow-lg px-4 translate-y-5">
        Our Menu
      </h2>

      {/* CATEGORY NAVIGATION */}
      <div className="relative">
        <button
          onClick={() => scroll(-300)}
          className={`
            absolute left-4 top-1/2 -translate-y-1/2 z-10 
            h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm
            flex items-center justify-center text-white
            transition-all duration-300
            hover:bg-white/40 cursor-pointer
            ${showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <FaChevronLeft size={20} />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className={`
            flex overflow-x-auto space-x-4 mb-10 py-4
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            scroll-smooth transition-all duration-300
            ${showLeftArrow ? "pl-20" : "pl-4"}
            ${showRightArrow ? "pr-20" : "pr-4"}
          `}
        >
          {visibleCategories.map((section, idx) => (
            <button
              key={section.name}
              onClick={() => setActiveIdx(idx)}
              className={`
                shrink-0 px-6 py-3 rounded-full font-semibold transition text-lg md:text-xl cursor-pointer
                ${
                  activeIdx === idx
                    ? "bg-white text-gray-900 shadow-lg"
                    : "bg-gray-800 text-white"
                }
                border border-gray-600 hover:bg-white hover:text-gray-900
              `}
            >
              {section.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll(300)}
          className={`
            absolute right-4 top-1/2 -translate-y-1/2 z-10 
            h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm
            flex items-center justify-center text-white
            transition-all duration-300
            hover:bg-white/40 cursor-pointer
            ${showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
        >
          <FaChevronRight size={20} />
        </button>
      </div>

      {/* DISHES GRID */}
      <div className="px-4">
        {activeSection && activeSection.items && (
          <div className={gridStyles}>
            {activeSection.items.map((item, i) => (
              <DishCard key={item._id || i} dish={item} />
            ))}
          </div>
        )}

        {activeSection && activeSection.subCategories && (
          <div className="flex flex-col gap-16">
            {activeSection.subCategories.map((subCategory, subIdx) => (
              <div key={subIdx}>
                <h3 className="mb-8 text-center text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                  {subCategory.name}
                </h3>
                <div className={gridStyles}>
                  {subCategory.items.map((item, i) => (
                    <DishCard key={item._id || i} dish={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dishes;
