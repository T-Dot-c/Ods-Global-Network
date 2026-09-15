import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../api/api";


// Subcategory definitions
const wellnessSubcategories = [
  { label: "Salon & Hairstyling", options: ["Hair Styling", "Haircut", "Hair Coloring", "Blow Dry"] },
  { label: "Gym & Fitness", options: ["Gym", "Personal Trainer", "Yoga Instructor", "Health Coach"] },
  { label: "Outdoor Wellness Activities", options: ["Hiking", "Wellness Camping"] },
  { label: "Spa and Wellness Treatments", options: ["Massages", "Facials", "Other Spa Services"] },
  { label: "Cosmetic Services", options: ["Skin Treatments", "Makeup Services"] },
  { label: "Holistic Therapies", options: ["Aromatherapy", "Acupuncture", "Reiki"] },
];

const medicalSubcategories = [
  { label: "Full Checkups", options: ["General Health Checkup", "Blood Tests", "Blood Pressure Monitoring", "Cholesterol & Glucose Screening", "Vision & Hearing Tests", "Physical Examination"] },
  { label: "Prenatal Services", options: ["Checkups & ultrasound", "Checkup only", "Intravenous drip"] },
  { label: "Dental Services", options: ["Crowning", "Braces", "Fillings", "Scaling", "Denture", "Extraction", "Root Canal Therapy", "Implants"] },
  { label: "Physiotherapy Services", options: ["Consultant ~ Full Time", "Consultant ~ Visit~1", "Consultant ~ Visit~2", "Consultant ~ Visit~3"] },
  { label: "Diagnostic Imaging Services", options: ["CT Scan", "MRI"] },
  { label: "Hemodialysis Services", options: ["Consultation", "Single Dialysis Session", "Weekly ~ Three Dialysis Session", "Bi-weekly ~ Six Dialysis Session", "Monthly ~ Twelve Dialysis Session"] },
  { label: "Aesthetic Services - Dermatology", options: ["Acne Treatment", "Scar Removal Treatment", "Hair Transplant", "Laser Hair Removal", "General Treatment"] },
  { label: "Nutritionist Services", options: ["Personalized Nutrition Plans", "Nutritional Counseling", "Nutritional Education", "Cooking Classes", "Weight Management", "Chronic Disease Management", "Ongoing Support", "Group Sessions"] },
  { label: "Aesthetic Services - Aesthetic Treatments", options: ["Facials", "Chemical peels", "Microneedling", "Waxing", "Makeup application", "Body treatments"] },
];

const homeBasedSubcategories = [
  { label: "Health - Medical", options: ["Primary Care", "Preventive Services"] },
  { label: "Health - Skilled Nursing", options: ["Full Time", "Assistants", "Care Taker"] },
  { label: "Spa and Wellness Treatments", options: ["Massages", "Facials", "Other Spa Services"] },
  { label: "Cosmetic Services", options: ["Skin Treatments", "Hair Styling", "Makeup Services"] },
];

const hotelRoomSubcategories = [
  { label: "3 Star Hotel", options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room"] },
  { label: "4 Star Hotel", options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room"] },
  { label: "5 Star Hotel", options: ["Standard Room", "Deluxe Room", "Twin Room", "Suit Room", "Royal Suite Room", "Presidential Room"] },
  { label: "Pensions", options: ["Standard Pension Room"] },
];

// Map category to its subcategories
const subcategoriesMap: Record<string, typeof wellnessSubcategories> = {
  Wellness: wellnessSubcategories,
  Medical: medicalSubcategories,
  "Home Based/Mobile Services": homeBasedSubcategories,
  Hotel: hotelRoomSubcategories,
};


const AddServiceForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [duration, setDuration] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState("");

 // Get token safely
  // 2️⃣ Get user token safely
  const user = JSON.parse(localStorage.getItem("user") || "{}");



  useEffect(() => {
    const allowedRoles = ["provider", "admin"];
    if (!user || !allowedRoles.includes(user.role)) {
      alert("Only providers or admins can add services.");
      navigate("/membership");
    }
  }, [navigate, user]);
const handleSubmit = async () => {
  // 1️⃣ Check required fields
  if (!title || !category || !price || !image) {
    alert("Title, Category, Price, and Image are required.");
    return;
  }

  // 2️⃣ Get token
  const token = localStorage.getItem("token");
  if (!token) {
    alert("You must be logged in to add a service.");
    return;
  }

  try {
    // 3️⃣ Upload image first
    const imageForm = new FormData();
    imageForm.append("image", image);

    const uploadRes = await fetch(`${BASE_URL.replace("/api", "")}/api/upload`, {
      method: "POST",
      body: imageForm,
      headers: {
        "Authorization": `Bearer ${token}`, // include token if required
      },
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json();
      console.error("Image upload failed:", errData);
      throw new Error(errData.msg || "Failed to upload image");
    }

    const uploadData = await uploadRes.json();
    // Use relative path from upload response (backend will convert to full URL when serving)
    const imageUrl = uploadData.imageUrl || uploadData.relativePath || uploadData.fullUrl?.replace(/^https?:\/\/[^\/]+/, '') || '';

    // 4️⃣ Send service creation request
    const serviceRes = await fetch(`${BASE_URL}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ send the correct token
      },
      body: JSON.stringify({
        title,
        description,
        category,
        subcategory,
        price,
        duration,
        tags,
        location,
        imageUrl, // Send relative path - backend stores this and converts to full URL when serving
      }),
    });

    if (!serviceRes.ok) {
      const errData = await serviceRes.json();
      console.error("Service creation failed:", errData);
      alert(errData.msg || "Failed to create service");
      return;
    }

    const data = await serviceRes.json();
    console.log("Service created:", data);
    alert("Service added successfully!");
    navigate("/services");
  } catch (err: any) {
    console.error("Error in handleSubmit:", err);
    alert(err.message || "Something went wrong while adding the service.");
  }
};


  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-bold mb-6 text-center text-[#0f285b]">Add a Service</h2>

      <input
        type="text"
        placeholder="Title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49] resize-none h-24"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      >
        <option value="">Select Category *</option>
        <option value="Wellness">Wellness</option>
        <option value="Medical">Medical</option>
        <option value="Home Based/Mobile Services">Home Based/Mobile Services</option>
        <option value="Hotel">Hotel</option>
      </select>

      {category && subcategoriesMap[category] && (
        <select
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
        >
          <option value="">Select Subcategory *</option>
          {subcategoriesMap[category].map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      )}

      <input
        type="number"
        placeholder={category === "Hotel" || category === "Hotel Rooms" ? "Price per night (ETB) *" : "Price (ETB) *"}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      />

      <input
        type="text"
        placeholder="Duration (e.g. 60 minutes)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      />

      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      />

      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full border border-gray-300 rounded-xl p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-[#be9b49]"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        className="w-full mb-6"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-[#0f285b] hover:bg-[#16301b] text-[#be9b49] font-bold py-3 rounded-xl shadow-md transition duration-300"
      >
        Add Service
      </button>
    </div>
  );
};

export default AddServiceForm;





