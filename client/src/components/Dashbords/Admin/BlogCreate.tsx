import { useState } from "react";
import BASE_URL from "../../../api/api";

const BlogCreate = () => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    coverImage: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, coverImage: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      alert("Please fill out all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("content", form.content);
    if (form.coverImage) {
      formData.append("coverImage", form.coverImage);
    }

    try {
      setLoading(true);
const res = await fetch(`${BASE_URL}/admin/posts`, {
  method: "POST",
  body: formData,
  credentials: "include", // keep this if you use cookies/sessions
});



      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create blog post");
      }

      alert("Blog post created!");
      setForm({ title: "", content: "", coverImage: null });
    } catch (err) {
      console.error("Error:", err);
      alert("Error creating blog post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Create Blog Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Post Title"
          className="w-full border p-2 rounded"
        />
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="Write content here..."
          className="w-full border p-2 rounded h-40"
        />
        <input
  type="file"
  name="coverImage"
  accept="image/*,application/pdf,video/*"
  onChange={handleFileChange}
/>


        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default BlogCreate;

