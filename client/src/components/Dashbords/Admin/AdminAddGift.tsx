import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import BASE_URL from "../../../api/api";

const AdminAddGift = () => {
  const [gift, setGift] = useState({
    title: "",
    category: "corporate",
    occasion: "",
    description: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setGift({ ...gift, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        setMessage("❌ Image must be smaller than 2MB");
        setSuccess(false);
        return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = "";

      // Upload image to local server if present
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append("image", imageFile);

          const uploadRes = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();

          if (!uploadData.success || !uploadData.imageUrl) {
            throw new Error("Failed to upload image");
          }

          // Convert relative path to full URL
          imageUrl = uploadData.imageUrl.startsWith("http") 
            ? uploadData.imageUrl 
            : `${BASE_URL}${uploadData.imageUrl}`;
        } catch (err) {
          console.error(err);
          setMessage("❌ Image upload failed");
          setSuccess(false);
          setLoading(false);
          return;
        }
      }

      // Get token from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setMessage("❌ You must be logged in to add a gift.");
        setSuccess(false);
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.token;
      
      if (!token) {
        setMessage("❌ You must be logged in to add a gift.");
        setSuccess(false);
        setLoading(false);
        return;
      }

      // Send gift data to backend
      const res = await fetch(`${BASE_URL}/gifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...gift, imageUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Gift added successfully!");
        setSuccess(true);
        setGift({ title: "", category: "corporate", occasion: "", description: "" });
        setImageFile(null);
        setPreviewUrl(null);
      } else {
        setMessage(`❌ ${data.msg || "Failed to add gift"}`);
        setSuccess(false);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
      setSuccess(false);
    }

    setLoading(false);

    // Clear message after 5 seconds
    setTimeout(() => setMessage(""), 5000);
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-xl rounded-xl p-8 mt-12 border border-gray-100">
      <h2 className="text-3xl font-bold text-center text-[#0f285b] mb-6">Add a New Gift</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            name="title"
            value={gift.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0f285b]"
            placeholder="e.g. Welcome Kit"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            name="category"
            value={gift.category}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm"
          >
            <option value="corporate">Corporate</option>
            <option value="individual">Individual</option>
          </select>
        </div>

        {/* Occasion */}
        <div>
          <label className="block font-semibold mb-1">Occasion (optional)</label>
          <input
            name="occasion"
            value={gift.occasion}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="e.g. Ashenda, Birthday"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1">Description (optional)</label>
          <textarea
            name="description"
            value={gift.description}
            onChange={handleChange}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Write a short description..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-semibold mb-1">Gift Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-1 border border-gray-300 rounded-md bg-white"
          />
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="mt-4 w-full max-h-64 object-contain rounded-lg border"
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-[#0f285b] hover:bg-[#2e4235] text-white font-semibold py-3 px-6 rounded-md shadow-md transition duration-200 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Adding..." : "Add Gift"}
        </button>

        {/* Message */}
        {message && (
          <p className={`text-center mt-4 font-medium ${success ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AdminAddGift;




