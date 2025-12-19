// src/components/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/Klubnika-removebg-preview.png";
import { LINKS } from "../constants";
import { FaBars, FaTimes, FaUserCircle, FaShoppingBag, FaBoxOpen, FaSignOutAlt, FaChevronDown } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCart();
  const cartItemCount = getItemCount();
  const { user, logout } = useAuth();
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- NAVIGATION HANDLER ---
  const handleNavClick = (link) => {
    setIsMobileMenuOpen(false); // Close mobile menu immediately

    // 1. Special Pages (Cart, Contact, Gallery, Merchandise)
    // ADDED: Merchandise to this list so it navigates to /merchandise
    if (["Cart", "Contact", "Gallery", "Merchandise"].includes(link.text)) {
      navigate(`/${link.text.toLowerCase()}`);
      return;
    }

    // 2. The Menu/Dishes Page
    if (link.text === "Menu" || link.text === "Dishes") {
      navigate("/dishes");
      return;
    }

    // 3. Scroll Sections (About, Mission, Expertise)
    // Case A: We are already on the Home Page
    if (location.pathname === "/") {
      const element = document.getElementById(link.targetId);
      if (element) {
        const navbarOffset = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    } 
    // Case B: We are on another page -> Navigate Home + Pass ID
    else {
      navigate("/", { state: { targetId: link.targetId } });
    }
  };

  const handleMyOrdersClick = () => {
    navigate("/my-orders");
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleLoginNav = () => {
    navigate('/auth');
    setIsMobileMenuOpen(false);
  };

  const renderCartBadge = () => (
    cartItemCount > 0 && (
      <span className="absolute -top-2 -right-3 bg-rose-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
        {cartItemCount}
      </span>
    )
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-3">
      
      <div className={`
        relative flex w-[95%] max-w-7xl items-center justify-between 
        bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50
        rounded-2xl px-6 py-3 transition-all duration-300
      `}>
        
        {/* Logo */}
        <button
          onClick={() => {
            navigate("/");
            window.scrollTo({ top: 0, behavior: "smooth" });
            setIsMobileMenuOpen(false);
          }}
          className="focus:outline-none transform hover:scale-105 transition-transform duration-300 cursor-pointer"
        >
          <img src={logo} alt="Klubnika" className="h-12.5 w-auto object-contain" />
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((link, index) => (
            <button
              key={index}
              className="relative group text-sm font-medium uppercase tracking-wider text-neutral-200 hover:text-white transition-colors duration-300 cursor-pointer"
              onClick={() => handleNavClick(link)}
            >
              {link.text === "Cart" ? (
                <div className="flex items-center gap-1">
                    <FaShoppingBag className="text-lg mb-1" />
                    {renderCartBadge()}
                </div>
              ) : (
                <>
                  {link.text}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-rose-500 transition-all duration-300 group-hover:w-full"></span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Desktop Auth - User Dropdown */}
        <div className="hidden lg:flex items-center pl-6 border-l border-white/10 ml-2">
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-neutral-200 hover:text-white focus:outline-none transition-colors cursor-pointer"
              >
                <FaUserCircle className="h-6 w-6 text-rose-500" />
                <span className="text-sm font-semibold tracking-wide">{user.name}</span>
                <FaChevronDown className={`text-xs transition-transform duration-300 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* The User Dropdown Menu */}
              <div className={`
                  absolute right-0 top-full mt-4 w-48 
                  bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl 
                  overflow-hidden transform transition-all duration-200 origin-top-right
                  ${isUserMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
              `}>
                <div className="p-1">
                    <button 
                        onClick={handleMyOrdersClick}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                        <FaBoxOpen className="text-rose-400" />
                        My Orders
                    </button>
                    <div className="h-px bg-white/10 mx-2 my-1"></div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:bg-white/10 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLoginNav}
              className="text-sm font-bold bg-gradient-to-r from-rose-600 to-rose-800 text-white px-6 py-2 rounded-full hover:shadow-lg hover:shadow-rose-600/30 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              LOGIN
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-4">
            <button onClick={() => navigate("/cart")} className="relative text-white cursor-pointer">
                <FaShoppingBag className="text-xl" />
                {renderCartBadge()}
            </button>
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-white text-2xl focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
        </div>

        {/* Mobile Dropdown */}
        <div className={`
          absolute top-full left-0 right-0 mt-2 mx-2 p-4 rounded-xl
          bg-neutral-900/95 backdrop-blur-xl border border-white/10 shadow-xl
          transform transition-all duration-300 origin-top z-40
          ${isMobileMenuOpen ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-0 -translate-y-4 pointer-events-none"}
        `}>
          <div className="flex flex-col gap-2">
            {LINKS.map((link, index) => (
               link.text !== "Cart" && (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 text-neutral-300 hover:text-rose-400 transition-colors font-medium uppercase tracking-wider cursor-pointer"
                  onClick={() => handleNavClick(link)}
                >
                  {link.text}
                </button>
               )
            ))}

            {user ? (
              <>
                <div className="h-px w-full bg-white/10 my-2"></div>
                
                {/* Mobile User Section */}
                <div className="bg-white/5 rounded-lg p-2">
                    <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-white/5">
                        <FaUserCircle className="text-rose-500" />
                        <span className="text-white font-bold">{user.name}</span>
                    </div>
                    
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        onClick={handleMyOrdersClick}
                    >
                        <FaBoxOpen className="text-rose-400" />
                        My Orders
                    </button>
                    
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 text-neutral-300 hover:text-rose-400 transition-colors cursor-pointer"
                        onClick={handleLogout}
                    >
                        <FaSignOutAlt />
                        Logout
                    </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleLoginNav}
                className="w-full mt-4 text-center bg-rose-600 text-white font-bold py-3 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;