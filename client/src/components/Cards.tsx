import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";

export default function Cards() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handlePartnerClick = () => navigate("/partner-with-us");
  const handleCareerClick = () => navigate("/careers");

  return (
    <section className="py-16 px-4 md:px-10 bg-gradient-to-br from-white via-gray-50 to-gray-100">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-[#1c2b21] mb-14">
        <Trans
          i18nKey="home.cards.heading"
          components={{ accent: <span className="text-yellow-500" /> }}
        />
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div
          onClick={handlePartnerClick}
          className="group cursor-pointer bg-white border-l-4 border-[#1c2b21] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 h-full flex flex-col"
        >
          <h3 className="text-lg md:text-xl font-semibold text-[#1c2b21] mb-2 group-hover:text-yellow-500 transition-colors">
            {t("home.cards.partner.title")}
          </h3>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed flex-1">
            {t("home.cards.partner.body")}
          </p>
          <button className="mt-3 text-sm md:text-base text-[#1c2b21] font-medium hover:text-yellow-500 transition-colors">
            {t("home.cards.partner.cta")}
          </button>
        </div>

        <div className="bg-white border-l-4 border-yellow-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 h-full flex flex-col">
          <h3 className="text-lg md:text-xl font-semibold text-[#1c2b21] mb-2 hover:text-yellow-500 transition-colors">
            {t("home.cards.community.title")}
          </h3>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed flex-1">
            {t("home.cards.community.body")}
          </p>
          <Link
            to="/community"
            className="mt-3 inline-block text-sm md:text-base text-yellow-500 font-semibold hover:underline"
          >
            {t("home.cards.community.cta")}
          </Link>
          <a
            href="https://www.linkedin.com/company/wanaw-health-and-wellness-digital-solution/"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs md:text-sm text-blue-600 hover:underline"
          >
            {t("home.cards.community.linkedin")}
          </a>
        </div>

        <div
          onClick={handleCareerClick}
          className="group cursor-pointer bg-white border-l-4 border-[#1c2b21] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 h-full flex flex-col"
        >
          <h3 className="text-lg md:text-xl font-semibold text-[#1c2b21] mb-2 group-hover:text-yellow-500 transition-colors">
            {t("home.cards.careers.title")}
          </h3>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed flex-1">
            {t("home.cards.careers.body")}
          </p>
          <button className="mt-3 text-sm md:text-base text-[#1c2b21] font-medium hover:text-yellow-500 transition-colors">
            {t("home.cards.careers.cta")}
          </button>
          <a
            href="https://www.linkedin.com/company/wanaw-health-and-wellness-digital-solution/"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs md:text-sm text-blue-600 hover:underline"
          >
            {t("home.cards.careers.linkedin")}
          </a>
        </div>
      </div>
    </section>
  );
}
