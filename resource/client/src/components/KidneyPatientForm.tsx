import React, { useState, type ChangeEvent, type FormEvent } from "react";
import BASE_URL from "../api/api";

interface KidneyPatientFormData {
  name: string;
  age: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  email: string;
  facility: string;
  location: string;
  message: string;
  idDocument: File | null;
  medicalCertificate: File | null;
  videos: FileList | null;
}

const KidneyPatientForm: React.FC = () => {
  const [formData, setFormData] = useState<KidneyPatientFormData>({
    name: "",
    age: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    email: "",
    facility: "",
    location: "",
    message: "",
    idDocument: null,
    medicalCertificate: null,
    videos: null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check video duration (client-side)
  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = video.duration;
        URL.revokeObjectURL(video.src);
        if (duration < 30 || duration > 60) {
          reject(`Video "${file.name}" must be 30–60 seconds. Current: ${Math.round(duration)}s`);
        } else {
          resolve(true);
        }
      };

      video.onerror = () => {
        reject(`Cannot read video "${file.name}"`);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files) return;

    if (name === "videos") {
      try {
        for (const file of Array.from(files)) {
          await checkVideoDuration(file);
        }
        setFormData(prev => ({ ...prev, videos: files }));
        setError("");
      } catch (err: any) {
        setError(err);
        e.target.value = ""; // reset file input
        setFormData(prev => ({ ...prev, videos: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  setLoading(true);

  try {
    const form = new FormData();
    form.append("name", formData.name);
    form.append("age", formData.age);
    form.append("phone", formData.phone);
    form.append("whatsapp", formData.whatsapp);
    form.append("telegram", formData.telegram);
    form.append("email", formData.email);
    form.append("facilityName", formData.facility);
    form.append("location", formData.location);
    form.append("message", formData.message);

    if (formData.idDocument) form.append("idDocument", formData.idDocument);
    if (formData.medicalCertificate) form.append("medicalCertificate", formData.medicalCertificate);
    if (formData.videos) {
      Array.from(formData.videos).forEach(video => form.append("videos", video));
    }

    const res = await fetch(`${BASE_URL}/kidney-patients`, {
      method: "POST",
      body: form,
    });

    // Read the response as text first
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text); // try parsing JSON
    } catch {
      throw new Error(`Server returned non-JSON response: ${text.substring(0, 200)}...`);
    }

    if (!res.ok) throw new Error(data?.error || "Submission failed");

    setSuccess("Submission successful");
    setFormData({
      name: "",
      age: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      email: "",
      facility: "",
      location: "",
      message: "",
      idDocument: null,
      medicalCertificate: null,
      videos: null,
    });
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Submission failed");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-10">
      <div className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-xl relative z-10">
        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md">
          Patient Assistance
        </div>

        <div className="flex justify-center mb-6">
          <img src="/wanaw gifting logo.jpeg" alt="ODS Global Network Logo" className="h-16 w-16 rounded-full object-cover" />
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center text-[#1c2b21]">
          Hemodialysis Patient Submission
        </h2>

        <p className="text-center text-gray-600 text-sm mb-6">
          Please fill out this form accurately for support
        </p>

        {error && <p className="text-red-600 mb-4 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm text-center">{success}</p>}
        {loading && <p className="text-yellow-600 mb-4 text-sm text-center">Submitting...</p>}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <input name="name" placeholder="Full Name" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="age" type="number" placeholder="Age" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="phone" placeholder="Phone" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="whatsapp" placeholder="WhatsApp" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="telegram" placeholder="Telegram" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="facility" placeholder="Health Facility Name" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <input name="location" placeholder="Location" onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-400"/>
          <textarea name="message" placeholder="Additional Information" onChange={handleChange} className="p-2 border border-gray-300 rounded-md text-sm resize-none h-24 focus:ring-2 focus:ring-yellow-400"/>

          <div>
            <label className="block text-sm text-gray-600 mb-1">ID / Passport / License</label>
            <input type="file" name="idDocument" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="w-full text-sm" required/>
            {formData.idDocument && <p className="text-xs mt-1 text-gray-500">Selected: {formData.idDocument.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Medical Certificate</label>
            <input type="file" name="medicalCertificate" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="w-full text-sm" required/>
            {formData.medicalCertificate && <p className="text-xs mt-1 text-gray-500">Selected: {formData.medicalCertificate.name}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Short Video (30s–1min)</label>
            <input type="file" name="videos" accept="video/*" multiple onChange={handleFileChange} className="w-full text-sm"/>
            {formData.videos && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {Array.from(formData.videos).map((file, i) => (
                  <video key={i} src={URL.createObjectURL(file)} controls className="w-32 h-20 object-cover rounded-md"/>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition">
            Submit Form
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">Ⓒ All rights reserved by ODS Global Network</p>
      </div>
    </div>
  );
};

export default KidneyPatientForm;

