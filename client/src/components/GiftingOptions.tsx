import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import BASE_URL from "../api/api";

type Gift = {
  _id: string;
  title: string;
  category: "corporate" | "individual";
  occasion?: string;
};

const GiftingOptions = () => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"corporate" | "individual" | "diaspora" | "">("");
  const navigate = useNavigate();
  const location = useLocation();

  // Set category from query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type");
    if (type === "individual" || type === "corporate" || type === "diaspora") {
      setSelectedCategory(type);
    }
  }, [location.search]);

  useEffect(() => {
  const fetchGifts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/gifts`);
      if (!res.ok) throw new Error("Failed to fetch gifts");
      const data: Gift[] = await res.json();

      // Sort alphabetically by title before saving
      const sortedData = data.sort((a, b) => a.title.localeCompare(b.title));

      setGifts(sortedData);
    } catch (err) {
      console.error("Error fetching gifts:", err);
    }
  };
  fetchGifts();
}, []);


  const categories: Array<"corporate" | "individual" | "diaspora"> = ["corporate", "individual", "diaspora"];

  const filteredGifts = (category: typeof categories[number]) => {
  let filtered = category === "diaspora"
    ? gifts.filter(g => g.category === "individual")
    : gifts.filter(g => g.category === category);

  // Sort alphabetically by title (case insensitive)
  return filtered.sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );
};


  const slugify = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleProceed = () => {
    if (!selectedGift || !selectedCategory) {
      alert("Please select a gift and category.");
      return;
    }
    // Pass the selected category as a URL parameter (preserve diaspora)
    navigate(`/gifts/${slugify(selectedGift)}?category=${selectedCategory}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md bg-white shadow-3xl rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-spin-slow"></div>
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-gradient-to-tr from-[#D4AF37] to-[#1c2b21] rounded-full opacity-20 animate-pulse"></div>

        <div className="absolute -top-5 left-5 bg-[#D4AF37] text-white text-xs px-3 py-1 rounded-full shadow-md z-10">
          ODS Global Network Member Access
        </div>

        <div className="flex justify-center mb-6 mt-4 relative z-10">
          <img src="/wanaw gifting logo.jpeg" alt="ODS Global Network Logo" className="h-16 w-16 rounded-full object-cover" />
        </div>

        <h2 className="text-2xl font-bold text-[#1c2b21] mb-4 text-center relative z-10">
          Select a Gift
        </h2>
        <p className="text-center text-gray-600 mb-6 relative z-10">
          Choose a gift for Corporate, Individual, or Ethiopian Diaspora.
        </p>

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value as typeof categories[number]);
            setSelectedGift("");
          }}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#1c2b21] transition mb-4 text-gray-700 font-medium relative z-10"
        >
          <option value="">-- Select Category --</option>
          {categories
            .filter(cat => filteredGifts(cat).length > 0)
            .map(cat => (
              <option key={cat} value={cat}>
                {cat === "diaspora" ? "Ethiopian Diaspora" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
        </select>

        {selectedCategory && (
          <select
            value={selectedGift}
            onChange={(e) => setSelectedGift(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#1c2b21] transition mb-6 text-gray-700 font-medium relative z-10"
          >
            <option value="">-- Choose Occasion --</option>
            {filteredGifts(selectedCategory).map(g => (
              <option key={g._id} value={g.title}>
                {g.title}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleProceed}
          className="w-full bg-gradient-to-r from-[#1c2b21] to-[#3c4f3b] text-[#D4AF37] font-semibold py-3 rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition-all relative z-10"
        >
          Continue
        </button>

        <p className="text-center text-gray-400 mt-4 text-sm relative z-10">
          Your selection is secure and will be processed safely.
        </p>
      </div>
    </div>
  );
};

export default GiftingOptions;








