import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL;

const AdminInvoices = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const adminToken = localStorage.getItem('klubnikaAdminToken');

  const months = [
    "", "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/invoices/stats`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [adminToken]);

  // Handle Excel Download
  const downloadReport = async (year, month) => {
    try {
      const res = await fetch(`${API_URL}/admin/invoices/download?year=${year}&month=${month}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const orders = await res.json();

      // --- UPDATED EXCEL MAPPING WITH SMART DELIVERY CHARGE CALCULATION ---
      const excelData = orders.map(order => {
        // 1. Get Values (use DB value if exists)
        let subTotalVal = order.subTotal;
        let gstAmountVal = order.gstAmount;
        let totalVal = order.totalAmount;
        let deliveryChargeVal = order.deliveryCharge;

        // 2. Fallback Logic for Older Orders (missing fields)
        if (!subTotalVal) {
             // If subtotal is missing, we try to detect if Delivery (20) was applied
             // Logic: If (Total - 20) / 1.05 results in a clean number, it likely had delivery charge
             // Or simpler: If order type is Delivery and Total suggests a small order
             
             // Base assumption: No delivery charge
             subTotalVal = totalVal / 1.05;
             
             // Check if applying delivery charge makes sense (e.g. Total 77.75 -> Sub 55)
             const subTotalWithDelivery = (totalVal - 20) / 1.05;
             
             // If SubtotalWithDelivery < 500, then Delivery Charge of 20 IS applicable.
             if (order.orderType === 'Delivery' && subTotalWithDelivery < 500) {
                 // Use the values assuming delivery charge exists
                 subTotalVal = subTotalWithDelivery;
                 deliveryChargeVal = 20; 
             }
        }

        // 3. GST Fallback
        if (!gstAmountVal) {
             gstAmountVal = totalVal - subTotalVal - (deliveryChargeVal || 0);
        }

        // 4. Final Delivery Charge Calculation (The Fix for your Screenshot)
        // If deliveryCharge is still undefined/null, calculate the gap
        if (deliveryChargeVal === undefined || deliveryChargeVal === null) {
             const gap = totalVal - subTotalVal - gstAmountVal;
             // If gap is approx 20, set it to 20. If approx 0, set to 0.
             deliveryChargeVal = Math.abs(gap - 20) < 1 ? 20 : (Math.abs(gap) < 1 ? 0 : gap);
        }

        return {
          OrderID: order._id,
          Date: new Date(order.createdAt).toLocaleDateString(),
          Customer: order.user?.name || 'Guest',
          Mobile: order.user?.mobile || 'N/A',
          OrderType: order.orderType || 'Delivery',
          
          // Items formatted for readability
          Items: order.items?.map(i => `${i.title} (x${i.quantity})`).join(', '),
          
          // Financial Breakdown
          Subtotal: Number(subTotalVal.toFixed(2)),
          GST_5_Percent: Number(gstAmountVal.toFixed(2)),
          Delivery_Charge: Number(deliveryChargeVal.toFixed(2)), // NOW CALCULATED CORRECTLY
          Total_Grand: Number(totalVal.toFixed(2)),
          
          Status: order.status,
          PaymentMethod: order.paymentMethod
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Setting column widths
      const wscols = [
        { wch: 25 }, // OrderID
        { wch: 12 }, // Date
        { wch: 20 }, // Customer
        { wch: 15 }, // Mobile
        { wch: 12 }, // OrderType
        { wch: 40 }, // Items
        { wch: 10 }, // Subtotal
        { wch: 15 }, // GST
        { wch: 15 }, // Delivery Charge
        { wch: 15 }, // Total
        { wch: 15 }, // Status
        { wch: 20 }, // PaymentMethod
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Sales Report");
      XLSX.writeFile(workbook, `Sales_Report_${months[month]}_${year}.xlsx`);

    } catch (err) {
      alert("Failed to download report");
      console.error(err);
    }
  };

  if (loading) return <div className="text-white p-4">Loading Invoices...</div>;

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Monthly Sales Records</h2>
          <p className="text-gray-400 text-sm mt-1">View and download tax-compliant reports (5% GST included)</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-700 text-gray-100 uppercase text-sm font-bold">
            <tr>
              <th className="p-4">Year</th>
              <th className="p-4">Month</th>
              <th className="p-4">Total Orders</th>
              <th className="p-4">Total Revenue (incl. Tax)</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {stats.map((stat, index) => (
              <tr key={index} className="hover:bg-gray-700 transition">
                <td className="p-4 font-bold text-white">{stat._id.year}</td>
                <td className="p-4 font-semibold text-primary">{months[stat._id.month]}</td>
                <td className="p-4">{stat.totalOrders} Orders</td>
                
                <td className="p-4 text-green-400 font-mono font-bold">
                  ₹{stat.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                
                <td className="p-4 text-right">
                  <button
                    onClick={() => downloadReport(stat._id.year, stat._id.month)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ml-auto transition-colors active:scale-95"
                  >
                    <span>Download Excel</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">No sales records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400 italic">
          * Note: Sales reports automatically calculate the 5% GST breakdown for each transaction. 
          Revenue shown includes collected taxes.
        </p>
      </div>
    </div>
  );
};

export default AdminInvoices;
