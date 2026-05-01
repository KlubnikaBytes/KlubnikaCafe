// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- Context Providers ---
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { LoadingProvider } from "./context/LoadingContext";

// --- Core Layout Components ---
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";
import Loader from "./components/Loader";

// --- Lazy Load Page Components ---
const HeroSection = lazy(() => import("./components/HeroSection"));
const Dishes = lazy(() => import("./components/Dishes"));
const About = lazy(() => import("./components/About"));
const Mission = lazy(() => import("./components/Mission"));
const Expertise = lazy(() => import("./components/Expertise"));
const Review = lazy(() => import("./components/Review"));
const Merchandise = lazy(() => import("./components/Merchandise"));
const Cart = lazy(() => import("./components/Cart"));
const Auth = lazy(() => import("./components/Auth"));
const Contact = lazy(() => import("./components/ContactSection"));
const Gallery = lazy(() => import("./components/Gallery"));
const MyOrders = lazy(() => import("./components/MyOrders"));
const RatingPage = lazy(() => import("./components/RatingPage"));

// --- Compliance Pages ---
const TermsPage = lazy(() => import("./components/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage"));
const CancellationRefundPage = lazy(() => import("./components/CancellationRefundPage"));
const ShippingDeliveryPage = lazy(() => import("./components/ShippingDeliveryPage"));

// --- Admin Components ---
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

/**
 * Public layout for all non-admin pages
 */
const PublicLayout = () => (
  <>
    <Navbar />
    <ScrollToTop />

    <Suspense fallback={<Loader />}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HeroSection />
              <About />
              <Mission />
              <Expertise />
              <Review />
              <Footer />
            </>
          }
        />

        <Route path="/dishes" element={<><Dishes /><Footer /></>} />
        <Route path="/merchandise" element={<><Merchandise /><Footer /></>} />
        <Route path="/cart" element={<><Cart /><Footer /></>} />
        <Route path="/contact" element={<><Contact /><Footer /></>} />
        <Route path="/ratings" element={<><RatingPage /><Footer /></>} />
        <Route path="/auth" element={<><Auth /><Footer /></>} />
        <Route path="/gallery" element={<><Gallery /><Footer /></>} />
        <Route path="/my-orders" element={<><MyOrders /><Footer /></>} />

        {/* Compliance */}
        <Route path="/terms" element={<><TermsPage /><Footer /></>} />
        <Route path="/privacy" element={<><PrivacyPolicyPage /><Footer /></>} />
        <Route path="/refund" element={<><CancellationRefundPage /><Footer /></>} />
        <Route path="/delivery" element={<><ShippingDeliveryPage /><Footer /></>} />
      </Routes>
    </Suspense>
  </>
);

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <CartProvider>
        <LoadingProvider>
          <Router>
            <main className="text-neutral-200 antialiased w-full min-h-screen">
              
              {/* 🔔 GLOBAL TOASTER (Bottom Right) */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: "#1f2937",
                    color: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #374151",
                  },
                }}
              />

              <Suspense fallback={<Loader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/*" element={<PublicLayout />} />

                  {/* Admin routes */}
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Routes>
              </Suspense>
            </main>
          </Router>
        </LoadingProvider>
      </CartProvider>
    </SocketProvider>
  </AuthProvider>
);

export default App;
