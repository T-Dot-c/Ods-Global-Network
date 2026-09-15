import { useEffect, useState } from "react";
import { FaSpa, FaHeartbeat, FaUser, FaHotel } from "react-icons/fa";
import { GiLotus} from "react-icons/gi";
import type { JSX } from "react";
import BASE_URL from "../../api/api";

const categories = [
  "All",
  "ODS Package",
  "Corporate Package",
  "Family Package",
  "Community Package",
  "Diaspora Package"
  
];

interface Program {
  _id: string;
  title: string;
  category: string;
  image: string;
  services: string[];
}

const getIcon = (category: string): JSX.Element => {
  switch (category) {
    case "Wellness":
      return <FaSpa className="text-green-600 text-2xl" />;
    case "Medical":
      return <FaHeartbeat className="text-red-600 text-2xl" />;
    case "Home Based/Mobile Services":
      return <GiLotus className="text-purple-600 text-2xl" />;
    case "Hotel Rooms":
      return <FaHotel className="text-yellow-600 text-2xl" />;
    default:
      return <FaUser className="text-gray-500 text-2xl" />;
  }
};

export default function Programs() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/programs`)
      .then((res) => res.json())
      .then((data) => setPrograms(data))
      .catch((err) => console.error("Failed to fetch programs:", err));
  }, []);

  const toggle = (index: number) =>
    setOpenIndex((prev) => (prev === index ? null : index));

  const filtered =
    selectedCategory === "All"
      ? programs
      : programs.filter((p) => p.category === selectedCategory);

  return (
    <div className="bg-[#f9fafb] min-h-screen py-16 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-[#0f285b] mb-4">
          ODS Programs
        </h1>
        <p className="text-center text-gray-700 max-w-3xl mx-auto mb-8">
          Explore our wide range of services and solutions crafted for your
          wellbeing.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                selectedCategory === cat
                  ? "bg-[#0f285b] text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="space-y-6">
          {filtered.map((program: Program, index: number) => (
            <div
              key={program._id || index}
              className="bg-white border max-w-2xl m-auto mb-6 rounded-xl overflow-hidden shadow"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {getIcon(program.category)}
                  <span className="text-lg font-semibold text-[#0f285b]">
                    {program.title}
                  </span>
                </div>
                <span className="text-gray-400 text-xl">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              
              {openIndex === index && (
                <div>
               {program.image && (
  <img
     src={`${BASE_URL.replace("/api", "")}${program.image}`}
    alt={program.title}
    className="w-full h-48 object-contain rounded-3xl mb-4"
  />
  )}
                  <ul className="px-6 py-4 list-disc list-inside text-gray-700 space-y-1 text-sm">
                    {program.services.map((service, i) => (
                      <li key={i}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500">No programs found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
