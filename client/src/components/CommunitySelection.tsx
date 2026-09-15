import { useNavigate } from "react-router-dom";

export default function CommunitySelection() {
  const navigate = useNavigate();

  const cardBaseClasses =
    "cursor-pointer rounded-3xl bg-white border-l-8 shadow-lg p-6 sm:p-8 transition-transform hover:scale-105 hover:shadow-2xl";
  const headingClasses = "text-xl sm:text-2xl font-bold mb-3 text-yellow-600";
  const paragraphClasses = "text-gray-700 text-sm sm:text-base leading-relaxed";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
      <h2 className="text-3xl sm:text-4xl font-extrabold mb-6 sm:mb-8 text-center text-[#0f285b] tracking-wide">
        Engage with Our Communities
      </h2>
      <p className="max-w-3xl mx-auto text-center text-gray-600 text-sm sm:text-base mb-10">
        Whether you are seeking support for chronic care or looking to help others,
        ODS Global Network communities offer tailored pathways to connect, heal, and grow.
      </p>

      {/* Community Cards Section - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
        {/* Support Community */}
        <div
          onClick={() => navigate("/community/support")}
          className={`${cardBaseClasses} border-[#0f285b]`}
          role="button"
          tabIndex={0}
          onKeyDown={() => navigate("/community/support")}
        >
          <h3 className={headingClasses}>Support Community</h3>
          <p className={paragraphClasses}>
            Provide funding or gifts for the treatment and medications of Hemodialysis patients.
          </p>
        </div>

        {/* Hemodialysis Patient Form */}
        <div
          onClick={() => navigate("/community/kidney")}
          className={`${cardBaseClasses} border-[#0f285b]`}
          role="button"
          tabIndex={0}
          onKeyDown={() => navigate("/community/kidney")}
        >
          <h3 className={headingClasses}>Hemodialysis Patient Form</h3>
          <p className={paragraphClasses}>
            If you are a Hemodialysis patient, fill out this form to be part of our support system for patients.
          </p>
        </div>
      </div>
    </div>
  );
}
