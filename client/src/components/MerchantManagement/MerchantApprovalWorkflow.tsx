import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ExternalLink, 
  Building2, 
  Clock, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";

interface PendingMerchant {
  id: number;
  companyName: string;
  serviceType: string;
  email: string;
  phone: string;
  city: string;
  location: string;
  tin: string;
  submittedAt: string;
  licenseUrl: string;
  tradeRegistrationUrl: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

const INITIAL_APPLICATIONS: PendingMerchant[] = [
  {
    id: 101,
    companyName: "Blue Nile Diagnostic & Imaging Center",
    serviceType: "Laboratories & Diagnostic Centers",
    email: "info@bluenileimaging.et",
    phone: "+251 91 234 5678",
    city: "Addis Ababa",
    location: "Bole Medhanialem, Ovid Tower, 2nd Floor",
    tin: "0092817263",
    submittedAt: "10 mins ago",
    licenseUrl: "/uploads/sample_license.pdf",
    tradeRegistrationUrl: "/uploads/sample_trade.pdf",
    status: "pending"
  },
  {
    id: 102,
    companyName: "CarePlus Home Healthcare & Emergency Response",
    serviceType: "Home Healthcare Providers",
    email: "admin@careplus.et",
    phone: "+251 92 345 6789",
    city: "Addis Ababa",
    location: "Sarbet, Next to Vatican Embassy",
    tin: "0083716254",
    submittedAt: "25 mins ago",
    licenseUrl: "/uploads/sample_license.pdf",
    tradeRegistrationUrl: "/uploads/sample_trade.pdf",
    status: "pending"
  },
  {
    id: 103,
    companyName: "Lucy Specialized Physiotherapy & Wellness",
    serviceType: "Wellness & Physiotherapy Centers",
    email: "lucy.wellness@gmail.com",
    phone: "+251 93 456 7890",
    city: "Addis Ababa",
    location: "Kazanchis, Guinea Conakry St.",
    tin: "0074615243",
    submittedAt: "1 hour ago",
    licenseUrl: "/uploads/sample_license.pdf",
    tradeRegistrationUrl: "/uploads/sample_trade.pdf",
    status: "pending"
  }
];

export default function MerchantApprovalWorkflow() {
  const [merchants, setMerchants] = useState<PendingMerchant[]>(INITIAL_APPLICATIONS);
  const [selectedMerchant, setSelectedMerchant] = useState<PendingMerchant | null>(merchants[0]);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApprove = (id: number) => {
    setMerchants((prev: PendingMerchant[]) => prev.map((m: PendingMerchant) => m.id === id ? { ...m, status: "approved" as const } : m));
    const target = merchants.find((m: PendingMerchant) => m.id === id);
    setActionNotice(`Merchant "${target?.companyName}" has been APPROVED. Notification dispatched.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleRejectSubmit = () => {
    if (!selectedMerchant) return;
    setMerchants((prev: PendingMerchant[]) => prev.map((m: PendingMerchant) => m.id === selectedMerchant.id ? { ...m, status: "rejected" as const, notes: rejectReason } : m));
    setActionNotice(`Merchant "${selectedMerchant.companyName}" has been REJECTED. Reason sent to merchant email.`);
    setRejectModalOpen(false);
    setRejectReason("");
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-gray-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#edc45b] bg-[#0f285b] px-3 py-1 rounded-full">
            ODS Admin Verification Engine
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#0f285b] mt-2">
            Merchant Compliance & Approval Workflow
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Review submitted legal documents, verify TIN certificates, and approve merchant listings in under 5 minutes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-blue-50 text-[#0f285b] border border-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#edc45b]" /> KPI Target: &lt; 5 min Review
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#0f285b] font-medium text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#edc45b]" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Grid Layout: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Merchant Applications List */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">
            Pending Applications ({merchants.filter((m: PendingMerchant) => m.status === "pending").length})
          </h3>

          <div className="space-y-2">
            {merchants.map((m: PendingMerchant) => {
              const isSelected = selectedMerchant?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMerchant(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected 
                      ? "border-[#0f285b] bg-blue-50/40 shadow-sm ring-2 ring-[#0f285b]/20" 
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#0f285b]">{m.companyName}</h4>
                      <p className="text-xs text-gray-500">{m.serviceType}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      m.status === "approved" ? "bg-green-100 text-green-800" :
                      m.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                    <span>{m.city}</span>
                    <span>{m.submittedAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Inspection & Decision Pane */}
        <div className="lg:col-span-7 bg-gray-50/60 p-6 rounded-xl border border-gray-200">
          {selectedMerchant ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#0f285b]">{selectedMerchant.companyName}</h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Category: <strong className="text-gray-800">{selectedMerchant.serviceType}</strong> • TIN: <strong className="font-mono text-gray-800">{selectedMerchant.tin}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedMerchant.location}, {selectedMerchant.city}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Contact</span>
                  <span className="text-xs font-bold text-[#0f285b] block">{selectedMerchant.phone}</span>
                  <span className="text-xs text-gray-500 block">{selectedMerchant.email}</span>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Submitted Verification Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0f285b]" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">Business License</p>
                        <p className="text-[10px] text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <a
                      href={selectedMerchant.licenseUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0f285b] hover:text-[#edc45b] font-bold flex items-center gap-1"
                    >
                      Inspect <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#0f285b]" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">Trade Registration</p>
                        <p className="text-[10px] text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <a
                      href={selectedMerchant.tradeRegistrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#0f285b] hover:text-[#edc45b] font-bold flex items-center gap-1"
                    >
                      Inspect <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Decision Actions */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500">Current Status:</span>{" "}
                  <strong className="text-xs uppercase font-bold text-[#0f285b]">{selectedMerchant.status}</strong>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={selectedMerchant.status === "rejected"}
                    className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApprove(selectedMerchant.id)}
                    disabled={selectedMerchant.status === "approved"}
                    className="px-5 py-2 bg-[#0f285b] hover:bg-[#091838] text-[#edc45b] text-xs font-bold rounded-lg transition shadow disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Merchant
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select an application from the left to inspect documents and make a verification decision.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" /> Specify Rejection Rationale
            </h3>
            <p className="text-xs text-gray-600">
              This message will be included in the automated notification sent to <strong>{selectedMerchant?.email}</strong>.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
              placeholder="e.g. Expired business license, invalid TIN certificate, or missing service price list..."
              className="w-full p-3 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
