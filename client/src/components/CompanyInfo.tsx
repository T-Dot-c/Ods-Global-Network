
import ServiceCatalog from "./ServiceCatalog";


const CompanyInfo = () => {
  return (
    <>
     {/* Decorative SVG top wave */}
  <div className="absolute top-25 right-0 w-full h-32 overflow-hidden leading-[0] z-10">
    <svg
      className="relative block w-full h-full"
      viewBox="0 0 500 80"
      preserveAspectRatio="none"
    >
      <path d="M500,0 C400,80 100,0 0,80 L0,0 L500,0 Z" fill="#1c2b21" />
    </svg>
  </div>
    <div className="bg-white text-gray-800  mx-auto space-y-10">
      {/* Header */}
      <section className="text-center ">
  
        <h1 className="text-3xl md:text-4xl font-bold mt-16 mb-6 text-[#1c2b21]">
          ODS GALOBAL NETWORK
        </h1>
        <p className="text-lg md:text-xl font-medium text-gold">
          "Ethiopian Blessings, Modern Gifting"
        </p>
      </section>
{/* About */}
<section className="relative bg-[#D4AF37] h-auto w-full pt-20 pb-24 px-6 sm:px-10 md:px-20 overflow-hidden">
  {/* 🔷 Top-Right Curved Cutout */}
  <div className="absolute top-0 right-0 w-full h-32 overflow-hidden leading-[0]">
    <svg
      className="relative block w-full h-full"
      viewBox="0 0 500 80"
      preserveAspectRatio="none"
    >
      <path d="M500,0 C400,80 100,0 0,80 L0,0 L500,0 Z" fill="white" />
    </svg>
  </div>

  {/* Content */}
  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
    {/* Text Content */}
    <div className="md:w-1/2 text-[#1c2b21]">
      <h2 className="text-3xl font-bold mb-4 relative inline-block after:block after:h-1 after:bg-green after:w-full after:mt-1 ">About 
</h2>
    <p className="leading-relaxed text-sm md:text-lg">
  ODS GALOBAL NETWORK Gifting is a pioneering multi-vendor marketplace (web and mobile app) designed to provide a seamless, efficient, and user-friendly platform for discovering, booking, gifting, and managing a diverse range of health, wellness, and hotel room services. Headquartered in Addis Ababa, Ethiopia, ODS Global Network Gifting is committed to revolutionizing access to wellness solutions while fostering cultural relevance, community empowerment, and global connectivity.
</p>
</div>
    {/* GIF Image */}
    <div className="md:w-1/2">
      <img
        src="/Healthy.gif"
        alt="Health and wellness animation"
        className="w-full max-w-md mx-auto rounded-lg shadow-lg"
      />
    </div>
  </div>
</section>

{/* Mission & Vision */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#1c2b21] text-white overflow-hidden">
  {/* Decorative Top Wave */}
  <div className="absolute top-0 right-0 w-full h-32 overflow-hidden leading-[0] z-0">
    <svg
      className="relative block w-full h-full"
      viewBox="0 0 500 80"
      preserveAspectRatio="none"
    >
      <path d="M500,0 C400,80 100,0 0,80 L0,0 L500,0 Z" fill="#ffffff" />
    </svg>
  </div>

  <div className="relative z-10 max-w-7xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold mb-14 text-gold">
      Our Mission & Vision
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Mission Card */}
       <div className="bg-white text-[#1c2b21] p-8 rounded-2xl shadow-lg border-l-8 border-[#D4AF37] hover:shadow-2xl transition">
         <h3 className="text-xl md:text-2xl font-bold mb-4 relative">
           <span className="inline-block pb-1 border-b-4 border-[#D4AF37]">Mission</span>
         </h3>
         <p className="text-sm md:text-base leading-relaxed">
           Connecting people to better healthcare through one intelligent digital platform that makes quality healthcare accessible, convenient, and connected for everyone.
         </p>
       </div>

             {/* Vision Card */}
       <div className="bg-white text-[#1c2b21] p-8 rounded-2xl shadow-lg border-l-8 border-[#D4AF37] hover:shadow-2xl transition">
         <h3 className="text-xl md:text-2xl font-bold mb-4 relative">
           <span className="inline-block pb-1 border-b-4 border-[#D4AF37]">Vision</span>
         </h3>
         <p className="text-sm md:text-base leading-relaxed">
           To become the leading digital healthcare ecosystem transforming how Africa accesses, delivers, and experiences healthcare.
         </p>
       </div>
    </div>
  </div>
</section>

{/* What We Offer */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-white overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[#1c2b21]">
      What We Offer
    </h2>
    <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
      ODS Global Network Gifting is a one-stop platform that simplifies access to health, wellness, and hospitality services.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#D4AF37] bg-opacity-10 p-6 rounded-xl border-l-4 border-[#D4AF37]">
        <h3 className="text-xl font-bold mb-3 text-[#1c2b21]">🏪 Centralized Marketplace</h3>
        <p className="text-gray-700">A single hub to book health, wellness, and hotel room services from multiple trusted vendors.</p>
      </div>
      
      <div className="bg-[#D4AF37] bg-opacity-10 p-6 rounded-xl border-l-4 border-[#D4AF37]">
        <h3 className="text-xl font-bold mb-3 text-[#1c2b21]">🎁 Cultural Gifting</h3>
        <p className="text-gray-700">Unique gifting options tailored to Ethiopian traditions (Timkat, Meskel) and global celebrations.</p>
      </div>
      
      <div className="bg-[#D4AF37] bg-opacity-10 p-6 rounded-xl border-l-4 border-[#D4AF37]">
        <h3 className="text-xl font-bold mb-3 text-[#1c2b21]">🏢 Corporate Wellness</h3>
        <p className="text-gray-700">Tailored programs for businesses to enhance employee well-being and engagement.</p>
      </div>
      
      <div className="bg-[#D4AF37] bg-opacity-10 p-6 rounded-xl border-l-4 border-[#D4AF37]">
        <h3 className="text-xl font-bold mb-3 text-[#1c2b21]">🌍 Diaspora-Friendly Services</h3>
        <p className="text-gray-700">Seamless gifting and booking solutions for the Ethiopian diaspora to support loved ones.</p>
      </div>
      
      <div className="bg-[#D4AF37] bg-opacity-10 p-6 rounded-xl border-l-4 border-[#D4AF37] md:col-span-2">
        <h3 className="text-xl font-bold mb-3 text-[#1c2b21]">💚 Community Initiatives</h3>
        <p className="text-gray-700">Programs focused on women's empowerment and support for chronic illness care, such as hemodialysis.</p>
      </div>
    </div>
  </div>
</section>

{/* Why Choose ODS Global Network Gifting */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#1c2b21] text-white overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-gold">
      Why Choose ODS Global Network Gifting?
    </h2>
    <p className="text-center mb-12 max-w-3xl mx-auto">
      ODS Global Network Gifting addresses critical gaps in Ethiopia's health, wellness, and hospitality sectors with innovative, inclusive, and culturally relevant solutions.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-3">🌟 Holistic Services</h3>
        <p>Comprehensive offerings spanning health, wellness, and hospitality under one platform.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-3">🎭 Cultural Connection</h3>
        <p>Gifting options aligned with Ethiopian traditions and global holidays, ensuring emotional and cultural resonance.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-3">✨ Seamless Experience</h3>
        <p>Intuitive web and mobile app interface for effortless booking, gifting, and service management.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold mb-3">🌐 Diaspora Engagement</h3>
        <p>Secure, accessible payment systems to generate foreign currency and connect the Ethiopian diaspora with their homeland.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg md:col-span-2">
        <h3 className="text-xl font-bold mb-3">💝 Social Impact</h3>
        <p>Empowering underprivileged women and supporting chronic illness care through dedicated initiatives.</p>
      </div>
    </div>
  </div>
</section>

{/* ODS Global Network Gifting */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#D4AF37] bg-opacity-10 overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[#1c2b21]">
      ODS Global Network Gifting
    </h2>
    <p className="text-gray-600 mb-12 max-w-3xl mx-auto">
      ODS Global Network Gifting transforms gifting into meaningful experiences with two tailored options
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#D4AF37] hover:shadow-2xl transition">
        <div className="text-5xl mb-4">🎁</div>
        <h3 className="text-2xl font-bold mb-4 text-[#1c2b21]">Basic Gift</h3>
        <p className="text-gray-700">Affordable wellness or hotel service packages ideal for individuals or corporate gifting.</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-[#1c2b21] hover:shadow-2xl transition">
        <div className="text-5xl mb-4">👑</div>
        <h3 className="text-2xl font-bold mb-4 text-[#1c2b21]">VIP Gift</h3>
        <p className="text-gray-700">Premium, customizable experiences for exclusive wellness treatments or luxury hotel stays.</p>
      </div>
    </div>
  </div>
</section>

{/* What Sets Us Apart */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-white overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#1c2b21]">
      What Sets Us Apart
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:bg-[#D4AF37] hover:bg-opacity-10 transition">
        <div className="text-3xl">🌐</div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Holistic Approach</h3>
          <p className="text-gray-700">A unique blend of health, wellness, and hospitality services.</p>
        </div>
      </div>
      
      <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:bg-[#D4AF37] hover:bg-opacity-10 transition">
        <div className="text-3xl">🎭</div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Cultural Relevance</h3>
          <p className="text-gray-700">Gifting options rooted in Ethiopian traditions and global celebrations.</p>
        </div>
      </div>
      
      <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:bg-[#D4AF37] hover:bg-opacity-10 transition">
        <div className="text-3xl">👥</div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Community Empowerment</h3>
          <p className="text-gray-700">Training and certification for underprivileged women to provide home-based wellness services.</p>
        </div>
      </div>
      
      <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:bg-[#D4AF37] hover:bg-opacity-10 transition">
        <div className="text-3xl">❤️</div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Chronic Illness Support</h3>
          <p className="text-gray-700">Dedicated initiatives to fund hemodialysis and meditation services through community contributions.</p>
        </div>
      </div>
      
      <div className="flex gap-4 p-6 bg-gray-50 rounded-xl hover:bg-[#D4AF37] hover:bg-opacity-10 transition md:col-span-2">
        <div className="text-3xl">🌍</div>
        <div>
          <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Global Accessibility</h3>
          <p className="text-gray-700">A diaspora-friendly platform that fosters connection and generates foreign currency through secure transactions.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Key Initiatives */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#1c2b21] text-white overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gold">
      Key Initiatives
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white text-[#1c2b21] p-8 rounded-2xl shadow-lg">
        <div className="text-5xl mb-4 text-center">👩‍💼</div>
        <h3 className="text-2xl font-bold mb-4 text-center">Women Empowerment Initiative</h3>
        <div className="space-y-3">
          <p className="font-semibold">Objective:</p>
          <p className="text-gray-700">Create sustainable income opportunities for underprivileged women.</p>
          <p className="font-semibold">Approach:</p>
          <p className="text-gray-700">Provide training and certification for home-based wellness services, fostering financial independence and community upliftment.</p>
        </div>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-8 rounded-2xl shadow-lg">
        <div className="text-5xl mb-4 text-center">❤️</div>
        <h3 className="text-2xl font-bold mb-4 text-center">Hemodialysis Patients Support Initiative</h3>
        <div className="space-y-3">
          <p className="font-semibold">Objective:</p>
          <p className="text-gray-700">Enhance access to care for chronic illness patients.</p>
          <p className="font-semibold">Approach:</p>
          <p className="text-gray-700">Build community awareness and facilitate gifts for hemodialysis treatments and meditation services through partnerships and contributions.</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* Our Platform */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#D4AF37] bg-opacity-10 overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-[#1c2b21]">
      Our Platform
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition">
        <div className="text-4xl mb-4">💻</div>
        <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Web & Mobile App</h3>
        <p className="text-sm text-gray-700">User-friendly interface for browsing, booking, and gifting services.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Secure Payments</h3>
        <p className="text-sm text-gray-700">Safe and accessible payment systems for local and international users.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition">
        <div className="text-4xl mb-4">🏪</div>
        <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Vendor Integration</h3>
        <p className="text-sm text-gray-700">Streamlined onboarding for service providers to expand their reach.</p>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition">
        <div className="text-4xl mb-4">🌍</div>
        <h3 className="text-lg font-bold mb-2 text-[#1c2b21]">Multilingual Support</h3>
        <p className="text-sm text-gray-700">Catering to diverse users with culturally relevant content.</p>
      </div>
    </div>
  </div>
</section>

{/* Our Impact */}
<section className="relative px-6 sm:px-10 md:px-20 py-20 bg-[#1c2b21] text-white overflow-hidden">
  <div className="relative z-10 max-w-7xl mx-auto">
    <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gold">
      Our Impact
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-xl font-bold mb-3">Economic Growth</h3>
        <p className="text-gray-700">Empowering local service providers and generating foreign currency through diaspora engagement.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <div className="text-4xl mb-4">💚</div>
        <h3 className="text-xl font-bold mb-3">Social Good</h3>
        <p className="text-gray-700">Supporting underprivileged communities and chronic illness patients.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <div className="text-4xl mb-4">🎭</div>
        <h3 className="text-xl font-bold mb-3">Cultural Preservation</h3>
        <p className="text-gray-700">Promoting Ethiopian traditions through meaningful gifting experiences.</p>
      </div>
      
      <div className="bg-white text-[#1c2b21] p-6 rounded-xl shadow-lg">
        <div className="text-4xl mb-4">🌐</div>
        <h3 className="text-xl font-bold mb-3">Global Reach</h3>
        <p className="text-gray-700">Connecting the Ethiopian diaspora with their roots through accessible wellness solutions.</p>
      </div>
    </div>
  </div>
</section>

  <ServiceCatalog/>


     </div>
     </>
  );
};

export default CompanyInfo;
