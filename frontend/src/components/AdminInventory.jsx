// frontend/src/components/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('klubnikaAdminToken');

  useEffect(() => {
    // 1. Check for admin token
    if (!adminToken) {
      navigate('/admin');
      return;
    }

    // 2. Fetch all products
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        setMenuData(data);
      } catch (err) {
        setError('Failed to fetch menu items.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [adminToken, navigate]);

  const handleStockToggle = async (productId, currentStatus) => {
    const newStatus = !currentStatus;

    try {
      const res = await fetch(`${API_URL}/products/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          productId: productId,
          isInStock: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stock');
      }

      // Update the state locally to avoid a full re-fetch
      setMenuData((prevData) =>
        prevData.map((category) => ({
          ...category,
          items: category.items?.map((item) =>
            item._id === productId ? { ...item, isInStock: newStatus } : item
          ),
          subCategories: category.subCategories?.map((sub) => ({
            ...sub,
            items: sub.items.map((item) =>
              item._id === productId ? { ...item, isInStock: newStatus } : item
            ),
          })),
        }))
      );
    } catch (err) {
      alert('Error updating stock. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('klubnikaAdminToken');
    navigate('/admin');
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold">Inventory Management</h1>
          
        </div>

        {menuData.map((category) => (
          <div key={category.name} className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">
              {category.name}
            </h2>
            {category.items &&
              category.items.map((item) => (
                <StockItem
                  key={item._id}
                  item={item}
                  onToggle={handleStockToggle}
                />
              ))}
            {category.subCategories &&
              category.subCategories.map((sub) => (
                <div key={sub.name} className="ml-4 mb-6">
                  <h3 className="text-2xl font-semibold text-gray-300 mb-2">
                    {sub.name}
                  </h3>
                  {sub.items.map((item) => (
                    <StockItem
                      key={item._id}
                      item={item}
                      onToggle={handleStockToggle}
                    />
                  ))}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// A helper component for the toggle switch
const StockItem = ({ item, onToggle }) => {
  return (
    <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg mb-3">
      <div>
        <p className="text-lg font-semibold">{item.title}</p>
        <p className="text-sm text-gray-400">{item.price}</p>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`font-bold ${item.isInStock ? 'text-green-500' : 'text-red-500'}`}>
          {item.isInStock ? 'In Stock' : 'Sold Out'}
        </span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.isInStock}
            onChange={() => onToggle(item._id, item.isInStock)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </label>
      </div>
    </div>
  );
};

export default AdminDashboard;