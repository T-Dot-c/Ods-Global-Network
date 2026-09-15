import React, { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle, Send, FileText, Download } from "lucide-react";
import BASE_URL from "../api/api";
import { generateCertificate } from "../assets/generateCertificate";

interface Patient {
  _id: string; // maps backend id
  id?: number;
  name: string;
  age?: number;
  phone: string;
  whatsapp: string;
  telegram: string;
  email: string;
  facilityName: string;
  location: string;
  message?: string;
  idDocument: string;
  medicalCertificate: string;
  videos: string[];
}

interface UserRoles {
  gifter: boolean;
  influencer: boolean;
  brandAmbassador: boolean;
  serviceProvider: boolean;
  volunteer: boolean;
}

interface CertificateData {
  patientName: string;
  patientId: string;
  contributionType: string;
  date: string;
}

const getUserRoles = (): UserRoles => {
  const stored = localStorage.getItem("userRoles");
  return stored
    ? JSON.parse(stored)
    : {
        gifter: false,
        influencer: false,
        brandAmbassador: false,
        serviceProvider: false,
        volunteer: false,
      };
};

const HemodialysisPatientsList: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRoles] = useState<UserRoles>(getUserRoles());
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [recentActions, setRecentActions] = useState<Record<string, string>>({});

  const gifterLevel = localStorage.getItem("gifterLevel") || "Individual";

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${BASE_URL}/kidney-patients`);
        if (!res.ok) throw new Error("Failed to fetch patients");
        const data = await res.json();

        // Map backend id to _id and ensure videos is always an array
        const mappedPatients: Patient[] = data.map((p: any) => ({
  _id: p._id?.toString() || p.id?.toString(),
  id: p.id,
  name: p.name,
  age: p.age,
  phone: p.phone,
  whatsapp: p.whatsapp,
  telegram: p.telegram,
  email: p.email,
  facilityName: p.facilityName,
  location: p.location,
  message: p.message,
  idDocument: p.idDocument,
  medicalCertificate: p.medicalCertificate,
  videos: p.videos || [], // <-- backend already returns [] or array
}));


        setPatients(mappedPatients);
      } catch (err: any) {
        setError(err.message || "Error fetching patients");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleDownloadCertificate = () => {
    if (!certificateData) return;
    generateCertificate({
      name: localStorage.getItem("userName") || "Supporter",
      role: certificateData.contributionType,
      level: gifterLevel,
      qrData: `Patient: ${certificateData.patientName}|Type: ${certificateData.contributionType}|Date: ${certificateData.date}`,
    });
    setShowCertificateModal(false);
  };

  const handleAction = (patient: Patient, action: keyof UserRoles) => {
    const newRecentActions = { ...recentActions, [patient._id]: action };
    setRecentActions(newRecentActions);

    const contributionData = {
      patientId: patient._id,
      patientName: patient.name,
      contributionType: action,
      date: new Date().toISOString().split("T")[0],
    };
    localStorage.setItem(`contribution_${patient._id}`, JSON.stringify(contributionData));

    let contributionLabel = "";
    switch (action) {
      case "gifter":
        contributionLabel =
          gifterLevel.toLowerCase() === "corporate"
            ? "Corporate Gift Donor"
            : "Individual Gift Donor";
        alert(`🎁 Thank you for sending a gift to ${patient.name}!`);
        break;
      case "influencer":
        contributionLabel = "Awareness Influencer";
        alert(`📢 Thank you for promoting ${patient.name}!`);
        break;
      case "brandAmbassador":
        contributionLabel = "Brand Ambassador";
        alert(`🌟 Thank you for promoting the program for ${patient.name}!`);
        break;
      case "serviceProvider":
        contributionLabel = "Service Provider";
        alert(`🏥 Thank you for providing services to ${patient.name}!`);
        break;
      case "volunteer":
        contributionLabel = "Volunteer";
        alert(`🤝 Thank you for volunteering to help ${patient.name}!`);
        break;
    }

    setCertificateData({
      patientName: patient.name,
      patientId: patient._id,
      contributionType: contributionLabel,
      date: contributionData.date,
    });
    setShowCertificateModal(true);
  };

  const hasContributed = (patientId: string) => {
    return !!localStorage.getItem(`contribution_${patientId}`);
  };

  if (loading) return <div className="text-center mt-10 text-lg text-gray-600">Loading patients...</div>;
  if (error) return <div className="text-center mt-10 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8 text-[#1c2b21]">
        Hemodialysis Patients Needing Support
      </h2>

      {/* Certificate Modal */}
      {showCertificateModal && certificateData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#1c2b21] mb-4">Certificate of Contribution</h3>
            <p className="mb-4">
              Thank you for your contribution to <strong>{certificateData.patientName}</strong> as a {certificateData.contributionType}.
            </p>
            <p className="mb-6">You can now download your certificate of contribution.</p>
            <div className="flex gap-4">
              <button
                onClick={handleDownloadCertificate}
                className="flex-1 py-2 px-4 bg-[#1c2b21] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patients Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient) => {
          const hasContributedToPatient = hasContributed(patient._id);
          const recentAction = recentActions[patient._id];

          return (
            <div key={patient._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-transform duration-300 relative">
              {/* Contribution Badge */}
              {hasContributedToPatient && (
                <div className="absolute top-4 right-4 bg-[#D4AF37] text-white text-xs px-2 py-1 rounded-full z-10">
                  {recentAction === "gifter" && (gifterLevel.toLowerCase() === "corporate" ? "🏢 Corporate Gift Sent" : "🎁 Gift Sent")}
                  {recentAction === "influencer" && "📢 Promoting"}
                  {recentAction === "brandAmbassador" && "🌟 Ambassadoring"}
                  {recentAction === "serviceProvider" && "🏥 Serving"}
                  {recentAction === "volunteer" && "🤝 Volunteering"}
                </div>
              )}

{patient.videos.length > 0 ? (
  patient.videos.map((video, index) => (
    <video key={index} src={video} controls width="400" />
  ))
) : (
  <p>No videos uploaded</p>
)}

              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-semibold text-[#1c2b21]">
                  {patient.name} <span className="text-gray-500 text-lg">({patient.age ?? "N/A"} yrs)</span>
                </h3>
                <p className="text-gray-700"><strong>Facility:</strong> {patient.facilityName}</p>
                <p className="text-gray-700"><strong>Location:</strong> {patient.location}</p>
                <p className="text-gray-600 italic">{patient.message || "No additional info provided."}</p>

                {/* Contact Info */}
                <div className="space-y-1">
                  <strong className="block text-gray-800 mb-1">Contact Info:</strong>
                  <ul className="text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><Phone size={16} /> {patient.phone}</li>
                    <li className="flex items-center gap-2"><MessageCircle size={16} /> {patient.whatsapp}</li>
                    <li className="flex items-center gap-2"><Send size={16} /> {patient.telegram}</li>
                    <li className="flex items-center gap-2"><Mail size={16} /> <a href={`mailto:${patient.email}`} className="text-blue-600 underline">{patient.email}</a></li>
                  </ul>
                </div>

                {/* Documents */}
                <div className="space-y-1">
                  <strong className="block text-gray-800 mb-1">Documents:</strong>
                  <ul className="space-y-1">
                    {patient.idDocument && (
                      <li className="flex items-center gap-2">
                        <FileText size={16} />
                        <a href={patient.idDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ID Document</a>
                      </li>
                    )}
                    {patient.medicalCertificate && (
                      <li className="flex items-center gap-2">
                        <FileText size={16} />
                        <a href={patient.medicalCertificate} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Medical Certificate</a>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 p-4 bg-[#F5F5F5] border-t">
                {Object.entries(userRoles).map(([role, isActive]) =>
                  isActive ? (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleAction(patient, role as keyof UserRoles)}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold hover:rounded-full transition text-sm ${
                        hasContributedToPatient
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-[#D4AF37] text-[#1c2b21] hover:bg-[#c19b2a]"
                      }`}
                      disabled={hasContributedToPatient}
                    >
                      {role === "gifter" && (gifterLevel.toLowerCase() === "corporate" ? "🏢 Corporate Gift" : "🎁 Send Gift")}
                      {role === "influencer" && "📢 Promote"}
                      {role === "brandAmbassador" && "🌟 Promote Program"}
                      {role === "serviceProvider" && "🏥 Provide Service"}
                      {role === "volunteer" && "🤝 Volunteer"}
                    </button>
                  ) : null
                )}

                {/* Certificate Download Button */}
                {hasContributedToPatient && (
                  <button
                    onClick={() => {
                      const contribution = JSON.parse(localStorage.getItem(`contribution_${patient._id}`) || "{}");
                      setCertificateData({
                        patientName: patient.name,
                        patientId: patient._id,
                        contributionType: contribution.contributionType,
                        date: contribution.date || new Date().toISOString().split("T")[0],
                      });
                      setShowCertificateModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1c2b21] text-white font-semibold hover:bg-[#0f1a14] transition text-sm flex items-center justify-center gap-1"
                  >
                    <Download size={16} /> Certificate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HemodialysisPatientsList;
