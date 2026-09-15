import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HomeHighlights from "./HomeHighlights";
import GiftShowcase from "./GiftShowcase";
import Footer from "./Footer";
import FestivitiesT from "./FestivitiesT";
import Cards from "./Cards";
import ContactWidget from "./ContactWidget";
import { Shield, ArrowRight } from "lucide-react";

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Hero Section */}
      <div className="relative min-h-[90vh] w-full bg-gradient-to-b from-[#f8fafc] to-white text-[#0F285B] overflow-hidden flex flex-col justify-center">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-5 h-auto px-4 sm:px-6 md:px-16 lg:px-28 py-12 md:py-16 max-w-7xl mx-auto w-full">
          <div className="w-full md:w-1/2 flex flex-col justify-center items-start text-left space-y-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
              <Shield className="w-4 h-4 text-[#0F285B]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0F285B]">
                ODS GLOBAL NETWORK PLATFORM
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#0F285B] tracking-tight leading-tight">
              Healthcare, Wellness &amp;{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BE9B49] via-[#EDC45B] to-[#8D7338]">
                Gifting Ecosystem
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 max-w-lg leading-relaxed font-normal">
              Unified digital infrastructure connecting healthcare providers, wellness merchants, corporate employers, and diaspora families across Ethiopia.
            </p>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0F285B] hover:bg-[#091838] text-[#EDC45B] font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/gifting-options"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-[#0F285B] hover:bg-gray-50 font-bold text-sm rounded-xl shadow-xs transition"
              >
                <span>Explore Services &amp; Gifting</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex justify-center items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#EDC45B]/20 to-[#0F285B]/10 rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/hero.svg"
                alt="ODS Global Network Platform"
                className="relative w-full max-h-[460px] object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Highlights & Showcase */}
      <HomeHighlights />
      <FestivitiesT />
      <Cards />
      <GiftShowcase />
      <ContactWidget />
      <Footer />
    </>
  );
};

export default Home;
