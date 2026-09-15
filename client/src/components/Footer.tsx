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
    <footer className="bg-[#0F285B] text-white text-sm pt-12 pb-8 px-6 sm:px-10 md:px-20 border-t border-[#BE9B49]/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1 — Brand Block */}
          <div className="space-y-4">
            <img
              src="/brand/gold-logo-mark.svg"
              className="h-12 w-auto object-contain"
              alt="ODS Global Network"
            />
            <h4
              className="text-lg font-bold text-ods-gold-gradient inline-block tracking-tight"
              style={{ color: "#BE9B49" }}
            >
              {t("footer.companyName")}
            </h4>
            <p className="text-[#E8E8E8] text-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <div>
            <h4
              className="text-lg font-bold text-ods-gold-gradient mb-4 inline-block tracking-tight"
              style={{ color: "#BE9B49" }}
            >
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/services"
                  className="text-[#E8E8E8] hover:text-[#BE9B49] hover:underline transition-colors text-sm inline-block"
                >
                  {t("footer.linkServices")}
                </Link>
              </li>
              <li>
                <Link
                  to="/gifting-options"
                  className="text-[#E8E8E8] hover:text-[#BE9B49] hover:underline transition-colors text-sm inline-block"
                >
                  {t("footer.linkGiftOptions")}
                </Link>
              </li>
              <li>
                <Link
                  to="/programs"
                  className="text-[#E8E8E8] hover:text-[#BE9B49] hover:underline transition-colors text-sm inline-block"
                >
                  {t("footer.linkPrograms")}
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-[#E8E8E8] hover:text-[#BE9B49] hover:underline transition-colors text-sm inline-block"
                >
                  {t("footer.linkSupport")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Connect With Us */}
          <div>
            <h4
              className="text-lg font-bold text-ods-gold-gradient mb-4 inline-block tracking-tight"
              style={{ color: "#BE9B49" }}
            >
              {t("footer.connect")}
            </h4>
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/share/14JxGfvVv4C/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#E8E8E8] hover:text-[#BE9B49] hover:bg-[#BE9B49]/20 transition-all duration-200 text-lg border border-white/10 hover:border-[#BE9B49]/40"
              >
                <FaFacebook />
              </a>
              <a
                href="https://www.instagram.com/wanaw_health_and_wellness_?igsh=bmJxdTVkMGY3NDVn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#E8E8E8] hover:text-[#BE9B49] hover:bg-[#BE9B49]/20 transition-all duration-200 text-lg border border-white/10 hover:border-[#BE9B49]/40"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.linkedin.com/company/wanaw-health-and-wellness-digital-solution/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#E8E8E8] hover:text-[#BE9B49] hover:bg-[#BE9B49]/20 transition-all duration-200 text-lg border border-white/10 hover:border-[#BE9B49]/40"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://www.tiktok.com/@wanawhealthandwellness?_t=ZM-8yBOhm4EAIa&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#E8E8E8] hover:text-[#BE9B49] hover:bg-[#BE9B49]/20 transition-all duration-200 text-lg border border-white/10 hover:border-[#BE9B49]/40"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Column 4 — Subscribe */}
          <div>
            <h4
              className="text-lg font-bold text-ods-gold-gradient mb-4 inline-block tracking-tight"
              style={{ color: "#BE9B49" }}
            >
              {t("footer.subscribe")}
            </h4>
            <p className="text-[#E8E8E8] text-sm mb-3 leading-relaxed">
              {t("footer.subscribeHint")}
            </p>
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
                className="px-3.5 py-2.5 rounded-xl bg-white text-[#0F285B] placeholder:text-gray-400 text-sm w-full sm:flex-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#EDC45B]/50 focus:border-[#BE9B49] transition-all shadow-sm"
              />
              <button
                type="submit"
                className="ods-gold-gradient text-[#0F285B] px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:brightness-105 active:scale-98 transition-all flex-shrink-0"
              >
                {t("footer.subscribeButton")}
              </button>
            </form>
            {message && (
              <p className="text-emerald-400 mt-2 text-xs font-semibold">{message}</p>
            )}
          </div>
        </div>

        {/* Mobile Expandable Additional Links */}
        <div className="mt-8 md:hidden">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-2 text-ods-gold-gradient font-semibold text-sm"
            style={{ color: "#BE9B49" }}
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
            <div className="mt-4 text-[#E8E8E8] space-y-2 text-sm">
              <Link to="/terms" className="block hover:text-[#BE9B49] hover:underline transition-colors">
                {t("footer.terms")}
              </Link>
              <Link to="/privacy" className="block hover:text-[#BE9B49] hover:underline transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link to="/partner" className="block hover:text-[#BE9B49] hover:underline transition-colors">
                {t("footer.partner")}
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Bar: Divider line & Copyright */}
        <div className="border-t border-[#BE9B49] mt-12 pt-6 text-center">
          <p className="text-[#E8E8E8]/70 text-xs tracking-wide">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
