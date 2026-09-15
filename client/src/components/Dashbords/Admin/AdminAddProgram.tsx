import { useState } from "react";
import BASE_URL from "../../../api/api";

const categories = [
  "ODS Package",
  "Family Package",
  "Premium Package",
  "Comunity Package",
];



export default function AdminAddProgram() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [services, setServices] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleServiceChange = (index: number, value: string) => {
    const updated = [...services];
    updated[index] = value;
    setServices(updated);
  };

  const addService = () => setServices([...services, ""]);
  const removeService = (index: number) =>
    setServices(services.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    if (image) formData.append("image", image);
    services
      .filter((s) => s.trim() !== "")
      .forEach((s) => formData.append("services", s)
);

    try {
      const res = await fetch(`${BASE_URL}/programs`, {
        method: "POST",
        headers: {
          Authorization: "Bearer your-admin-secret", // secure properly
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Program added successfully!");
        setTitle("");
        setCategory("");
        setImage(null);
        setServices([""]);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Server error while submitting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold text-[#1c2b21]">Add New Program</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Program Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded border-gray-300"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="w-full p-2 border text-gray-500 rounded border-gray-300"
        >
          <option value="">Select Category</option>
         {categories.map((cat) => (
  <option key={cat} value={cat}>
    {cat}
  </option>
))}

        </select>

        {/* Image File Upload */}
  <input
  type="file"
  accept="image/*"
  required
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }}
  className="w-full p-2 border text-gray-500 rounded border-gray-300"
/>
{imagePreview && (
  <img
    src={imagePreview}
    alt="Preview"
    className="w-full max-h-64 object-contain mt-2 rounded"
  />
)}



        <div>
          <label className="font-semibold block mb-1">Services:</label>
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={service}
                onChange={(e) => handleServiceChange(index, e.target.value)}
                placeholder={`Service ${index + 1}`}
                className="flex-1 p-2 border rounded border-gray-300"
                required
              />
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-500 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addService}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add another service
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#1c2b21] text-white px-4 py-2 rounded"
        >
          {loading ? "Submitting..." : "Add Program"}
        </button>
      </form>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
}

