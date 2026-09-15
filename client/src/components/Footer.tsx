import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link } from "react-router-dom";
import BASE_URL from "../api/api";
import axios from "axios";

const Footer = () => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/subscribe`, { email });

      if (res.status === 200 || res.status === 201) {
        setMessage(t("footer.messages.thankYou"));
        setEmail("");
      } else {
        setMessage(t("footer.messages.genericError"));
      }
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string } } };
      if (
        ax.response?.status === 400 &&
        ax.response?.data?.error === "Email already subscribed"
      ) {
        setMessage(t("footer.messages.alreadySubscribed"));
      } else {
        setMessage(t("footer.messages.failed"));
      }
      console.error("Subscription error:", err);
    }

    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <footer className="bg-[#1c2b21] text-white text-sm pt-10 pb-6 px-6 sm:px-10 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <img src="/wanaw gifting logo.jpeg" className="h-12 w-12 " alt="" />
            <h4 className="text-lg font-semibold text-[#D4AF37] mb-4">
              {t("footer.companyName")}
            </h4>
            <p className="text-gray-300">{t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#D4AF37] mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/services" className="hover:underline">
                  {t("footer.linkServices")}
                </a>
              </li>
              <li>
                <a href="/gifting-options" className="hover:underline">
                  {t("footer.linkGiftOptions")}
                </a>
              </li>
              <li>
                <a href="/programs" className="hover:underline">
                  {t("footer.linkPrograms")}
                </a>
              </li>
              <li>
                <a href="/support" className="hover:underline">
                  {t("footer.linkSupport")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#D4AF37] mb-4">
              {t("footer.connect")}
            </h4>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/share/14JxGfvVv4C/"
                className="hover:text-[#D4AF37]"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.instagram.com/wanaw_health_and_wellness_?igsh=bmJxdTVkMGY3NDVn"
                className="hover:text-[#D4AF37]"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.linkedin.com/company/wanaw-health-and-wellness-digital-solution/"
                className="hover:text-[#D4AF37]"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://www.tiktok.com/@wanawhealthandwellness?_t=ZM-8yBOhm4EAIa&_r=1"
                className="hover:text-[#D4AF37]"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#D4AF37] mb-4">
              {t("footer.subscribe")}
            </h4>
            <p className="text-gray-300 mb-3">{t("footer.subscribeHint")}</p>
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="px-3 py-2 rounded bg-[#D4AF37] text-black text-sm w-full sm:flex-1"
              />
              <button
                type="submit"
                className="bg-[#D4AF37] text-black px-4 py-2 rounded-full font-semibold text-sm hover:rounded-md"
              >
                {t("footer.subscribeButton")}
              </button>
            </form>
            {message && (
              <p className="text-green-400 mt-2 text-xs font-medium">{message}</p>
            )}
          </div>
        </div>

        <div className="mt-6 md:hidden">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-2 text-[#D4AF37] font-medium"
          >
            {showMore ? (
              <>
                {t("footer.showLess")} <IoIosArrowUp />
              </>
            ) : (
              <>
                {t("footer.showMore")} <IoIosArrowDown />
              </>
            )}
          </button>

          {showMore && (
            <div className="mt-4 text-gray-400 space-y-2">
              <Link to="/terms" className="block hover:underline">
                {t("footer.terms")}
              </Link>
              <Link to="/privacy" className="block hover:underline">
                {t("footer.privacy")}
              </Link>
              <Link to="/partner" className="block hover:underline">
                {t("footer.partner")}
              </Link>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 mt-10 pt-4 text-center text-gray-400 text-xs">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
