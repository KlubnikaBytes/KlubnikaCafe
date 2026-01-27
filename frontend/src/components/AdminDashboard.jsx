import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminInventory from './AdminInventory';
import AdminOrderDashboard from './AdminOrderDashboard';
import AdminInvoices from './AdminInvoices';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const navigate = useNavigate();

  // --- CONFIGURATION ---
  const SESSION_DURATION = 5 * 60 * 1000; // 5 Minutes Session
  const RELOAD_INTERVAL = 30 * 1000;      // 30 Seconds Auto-Reload

  const handleLogout = () => {
    localStorage.removeItem('klubnikaAdminToken');
    localStorage.removeItem('adminSessionStart');
    navigate('/admin');
  };

  // --- EFFECT 1: Global Session Timeout ---
  useEffect(() => {
    const initSession = () => {
      const now = Date.now();
      let startTime = localStorage.getItem('adminSessionStart');

      if (!startTime) {
        startTime = now.toString();
        localStorage.setItem('adminSessionStart', startTime);
      }

      const elapsed = now - parseInt(startTime, 10);

      if (elapsed >= SESSION_DURATION) {
        setShowTimeoutModal(true);
        return;
      }

      const remainingTime = SESSION_DURATION - elapsed;
      const logoutTimeout = setTimeout(() => {
        setShowTimeoutModal(true);
      }, remainingTime);

      return () => clearTimeout(logoutTimeout);
    };

    return initSession();
  }, []);

  // --- EFFECT 2: Auto-Reload (Optimized for activeTab) ---
  useEffect(() => {
    let reloadTimer;

    if (activeTab === 'orders') {
      reloadTimer = setInterval(() => {
        const currentElapsed = Date.now() - parseInt(localStorage.getItem('adminSessionStart') || '0', 10);
        
        if (currentElapsed < SESSION_DURATION) {
          window.location.reload();
        }
      }, RELOAD_INTERVAL);
    }

    return () => {
      if (reloadTimer) clearInterval(reloadTimer);
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 relative">
      
      {/* --- TIMEOUT POPUP --- */}
      {showTimeoutModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl border border-red-600 text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="text-red-500 text-5xl md:text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Session Timed Out</h2>
            <p className="text-gray-400 mb-8 text-sm md:text-base">
              Your session has expired for security reasons. Please login again to continue.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition text-lg active:scale-95"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}

      {/* --- DASHBOARD CONTENT --- */}
      <div className={`max-w-7xl mx-auto transition-all duration-500 ${showTimeoutModal ? 'blur-md pointer-events-none scale-95' : ''}`}>
        
        {/* Header Section: Stack on mobile, Row on Desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Portal</h1>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <span className={`text-[10px] md:text-xs px-2 py-1 rounded border uppercase tracking-widest font-medium ${
               activeTab === 'orders' 
                 ? 'text-green-400 border-green-400/50 bg-green-400/10' 
                 : 'text-gray-500 border-gray-700 bg-gray-800'
             }`}>
               {activeTab === 'orders' ? 'Live Auto-Refresh: 30s' : 'Refresh: Paused'}
            </span>
            <button
              onClick={handleLogout}
              className="flex-1 md:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 border border-gray-700 transition active:bg-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* --- Tab Navigation: Scrollable on mobile --- */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-800 mb-6 md:mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex space-x-2 md:space-x-4 min-w-max">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 md:px-6 text-base md:text-xl font-semibold transition-all relative ${
                activeTab === 'orders' 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Live Orders
              {activeTab === 'orders' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in slide-in-from-left duration-300" />}
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-3 px-4 md:px-6 text-base md:text-xl font-semibold transition-all relative ${
                activeTab === 'inventory' 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Inventory
              {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in slide-in-from-left duration-300" />}
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-3 px-4 md:px-6 text-base md:text-xl font-semibold transition-all relative ${
                activeTab === 'invoices' 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Invoices
              {activeTab === 'invoices' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in slide-in-from-left duration-300" />}
            </button>
          </div>
        </div>

        {/* --- Tab Content --- */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'orders' && <AdminOrderDashboard />}
          {activeTab === 'inventory' && <AdminInventory />}
          {activeTab === 'invoices' && <AdminInvoices />}
        </div>
      </div>

      {/* Global CSS to hide scrollbar on mobile tab nav */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default AdminDashboard;