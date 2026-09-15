import { FaListAlt, FaUserFriends, FaCalendarAlt, FaPaperPlane } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useMemo } from "react";

const HomeHighlights = () => {
  const { t } = useTranslation();

  const highlights = useMemo(
    () => [
      {
        icon: <FaListAlt className="text-gold text-3xl sm:text-4xl" />,
        titleKey: "home.highlights.items.browse.title",
        descriptionKey: "home.highlights.items.browse.description",
        link: "/services",
        actionKey: "home.highlights.items.browse.action",
      },
      {
        icon: <FaUserFriends className="text-gold text-3xl sm:text-4xl" />,
        titleKey: "home.highlights.items.role.title",
        descriptionKey: "home.highlights.items.role.description",
        link: "/gifting-options",
        actionKey: "home.highlights.items.role.action",
      },
      {
        icon: <FaCalendarAlt className="text-gold text-3xl sm:text-4xl" />,
        titleKey: "home.highlights.items.occasion.title",
        descriptionKey: "home.highlights.items.occasion.description",
        link: "/gifting-occasions",
        actionKey: "home.highlights.items.occasion.action",
      },
      {
        icon: <FaPaperPlane className="text-gold text-3xl sm:text-4xl" />,
        titleKey: "home.highlights.items.personal.title",
        descriptionKey: "home.highlights.items.personal.description",
        link: "/how-it-works",
        actionKey: "home.highlights.items.personal.action",
      },
    ],
    []
  );

  return (
    <section className="relative bg-green pt-20 pb-24 px-6 sm:px-10 md:px-20 overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-32 overflow-hidden leading-[0]">
        <svg
          className="relative block w-full h-full"
          viewBox="0 0 500 80"
          preserveAspectRatio="none"
        >
          <path d="M500,0 C400,80 100,0 0,80 L0,0 L500,0 Z" fill="white" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-10">
        <div className="text-center ">
          <h2 className="relative inline-block text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
            <span className="relative z-10">
              <Trans
                i18nKey="home.highlights.sectionTitle"
                components={{
                  accent: <span className="text-gold" />,
                }}
              />
            </span>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-[#edc45b] rounded-full opacity-60 blur-sm"></span>
          </h2>
          <p className="mt-4 text-white/80 text-sm md:text-base max-w-xl mx-auto">
            {t("home.highlights.sectionSubtitle")}
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="/Mindfulness.svg"
              alt={t("home.highlights.illustrationAlt")}
              className="w-full max-w-[400px] md:max-w-[500px] rounded-full "
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-6">
            {highlights.slice(0, 2).map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 bg-white/10 backdrop-blur-md shadow-md rounded-xl p-5 hover:shadow-lg transition-all duration-300"
              >
                <div className="min-w-[40px]">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-sm text-white mb-3">{t(item.descriptionKey)}</p>
                  <Link
                    to={item.link}
                    className="inline-block bg-[#be9b49] text-green font-semibold text-sm px-4 py-2 rounded-full hover:rounded-md hover:text-[#0f285b] transition"
                  >
                    {t(item.actionKey)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.slice(2).map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 bg-white/10 backdrop-blur-md shadow-md rounded-xl p-5 hover:shadow-lg transition-all duration-300"
            >
              <div className="min-w-[40px]">{item.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm text-white mb-3">{t(item.descriptionKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeHighlights;
