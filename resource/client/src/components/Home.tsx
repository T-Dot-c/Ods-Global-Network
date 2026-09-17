import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import HomeHighlights from "./HomeHighlights";

import GiftShowcase from "./GiftShowcase";

import Footer from "./Footer";
import FestivitiesT from "./FestivitiesT";

import Cards from "./Cards";
import ContactWidget from "./ContactWidget";

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="relative h-screen w-full bg-zinc-50 text-gold overflow-hidden">
        <div className=" social-bar bg-green  py-6 overflow-hidden ">
          <div className="bg-green py-6 overflow-x-auto"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-5 h-auto px-4 sm:px-6 md:px-16 lg:px-28 py-10 md:py-0">
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-left space-y-5">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-[#1c2b21] text-center leading-snug md:leading-tight">
              {t("home.hero.title")}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-700 text-center max-w-md">
              {t("home.hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                to="/login"
                className="w-full sm:w-auto text-center bg-[#D4AF37] text-[#1c2b21] font-semibold px-6 py-2.5 rounded-full border border-gray-300 shadow-sm hover:rounded-lg hover:shadow-md transition"
              >
                {t("home.hero.signIn")}
              </Link>
              <Link
                to="/gifting-options"
                className="w-full sm:w-auto text-center bg-[#1c2b21] text-[#D4AF37] font-semibold px-6 py-2.5 rounded-full shadow hover:rounded-lg hover:shadow-md transition"
              >
                {t("home.hero.sendGift")}
              </Link>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex justify-center items-center mb-8 md:mb-0">
            <img
              src="/hero.svg"
              alt={t("home.hero.imageAlt")}
              className="w-4/5 sm:w-3/4 md:w-full max-h-[500px] object-contain animate-fade-slide-in"
            />
          </div>
        </div>
      </div>
      <div></div>
      <div className="relative h-auto  bg-[#f9fafb] px-6 py-24 sm:py-32 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] bg-gradient-to-br from-yellow-400 to-yellow-300 rounded-br-[300px] shadow-xl opacity-80 z-0" />
        <div className="absolute top-[140px] left-[50px] w-[150px] h-[150px] bg-yellow-200 rounded-full shadow-md opacity-70 z-0 animate-bob" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1c2b21] mb-4">
              {t("home.about.heading")}{" "}
              <span className="text-gold">{t("home.about.headingAccent")}</span>
            </h2>
            <div className="w-20 h-1 mx-auto bg-yellow-500 rounded-full" />
          </div>

          <div className="text-gray-700 space-y-6 text-base md:text-lg leading-relaxed">
            <p className="animate-fade-in">
              <Trans
                i18nKey="home.about.p1"
                components={{
                  brand: (
                    <span className="font-semibold text-[#1c2b21]" />
                  ),
                }}
              />
            </p>
            <p className="animate-fade-in delay-150">{t("home.about.p2")}</p>
            <p className="animate-fade-in delay-300">{t("home.about.p3")}</p>
            <p className="text-gold font-bold italic text-xl animate-fade-in delay-500">
              {t("home.about.tagline")}
            </p>
          </div>
        </div>
      </div>

      <HomeHighlights />
      <Cards />
      <GiftShowcase />
      <FestivitiesT />
      <ContactWidget />

      <Footer />
    </>
  );
};

export default Home;
