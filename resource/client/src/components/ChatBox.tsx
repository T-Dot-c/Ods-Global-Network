import { useState, useEffect, useRef } from "react";
import BASE_URL from "../api/api";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Collapsed by default
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "bot", content: data.reply || "🤖 Sorry, no response." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "⚠️ Error connecting to server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end z-50">
      {/* Toggle button (always visible) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-green text-gold rounded-full shadow-md hover:scale-105 transition"
        >
          💬
        </button>
      )}

      {/* Expanded chat view */}
      {open && (
        <div className="w-full sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 mt-2">
          {/* Header */}
          <div className="bg-green text-gold p-4 text-lg font-semibold shadow-md flex justify-between items-center">
            💬 ODS Global Network Chat
            <button
              onClick={() => setOpen(false)}
              className="px-2 py-1 bg-gray-200 rounded-full hover:bg-gray-300 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl text-sm max-w-[75%] shadow transition 
                    ${
                      msg.role === "user"
                        ? "bg-green text-gold rounded-br-none"
                        : "bg-gray-200 text-gray-800 rounded-bl-none"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl text-sm max-w-[75%] shadow bg-gray-200 text-gray-600 rounded-bl-none animate-pulse">
                  🤖 Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <div className="p-3 bg-white border-t flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green text-sm sm:text-base"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-green text-gold rounded-full shadow-md hover:scale-105 transition disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;





