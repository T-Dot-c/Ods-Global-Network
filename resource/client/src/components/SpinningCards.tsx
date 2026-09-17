import { FaSpa, FaGift, FaBriefcase } from "react-icons/fa";
import { MdMedicalServices } from "react-icons/md";
import { Link } from "react-router-dom";

const SpinningCards = () => {
  const cards = [
    {
      frontIcon: <FaSpa className="text-4xl text-blue-600" />,
      backText: "Explore spa, massage & yoga options",
      link: "/services",
    },
    {
      frontIcon: <MdMedicalServices className="text-4xl text-green-600" />,
      backText: "Get access to health & medical services",
      link: "/services",
    },
    {
      frontIcon: <FaGift className="text-4xl text-pink-600" />,
      backText: "Send a wellness gift or gift card",
      link: "/gifts",
    },
    {
      frontIcon: <FaBriefcase className="text-4xl text-yellow-500" />,
      backText: "Packages for your company or team",
      link: "/corporate",
    },
  ];

  return (
    <div className="w-full bg-gray-50 py-10 px-4 mt-10 md:mt-20">
      <div className="max-w-6xl mx-auto grid gap-6 grid-cols-2 md:grid-cols-4">
        {cards.map((card, index) => (
          <Link to={card.link} key={index} className="card-flip h-52">
            <div className="card-inner w-full h-full">
              <div className="card-front">{card.frontIcon}</div>
              <div className="card-back text-center text-sm font-medium px-4">
                {card.backText}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SpinningCards;
