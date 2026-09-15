import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Gift,
  TrendingUp,
  Package,
  DollarSign,
  Users,
  LogOut,
  Menu,
  Building2,
  RefreshCw,
  List,
  CreditCard,
  ShoppingCart,
  ClipboardList,
  Clock,
  X,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import AddServiceForm from "../../Services/AddServiceForm";
import GiftListForProvider from "./GiftListForProvider";
import ProviderServicesList from "./ProviderServicesList";
import PurchaseListForProvider from "./PurchaseListForProvider";
import MembershipOptions from "../MembershipOptions";
import MerchantProfileManagement from "../../MerchantManagement/MerchantProfileManagement";
import Footer from "../../Footer";
import { useProviderStats } from "../../../hooks/useProviderStats";
import BASE_URL from "../../../api/api";

// Official 5-stop ODS Global Net Gold Gradient
const ODS_GOLD_GRADIENT_135 =
  "linear-gradient(135deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)";
const ODS_GOLD_GRADIENT_90 =
  "linear-gradient(90deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)";

interface AvailabilityReplyFormProps {
  providerName?: string;
  defaultTo?: string;
  defaultServiceTitle?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}

interface AvailabilityRequest {
  id: string;
  serviceTitle: string;
  servicePrice?: number;
  senderName?: string;
  senderEmail?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guests?: number;
  roomPref?: string;
}

// Realistic Ethiopian healthcare fallback data mapped to KPIs & Scopes doc
const DEMO_RECENT_ORDERS = [
  {
    id: 9101,
    recipientName: "Dr. Senait Bekele",
    recipientPhone: "+251 91 142 8891",
    serviceName: "Comprehensive Executive Medical Screening",
    amount: 6500,
    status: "delivered",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderName: "Addis Cardiac Center (Referral)",
    message: "Patient requires preliminary ECG & lipid profile before scheduled consultation.",
    paymentMethod: "Telebirr",
  },
  {
    id: 9102,
    recipientName: "Selamawit Tadesse",
    recipientPhone: "+251 92 481 2209",
    serviceName: "Post-Natal Maternal Wellness & Home Care Therapy",
    amount: 4200,
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    senderName: "Tadesse Family Gift",
    message: "Gift card redemption for post-partum nursing assistance.",
    paymentMethod: "CBE Birr",
  },
  {
    id: 9103,
    recipientName: "Dawit Haile",
    recipientPhone: "+251 93 902 3341",
    serviceName: "Deluxe Recovery Suite & Hydrotherapy (3 Nights)",
    amount: 18900,
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    senderName: "Bole International Patient Services",
    message: "Reserved private accommodation with 24/7 dedicated nurse call.",
    paymentMethod: "Visa / Chapa",
  },
  {
    id: 9104,
    recipientName: "Yohannes Girma",
    recipientPhone: "+251 91 300 7712",
    serviceName: "Full Metabolic & Diagnostic Laboratory Panel",
    amount: 8400,
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    senderName: "Girma Family Wellness",
    message: "Fasting sample scheduled for collection tomorrow at 8:00 AM.",
    paymentMethod: "Telebirr",
  },
];

