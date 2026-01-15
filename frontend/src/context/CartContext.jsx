import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext"; 
import { useSocket } from "./SocketContext"; 

const CartContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LOCAL_STORAGE_KEY = "klubnikaGuestCart";

const parsePrice = (priceString) => {
  if (typeof priceString === "number") return priceString;
  if (typeof priceString !== "string") return 0;
  return parseInt(priceString.replace("₹", ""));
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, token, user, logout } = useAuth(); 
  
  // Get Socket
  const { socket } = useSocket(); 

  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false); 

  // --- 1. WEBSOCKET LISTENER ---
  useEffect(() => {
    // Debug Log
    // console.log("🛒 CartContext: Socket Status:", socket ? "Connected" : "Null");

    if (isAuthenticated && socket && user) {
      const handleCartUpdate = (updatedCart) => {
        console.log("🛒 🔥 WEB RECEIVED LIVE CART UPDATE:", updatedCart);
        setCartItems(Array.isArray(updatedCart) ? updatedCart : []);
      };

      socket.off('cartUpdated', handleCartUpdate); // Prevent duplicates
      socket.on('cartUpdated', handleCartUpdate);

      return () => {
        socket.off('cartUpdated', handleCartUpdate);
      };
    }
  }, [isAuthenticated, socket, user]);


  // --- 2. INITIAL FETCH ---
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      // Ensure API_URL is correct
      const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      
      fetch(`${endpoint}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (!res.ok) {
            if (res.status === 401) logout(); 
            throw new Error('Failed to fetch cart');
          }
          return res.json();
        })
        .then((data) => {
          setCartItems(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("Cart Fetch Error:", err.message);
          setCartItems([]); 
        })
        .finally(() => setLoading(false));
    } else {
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        setCartItems(localData ? JSON.parse(localData) : []);
      } catch (error) {
        setCartItems([]);
      }
    }
  }, [isAuthenticated, token, logout]);

  // --- CART OPERATIONS (Same as before) ---
  const addToast = (item) => {
    const id = Date.now();
    const newToast = { id, title: item.title, price: item.price, image: item.image };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => removeToast(id), 3000); 
  };
  
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const addToCart = async (item, isAddOn = false) => {
    addToast(item); 
    if (isAuthenticated) {
      try {
        const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const res = await fetch(`${endpoint}/cart/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(item),
        });
        if (res.ok) {
           const updatedCart = await res.json();
           setCartItems(updatedCart);
        }
      } catch (err) { console.error(err); }
    } else {
      setCartItems((prevItems) => {
        const existingItem = !isAddOn ? prevItems.find((i) => i.title === item.title) : null;
        return existingItem 
          ? prevItems.map((i) => i.title === item.title ? { ...i, quantity: i.quantity + 1 } : i)
          : [...prevItems, { ...item, quantity: 1 }];
      });
    }
  };

  const decreaseCartQuantity = async (title) => {
    if (isAuthenticated) {
      try {
        const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const res = await fetch(`${endpoint}/cart/decrease`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
           const updatedCart = await res.json();
           setCartItems(updatedCart);
        }
      } catch (err) { console.error(err); }
    } else {
        // ... (Guest Logic Unchanged)
        setCartItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.title === title);
        if (existingItem?.quantity === 1) return prevItems.filter((i) => i.title !== title);
        return prevItems.map((i) => i.title === title ? { ...i, quantity: i.quantity - 1 } : i);
      });
    }
  };

  const removeFromCart = async (title) => {
    if (isAuthenticated) {
      try {
        const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const res = await fetch(`${endpoint}/cart/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
           const updatedCart = await res.json();
           setCartItems(updatedCart);
        }
      } catch (err) { console.error(err); }
    } else {
      setCartItems((prevItems) => prevItems.filter((i) => i.title !== title));
    }
  };
  
  const clearCart = async () => {
    if (isAuthenticated) {
       try {
        const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const res = await fetch(`${endpoint}/cart/clear`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setCartItems(await res.json()); 
      } catch (err) { console.error(err); }
    } else {
      setCartItems([]);
    }
  };

  const mergeAndFetchCart = async (loginToken) => {
    const guestCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    if (guestCart.length > 0) {
      try {
        const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
        const res = await fetch(`${endpoint}/cart/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${loginToken}` },
          body: JSON.stringify({ guestCart })
        });
        if (res.ok) {
           setCartItems(await res.json()); 
           localStorage.removeItem(LOCAL_STORAGE_KEY); 
        } else { fetchCart(loginToken); }
      } catch (err) { fetchCart(loginToken); }
    } else {
      fetchCart(loginToken);
    }
  };

  const fetchCart = async (loginToken) => {
    try {
      const endpoint = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      const res = await fetch(`${endpoint}/cart`, {
        headers: { Authorization: `Bearer ${loginToken}` },
      });
      if (res.ok) setCartItems(await res.json());
    } catch (err) { setCartItems([]); }
  };

  const clearCartOnLogout = () => setCartItems([]);

  const getCartTotal = () => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((total, item) => total + parsePrice(item.price) * item.quantity, 0);
  };

  const getItemCount = () => {
    if (!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems, toasts, loading, addToCart, decreaseCartQuantity, removeFromCart,
        clearCart, getCartTotal, getItemCount, removeToast, mergeAndFetchCart, clearCartOnLogout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
