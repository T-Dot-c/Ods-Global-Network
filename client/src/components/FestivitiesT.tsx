import { useEffect, useMemo } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useTranslation } from "react-i18next";

const FESTIVAL_KEYS = [
  "ashenda",
  "irreechaa",
  "meskel",
  "timket",
  "buhe",
  "enkutatash",
  "genna",
  "fasika",
  "mothersDay",
  "fathersDay",
  "valentines",
  "womensDay",
  "worldHealth",
] as const;

function FestivitiesT() {
  const { t } = useTranslation();

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const festivals = useMemo(
    () =>
      FESTIVAL_KEYS.map((key) => ({
        key,
        title: t(`home.festivities.items.${key}.title`),
        desc: t(`home.festivities.items.${key}.desc`),
      })),
    [t]
  );

  return (
    <div className="relative w-full overflow-hidden">
      <div className="relative w-full h-[70vh] sm:h-[80vh] md:h-screen">
        <img
          src="/Festivities.svg"
          alt={t("home.festivities.heroImageAlt")}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-black opacity-40 z-10" />
        <div className="relative z-20 flex items-center justify-center h-full text-center text-gold px-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {t("home.festivities.heroTitle")}
            </h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto">
              {t("home.festivities.heroSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute top-full left-0 w-full h-32 overflow-hidden leading-[0] z-20 -mt-1">
        <svg
          className="relative block w-full h-full"
          viewBox="0 0 500 80"
          preserveAspectRatio="none"
        >
          <path d="M500,0 C400,80 100,0 0,80 L0,0 L500,0 Z" fill="#d4af37" />
        </svg>
      </div>

      <section className="relative z-30 -mt-16 sm:-mt-24 md:-mt-28 px-4 sm:px-8 md:px-16 pb-12">
        <div className="scroll-content">
          <div className="flex gap-6 sm:gap-8 md:gap-10 min-w-max pb-2">
            {festivals.map((festival) => (
              <div
                key={festival.key}
                className="min-w-[260px] sm:min-w-[300px] flex-shrink-0
                             bg-green border border-none
                             p-5 rounded-2xl
                             hover:scale-105 transform transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-gold mb-2">{festival.title}</h3>
                <p className="text-sm text-gray-800 text-gold leading-relaxed">{festival.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FestivitiesT;
