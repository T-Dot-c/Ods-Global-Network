import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import BASE_URL from "../api/api";
import axios from "axios";

import { FaPhoneAlt, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { SiTelegram } from "react-icons/si";

import {
  IoIosArrowDown,
  IoIosArrowForward,
  IoIosSearch,
} from "react-icons/io";
import { X } from "lucide-react";
import {
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaTiktok,
  FaLock,
  FaSpa,
  FaStethoscope,
  FaGift,
  FaBriefcase,
} from "react-icons/fa";
import LanguageSwitcher from "./LanguageSwitcher";

type ServiceCategoryId = "wellness" | "health" | "homeMobile" | "hotel";
type GiftId = "individual" | "corporate" | "diaspora";

type ServiceMenuItem = { kind: "service"; categoryId: ServiceCategoryId; path: string };
type GiftMenuItem = { kind: "gift"; giftId: GiftId; path: string };

type MenuDropdownSection = {
  key: string;
  titleKey: string;
  items: (ServiceMenuItem | GiftMenuItem)[];
};

type MenuLinkSection = {
  key: string;
  titleKey: string;
  linkOnly: true;
  path: string;
};

type MenuSection = MenuDropdownSection | MenuLinkSection;

const isDropdownSection = (section: MenuSection): section is MenuDropdownSection =>
  "items" in section;

const menuSections: MenuSection[] = [
  {
    key: "services",
    titleKey: "nav.services",
    items: [
      { kind: "service", categoryId: "wellness", path: "/services?category=wellness" },
      { kind: "service", categoryId: "health", path: "/services?category=Health" },
      {
        kind: "service",
        categoryId: "homeMobile",
        path: "/services?category=Home Based/Mobile Services",
      },
      { kind: "service", categoryId: "hotel", path: "/services?category=hotel" },
    ],
  },
  {
    key: "programs",
    titleKey: "nav.programs",
    linkOnly: true,
    path: "/programs",
  },
  {
    key: "gifts",
    titleKey: "nav.giftOptions",
    items: [
      { kind: "gift", giftId: "individual", path: "/gifting-options?type=individual" },
      { kind: "gift", giftId: "corporate", path: "/gifting-options?type=corporate" },
      { kind: "gift", giftId: "diaspora", path: "/gifting-options?type=diaspora" },
    ],
  },
];

const getServiceIcon = (categoryId: ServiceCategoryId) => {
  switch (categoryId) {
    case "wellness":
      return <FaSpa className="text-green-600" />;
    case "health":
      return <FaStethoscope className="text-red-600" />;
    case "hotel":
      return <FaBriefcase className="text-blue-500" />;
    case "homeMobile":
      return <FaGift className="text-yellow-500" />;
    default:
      return <FaGift />;
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<unknown[]>([]);
  const [filteredResults, setFilteredResults] = useState<unknown[]>([]);

  const [, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [latestBlog, setLatestBlog] = useState<{ title: string; slug: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/posts`)
      .then((r) => r.json())
      .then((d) => d && d.length && setLatestBlog(d[0]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((p) => (p + 1) % 3);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const services = await axios.get(`${BASE_URL}/services`);
        const programs = await axios.get(`${BASE_URL}/programs`);
        const gifts = await axios.get(`${BASE_URL}/gifts`);

        const combinedItems = [...services.data, ...programs.data, ...gifts.data];
        setAllItems(combinedItems);
      } catch (error) {
        console.error("Search fetch error:", error);
      }
    };

    void fetchItems();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const results = allItems.filter((item) => {
      const rec = item as Record<string, unknown>;
      const titleMatch = String(rec.title ?? "").toLowerCase().includes(q);
      const categoryMatch = String(rec.category ?? "").toLowerCase().includes(q);
      const locationMatch = String(rec.location ?? "").toLowerCase().includes(q);
      const priceMatch = String(rec.price ?? "").toLowerCase().includes(q);
      const ratingMatch = String(rec.rating ?? "").toLowerCase().includes(q);

      return titleMatch || categoryMatch || locationMatch || priceMatch || ratingMatch;
    });

    setFilteredResults(results);
  }, [searchQuery, allItems]);

  const itemLabel = (item: ServiceMenuItem | GiftMenuItem) => {
    if (item.kind === "service") {
      return t(`nav.serviceCategories.${item.categoryId}.label`);
    }
    return t(`nav.giftsMenu.${item.giftId}`);
  };

  const itemDescription = (item: ServiceMenuItem | GiftMenuItem) => {
    if (item.kind === "service") {
      return t(`nav.serviceCategories.${item.categoryId}.description`);
    }
    return "";
  };

  const itemIcon = (item: ServiceMenuItem | GiftMenuItem) => {
    if (item.kind === "service") {
      return getServiceIcon(item.categoryId);
    }
    return <FaGift className="text-yellow-500" />;
  };

  const renderDesktopSection = (section: MenuSection) => {
    if (!isDropdownSection(section)) {
      return (
        <Link
          key={section.key}
          to={section.path}
          className=" hover:text-[#1c2b21]"
        >
          {t(section.titleKey)}
          <IoIosArrowDown className="inline ml-1" />
        </Link>
      );
    }

    return (
      <div key={section.key} className="relative group">
        <span className="cursor-pointer pb-1 group-hover:text-[#1c2b21]">
          {t(section.titleKey)} <IoIosArrowDown className="inline ml-1" />
        </span>
        <ul className="absolute left-0 mt-2 bg-zinc-50 rounded shadow-lg p-12 gap-10 hidden group-hover:block min-w-[400px] z-50">
          {section.items.map((item: ServiceMenuItem | GiftMenuItem) => (
            <div key={item.path} className="relative group/item">
              <Link
                to={item.path}
                className="flex items-start gap-8 text-sm py-3 rounded px-2 hover:bg-gray-100"
              >
                {itemIcon(item)}
                <div>
                  <p className="font-semibold">{itemLabel(item)}</p>
                  {itemDescription(item) ? (
                    <p className="text-xs text-gray-500">{itemDescription(item)}</p>
                  ) : null}
                </div>
              </Link>
            </div>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between  bg-green text-white text-xs sm:text-sm px-4 sm:px-6 lg:px-12 py-2 font-inter gap-2 sm:gap-0">
        <div className="flex items-center gap-2 order-1 sm:order-none">
          <button
            type="button"
            className="bg-[#D4AF37] text-[#1c2b21] font-semibold text-xs px-3 py-1 rounded-full"
            onClick={() => latestBlog?.slug && navigate(`/blogs/${latestBlog.slug}`)}
          >
            {t("nav.blog")}
          </button>

          <span
            className={`transition-opacity duration-700 ${
              fade ? "opacity-100" : "opacity-0"
            } cursor-pointer hover:underline`}
            onClick={() => latestBlog?.slug && navigate(`/blogs/${latestBlog.slug}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && latestBlog?.slug) navigate(`/blogs/${latestBlog.slug}`);
            }}
            role="button"
            tabIndex={0}
          >
            {latestBlog?.title || t("nav.latestBlogFallback")}
          </span>
        </div>

        <div className="hidden md:grid grid-cols-4 gap-6 text-center order-0 sm:order-none">
          <div>
            <a href="tel:+251-960-606-042" className="text-gray-300">
              <FaPhoneAlt className="text-gold text-lg  mx-auto mb-1" />
            </a>
          </div>
          <div>
            <a href="mailto:info@odsglobal.net" className="text-gray-300">
              <FaEnvelope className="text-gold text-lg  mx-auto mb-1" />
            </a>
          </div>
          <div>
            <a
              href="https://wa.me/251960606042"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300"
            >
              <FaWhatsapp className="text-gold text-lg  mx-auto mb-1" />
            </a>
          </div>
          <div>
            <a
              href="https://t.me/+251960606042"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300"
            >
              <SiTelegram className="text-gold text-lg  mx-auto mb-1" />
            </a>
          </div>
        </div>
      </div>

      <header className="bg-zinc-50 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-3 py-4 px-5 md:px-8 lg:px-12 relative">
          <img
            src="wanaw gifting logo.jpeg"
            alt={t("nav.logoAlt")}
            className="h-10 w-10 md:h-12 md:w-12 rounded-full cursor-pointer"
            onClick={() => navigate("/")}
          />

          <nav className="hidden md:flex flex-1 min-w-0 items-center justify-center flex-wrap gap-x-6 gap-y-2 text-[14px] lg:text-[15px]">
            <Link to="/company">{t("nav.about")}</Link>
            <Link to="/request-service" className="hover:text-[#1c2b21]">
              {t("nav.requestService")}
            </Link>

            {menuSections.map((section) => renderDesktopSection(section))}

            <Link to="/support">{t("nav.support")}</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              className="p-2 rounded hover:bg-gray-100"
              aria-label={t("nav.searchPlaceholder")}
            >
              <IoIosSearch size={20} />
            </button>

            <LanguageSwitcher />

            <Link to="/login" className="font-semibold hover:underline whitespace-nowrap">
              {t("nav.signIn")}
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden z-20 p-2"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <div className="flex flex-col gap-1">
                <span className="block w-5 h-0.5 bg-green" />
                <span className="block w-4 h-0.5 bg-green ml-auto" />
                <span className="block w-3 h-0.5 bg-green ml-auto" />
              </div>
            )}
          </button>
        </div>

        {searchOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-md z-40 p-4 border-t md:flex md:justify-center">
            <div className="w-full md:max-w-xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t("nav.searchPlaceholder")}
                  className="flex-grow px-4 py-2 rounded-full border text-sm"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value.toLowerCase();
                    setSearchQuery(q);

                    setFilteredResults(
                      allItems.filter((item) => {
                        const rec = item as Record<string, unknown>;
                        const titleMatch = String(rec.title ?? rec.name ?? "")
                          .toLowerCase()
                          .includes(q);
                        const categoryMatch = String(rec.category ?? rec.serviceType ?? "")
                          .toLowerCase()
                          .includes(q);
                        const locationMatch = String(rec.location ?? rec.city ?? "")
                          .toLowerCase()
                          .includes(q);

                        return titleMatch || categoryMatch || locationMatch;
                      })
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setFilteredResults([]);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {searchQuery && (
                <div className="mt-4 bg-white border rounded shadow max-h-64 overflow-y-auto">
                  {filteredResults.length ? (
                    filteredResults.map((item, idx) => {
                      const rec = item as Record<string, unknown>;
                      const path = `/services?category=${encodeURIComponent(
                        String(rec.category ?? rec.serviceType ?? "")
                      )}&location=${encodeURIComponent(String(rec.location ?? rec.city ?? ""))}`;

                      return (
                        <a
                          key={idx}
                          href={path}
                          className="block px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          <strong>{String(rec.title ?? rec.name ?? "")}</strong> <br />
                          <span className="text-xs text-gray-500">
                            {String(rec.category ?? rec.serviceType ?? "")} |{" "}
                            {String(rec.location ?? rec.city ?? "")}
                          </span>
                        </a>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 p-2 text-sm">{t("nav.noResults")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={`fixed inset-0 z-40 transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black bg-opacity-40 cursor-default border-0 p-0"
            onClick={() => setMenuOpen(false)}
            aria-label={t("nav.closeMenuOverlay")}
          />
          <div className="absolute right-0 top-0 h-full w-full bg-white p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <img src="wanaw gifting logo.jpeg" className="h-12 rounded-full" alt="" />
              <X className="cursor-pointer" onClick={() => setMenuOpen(false)} />
            </div>

            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-lg font-medium py-2 border-b"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/company"
                className="text-lg font-medium py-2 border-b"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.about")}
              </Link>

              {menuSections.map((section) => {
                if (!isDropdownSection(section)) {
                  return (
                    <Link
                      key={section.key}
                      to={section.path}
                      className="text-lg font-medium py-2 border-b"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t(section.titleKey)}
                    </Link>
                  );
                }

                return (
                  <div key={section.key} className="border-b pb-2">
                    <button
                      type="button"
                      className="flex items-center justify-between w-full text-lg font-medium py-2"
                      onClick={() =>
                        setDropdownOpen((d) => (d === section.key ? null : section.key))
                      }
                    >
                      {t(section.titleKey)}
                      <IoIosArrowDown
                        className={`transition-transform ${dropdownOpen === section.key ? "rotate-180" : ""}`}
                      />
                    </button>

                    {dropdownOpen === section.key && (
                      <div className="ml-3 space-y-2 mt-2">
                        {section.items.map((item: ServiceMenuItem | GiftMenuItem) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-2 text-base py-1.5 hover:underline"
                            onClick={() => setMenuOpen(false)}
                          >
                            <IoIosArrowForward size={14} /> {itemLabel(item)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link
                to="/support"
                className="text-lg font-medium py-2 border-b"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.support")}
              </Link>
              <Link
                to="/request-service"
                className="text-lg font-medium py-2 border-b"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.requestService")}
              </Link>

              <div className="py-2 border-b">
                <LanguageSwitcher align="left" className="w-full" />
              </div>

              <div className="flex gap-4 mt-6 text-[#1c2b21]">
                <a
                  href="https://www.facebook.com/share/14JxGfvVv4C/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook size={18} />
                </a>
                <a
                  href="https://www.linkedin.com/company/wanaw-health-and-wellness-digital-solution/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin size={18} />
                </a>
                <a
                  href="https://www.instagram.com/wanaw_health_and_wellness_?igsh=bmJxdTVkMGY3NDVn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram size={18} />
                </a>
                <a
                  href="https://www.tiktok.com/@wanawhealthandwellness?_t=ZM-8yBOhm4EAIa&_r=1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaTiktok size={18} />
                </a>
              </div>

              <Link
                to="/login"
                className="mt-6 bg-[#1c2b21] text-[#D4AF37] px-6 py-2 rounded-md flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <FaLock size={18} />
                {t("nav.signIn")}
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
