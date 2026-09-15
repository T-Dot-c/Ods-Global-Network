import { FaCrown, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const MembershipPreview = () => {
  const navigate = useNavigate();

  const handleNavigate = (role: "user" | "provider") => {
    navigate(`/membership/select?role=${role}`);
  };

  return (
    <section className="bg-[#f9fafb] px-6 md:px-20 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1c2b21] mb-3">
          Membership Options
        </h2>
        <p className="text-gray-600 text-base md:text-lg">
          Choose the right membership that fits your goals — whether you're a
          user or a provider.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Service Providers Preview */}
        <div
          className="bg-white shadow-md hover:shadow-xl transition rounded-xl p-6 border-l-4 border-[#1c2b21] cursor-pointer"
          onClick={() => handleNavigate("provider")}
        >
          <div className="flex items-center gap-4 mb-4">
            <FaUserTie className="text-3xl text-[#1c2b21]" />
            <h3 className="text-xl font-bold text-[#1c2b21]">
              For Service Providers
            </h3>
          </div>
          <ul className="text-gray-600 text-sm space-y-2 mb-4">
            <li>✔ Create & manage services</li>
            <li>✔ Promote your business</li>
            <li>✔ Track performance with insights</li>
          </ul>
          <span className="inline-block bg-[#1c2b21] text-gold px-5 py-2 rounded-full text-sm font-medium hover:rounded-md transition">
            View Plans
          </span>
        </div>

        {/* Users Preview */}
        <div
          className="bg-white shadow-md hover:shadow-xl transition rounded-xl p-6 border-l-4 border-yellow-500 cursor-pointer"
          onClick={() => handleNavigate("user")}
        >
          <div className="flex items-center gap-4 mb-4">
            <FaCrown className="text-3xl text-gold" />
            <h3 className="text-xl font-bold text-[#1c2b21]">For Users</h3>
          </div>
          <ul className="text-gray-600 text-sm space-y-2 mb-4">
            <li>✔ Book & gift services</li>
            <li>✔ Get discounts & rewards</li>
            <li>✔ Enjoy exclusive content</li>
          </ul>
          <span className="inline-block bg-[#D4AF37] text-[#1c2b21] px-5 py-2 rounded-full text-sm font-medium hover:rounded-md transition">
            Discover Benefits
          </span>
        </div>
      </div>
    </section>
  );
};

export default MembershipPreview;