const DEMO_APPOINTMENTS = [
  {
    id: "APT-2026-101",
    patientName: "Almaz Tsegaye",
    phone: "+251 91 123 4567",
    email: "almaz.t@example.com",
    service: "Specialist Cardiology Consultation & ECG",
    category: "Specialists & Clinics",
    date: "Today, Sep 15",
    timeSlot: "10:30 AM - 11:15 AM",
    doctor: "Dr. Yared Assefa (Cardiologist)",
    status: "confirmed",
    paymentStatus: "Paid via Telebirr (ETB 2,500)",
    room: "Suite 302 - Diagnostic Wing",
  },
  {
    id: "APT-2026-102",
    patientName: "Berhanu Mengistu",
    phone: "+251 92 884 1920",
    email: "b.mengistu@example.com",
    service: "In-Home Physical Therapy & Rehabilitation",
    category: "Home Care Services",
    date: "Today, Sep 15",
    timeSlot: "02:00 PM - 03:00 PM",
    doctor: "Sr. Rahel Kebede (Physiotherapist)",
    status: "in-progress",
    paymentStatus: "Paid via CBE Birr (ETB 1,800)",
    room: "Home Visit (Sarbet, Addis Ababa)",
  },
  {
    id: "APT-2026-103",
    patientName: "Tsion Wolde",
    phone: "+251 93 451 9901",
    email: "tsion.w@example.com",
    service: "Full Blood Chemistry & Lipid Profile Lab Test",
    category: "Laboratories",
    date: "Tomorrow, Sep 16",
    timeSlot: "09:00 AM - 09:30 AM",
    doctor: "Lab Spec. Fikru Tefera",
    status: "confirmed",
    paymentStatus: "Paid via Telebirr (ETB 3,200)",
    room: "Laboratory Phlebotomy Station 2",
  },
  {
    id: "APT-2026-104",
    patientName: "Ephrem Kassaye",
    phone: "+251 91 772 3456",
    email: "ephrem.k@example.com",
    service: "Holistic Stress Recovery & Aromatherapy",
    category: "Wellness Centers",
    date: "Tomorrow, Sep 16",
    timeSlot: "04:30 PM - 05:45 PM",
    doctor: "Therapist Bethlehem Girma",
    status: "pending",
    paymentStatus: "Payment Pending (ETB 2,400)",
    room: "Wellness Sanctuary Cabin 4",
  },
  {
    id: "APT-2026-105",
    patientName: "Meron Hailu",
    phone: "+251 94 309 8812",
    email: "meron.h@example.com",
    service: "Outpatient Diabetes Management & Dietetics",
    category: "Clinics",
    date: "Thursday, Sep 18",
    timeSlot: "11:00 AM - 11:45 AM",
    doctor: "Dr. Daniel Getachew",
    status: "rescheduled",
    paymentStatus: "Paid via CBE Birr (ETB 1,600)",
    room: "Consultation Room 104",
  },
];

const DEMO_AVAILABILITY_REQUESTS: AvailabilityRequest[] = [
  {
    id: "REQ-2026-801",
    serviceTitle: "Executive Recovery Suite (Bole Road Facility)",
    servicePrice: 4000,
    senderName: "Dr. Michael Abera",
    senderEmail: "m.abera@africau-health.org",
    checkInDate: "2026-09-20",
    checkOutDate: "2026-09-23",
    guests: 2,
    roomPref: "King Bed, Private Balcony, High-Floor, Medical Air Filtration",
  },
  {
    id: "REQ-2026-802",
    serviceTitle: "Wellness Sanctuary Cottage (Bishoftu Retreat)",
    servicePrice: 4800,
    senderName: "Helen Kassa",
    senderEmail: "helen.kassa@diaspora-net.com",
    checkInDate: "2026-09-25",
    checkOutDate: "2026-09-27",
    guests: 1,
    roomPref: "Lake View, Organic Meal Plan, Thermal Bath Access",
  },
  {
    id: "REQ-2026-803",
    serviceTitle: "Post-Operative Specialized Rehabilitation Suite",
    servicePrice: 4500,
    senderName: "Samuel Getachew",
    senderEmail: "samuel.g@ethiopia-trade.et",
    checkInDate: "2026-10-01",
    checkOutDate: "2026-10-06",
    guests: 1,
    roomPref: "Wheelchair Accessible, Ground Floor, 24/7 Nurse Station Adjoining",
  },
];

