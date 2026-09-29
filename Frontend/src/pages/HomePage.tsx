import React from 'react';
import { Button } from '../components/common/Button';
import {
  ArrowRight,
  Sparkles,
  Gift,
  CheckCircle2,
  Calendar,
  CreditCard,
  Bell,
  Users,
  Briefcase,
  Building2,
  Pill,
  Truck,
  HeartPulse,
  UserCheck,
  BarChart3,
  Lock,
  Database,
  Search,
  Check,
  Shield,
  Smartphone,
  Mail,
  FileText,
  Sliders,
  LifeBuoy,
  BadgeDollarSign,
  Activity,
  Layers,
  Award,
  ShieldCheck,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // 04. Services & Provider Categories (9 Authoritative Categories from Section 4)
  const serviceCategories = [
    {
      title: 'Hospitals',
      description: 'Comprehensive inpatient care, specialized surgery, emergency medicine, and accredited clinical facilities.',
      icon: <Building2 size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Clinics',
      description: 'Outpatient consultations, routine checkups, specialized family practice, and urgent care clinics.',
      icon: <StethoscopeIcon size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Pharmacies',
      description: 'Prescription fulfillment, licensed digital dispensaries, certified pharmaceutical delivery, and wellness supplies.',
      icon: <Pill size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Laboratories',
      description: 'Advanced pathology screening, clinical blood diagnostics, molecular testing, and verified lab results.',
      icon: <Activity size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Wellness Centers',
      description: 'Therapeutic spas, stress management, holistic physiotherapy, mindfulness, yoga, and restorative personal care.',
      icon: <HeartPulse size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Ambulance Services',
      description: '24/7 rapid emergency medical response, certified paramedic dispatch, and safe patient transfer logistics.',
      icon: <Truck size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Home Care',
      description: 'Licensed visiting nurses, elder care companions, post-op support, and compassionate home healthcare.',
      icon: <UserCheck size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Specialists',
      description: 'Board-certified medical specialists across cardiology, dermatology, pediatrics, internal medicine, and surgery.',
      icon: <Award size={26} color="var(--color-navy)" />,
    },
    {
      title: 'Diagnostic Centers',
      description: 'State-of-the-art medical imaging, ultrasound, MRI, CT scanning, and comprehensive executive health screenings.',
      icon: <BarChart3 size={26} color="var(--color-navy)" />,
    },
  ];

  // 05. For Customers Features (9 Features)
  const customerFeatures = [
    'Easy customer registration',
    'Personalized customer profile',
    'Service discovery',
    'Online appointment booking',
    'Booking history',
    'Appointment history',
    'Notifications and reminders',
    'Payment management',
    'Secure account access',
  ];

  // 06. For Merchants Features (9 Features)
  const merchantFeatures = [
    'Merchant registration',
    'Business profile management',
    'Document submission',
    'Verification and approval workflow',
    'Merchant dashboard',
    'Booking management',
    'Customer management',
    'Transaction tracking',
    'Notifications',
  ];

  // 07. Service Provider Network (5 Benefits)
  const providerBenefits = [
    {
      title: 'Digital Presence',
      description: 'Present your organization and services to customers through the platform.',
      icon: <Layers size={22} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Service Management',
      description: 'Organize and manage your available services.',
      icon: <Sliders size={22} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Appointment Management',
      description: 'Manage bookings, schedules, and appointments.',
      icon: <Calendar size={22} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Customer Access',
      description: 'Connect with customers looking for your services.',
      icon: <Users size={22} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Business Management',
      description: 'Manage important activities through a centralized dashboard.',
      icon: <Briefcase size={22} color="var(--color-gold-bright)" />,
    },
  ];

  // 08. Appointment Booking Features (8 Features)
  const appointmentFeatures = [
    'Online booking',
    'Calendar integration',
    'Time-slot management',
    'Booking confirmation',
    'Appointment reminders',
    'Cancellation',
    'Rescheduling',
    'Booking history',
  ];

  // 09. Payments Methods (5 Supported Methods)
  const paymentMethods = [
    { name: 'Credit Cards', desc: 'Visa, Mastercard & International processing', icon: <CreditCard size={24} color="var(--color-gold-bright)" /> },
    { name: 'Debit Cards', desc: 'Direct banking debit integration', icon: <CreditCard size={24} color="var(--color-gold-bright)" /> },
    { name: 'Mobile Money', desc: 'Telebirr & mobile telecom billing', icon: <Smartphone size={24} color="var(--color-gold-bright)" /> },
    { name: 'Bank Transfer', desc: 'Direct institutional settlement', icon: <Building2 size={24} color="var(--color-gold-bright)" /> },
    { name: 'Digital Wallets', desc: 'Instant cryptographic wallet payments', icon: <BadgeDollarSign size={24} color="var(--color-gold-bright)" /> },
  ];

  // 10. Gift Cards Features (5 Features)
  const giftCardFeatures = [
    'Gift card purchase',
    'Digital redemption',
    'Balance tracking',
    'Expiry management',
    'Transaction history',
  ];

  // 11. One Connected Platform (4 Ecosystem Participants)
  const ecosystemRoles = [
    {
      role: 'Customers',
      tagline: 'Discover and access services.',
      icon: <Users size={28} color="var(--color-navy)" />,
      action: () => onNavigate('register'),
    },
    {
      role: 'Merchants',
      tagline: 'Manage businesses and services.',
      icon: <Briefcase size={28} color="var(--color-navy)" />,
      action: () => onNavigate('register'),
    },
    {
      role: 'Service Providers',
      tagline: 'Connect with customers and manage appointments.',
      icon: <StethoscopeIcon size={28} color="var(--color-navy)" />,
      action: () => onNavigate('register'),
    },
    {
      role: 'Administrators',
      tagline: 'Monitor and manage the platform ecosystem.',
      icon: <Shield size={28} color="var(--color-navy)" />,
      action: () => onNavigate('login'),
    },
  ];

  // 12. Platform Management Areas (9 Areas)
  const managementAreas = [
    { title: 'User Management', icon: <Users size={20} color="var(--color-gold-bright)" /> },
    { title: 'Merchant Management', icon: <Briefcase size={20} color="var(--color-gold-bright)" /> },
    { title: 'Provider Management', icon: <Building2 size={20} color="var(--color-gold-bright)" /> },
    { title: 'Booking Management', icon: <Calendar size={20} color="var(--color-gold-bright)" /> },
    { title: 'Transaction Management', icon: <CreditCard size={20} color="var(--color-gold-bright)" /> },
    { title: 'Revenue Management', icon: <BadgeDollarSign size={20} color="var(--color-gold-bright)" /> },
    { title: 'Analytics', icon: <BarChart3 size={20} color="var(--color-gold-bright)" /> },
    { title: 'Reports', icon: <FileText size={20} color="var(--color-gold-bright)" /> },
    { title: 'Support Tickets', icon: <LifeBuoy size={20} color="var(--color-gold-bright)" /> },
  ];

  // 13. Security & Trust Features (7 Features)
  const securityFeatures = [
    'Secure authentication',
    'Role-based access control',
    'Data protection',
    'Secure backups',
    'Activity logging',
    'Audit trails',
    'Controlled access to platform resources',
  ];

  // 14. Notifications Channels (3 Channels)
  const notificationChannels = [
    {
      channel: 'Email',
      desc: 'Booking confirmations, invoice summaries, and verification receipts delivered instantly to your inbox.',
      icon: <Mail size={24} color="var(--color-navy)" />,
    },
    {
      channel: 'SMS',
      desc: 'Time-critical schedule reminders, one-time verification codes, and immediate appointment alerts.',
      icon: <Smartphone size={24} color="var(--color-navy)" />,
    },
    {
      channel: 'Push Notifications',
      desc: 'Real-time in-app status notifications, provider confirmations, and transaction verifications.',
      icon: <Bell size={24} color="var(--color-navy)" />,
    },
  ];

  // 15. Why ODS Global Net (4 Key Points)
  const whyPoints = [
    {
      title: 'Connected Ecosystem',
      description: 'Customers, merchants, and service providers operate within one platform.',
      icon: <Layers size={24} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Convenient Access',
      description: 'Discover, book, manage, and pay through a unified digital experience.',
      icon: <Search size={24} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Centralized Management',
      description: 'Accounts, bookings, transactions, and services can be managed from dedicated dashboards.',
      icon: <Sliders size={24} color="var(--color-gold-bright)" />,
    },
    {
      title: 'Scalable Platform',
      description: 'Built to support a growing network of users, merchants, and service providers.',
      icon: <Database size={24} color="var(--color-gold-bright)" />,
    },
  ];

  // Helper pattern background div
  const patternBg = (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
        opacity: 0.05,
        backgroundSize: '360px',
        pointerEvents: 'none',
      }}
    />
  );

  return (
    <div style={{ backgroundColor: 'var(--color-navy)', color: 'var(--color-text-light)', minHeight: '100vh' }}>
      {/* ========================================================================= */}
      {/* 01. HERO SECTION */}
      {/* ========================================================================= */}
      <section
        id="hero"
        style={{
          position: 'relative',
          paddingTop: '90px',
          paddingBottom: '110px',
          backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(18, 49, 104, 0.95) 0%, rgba(15, 40, 91, 1) 60%, rgba(8, 23, 56, 1) 100%)',
          overflow: 'hidden',
          borderBottom: '1px solid var(--color-border-dark)',
        }}
      >
        {patternBg}

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          {/* Eyebrow */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '999px',
              backgroundColor: 'rgba(18, 49, 104, 0.85)',
              border: '1px solid var(--color-gold-mid)',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Sparkles size={16} color="var(--color-gold-bright)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold-highlight)', letterSpacing: '1px' }}>
              &ldquo;ETHIOPIAN BLESSINGS, MODERN GIFTING&rdquo;
            </span>
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: '920px',
              margin: '0 auto 24px',
              letterSpacing: '-0.5px',
            }}
          >
            Connecting People, Businesses, and Services in{' '}
            <span className="gold-gradient-text">One Digital Platform.</span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
              color: 'var(--color-text-muted-dark)',
              maxWidth: '820px',
              margin: '0 auto 36px',
              lineHeight: 1.7,
            }}
          >
            Book, gift, and manage health, wellness, and hotel room services &mdash; all in one platform. Connecting customers, accredited healthcare merchants, and specialized providers across Ethiopia.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
              Get Started <ArrowRight size={18} />
            </Button>
            <Button
              size="lg"
              variant="outline-gold"
              onClick={() => {
                const el = document.getElementById('services');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Services
            </Button>
            <Button
              size="lg"
              variant="outline-gold"
              onClick={() => {
                const el = document.getElementById('gifting');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Gift size={18} /> Send a Gift
            </Button>
          </div>

          {/* Supporting Text Pills */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              padding: '12px 24px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-bright)', letterSpacing: '0.5px' }}>
              Discover
            </span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-bright)', letterSpacing: '0.5px' }}>
              Book
            </span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-bright)', letterSpacing: '0.5px' }}>
              Pay
            </span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-bright)', letterSpacing: '0.5px' }}>
              Gift
            </span>
            <span style={{ color: 'var(--color-border-dark)' }}>•</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-gold-bright)', letterSpacing: '0.5px' }}>
              Manage
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 02. INTRODUCTION / ABOUT ODS GLOBAL NET */}
      {/* ========================================================================= */}
      <section
        id="about"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <ShieldCheck size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  ABOUT ODS GLOBAL NET
                </span>
              </div>
              <h2 style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: '22px' }}>
                A Smarter Way to <span className="gold-gradient-text">Access and Manage</span> Services
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '16px' }}>
                At <strong style={{ color: '#ffffff' }}>ODS Global Network Gifting</strong>, we are a pioneering digital platform connecting users with trusted providers across medical care, wellness spas, 24/7 ambulance services, diagnostic laboratories, and hospitality. Headquartered in Addis Ababa, Ethiopia, we make health, self-care, and comfort accessible anytime, anywhere.
              </p>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.02rem', lineHeight: 1.8, marginBottom: '24px' }}>
                Whether booking a specialized doctor's consultation, ordering prescription deliveries, scheduling rapid lab tests, or sending cultural wellness vouchers to loved ones, ODS Global Net delivers seamless, reliable options right at your fingertips.
              </p>

              {/* Mission & Vision Mini-Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderLeft: '4px solid var(--color-gold-bright)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold-bright)', textTransform: 'uppercase', marginBottom: '6px' }}>Our Mission</div>
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    Connecting people to better healthcare through one intelligent digital platform that makes quality care accessible, convenient, and connected for everyone.
                  </p>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderLeft: '4px solid var(--color-gold-bright)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold-bright)', textTransform: 'uppercase', marginBottom: '6px' }}>Our Vision</div>
                  <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    To become the leading digital healthcare ecosystem transforming how Africa accesses, delivers, and experiences healthcare.
                  </p>
                </div>
              </div>

              <Button
                variant="gold"
                onClick={() => {
                  const el = document.getElementById('ecosystem');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More About ODS Global Net <ArrowRight size={18} />
              </Button>
            </div>

            {/* Visual Feature Showcase Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
              }}
            >
              {[
                { title: 'Trusted Providers', count: '100% Verified', icon: <CheckCircle2 size={24} color="var(--color-gold-bright)" /> },
                { title: 'Booking Engine', count: 'Real-Time Sync', icon: <Calendar size={24} color="var(--color-gold-bright)" /> },
                { title: 'Secure Payments', count: 'Encrypted Gateway', icon: <CreditCard size={24} color="var(--color-gold-bright)" /> },
                { title: 'Instant Alerts', count: 'SMS & Email', icon: <Bell size={24} color="var(--color-gold-bright)" /> },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    color: 'var(--color-navy)',
                    padding: '28px 24px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid rgba(190, 155, 73, 0.2)',
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(15, 40, 91, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    {item.icon}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03. HOW ODS GLOBAL NET WORKS */}
      {/* ========================================================================= */}
      <section
        id="how-it-works"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Everything You Need, <span className="gold-gradient-text">Connected in One Platform</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              A simple digital experience that connects customers with merchants and service providers while making everyday service management easier.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '28px',
            }}
          >
            {[
              {
                num: '01',
                step: 'Discover',
                title: 'Find the Right Service',
                description: 'Explore available merchants and service providers across different categories and discover services that match your needs.',
                icon: <Search size={28} color="var(--color-navy)" />,
              },
              {
                num: '02',
                step: 'Book',
                title: 'Schedule With Ease',
                description: 'Browse availability, select a convenient time, and make appointments directly through the platform.',
                icon: <Calendar size={28} color="var(--color-navy)" />,
              },
              {
                num: '03',
                step: 'Pay',
                title: 'Choose How You Pay',
                description: 'Use available payment options to complete transactions conveniently and securely.',
                icon: <CreditCard size={28} color="var(--color-navy)" />,
              },
              {
                num: '04',
                step: 'Manage',
                title: 'Stay in Control',
                description: 'Manage your bookings, appointments, transactions, profile, notifications, and other activities from one account.',
                icon: <Sliders size={28} color="var(--color-navy)" />,
              },
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '36px 28px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  borderTop: '4px solid var(--color-gold-mid)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(15, 40, 91, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold-mid)' }}>
                    {step.num}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#6b7280', marginBottom: '8px' }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: 'var(--color-navy)' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04. SERVICES & PROVIDER CATEGORIES */}
      {/* ========================================================================= */}
      <section
        id="services"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Access a Growing <span className="gold-gradient-text">Network of Services</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              ODS Global Net connects customers with a diverse range of businesses and professional service providers through one digital ecosystem.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
              marginBottom: '48px',
            }}
          >
            {serviceCategories.map((cat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '28px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {cat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-navy)' }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.6 }}>
                    {cat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
              Explore Service Providers <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05. FOR CUSTOMERS */}
      {/* ========================================================================= */}
      <section
        id="for-customers"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Users size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  FOR CUSTOMERS
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '20px' }}>
                Services at Your <span className="gold-gradient-text">Fingertips</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '32px' }}>
                ODS Global Net gives customers a convenient way to discover services, manage appointments, track bookings, make payments, and stay informed from a single account.
              </p>
              <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
                Create Your Account <ArrowRight size={18} />
              </Button>
            </div>

            {/* Feature checklist card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', color: 'var(--color-navy)' }}>
                Customer Experience Highlights
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                {customerFeatures.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(190, 155, 73, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={15} color="var(--color-gold-mid)" />
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06. FOR MERCHANTS */}
      {/* ========================================================================= */}
      <section
        id="for-merchants"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            {/* Feature checklist card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                order: 2,
              }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', color: 'var(--color-navy)' }}>
                Merchant Management Suite
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                {merchantFeatures.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(190, 155, 73, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={15} color="var(--color-gold-mid)" />
                    </div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ order: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Briefcase size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  FOR MERCHANTS
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '20px' }}>
                Take Your <span className="gold-gradient-text">Business Digital</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '32px' }}>
                ODS Global Net provides merchants with digital tools to manage their profiles, services, documents, bookings, customers, and business activities from one centralized platform.
              </p>
              <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
                Register Your Business <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07. SERVICE PROVIDER NETWORK */}
      {/* ========================================================================= */}
      <section
        id="for-providers"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(190, 155, 73, 0.15)',
                border: '1px solid var(--color-gold-mid)',
                marginBottom: '20px',
              }}
            >
              <StethoscopeIcon size={16} color="var(--color-gold-bright)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                SERVICE PROVIDER NETWORK
              </span>
            </div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Built for <span className="gold-gradient-text">Service Providers</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Whether you operate a hospital, clinic, pharmacy, laboratory, wellness center, home care service, or specialized practice, ODS Global Net provides a digital environment for managing and presenting your services.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
              marginBottom: '48px',
            }}
          >
            {providerBenefits.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '32px 24px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
              Join the ODS Network <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 08. APPOINTMENT BOOKING */}
      {/* ========================================================================= */}
      <section
        id="appointments"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Calendar size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  APPOINTMENT BOOKING
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '20px' }}>
                Book Services <span className="gold-gradient-text">Without the Hassle</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '32px' }}>
                Find available services, select a convenient time, and manage your appointments directly through ODS Global Net.
              </p>
              <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
                Book an Appointment <ArrowRight size={18} />
              </Button>
            </div>

            {/* 8 Features Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
              }}
            >
              {appointmentFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    color: 'var(--color-navy)',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <CheckCircle2 size={18} color="var(--color-gold-mid)" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 09. PAYMENTS */}
      {/* ========================================================================= */}
      <section
        id="payments"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 60px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Flexible <span className="gold-gradient-text">Payment Options</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '12px' }}>
              ODS Global Net is designed to support convenient digital transactions by connecting users with multiple payment methods.
            </p>
            <p style={{ color: 'var(--color-gold-bright)', fontSize: '1rem', fontWeight: 600 }}>
              Simple, convenient, and integrated payment management.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
              marginBottom: '48px',
            }}
          >
            {paymentMethods.map((pm, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '28px 20px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}
                >
                  {pm.icon}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>{pm.name}</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{pm.desc}</p>
              </div>
            ))}
          </div>

          {/* Strategic partner settlement badges */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '36px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/capital-bank.png" alt="Capital Bank" style={{ height: '28px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/ethiotel.png" alt="Ethio Telecom" style={{ height: '28px', objectFit: 'contain' }} />
            </div>
            <div style={{ background: '#ffffff', padding: '10px 24px', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
              <img src="/assets/brand/partners/chapa.png" alt="Chapa Payment Gateway" style={{ height: '28px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. GIFT CARDS */}
      {/* ========================================================================= */}
      <section
        id="gifting"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Gift size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  GIFT CARDS
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '20px' }}>
                Give More With <span className="gold-gradient-text">ODS Gift Cards</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '28px' }}>
                Transform healthcare and self-care into meaningful digital experiences. Whether gifting as an individual (for family and diaspora relatives) or as an organization (for corporate wellness and rewards), ODS Global Net delivers seamless digital redemption.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                {giftCardFeatures.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle2 size={20} color="var(--color-gold-bright)" />
                    <span style={{ fontSize: '0.95rem' }}>{feat}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
                  Purchase Gift Card <ArrowRight size={18} />
                </Button>
                <Button size="lg" variant="outline-gold" onClick={() => onNavigate('login')}>
                  Redeem Voucher
                </Button>
              </div>
            </div>

            {/* Voucher Card Mockup */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1b3b75 0%, #0c1c38 100%)',
                padding: '40px',
                borderRadius: '24px',
                border: '1px solid var(--color-gold-mid)',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--color-gold-bright)', fontWeight: 700 }}>
                  ODS DIGITAL VOUCHER
                </span>
                <Gift size={28} color="var(--color-gold-bright)" />
              </div>

              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                ETB 5,000.00
              </div>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem', marginBottom: '32px' }}>
                Valid at accredited hospitals, clinics, diagnostic centers &amp; spas across the ODS Global Net.
              </p>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px dashed var(--color-gold-mid)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase' }}>Voucher Code</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--color-gold-highlight)' }}>
                    ODS-2026-WELLNESS
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Active</div>
              </div>
            </div>
          </div>

          {/* Gifting Packages: Basic vs. VIP */}
          <div style={{ marginTop: '64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(190, 155, 73, 0.3)', borderRadius: '16px', padding: '32px' }}>
              <div style={{ color: 'var(--color-gold-bright)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                Basic Gift Packages
              </div>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Affordable wellness treatments, diagnostic checkups, or hotel room stay packages ideal for individuals, employee tokens, or diaspora family support.
              </p>
              <div style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="var(--color-gold-bright)" style={{ flexShrink: 0 }} />
                <span>Individual &amp; Corporate • Instant Code SMS • Flexible Balance</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--color-gold-bright)', borderRadius: '16px', padding: '32px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '20px', backgroundColor: 'var(--color-gold-bright)', color: 'var(--color-navy-dark)', fontSize: '0.75rem', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', textTransform: 'uppercase' }}>
                Premium Experience
              </div>
              <div style={{ color: 'var(--color-gold-bright)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                VIP Gift Experiences
              </div>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
                Exclusive, customizable experiences featuring executive health evaluations, specialist consultations, therapeutic spa retreats, and luxury hospitality stays.
              </p>
              <div style={{ color: '#e2e8f0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="var(--color-gold-bright)" style={{ flexShrink: 0 }} />
                <span>Dedicated Care Coordinator • Priority Booking • VIP Partner Access</span>
              </div>
            </div>
          </div>

          {/* Celebrations & Occasions Strip */}
          <div style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-gold-bright)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '16px' }}>
              Curated For Ethiopian &amp; Global Celebrations
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
              {[
                'Enkutatash (New Year)',
                'Meskel',
                'Timket (Epiphany)',
                'Genna (Christmas)',
                'Fasika (Easter)',
                'Irreechaa',
                'Ashenda',
                "Mother's Day",
                "Father's Day",
                "Valentine's Day",
                'Corporate Milestones',
              ].map((occ, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(190, 155, 73, 0.12)',
                    border: '1px solid rgba(190, 155, 73, 0.25)',
                    color: '#e2e8f0',
                    fontSize: '0.82rem',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontWeight: 500,
                  }}
                >
                  {occ}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. ONE CONNECTED PLATFORM */}
      {/* ========================================================================= */}
      <section
        id="ecosystem"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Everything Connected. <span className="gold-gradient-text">Everything in One Place.</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              ODS Global Net brings together the essential components of the service experience into one connected digital ecosystem.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}
          >
            {ecosystemRoles.map((eco, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '32px 24px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  {eco.icon}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>{eco.role}</h3>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>
                  {eco.tagline}
                </p>
                <Button variant="outline-gold" size="sm" fullWidth onClick={eco.action}>
                  Enter Portal <ArrowRight size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. PLATFORM MANAGEMENT */}
      {/* ========================================================================= */}
      <section
        id="management"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Powerful Tools <span className="gold-gradient-text">Behind the Experience</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              A centralized administration environment provides the tools needed to manage users, merchants, providers, bookings, transactions, analytics, reports, and support operations.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {managementAreas.map((area, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '24px',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {area.icon}
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {area.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. SECURITY & TRUST */}
      {/* ========================================================================= */}
      <section
        id="security"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '60px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  marginBottom: '20px',
                }}
              >
                <Lock size={16} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                  SECURITY & TRUST
                </span>
              </div>
              <h2 style={{ fontSize: '2.4rem', lineHeight: 1.2, marginBottom: '20px' }}>
                Designed With <span className="gold-gradient-text">Security in Mind</span>
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '20px' }}>
                ODS Global Net incorporates security controls throughout the platform to help protect accounts, transactions, and platform data.
              </p>
              <p style={{ color: 'var(--color-gold-bright)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>
                Your account and platform activity are managed through secure digital processes.
              </p>
            </div>

            {/* Security Features Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', color: 'var(--color-navy)' }}>
                Enterprise Security Controls
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {securityFeatures.map((sec, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldCheck size={20} color="var(--color-gold-mid)" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>{sec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. NOTIFICATIONS */}
      {/* ========================================================================= */}
      <section
        id="notifications"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 60px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Stay Informed at <span className="gold-gradient-text">Every Step</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Receive important updates throughout your service journey, from booking confirmations and appointment reminders to payment notifications and account updates.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {notificationChannels.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '36px 28px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}
                >
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px' }}>{item.channel}</h3>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 15. WHY ODS GLOBAL NET? */}
      {/* ========================================================================= */}
      <section
        id="why-ods"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 64px' }}>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              One Platform. <span className="gold-gradient-text">Multiple Possibilities.</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.1rem', lineHeight: 1.7 }}>
              ODS Global Net is designed to reduce the complexity of accessing and managing services by bringing customers, merchants, service providers, and administrators into one connected ecosystem.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            {whyPoints.map((pt, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--color-navy)',
                  padding: '32px 24px',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: '4px solid var(--color-gold-mid)',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 40, 91, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {pt.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  {pt.title}
                </h3>
                <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {pt.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 16. WORK WITH ODS GLOBAL NETWORK (From Cards.tsx & PartnerWithUs.tsx) */}
      {/* ========================================================================= */}
      <section
        id="work-with-us"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(190, 155, 73, 0.15)',
                border: '1px solid var(--color-gold-mid)',
                marginBottom: '16px',
              }}
            >
              <Briefcase size={16} color="var(--color-gold-bright)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                STRATEGIC PARTNERSHIPS
              </span>
            </div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Work With <span className="gold-gradient-text">ODS Global Network</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Join our growing healthcare and digital technology ecosystem across Ethiopia and the diaspora.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '28px',
            }}
          >
            {/* Card 1: Partner */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px 28px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
                borderLeft: '5px solid var(--color-navy)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
                Invest / Partner With Us
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Are you an investor, venture capital firm, business enterprise, healthcare institution, or technology solutions provider? Join ODS Global Network to grow and innovate together.
              </p>
              <Button
                variant="gold"
                size="sm"
                onClick={() => onNavigate('register')}
              >
                Become a Partner &rarr;
              </Button>
            </div>

            {/* Card 2: Community */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px 28px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
                borderLeft: '5px solid var(--color-gold-bright)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
                Join ODS Global Network Community
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Are you in the Diaspora, an individual seeking to volunteer, a medical professional, or a fresh graduate? Connect, collaborate, and contribute with our national healthcare mission.
              </p>
              <Button
                variant="gold"
                size="sm"
                onClick={() => onNavigate('register')}
              >
                Become a Member &rarr;
              </Button>
            </div>

            {/* Card 3: Careers */}
            <div
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--color-navy)',
                padding: '36px 28px',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)',
                borderLeft: '5px solid var(--color-navy)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>
                Career Openings
              </h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.6, flex: 1, marginBottom: '24px' }}>
                Looking for full-time or specialist opportunities in digital health, logistics, or operations? Explore open roles and build the future of connected healthtech in Africa.
              </p>
              <Button
                variant="outline-gold"
                size="sm"
                onClick={() => onNavigate('register')}
              >
                View Openings &rarr;
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 17. CUSTOMER SUPPORT & FAQ (From SupportPage.tsx) */}
      {/* ========================================================================= */}
      <section
        id="faq"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(190, 155, 73, 0.15)',
                border: '1px solid var(--color-gold-mid)',
                marginBottom: '16px',
              }}
            >
              <LifeBuoy size={16} color="var(--color-gold-bright)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)' }}>
                HELP CENTER &amp; FAQS
              </span>
            </div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '16px' }}>
              Frequently Asked <span className="gold-gradient-text">Questions</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.05rem', lineHeight: 1.7 }}>
              Everything you need to know about navigating, booking, and gifting on ODS Global Net.
            </p>
          </div>

          <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              {
                q: 'How do I book an appointment or service on ODS Global Net?',
                a: 'Browse our verified provider directory across hospitals, clinics, pharmacies, laboratories, and wellness centers. Select your preferred practitioner or facility, choose a convenient date/time slot, and confirm instantly with your account.',
              },
              {
                q: 'How do ODS Digital Gift Cards and Vouchers work?',
                a: 'You can choose between Basic and VIP gift experiences for individuals or corporate teams. The recipient receives a secure digital code via SMS or email, which can be redeemed at accredited partner facilities across Ethiopia.',
              },
              {
                q: 'What payment methods are supported on the platform?',
                a: 'We support all major payment channels including Telebirr, local debit cards, international credit cards (Visa/Mastercard), direct bank transfer, and digital wallets integrated securely via Chapa.',
              },
              {
                q: 'Can members of the Ethiopian Diaspora send gifts and medical care to relatives in Ethiopia?',
                a: 'Yes! ODS Global Net is purpose-built to connect diaspora families with their loved ones. You can securely purchase medical checkups, wellness packages, or voucher credits from abroad using international payment methods.',
              },
              {
                q: 'How can healthcare providers and merchants join the network?',
                a: 'Service providers and merchants can register through our onboarding portal. After submitting accreditation licenses and completing our digital KYC verification, you gain instant access to your dedicated provider dashboard.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(190, 155, 73, 0.25)',
                  borderRadius: '14px',
                  padding: '24px 28px',
                }}
              >
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-gold-bright)', marginBottom: '8px' }}>
                  {faq.q}
                </h4>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Direct Support Contact Bar */}
          <div
            style={{
              maxWidth: '880px',
              margin: '40px auto 0',
              padding: '24px',
              backgroundColor: 'rgba(18, 49, 104, 0.7)',
              border: '1px solid var(--color-gold-mid)',
              borderRadius: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>
                Need additional assistance?
              </div>
              <div style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem' }}>
                Our Addis Ababa support team is available via Phone, WhatsApp, and Email.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="tel:+251-960-606-042"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--color-gold-bright)',
                  color: 'var(--color-navy-dark)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                +251 960 606 042
              </a>
              <a
                href="mailto:info@odsglobal.net"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid var(--color-gold-bright)',
                  color: 'var(--color-gold-bright)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                info@odsglobal.net
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 18. CALL TO ACTION */}
      {/* ========================================================================= */}
      <section
        id="cta-connect"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 0',
          borderBottom: '1px solid var(--color-border-dark)',
          backgroundColor: 'var(--color-navy-dark)',
          textAlign: 'center',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '860px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
            Ready to Connect With <span className="gold-gradient-text">ODS Global Net?</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1.15rem', lineHeight: 1.7, marginBottom: '40px' }}>
            Whether you're looking for services, growing your business, or joining our service provider network, ODS Global Net gives you the tools to connect and manage your digital experience.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline-gold" onClick={() => onNavigate('register')}>
              Become a Merchant
            </Button>
            <Button size="lg" variant="outline-gold" onClick={() => onNavigate('register')}>
              Join as a Service Provider
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 17. FINAL HOMEPAGE CTA */}
      {/* ========================================================================= */}
      <section
        id="final-cta"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '90px 0',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(18, 49, 104, 0.95) 0%, rgba(15, 40, 91, 1) 60%, rgba(8, 23, 56, 1) 100%)',
          textAlign: 'center',
        }}
      >
        {patternBg}
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '800px' }}>
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              marginBottom: '18px',
              letterSpacing: '-0.5px',
            }}
          >
            <span className="gold-gradient-text">Discover. Connect. Book. Pay. Manage.</span>
          </h2>
          <p
            style={{
              fontSize: '1.2rem',
              color: 'var(--color-text-muted-dark)',
              marginBottom: '36px',
              lineHeight: 1.6,
            }}
          >
            Experience a more connected way to access and manage services with ODS Global Net.
          </p>
          <Button size="lg" variant="gold" onClick={() => onNavigate('register')}>
            Get Started Today <ArrowRight size={18} />
          </Button>
        </div>
      </section>
    </div>
  );
};

// Custom Stethoscope SVG icon wrapper for seamless vector rendering
const StethoscopeIcon: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

export default HomePage;
