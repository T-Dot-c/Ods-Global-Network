import { useState } from "react";
import { FaPhoneAlt, FaEnvelope,FaWhatsapp, } from "react-icons/fa";
import BASE_URL from "../api/api";

import { SiTelegram } from "react-icons/si";
import Map from "./Map";


const SupportPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${BASE_URL}/support`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    alert("Support request submitted successfully!");
    setForm({ name: "", email: "", subject: "", message: "" });
  } catch (error) {
    console.error("Submission failed:", error);
    alert("There was a problem submitting your request.");
  }
};


  const faqs = [
    {
      question: "How can I track my order?",
      answer: "After placing an order, you'll receive an email with tracking details.",
    },
    {
      question: "Can I cancel or modify my order?",
      answer: "You can cancel or change your order within 12 hours of placement.",
    },
    {
      question: "How do I contact support?",
      answer: "Use the contact form above or reach us via phone or email.",
    },
  ];

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white px-4 relative overflow-hidden">
      {/* Decorative Shapes */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-[#0f285b] rounded-full opacity-40  animate-pulse z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#0f285b] rounded-full opacity-30  animate-spin-slow z-0"></div>
      <div className="absolute -top-10 right-10 w-32 h-32 bg-[#be9b49] rotate-45 rounded-lg opacity-50  z-0"></div>
      <div className="absolute top-10 left-10 w-40 h-40 bg-[#0f285b] rounded-full opacity-40  animate-pulse z-0"></div>
      <div className="absolute bottom-10 right-0 w-60 h-60 bg-[#0f285b] rounded-full opacity-30  animate-spin-slow z-0"></div>
      <div className="absolute -top-0 right-0 w-32 h-32 bg-[#be9b49] rotate-45 rounded-lg opacity-50  z-0"></div>
      <div className="absolute top-20 left-20 w-40 h-40 bg-[#0f285b] rounded-full opacity-40  animate-pulse z-0"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-[#0f285b] rounded-full opacity-30  animate-spin-slow z-0"></div>
      <div className="absolute -top-20 right-0 w-32 h-32 bg-[#be9b49] rotate-45 rounded-lg opacity-50  z-0"></div>
      {/* Login Card */}
      <div className="max-w-xl mx-auto bg-green rounded-2xl z-10 shadow-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gold">Customer Support & Help Center</h1>

         {/* Contact Info */}
          <div className="grid md:grid-cols-4 gap-2 mb-8 text-center">
            <div>
              <a href="tel:+251-960-606-042" className="text-gray-300">
               <FaPhoneAlt className="text-gold text-2xl mx-auto mb-2" />
              </a>
            </div>
            <div>
              <a href="mailto:info@odsglobal.net" className="text-gray-300">
                <FaEnvelope className="text-gold text-2xl mx-auto mb-2" />
              </a>
            </div>
            <div>
              
              <a
                href="https://wa.me/251960606042"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300"
              >
              <FaWhatsapp className="text-gold text-2xl mx-auto mb-2" />
              </a>
            </div>
            <div>
             
              <a
                href="https://t.me/+251960606042"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300"
              >
               <SiTelegram className="text-gold text-2xl mx-auto mb-2" />
              </a>
            </div>
          </div>
        {/* Support Form */}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 mb-10">
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="p-3 border text-gray-300 border-gray-300 rounded-xl w-full"
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="p-3 border text-gray-300 border-gray-300 rounded-xl w-full"
            required
          />
          <input
            name="subject"
            type="text"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject"
            className="p-3 border text-gray-300  border-gray-300 rounded-xl w-full col-span-full"
            required
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            rows={5}
            className="p-3 border text-gray-300  border-gray-300 rounded-xl w-full col-span-full"
            required
          ></textarea>
          <button
            type="submit"
            className="bg-[#be9b49] text-[#0f285b] py-3 rounded-xl hover:rounded-full transition col-span-full"
          >
            Submit Request
          </button>
        </form>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gold mb-4">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="bg-gray-100 p-4 rounded-xl shadow-sm">
              <p className="font-medium">{faq.question}</p>
              <p className="text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Map/>
    </>
  );
};

export default SupportPage;