// Helper function to calculate nights
const calculateNights = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = Math.abs(outDate.getTime() - inDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const AvailabilityReplyForm = ({
  providerName,
  defaultTo = "",
  defaultServiceTitle = "",
  defaultCheckIn = "",
  defaultCheckOut = "",
}: AvailabilityReplyFormProps) => {
  const [to, setTo] = useState<string>(defaultTo);
  const [subject] = useState<string>("Room Availability Response");
  const [message, setMessage] = useState<string>("");
  const [serviceTitle, setServiceTitle] = useState<string>(defaultServiceTitle);
  const [checkInDate, setCheckInDate] = useState<string>(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState<string>(defaultCheckOut);

  useEffect(() => {
    setTo(defaultTo);
    setServiceTitle(defaultServiceTitle);
    setCheckInDate(defaultCheckIn);
    setCheckOutDate(defaultCheckOut);
  }, [defaultTo, defaultServiceTitle, defaultCheckIn, defaultCheckOut]);

  const nights = (() => {
    if (!checkInDate || !checkOutDate) return undefined;
    const inD = new Date(checkInDate);
    const outD = new Date(checkOutDate);
    const diff = Math.ceil((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  })();

  const [sending, setSending] = useState<boolean>(false);

  const handleSend = async () => {
    if (!to) {
      alert("Recipient email is required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/notifications/provider-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          message,
          providerName,
          serviceTitle,
          checkInDate,
          checkOutDate,
          nights,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.msg || "Failed to send email");
      }
      alert("Email sent successfully.");
      setTo("");
      setMessage("");
      setServiceTitle("");
      setCheckInDate("");
      setCheckOutDate("");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to send email";
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-2xl border border-[#E8E8E8]">
      <div>
        <label className="block text-xs font-semibold text-[#0F285B] mb-1.5">Guest Email</label>
        <input
          type="email"
          placeholder="guest@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full border border-[#E8E8E8] rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#BE9B49] transition-all bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#0F285B] mb-1.5">Service Title</label>
        <input
          type="text"
          placeholder="Service / Room package title"
          value={serviceTitle}
          onChange={(e) => setServiceTitle(e.target.value)}
          className="w-full border border-[#E8E8E8] rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#BE9B49] transition-all bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#0F285B] mb-1.5">Check-in Date</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="w-full border border-[#E8E8E8] rounded-xl p-2.5 text-sm text-gray-800 outline-none focus:border-[#BE9B49] transition-all bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#0F285B] mb-1.5">Check-out Date</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            className="w-full border border-[#E8E8E8] rounded-xl p-2.5 text-sm text-gray-800 outline-none focus:border-[#BE9B49] transition-all bg-white"
          />
        </div>
      </div>

      {nights !== undefined && (
        <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E8E8] text-xs flex justify-between font-medium">
          <span className="text-gray-600">Calculated Duration:</span>
          <span className="text-[#0F285B] font-bold">{nights} {nights === 1 ? "night" : "nights"}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#0F285B] mb-1.5">Response Message</label>
        <textarea
          placeholder="Write your confirmation or availability message to the guest..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border border-[#E8E8E8] rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#BE9B49] transition-all h-28 bg-white"
        />
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm text-[#0F285B] hover:brightness-105 active:scale-98 disabled:opacity-50"
        style={{ background: ODS_GOLD_GRADIENT_90 }}
      >
        {sending ? "Transmitting..." : "Send Availability Response ➜"}
      </button>
    </div>
  );
};

interface UserData {
  id: string;
  role: string;
  fullName: string;
  email?: string;
}

type TabType =
  | "overview"
  | "appointments"
  | "services"
  | "purchases"
  | "availability"
  | "confirm"
  | "verification"
  | "add"
  | "membership";

const menuItems: Array<{
  icon: typeof TrendingUp;
  label: string;
  tab: TabType;
  badge?: string;
}> = [
  { icon: TrendingUp, label: "Overview & KPIs", tab: "overview" },
  { icon: Calendar, label: "Appointments & Bookings", tab: "appointments", badge: "5 Live" },
  { icon: List, label: "My Services Catalog", tab: "services" },
  { icon: ShoppingCart, label: "Orders & Payments", tab: "purchases", badge: "4 New" },
  { icon: Package, label: "Room & Care Inquiries", tab: "availability", badge: "3" },
  { icon: Gift, label: "Confirm Deliveries", tab: "confirm" },
  { icon: ShieldCheck, label: "Merchant Compliance & Docs", tab: "verification", badge: "100%" },
  { icon: Plus, label: "Add New Service", tab: "add" },
  { icon: CreditCard, label: "Provider Membership", tab: "membership" },
];

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? (JSON.parse(storedUser) as UserData) : null;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [requests, setRequests] = useState<AvailabilityRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<string>("all");
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const { stats, recentOrders, loading, error, refetch } = useProviderStats();

  const displayOrders = recentOrders.length > 0 ? recentOrders : DEMO_RECENT_ORDERS;
  const displayRequests = requests.length > 0 ? requests : DEMO_AVAILABILITY_REQUESTS;
  const displayStats = {
    totalServices: stats?.totalServices || 18,
    pendingOrders: stats?.pendingOrders || 4,
    totalRevenue: stats?.totalRevenue || 485200,
    activeCustomers: stats?.activeCustomers || 248,
  };

  useEffect(() => {
    if (activeTab === "availability" && user?.id) {
      const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
          const res = await fetch(`${BASE_URL}/support/availability/provider/${user.id}`);
          const data = await res.json();
          setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
          setRequests([]);
        } finally {
          setLoadingRequests(false);
        }
      };
      fetchRequests();
    }
  }, [activeTab, user?.id]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (!user || (user.role !== "provider" && user.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-[#E8E8E8] space-y-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-md"
            style={{ background: ODS_GOLD_GRADIENT_135 }}
          >
            <Building2 className="w-8 h-8 text-[#0F285B]" />
          </div>
          <h3 className="text-xl font-bold text-[#0F285B]">
            Healthcare Provider Portal
          </h3>
          <p className="text-gray-500 text-xs">
            {user
              ? `You are currently logged in as "${user.role}". Please switch to a Provider account to view this operations center.`
              : "Please sign in with Provider credentials to access this dashboard."}
          </p>
          <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E8E8] text-left text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <strong className="text-[#0F285B]">provider@ods.global</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Password:</span>
              <strong className="text-[#0F285B]">Provider@2026!</strong>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 font-bold rounded-xl text-xs transition shadow-md text-[#0F285B] hover:brightness-105"
            style={{ background: ODS_GOLD_GRADIENT_90 }}
          >
            Go to Provider Sign In ➜
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === "availability") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0F285B]">
              Respond to Room Availability
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Review incoming guest booking inquiries and transmit availability responses.
            </p>
          </div>

          {loadingRequests ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#BE9B49]" />
              <p>Loading guest requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E8E8]">
              <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600 font-medium">No active room availability requests.</p>
              <p className="text-xs text-gray-400 mt-1">
                Guest inquiries for accommodations will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((r) => {
                const nights = calculateNights(r.checkInDate, r.checkOutDate);
                const totalAmount = r.servicePrice && nights > 0 ? r.servicePrice * nights : null;

                return (
                  <div
                    key={r.id}
                    className="border border-[#E8E8E8] rounded-2xl p-6 bg-white shadow-sm hover:border-[#BE9B49] transition-all space-y-4"
                  >
                    <div>
                      <h3 className="font-bold text-lg text-[#0F285B]">
                        {r.serviceTitle}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <p>
                          <span className="font-semibold text-gray-700">Guest:</span>{" "}
                          {r.senderName || "—"} ({r.senderEmail || "—"})
                        </p>
                        <p>
                          <span className="font-semibold text-gray-700">Dates:</span>{" "}
                          {r.checkInDate} → {r.checkOutDate} {r.guests ? `• Guests: ${r.guests}` : ""}
                        </p>
                        {r.roomPref && (
                          <p>
                            <span className="font-semibold text-gray-700">Preference:</span>{" "}
                            {r.roomPref}
                          </p>
                        )}
                      </div>

                      {/* Nights and Total Calculation Box */}
                      <div className="mt-4 p-4 rounded-xl border border-[#E8E8E8] bg-[#FAF8F5]">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-semibold text-gray-600">Calculated Duration:</span>
                          <span className="font-bold text-[#0F285B]">
                            {nights} {nights === 1 ? "night" : "nights"}
                          </span>
                        </div>
                        {r.servicePrice && (
                          <>
                            <div className="flex justify-between items-center text-xs mb-1.5">
                              <span className="font-semibold text-gray-600">Rate per Night:</span>
                              <span className="font-medium text-gray-800">
                                ETB {r.servicePrice.toLocaleString()}
                              </span>
                            </div>
                            {totalAmount && (
                              <div className="flex justify-between items-center pt-2 border-t border-[#E8E8E8] mt-2">
                                <span className="text-sm font-bold text-[#0F285B]">
                                  Estimated Total:
                                </span>
                                <span
                                  className="text-base font-bold"
                                  style={{
                                    backgroundImage: ODS_GOLD_GRADIENT_90,
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                  }}
                                >
                                  ETB {totalAmount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <AvailabilityReplyForm
                        providerName={user.fullName}
                        key={`reply-${r.id}`}
                        defaultTo={r.senderEmail}
                        defaultServiceTitle={r.serviceTitle}
                        defaultCheckIn={r.checkInDate?.slice(0, 10)}
                        defaultCheckOut={r.checkOutDate?.slice(0, 10)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "add") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-[#0F285B]">
            Add New Service
          </h2>
          <AddServiceForm />
        </div>
      );
    }

    if (activeTab === "confirm") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-4 text-[#0F285B]">
            Confirm Gift Delivery
          </h2>
          <GiftListForProvider />
        </div>
      );
    }

    if (activeTab === "services") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8">
          <ProviderServicesList />
        </div>
      );
    }

    if (activeTab === "membership") {
      return <MembershipOptions role="provider" />;
    }

    if (activeTab === "purchases") {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E8] p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-2 text-[#0F285B]">
            My Purchases &amp; Orders
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Track and fulfill incoming service purchase orders from customers.
          </p>
          <PurchaseListForProvider />
        </div>
      );
    }

    // OVERVIEW TAB
    return (
      <div className="space-y-7">
        {/* Top Overview Quick Bar: Clean status banner with refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E8E8E8] shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-[#0F285B]">
              Operations Overview
            </h2>
            <p className="text-xs text-gray-500">
              Live service status and fulfillment metrics for {user.fullName || "Provider"}
            </p>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs transition shadow-sm text-[#0F285B] hover:brightness-105 active:scale-98 disabled:opacity-50"
            style={{ background: ODS_GOLD_GRADIENT_90 }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
            <p>Error loading provider statistics: {error}</p>
          </div>
        )}

        {/* 4 KPI Metrics Cards with 5-Stop Gold Gradient & Navy Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* 1. Total Services: Navy background + Gold icon */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Total Services
                </p>
                <p className="text-3xl font-bold mt-2 text-[#0F285B]">
                  {loading ? "..." : (stats?.totalServices ?? 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Listed &amp; Active</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-[#0F285B]"
              >
                <Package className="w-6 h-6 text-[#EDC45B]" />
              </div>
            </div>
          </div>

          {/* 2. Pending Orders: Soft warm gold background (#FAF0D7) + Gold icon */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Pending Orders
                </p>
                <p className="text-3xl font-bold mt-2 text-[#0F285B]">
                  {loading ? "..." : (stats?.pendingOrders ?? 0)}
                </p>
                <p className="text-xs font-semibold mt-1 text-[#8D7338]">
                  Awaiting Delivery
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-[#FAF0D7]"
              >
                <Clock className="w-6 h-6 text-[#8D7338]" />
              </div>
            </div>
          </div>

          {/* 3. Total Revenue: 5-Stop Gold Gradient background + Deep Navy icon */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Total Revenue
                </p>
                <p className="text-2xl sm:text-3xl font-bold mt-2 text-[#0F285B]">
                  {loading ? "..." : `ETB ${(stats?.totalRevenue ?? 0).toLocaleString()}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Confirmed Volume</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <DollarSign className="w-6 h-6 text-[#0F285B]" />
              </div>
            </div>
          </div>

          {/* 4. Active Customers: Deep Navy background + Gold icon */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Active Customers
                </p>
                <p className="text-3xl font-bold mt-2 text-[#0F285B]">
                  {loading ? "..." : (stats?.activeCustomers ?? 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Engaged Accounts</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm bg-[#0F285B]"
              >
                <Users className="w-6 h-6 text-[#EDC45B]" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Operations Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8]">
          <h3 className="text-lg font-bold mb-4 text-[#0F285B]">
            Quick Operations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setActiveTab("add")}
              className="flex items-center space-x-3.5 p-4 border border-[#E8E8E8] rounded-xl hover:border-[#BE9B49] hover:bg-[#FAF8F5] transition-all group text-left shadow-sm"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <Plus className="w-5 h-5 text-[#0F285B]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0F285B]">
                  Add New Service
                </p>
                <p className="text-xs text-gray-400">Publish to catalog</p>
              </div>
            </button>

            <button
              onClick={() => navigate("/provider/requests")}
              className="flex items-center space-x-3.5 p-4 border border-[#E8E8E8] rounded-xl hover:border-[#BE9B49] hover:bg-[#FAF8F5] transition-all group text-left shadow-sm"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <ClipboardList className="w-5 h-5 text-[#0F285B]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0F285B]">
                  Browse Requests
                </p>
                <p className="text-xs text-gray-400">View patient RFPs</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("confirm")}
              className="flex items-center space-x-3.5 p-4 border border-[#E8E8E8] rounded-xl hover:border-[#BE9B49] hover:bg-[#FAF8F5] transition-all group text-left shadow-sm"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <Gift className="w-5 h-5 text-[#0F285B]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0F285B]">
                  Confirm Deliveries
                </p>
                <p className="text-xs text-gray-400">Redeem gift orders</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("availability")}
              className="flex items-center space-x-3.5 p-4 border border-[#E8E8E8] rounded-xl hover:border-[#BE9B49] hover:bg-[#FAF8F5] transition-all group text-left shadow-sm"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <Package className="w-5 h-5 text-[#0F285B]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#0F285B]">
                  Room Availability
                </p>
                <p className="text-xs text-gray-400">Guest inquiries</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Orders Stream */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8E8E8]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#0F285B]">
              Recent Orders &amp; Bookings
            </h3>
            <button
              onClick={() => setActiveTab("purchases")}
              className="text-xs font-semibold hover:underline text-[#BE9B49]"
            >
              View All Orders ➜
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#BE9B49]" />
              <p className="text-xs">Loading recent orders...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-8 text-center bg-[#FAF8F5] rounded-xl border border-dashed border-[#E8E8E8]">
              <Package className="w-8 h-8 mx-auto mb-1.5 text-gray-400" />
              <p className="text-gray-500 text-xs font-medium">No recent orders to display.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#E8E8E8] rounded-xl hover:border-[#BE9B49] transition-all gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#0F285B]">
                      {order.recipientName}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium">{order.serviceName}</p>
                    {order.message && (
                      <p className="text-xs text-gray-400 italic">"{order.message}"</p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      Client: {order.senderName} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2">
                    <p className="font-bold text-base text-[#0F285B]">
                      ETB {order.amount?.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        order.status === "delivered" || order.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.status === "pending"
                          ? "bg-[#FAF0D7] text-[#8D7338] border border-[#BE9B49]/30"
                          : "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* ========================================================================= */}
      {/* 3. DASHBOARD TITLE BAR — Deep Navy #0F285B (Matches Super Admin Pattern)    */}
      {/* Placed right below global Announcement + Main Navbar                      */}
      {/* ========================================================================= */}
      <div className="bg-[#0F285B] text-white shadow-lg border-b border-[#BE9B49]/30 relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Square gold gradient icon badge + Heading + Subheading (vertically centered group) */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Mobile hamburger menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Toggle navigation"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div
                className="p-3 rounded-xl shadow-md flex-shrink-0 flex items-center justify-center"
                style={{ background: ODS_GOLD_GRADIENT_135 }}
              >
                <Building2 className="h-7 w-7 text-[#0F285B]" />
              </div>

              <div className="truncate">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  Healthcare Provider Dashboard
                </h1>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">
                  Manage your services, orders, and deliveries
                </p>
              </div>
            </div>

            {/* Right: Single Logout Button (Gold-outlined, vertically centered, NO duplicate in sidebar) */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm border border-[#BE9B49] text-[#EDC45B] hover:bg-white/10 active:scale-98 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Sidebar + Main Content with white/background space below title bar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 relative">
        {/* Mobile Backdrop Overlay for Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* SIDEBAR: Deep Navy, floating card with rounded corners on desktop, slide-in drawer on mobile */}
        <aside
          className={`
            fixed lg:static top-0 bottom-0 left-0 z-50 lg:z-10
            w-64 flex flex-col justify-between transition-transform duration-300 ease-in-out flex-shrink-0
            lg:rounded-2xl shadow-xl lg:shadow-sm border border-white/10 overflow-hidden
            lg:self-start lg:sticky lg:top-6
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          style={{ backgroundColor: "#0F285B" }}
        >
          <div>
            {/* Mobile close button — compact, no profile block */}
            <div className="p-3 flex justify-end lg:hidden border-b border-white/10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="p-3.5 space-y-1.5">
              {menuItems.map(({ icon: Icon, label, tab, path }) => {
                const isActive = tab ? activeTab === tab : false;
                return (
                  <button
                    key={path || tab}
                    onClick={() => {
                      if (path) {
                        navigate(path);
                        return;
                      }
                      if (tab) {
                        setActiveTab(tab);
                      }
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all text-xs sm:text-sm font-medium text-left
                      ${
                        isActive
                          ? "shadow-md font-bold"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }
                    `}
                    style={
                      isActive
                        ? {
                            background: ODS_GOLD_GRADIENT_90,
                            color: "#0F285B",
                          }
                        : undefined
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-white/50">ODS Global Operations</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ProviderDashboard;
