// src/components/Gifting/GiftCard.tsx
import { useNavigate } from "react-router-dom";

interface GiftCardProps {
  title: string;
  description: string;
  gifts: string[];
  selectedGift: string;
  onChange: (value: string) => void;
  slugPrefix: string;
  colors: {
    bg: string;
    text: string;
    buttonBg: string;
    buttonText: string;
  };
}

const GiftCard = ({
  title,
  description,
  gifts,
  selectedGift,
  onChange,
  colors,
}: GiftCardProps) => {
  const navigate = useNavigate();

  const slugify = (text: string) =>
    text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div
      className={`${colors.bg} text-${colors.text} p-10 rounded-3xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:scale-[1.015]`}
    >
      <h3 className="text-2xl font-semibold mb-3 text-center">{title}</h3>
      <p className="text-sm mb-6 text-center">{description}</p>

      <select
        value={selectedGift}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 mb-2 px-2 py-2 rounded-lg text-sm text-gray-700 bg-white border border-gray-300 focus:ring-2 focus:ring-green-400 shadow-sm"
      >
        <option value="">-- Select Gift --</option>
        {gifts.map(title => (
          <option key={title} value={title}>
            {title}
          </option>
        ))}
      </select>

      {selectedGift && (
        <>
          <p className="mt-2 font-medium text-sm">✅ Selected: {selectedGift}</p>
          <button
            onClick={() => navigate(`/gifts/${slugify(selectedGift)}`)}
            className={`mt-5 w-full ${colors.buttonBg} ${colors.buttonText} py-2.5 rounded-full shadow-md hover:rounded-md font-semibold transition duration-300`}
          >
            Continue to Details
          </button>
        </>
      )}
    </div>
  );
};

export default GiftCard;
