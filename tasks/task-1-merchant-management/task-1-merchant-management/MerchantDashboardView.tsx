import React, { useState } from "react";
import { 
  Building2, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus, 
  Eye, 
  ArrowUpRight 
} from "lucide-react";

export default function MerchantDashboardView() {
  const [activeFilter, setActiveFilter] = useState("all");

  const stats = [
    { title: "Active Services Listed", value: "18", change: "+3 this month", icon: Package },
    { title: "Service Requests Received", value: "42", change: "6 pending proposals", icon: Users },
    { title: "Confirmed Bookings", value: "128", change: "+14% vs last week", icon: CheckCircle2 },
    { title: "Total Gifting & Service Volume", value: "485,200 ETB", change: "+22% MoM", icon: DollarSign }
  ];

  const recentRequests = [
    { id: "REQ-901", customer: "Yared M.", service: "Comprehensive Full Body Executive Checkup", date: "Today, 11:30 AM", status: "Proposal Sent" },
    { id: "REQ-902", customer: "Bethlehem T.", service: "Hemodialysis Session Support Package", date: "Today, 09:15 AM", status: "Accepted" },
    { id: "REQ-903", customer: "Dawit K.", service: "In-Home Physiotherapy Consultation", date: "Yesterday", status: "Pending Review" },
    { id: "REQ-904", customer: "Almaz S.", service: "Cardiac Ultrasound & ECG Diagnostic", date: "Sep 12, 2026", status: "Completed" }
  ];

  return (
    <div className="max-w-7xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-[#0f285b] via-[#163a82] to-[#0f285b] rounded-2xl text-white shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#edc45b] text-[#0f285b] mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> ODS Verified Healthcare Merchant
          </span>
          <h1 className="text-2xl md:text-3xl font-black">St. Gabriel Specialized Healthcare</h1>
          <p className="text-blue-200 text-sm mt-1">
            Merchant ID: <strong className="font-mono text-[#edc45b]">ODS-MER-09214</strong> • Addis Ababa, Ethiopia
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="px-4 py-2.5 bg-[#edc45b] hover:bg-[#be9b49] text-[#0f285b] font-bold text-xs rounded-xl transition shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Service
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-5 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">{s.title}</span>
                <div className="w-8 h-8 rounded-lg bg-[#0f285b]/10 text-[#0f285b] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#0f285b]" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-[#0f285b] mt-2">{s.value}</h3>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {s.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Customer Inquiries & Requests */}
      <div className="p-6 bg-white border border-gray-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0f285b]">Live Customer Service Requests</h3>
            <p className="text-xs text-gray-500">Service requests matched to your medical category</p>
          </div>
          <button 
            type="button"
            className="text-xs font-bold text-[#0f285b] hover:text-[#edc45b] flex items-center gap-1"
          >
            Browse All Requests <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Request Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Requested Service</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-[#0f285b]">{req.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{req.customer}</td>
                  <td className="py-3 px-4 text-gray-600">{req.service}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{req.date}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      req.status === "Accepted" ? "bg-green-100 text-green-800" :
                      req.status === "Completed" ? "bg-blue-100 text-blue-800" :
                      req.status === "Proposal Sent" ? "bg-purple-100 text-purple-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      type="button"
                      className="px-3 py-1 bg-gray-100 hover:bg-[#0f285b] hover:text-white rounded text-xs font-bold text-gray-700 transition"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
