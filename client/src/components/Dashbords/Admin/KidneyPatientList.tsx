import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../../../api/api"; // adjust your path as needed

type KidneyPatient = {
  _id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
  facility?: string;
  location?: string;
  message?: string;
  idDocument?: string;           // Local file path or full URL
  medicalCertificate?: string;   // Local file path or full URL
  videos?: string[];             // Array of file URLs
};

const KidneyPatientList = () => {
  const [patients, setPatients] = useState<KidneyPatient[]>([]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/kidney-patients`)
      .then((res) => setPatients(res.data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  // Helper to determine full URL for documents (local files or full URLs)
  const getDocumentUrl = (doc: string) =>
    doc.startsWith("http") ? doc : `${BASE_URL}${doc}`;

  return (
    <div className="p-4 max-w-7xl mx-auto overflow-x-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">Kidney Patients</h2>

      {patients.length === 0 ? (
        <p className="text-center">No patients found.</p>
      ) : (
        <table className="min-w-full table-auto border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">#</th>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Phone</th>
              <th className="border px-3 py-2">WhatsApp</th>
              <th className="border px-3 py-2">Telegram</th>
              <th className="border px-3 py-2">Email</th>
              <th className="border px-3 py-2">Facility</th>
              <th className="border px-3 py-2">Location</th>
              <th className="border px-3 py-2">Message</th>
              <th className="border px-3 py-2">Documents</th>
              <th className="border px-3 py-2">Videos</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, idx) => (
              <tr key={patient._id} className="text-center">
                <td className="border px-3 py-2">{idx + 1}</td>
                <td className="border px-3 py-2">{patient.name}</td>
                <td className="border px-3 py-2">{patient.phone ?? "-"}</td>
                <td className="border px-3 py-2">{patient.whatsapp ?? "-"}</td>
                <td className="border px-3 py-2">{patient.telegram ?? "-"}</td>
                <td className="border px-3 py-2">
                  {patient.email ? (
                    <a href={`mailto:${patient.email}`} className="text-blue-600 underline">
                      {patient.email}
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border px-3 py-2">{patient.facility ?? "-"}</td>
                <td className="border px-3 py-2">{patient.location ?? "-"}</td>
                <td className="border px-3 py-2 whitespace-pre-wrap">{patient.message ?? "-"}</td>
                <td className="border px-3 py-2 space-y-1">
                  {patient.idDocument ? (
                    <a
                      href={getDocumentUrl(patient.idDocument)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline block"
                    >
                      ID Document
                    </a>
                  ) : (
                    "-"
                  )}
                  {patient.medicalCertificate ? (
                    <a
                      href={getDocumentUrl(patient.medicalCertificate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline block"
                    >
                      Certificate
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border px-3 py-2 space-y-2">
                  {patient.videos && patient.videos.length > 0 ? (
                    patient.videos.map((video, i) => (
                      <video
                        key={i}
                        src={video}
                        controls
                        className="w-48 h-auto mx-auto border rounded"
                        aria-label={`Video ${i + 1} for ${patient.name}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ))
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default KidneyPatientList;

