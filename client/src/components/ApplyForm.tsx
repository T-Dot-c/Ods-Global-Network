import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../api/api";

const ApplyForm = () => {
  const { jobId } = useParams<{ jobId: string }>(); // get jobId from URL
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [employmentModel, setEmploymentModel] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [credentialsFile, setCredentialsFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) {
      alert("Job ID is missing. Cannot submit application.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("currentLocation", currentLocation);
    formData.append("specialization", specialization);
    formData.append("employmentModel", employmentModel);
    if (cvFile) formData.append("cv", cvFile);
    if (credentialsFile) formData.append("credentials", credentialsFile);

    try {
      setLoading(true);
       await axios.post(`${BASE_URL}/applications/${jobId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Application submitted successfully!");
      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setCurrentLocation("");
      setSpecialization("");
      setEmploymentModel("");
      setCvFile(null);
      setCredentialsFile(null);
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Apply for Job</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Current Location"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Employment Model"
          value={employmentModel}
          onChange={(e) => setEmploymentModel(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        />
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
          />
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCredentialsFile(e.target.files?.[0] || null)}
            className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default ApplyForm;



