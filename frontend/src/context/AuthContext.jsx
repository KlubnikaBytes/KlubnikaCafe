import React, { createContext, useContext, useState, useEffect } from 'react';

// Get the API URL from the .env file
const API_URL = import.meta.env.VITE_API_URL;
const AUTH_TOKEN_KEY = "klubnikaToken";
const AUTH_USER_KEY = "klubnikaUser";

// Create the context
const AuthContext = createContext(null);

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // On initial app load, check localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // --- SIGNUP: Step 1 ---
  const sendSignupOtp = async (credentials) => {
    const res = await fetch(`${API_URL}/auth/send-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send OTP');
    }
    return data;
  };

  // --- SIGNUP: Step 2 ---
  const verifySignup = async (data) => {
    const res = await fetch(`${API_URL}/auth/verify-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error || 'Signup verification failed');
    }
    return resData;
  };

  // --- LOGIN (Email/Password) ---
  const login = async (credentials) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setToken(data.token);
    
    return data;
  };

  // --- LOGIN (Mobile OTP): Step 1 ---
  const sendLoginOtp = async (mobile) => {
    const res = await fetch(`${API_URL}/auth/send-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  };

  // --- LOGIN (Mobile OTP): Step 2 ---
  const loginWithOtp = async (mobile, otp) => {
    const res = await fetch(`${API_URL}/auth/login-with-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        sendSignupOtp,
        verifySignup,
        sendLoginOtp, // Exported
        loginWithOtp, // Exported
        logout, 
        isAuthenticated: !!token 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  return useContext(AuthContext);
};