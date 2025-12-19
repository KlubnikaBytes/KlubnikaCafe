// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// --- Context Providers ---
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { LoadingProvider } from "./context/LoadingContext";

// --- Core Layout Components ---
import Navbar from "./components/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import Loader from "./components/Loader";

// --- Lazy Load Page Components ---
const HeroSection = lazy(() => import("./components/HeroSection"));
const Dishes = lazy(() => import("./components/Dishes"));
const About = lazy(() => import("./components/About"));
const Mission = lazy(() => import("./components/Mission"));
const Expertise = lazy(() => import("./components/Expertise"));
const Review = lazy(() => import("./components/Review")); // ✅ Review is imported back
const Merchandise = lazy(() => import("./components/Merchandise")); // ✅ Added Merchandise
const Cart = lazy(() => import("./components/Cart"));
const Auth = lazy(() => import("./components/Auth"));
const Contact = lazy(() => import("./components/ContactSection"));
const Gallery = lazy(() => import("./components/Gallery"));
const MyOrders = lazy(() => import("./components/MyOrders"));
const RatingPage = lazy(() => import("./components/RatingPage")); 

// --- NEW LAZY IMPORTS FOR RAZORPAY COMPLIANCE ---
const TermsPage = lazy(() => import("./components/TermsPage")); 
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage")); 
const CancellationRefundPage = lazy(() => import("./components/CancellationRefundPage")); 
const ShippingDeliveryPage = lazy(() => import("./components/ShippingDeliveryPage")); 
// --- END NEW LAZY IMPORTS ---

// --- Lazy Load Admin Components ---
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

/**
 * Public layout that wraps all non-admin pages.
 * Navbar and Footer stay constant while routed content changes.
 */
const PublicLayout = () => (
  <>
    <Navbar />
    <ScrollToTop /> {/* Keep ScrollToTop outside Suspense so it works on all routes immediately */}
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
              <Review /> {/* ✅ Review Section added back here, below Expertise */}
              <Footer />
            </>
          }
        />
        <Route
          path="/dishes"
          element={
            <>
              <Dishes />
              <Footer />
            </>
          }
        />
        <Route
          path="/merchandise"
          element={
            <>
              <Merchandise /> {/* ✅ New Merchandise Page Route */}
              <Footer />
            </>
          }
        />
        <Route
          path="/cart"
          element={
            <>
              <Cart />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Contact />
              <Footer />
            </>
          }
        />
        <Route
          path="/ratings"
          element={
            <>
              <RatingPage />
              <Footer />
            </>
          }
        />
        <Route
          path="/auth"
          element={
            <>
              <Auth />
              <Footer />
            </>
          }
        />
        <Route
          path="/gallery"
          element={
            <>
              <Gallery />
              <Footer />
            </>
          }
        />
        <Route
          path="/my-orders"
          element={
            <>
              <MyOrders />
              <Footer />
            </>
          }
        />
        
        {/* --- COMPLIANCE ROUTES --- */}
        <Route path="/terms" element={<><TermsPage /><Footer /></>} />
        <Route path="/privacy" element={<><PrivacyPolicyPage /><Footer /></>} />
        <Route path="/refund" element={<><CancellationRefundPage /><Footer /></>} />
        <Route path="/delivery" element={<><ShippingDeliveryPage /><Footer /></>} />
        {/* ------------------------------------ */}

      </Routes>
    </Suspense>
    <ToastContainer />
  </>
);

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <CartProvider>
        <LoadingProvider>
          <Router>
            <main className="text-neutral-200 antialiased w-full min-h-screen">
              {/* Root routing */}
              <Suspense fallback={<Loader />}>
                <Routes>
                  {/* Public routes (with Navbar/Footer) */}
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