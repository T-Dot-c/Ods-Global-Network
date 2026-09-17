import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaPhoneAlt, FaWhatsapp, FaEnvelope } from "react-icons/fa";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import BASE_URL from "../api/api";

const PHONE = "+251-960-606-042";
const WHATSAPP_URL = "https://wa.me/251960606042";
const EMAIL = "info@odsglobal.net";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ContactWidget = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "chat">("menu");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleClose = () => {
    setOpen(false);
    setView("menu");
  };

  const handleAppChat = () => {
    setView("chat");
  };

  const handleBackToMenu = () => {
    setView("menu");
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const newMessage: Message = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, newMessage]);
    const sent = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sent }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply || t("contactWidget.botNoResponse"),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", content: t("contactWidget.botError") },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 flex flex-col items-end z-50">
      {open && (
        <div className="mb-3 w-[320px] sm:w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-[#1c2b21] text-[#D4AF37] px-4 py-3 flex items-center justify-between">
            <span className="font-semibold">
              {view === "menu" ? t("contactWidget.headerMenu") : t("contactWidget.headerChat")}
            </span>
            <div className="flex items-center gap-1">
              {view === "chat" && (
                <button
                  type="button"
                  onClick={handleBackToMenu}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition"
                  title={t("contactWidget.backTitle")}
                >
                  ←
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
                aria-label={t("contactWidget.closeAria")}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-4">
            {view === "menu" ? (
              <ul className="space-y-2">
                <li>
                  <a
                    href={`tel:${PHONE.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#D4AF37]/10 text-[#1c2b21] transition"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green/10 text-[#1c2b21]">
                      <FaPhoneAlt className="text-lg" />
                    </span>
                    <span className="font-medium">{t("contactWidget.phone")}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#D4AF37]/10 text-[#1c2b21] transition"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green/10 text-[#1c2b21]">
                      <FaWhatsapp className="text-lg" />
                    </span>
                    <span className="font-medium">{t("contactWidget.whatsapp")}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#D4AF37]/10 text-[#1c2b21] transition"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green/10 text-[#1c2b21]">
                      <FaEnvelope className="text-lg" />
                    </span>
                    <span className="font-medium">{t("contactWidget.email")}</span>
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleAppChat}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#D4AF37]/10 text-[#1c2b21] transition text-left"
                  >
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-green/10 text-[#1c2b21]">
                      <HiChatBubbleLeftRight className="text-lg" />
                    </span>
                    <span className="font-medium">{t("contactWidget.appChat")}</span>
                  </button>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col h-[320px]">
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t("contactWidget.emptyChat")}
                    </p>
                  )}
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-[#1c2b21] text-[#D4AF37] rounded-br-none"
                            : "bg-gray-100 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-2xl text-sm bg-gray-100 text-gray-500 rounded-bl-none animate-pulse">
                        {t("contactWidget.typing")}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    placeholder={t("contactWidget.placeholder")}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  <button
                    type="button"
                    onClick={handleSendChat}
                    disabled={chatLoading}
                    className="px-4 py-2 bg-[#1c2b21] text-[#D4AF37] rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {t("contactWidget.send")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1c2b21] text-[#D4AF37] shadow-lg hover:shadow-xl hover:scale-105 transition z-50"
        aria-label={t("contactWidget.fabAria")}
        title={t("contactWidget.fabTitle")}
      >
        <HiChatBubbleLeftRight className="w-7 h-7" />
      </button>
    </div>
  );
};

export default ContactWidget;
