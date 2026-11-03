import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  User,
  UserCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Globe,
  MapPin,
  Stethoscope,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { PhoneInput } from '../components/common/PhoneInput';
import { RegistrationFileUpload } from '../components/common/RegistrationFileUpload';

const API_BASE = 'http://localhost:3001';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
}

type RegistrationRole = 'customer' | 'merchant' | 'provider';

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  // Step & Role State
  const [currentStep, setCurrentStep] = useState<'select' | 'form'>('select');
  const [role, setRole] = useState<RegistrationRole>('customer');

  // Customer State
  const [custFirstName, setCustFirstName] = useState('');
  const [custLastName, setCustLastName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCountry, setCustCountry] = useState('Ethiopia');
  const [custCity, setCustCity] = useState('Addis Ababa');
  const [custPassword, setCustPassword] = useState('');
  const [custConfirmPassword, setCustConfirmPassword] = useState('');
  const [custLanguage, setCustLanguage] = useState('English');
  const [custNotifications, setCustNotifications] = useState('All Notifications (Email, SMS, Push)');
  const [custEmailVerify, setCustEmailVerify] = useState(true);
  const [custPhoneVerify, setCustPhoneVerify] = useState(true);

  // Merchant State (Holds both standard businesses and organizations/institutions)
  const [merchName, setMerchName] = useState('');
  const [merchType, setMerchType] = useState('Retailer');
  const [merchCategory, setMerchCategory] = useState('Health & Medical Supplies');
  const [merchDesc, setMerchDesc] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchWebsite, setMerchWebsite] = useState('');
  const [merchCountry, setMerchCountry] = useState('Ethiopia');
  const [merchRegion, setMerchRegion] = useState('Addis Ababa');
  const [merchCity, setMerchCity] = useState('Addis Ababa');
  const [merchAddress, setMerchAddress] = useState('');
  const [merchPostal, setMerchPostal] = useState('');
  const [merchMapLocation, setMerchMapLocation] = useState('');
  const [merchContactPerson, setMerchContactPerson] = useState('');
  const [merchContactEmail, setMerchContactEmail] = useState('');
  const [merchContactPhone, setMerchContactPhone] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchConfirmPassword, setMerchConfirmPassword] = useState('');
  const [stagedDocs, setStagedDocs] = useState<Record<string, { doc_type: string; staging_token: string; file_name: string } | null>>({});

  const isOrgType = merchType === 'Organization / Institution';

  const handleMerchTypeChange = (newType: string) => {
    setMerchType(newType);
    if (newType === 'Organization / Institution') {
      setMerchCategory('Corporation / Enterprise');
    } else {
      setMerchCategory('Health & Medical Supplies');
    }
  };

  // Service Provider State
  const [provName, setProvName] = useState('');
  const [provType, setProvType] = useState('Hospital');
  const [provCategory, setProvCategory] = useState('Outpatient & Inpatient Care');
  const [provDesc, setProvDesc] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provWebsite, setProvWebsite] = useState('');
  const [provCity, setProvCity] = useState('Addis Ababa');
  const [provAddress, setProvAddress] = useState('');
  const [provServiceLocation, setProvServiceLocation] = useState('');
  const [provServicesOffered, setProvServicesOffered] = useState('');
  const [provOperatingHours, setProvOperatingHours] = useState('24/7 Operations');
  const [provAvailability, setProvAvailability] = useState('Immediate & Scheduled');
  const [provContactPerson, setProvContactPerson] = useState('');
  const [provContactEmail, setProvContactEmail] = useState('');
  const [provContactPhone, setProvContactPhone] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provConfirmPassword, setProvConfirmPassword] = useState('');

  // UI / Validation State
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const getActivePassword = () => {
    if (role === 'customer') return custPassword;
    if (role === 'merchant') return merchPassword;
    return provPassword;
  };

  const currentStrength = getPasswordStrength(getActivePassword());

  const roleOptions: { key: RegistrationRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'customer',
      title: 'Customer',
      desc: 'Discover and book verified medical appointments, emergency care, and wellness services.',
      icon: <User size={18} color="var(--color-gold-deep)" />,
    },
    {
      key: 'merchant',
      title: 'Merchant & Institutions',
      desc: 'List medical equipment, pharmaceuticals, wellness items, manage orders — or register institutional accounts (enterprise, NGO, diplomatic mission, government agency).',
      icon: <Briefcase size={18} color="var(--color-gold-deep)" />,
    },
    {
      key: 'provider',
      title: 'Service Provider',
      desc: 'Hospitals, diagnostic labs, specialty clinics, ambulances, and home care providers.',
      icon: <Stethoscope size={18} color="var(--color-gold-deep)" />,
    },
  ];

  const currentRoleConfig = roleOptions.find((r) => r.key === role) || roleOptions[0];

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (role === 'customer') {
      if (!custFirstName.trim()) newErrors.custFirstName = 'First name is required';
      if (!custLastName.trim()) newErrors.custLastName = 'Last name is required';
      if (!custEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
        newErrors.custEmail = 'Valid email is required';
      }
      if (!custPhone.trim()) newErrors.custPhone = 'Mobile phone is required';
      if (custPassword.length < 8) newErrors.custPassword = 'Min 8 chars required';
      if (custPassword !== custConfirmPassword) newErrors.custConfirm = 'Passwords do not match';
    } else if (role === 'merchant') {
      if (!merchName.trim()) {
        newErrors.merchName = isOrgType ? 'Organization name is required' : 'Business name is required';
      }
      if (!merchPhone.trim()) newErrors.merchPhone = 'Phone is required';
      if (!merchEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchEmail)) {
        newErrors.merchEmail = 'Valid email is required';
      }
      if (!merchContactPerson.trim()) {
        newErrors.merchContactPerson = isOrgType ? 'Representative name is required' : 'Contact person is required';
      }
      if (merchPassword.length < 8) newErrors.merchPassword = 'Min 8 chars required';
      if (merchPassword !== merchConfirmPassword) newErrors.merchConfirm = 'Passwords do not match';
    } else if (role === 'provider') {
      if (!provName.trim()) newErrors.provName = 'Provider name is required';
      if (!provPhone.trim()) newErrors.provPhone = 'Phone is required';
      if (!provEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(provEmail)) {
        newErrors.provEmail = 'Valid email is required';
      }
      if (!provContactPerson.trim()) newErrors.provContactPerson = 'Contact person is required';
      if (provPassword.length < 8) newErrors.provPassword = 'Min 8 chars required';
      if (provPassword !== provConfirmPassword) newErrors.provConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);

      let payload: Record<string, any> = {};

      if (role === 'customer') {
        payload = {
          role: 'customer',
          full_name: `${custFirstName.trim()} ${custLastName.trim()}`.trim(),
          email: custEmail.trim(),
          phone: custPhone.trim(),
          password: custPassword,
          country: custCountry,
          city: custCity,
          preferred_language: custLanguage === 'Amharic' ? 'am' : 'en',
          notification_preference: custNotifications.toLowerCase().includes('sms') ? 'sms' : 'email',
        };
      } else if (role === 'merchant') {
        payload = {
          role: 'merchant',
          full_name: merchContactPerson.trim() || merchName.trim(),
          email: merchEmail.trim(),
          phone: merchPhone.trim(),
          password: merchPassword,
          business_name: merchName.trim(),
          business_type: isOrgType ? 'organization' : merchType.toLowerCase(),
          category: merchCategory,
          business_phone: merchPhone.trim(),
          business_email: merchEmail.trim(),
          website: merchWebsite.trim() || null,
          description: merchDesc.trim() || null,
          country: merchCountry,
          region_state: merchRegion,
          city: merchCity,
          postal_code: merchPostal.trim() || null,
          address_line: merchAddress.trim() || null,
          contact_person_name: merchContactPerson.trim(),
          contact_person_email: merchContactEmail.trim() || null,
          contact_person_phone: merchContactPhone.trim() || null,
        };
      } else if (role === 'provider') {
        payload = {
          role: 'provider',
          full_name: provContactPerson.trim() || provName.trim(),
          email: provEmail.trim(),
          phone: provPhone.trim(),
          password: provPassword,
          provider_name: provName.trim(),
          provider_type: provType,
          service_category: provCategory,
          official_phone: provPhone.trim(),
          official_email: provEmail.trim(),
          website: provWebsite.trim() || null,
          description: provDesc.trim() || null,
          services_offered: provServicesOffered.trim() || null,
          operating_hours: provOperatingHours,
          availability: provAvailability,
          city: provCity,
          address_line: provAddress.trim() || null,
          contact_person_name: provContactPerson.trim(),
          contact_person_email: provContactEmail.trim() || null,
          contact_person_phone: provContactPhone.trim() || null,
        };
      }

      // Collect optional staged KYC / registration documents
      const documentsList = Object.values(stagedDocs)
        .filter((d): d is { doc_type: string; staging_token: string; file_name: string } => !!d)
        .map((d) => ({ doc_type: d.doc_type, staging_token: d.staging_token }));

      payload.documents = documentsList;

      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErrors({ general: data.message || 'Registration failed. Please check your information.' });
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        setSubmittedSuccess(true);
      } catch (err: any) {
        setErrors({ general: 'Network error: Unable to reach authentication server. Please check your connection.' });
        setIsSubmitting(false);
      }
    }
  };

  // Compact select dropdown style helper
  const compactSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '8px',
    color: 'var(--color-text-dark)',
    fontSize: '0.86rem',
    outline: 'none',
  };

  // Compact Section title divider helper
  const renderSectionHeader = (title: string, subtitle?: string) => (
    <div style={{ margin: '16px 0 8px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px' }}>
      <h4 style={{ fontSize: '0.92rem', color: 'var(--color-navy-dark)', fontWeight: 700 }}>{title}</h4>
      {subtitle && <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
    </div>
  );

  // Live Password Strength Bar
  const renderPasswordStrength = () => {
    if (!getActivePassword()) return null;
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['Weak', 'Moderate', 'Good', 'Strong'];
    return (
      <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', gap: '3px', height: '3px' }}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                borderRadius: '2px',
                backgroundColor: idx < currentStrength ? colors[currentStrength - 1] : '#e2e8f0',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.72rem', color: colors[currentStrength - 1] || 'var(--color-text-muted)', fontWeight: 500 }}>
          Password strength: {labels[currentStrength - 1] || 'Weak'}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      {/* LEFT COLUMN: BRAND SHOWCASE (Desktop) */}
      <div
        className="auth-brand-col"
        style={{
          flex: '1 1 45%',
          backgroundColor: 'var(--color-navy-dark)',
          position: 'relative',
          padding: '60px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid var(--color-border-dark)',
          overflow: 'hidden',
          height: '100vh',
          maxHeight: '100vh',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        {/* Background Texture */}
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

        <div style={{ position: 'relative', zIndex: 2 }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-gold-bright)',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '40px',
            }}
          >
            <ArrowLeft size={16} /> Return to Home
          </button>

          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{ height: '54px', marginBottom: '36px' }}
          />

          <h2 style={{ fontSize: '2.2rem', color: '#ffffff', marginBottom: '16px', lineHeight: 1.25 }}>
            Secure Gateway to <span className="gold-gradient-text">Premier Health & Wellness</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '440px' }}>
            Access verified medical consultations, manage executive hospital appointments, or administer your merchant operations dashboard.
          </p>
        </div>

        {/* Feature badges */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px', margin: '40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Bank-Grade Security</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>HMAC-signed sessions & end-to-end data encryption</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Automatic Portal Routing</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Instant authentication and routing to Customer, Provider, or Admin portals</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>
          © {new Date().getFullYear()} ODS Global Network. All transactions protected.
        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC REGISTRATION FORM */}
      <div
        style={{
          backgroundColor: '#ffffff',
          flex: '1 1 55%',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 24px',
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          color: 'var(--color-text-dark)',
        }}
      >
        {/* Subtle Background Texture */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/assets/brand/raster/brand-pattern.png)',
            opacity: 0.015,
            backgroundSize: '360px',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: currentStep === 'form' ? '760px' : '660px', margin: '0 auto', paddingBottom: '40px' }}>
          {/* ========================================================================= */}
          {/* STEP 1: COMPACT SELECT REGISTRATION TYPE SCREEN */}
          {/* ========================================================================= */}
          {currentStep === 'select' && !submittedSuccess && (
            <div
              style={{
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '100px 24px',
                width: '100%',
                margin: '0 auto',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.9rem', color: 'var(--color-navy-dark)', fontWeight: 700, marginBottom: '8px' }}>
                  Create Your ODS Account
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  Select how you want to use ODS Global Net.
                </p>
              </div>

              {/* Role Dropdown */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy-dark)', marginBottom: '8px' }}>
                  Registering as ▾
                </label>
                <select
                  style={{ ...compactSelectStyle, padding: '11px 14px', fontSize: '0.92rem', fontWeight: 500 }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as RegistrationRole)}
                >
                  <option value="customer">Customer (Discover & Book Services)</option>
                  <option value="merchant">Merchant & Institutions (Suppliers, Retail & Enterprises)</option>
                  <option value="provider">Service Provider (Hospitals, Clinics & Specialists)</option>
                </select>

                {/* Role Description Preview Card */}
                <div
                  style={{
                    marginTop: '14px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 40, 91, 0.03)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(190, 155, 73, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {currentRoleConfig.icon}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '2px' }}>
                      {currentRoleConfig.title}
                    </h5>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                      {currentRoleConfig.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Button size="md" variant="gold" fullWidth onClick={() => setCurrentStep('form')}>
                  Continue Registration <ArrowRight size={16} />
                </Button>

                <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => onNavigate('login')}
                    style={{ color: 'var(--color-gold-deep)', fontWeight: 700 }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DYNAMIC COMPACT FORM BASED ON ROLE */}
          {/* ========================================================================= */}
          {currentStep === 'form' && !submittedSuccess && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 28px',
              }}
            >
              {/* Top Quick Role Selector Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Role:</span>
                  <select
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-navy-dark)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    value={role}
                    onChange={(e) => setRole(e.target.value as RegistrationRole)}
                  >
                    <option value="customer">Customer</option>
                    <option value="merchant">Merchant & Institutions</option>
                    <option value="provider">Service Provider</option>
                  </select>
                </div>

                <button
                  onClick={() => setCurrentStep('select')}
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--color-gold-deep)',
                    fontWeight: 700,
                  }}
                >
                  Overview ▾
                </button>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--color-navy-dark)', fontWeight: 700, marginBottom: '4px' }}>
                  {role === 'customer' && 'Customer Registration'}
                  {role === 'merchant' && (isOrgType ? 'Organization / Institution Registration' : 'Merchant Registration')}
                  {role === 'provider' && 'Service Provider Registration'}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  Enter your details below to activate your account.
                </p>
                {errors.general && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #f87171',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0 }} />
                    <span>{errors.general}</span>
                  </div>
                )}
              </div>

              <form onSubmit={validateAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* ------------------------------------------------------------- */}
                {/* OPTION 1: CUSTOMER FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'customer' && (
                  <>
                    {renderSectionHeader('Personal Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label="First Name"
                        placeholder="e.g. Abebe"
                        value={custFirstName}
                        onChange={(e) => setCustFirstName(e.target.value)}
                        error={errors.custFirstName}
                      />
                      <Input
                        compact
                        label="Last Name"
                        placeholder="e.g. Kebede"
                        value={custLastName}
                        onChange={(e) => setCustLastName(e.target.value)}
                        error={errors.custLastName}
                      />
                      <Input
                        compact
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        error={errors.custEmail}
                        leftIcon={<Mail size={14} />}
                      />
                      <PhoneInput
                        label="Phone Number"
                        value={custPhone}
                        onChange={(e164Val) => setCustPhone(e164Val)}
                        error={errors.custPhone}
                        required
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Country</label>
                        <select style={compactSelectStyle} value={custCountry} onChange={(e) => setCustCountry(e.target.value)}>
                          <option value="Ethiopia">Ethiopia</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Djibouti">Djibouti</option>
                          <option value="United States">United States (Diaspora)</option>
                          <option value="United Kingdom">United Kingdom (Diaspora)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <Input
                        compact
                        label="City"
                        placeholder="Addis Ababa"
                        value={custCity}
                        onChange={(e) => setCustCity(e.target.value)}
                      />
                    </div>

                    {renderSectionHeader('Account Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div>
                        <Input
                          compact
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 8 characters"
                          value={custPassword}
                          onChange={(e) => setCustPassword(e.target.value)}
                          error={errors.custPassword}
                          leftIcon={<Lock size={14} />}
                          rightIcon={
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ color: 'var(--color-text-muted-dark)' }}
                            >
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          }
                        />
                        {renderPasswordStrength()}
                      </div>

                      <Input
                        compact
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={custConfirmPassword}
                        onChange={(e) => setCustConfirmPassword(e.target.value)}
                        error={errors.custConfirm}
                        leftIcon={<Lock size={14} />}
                      />
                    </div>

                    {renderSectionHeader('Preferences')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Preferred Language</label>
                        <select style={compactSelectStyle} value={custLanguage} onChange={(e) => setCustLanguage(e.target.value)}>
                          <option value="English">English</option>
                          <option value="Amharic">Amharic (አማርኛ)</option>
                          <option value="Oromo">Afaan Oromoo</option>
                          <option value="Tigrinya">Tigrinya (ትግርኛ)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Notifications</label>
                        <select style={compactSelectStyle} value={custNotifications} onChange={(e) => setCustNotifications(e.target.value)}>
                          <option value="All Notifications (Email, SMS, Push)">All Channels</option>
                          <option value="Email Only">Email Only</option>
                          <option value="SMS Only">SMS Only</option>
                        </select>
                      </div>
                    </div>

                    {renderSectionHeader('Verification')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={custEmailVerify}
                          onChange={(e) => setCustEmailVerify(e.target.checked)}
                          style={{ accentColor: 'var(--color-gold-deep)' }}
                        />
                        Send email verification link
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 500 }}>
                        <input
                          type="checkbox"
                          checked={custPhoneVerify}
                          onChange={(e) => setCustPhoneVerify(e.target.checked)}
                          style={{ accentColor: 'var(--color-gold-deep)' }}
                        />
                        Send OTP SMS code to verify phone
                      </label>
                    </div>

                    <Button type="submit" variant="gold" size="md" fullWidth disabled={isSubmitting} style={{ marginTop: '14px' }}>
                      {isSubmitting ? 'Creating Account...' : 'Create Customer Account'}
                    </Button>
                  </>
                )}

                {/* ------------------------------------------------------------- */}
                {/* OPTION 2: MERCHANT & INSTITUTIONS FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'merchant' && (
                  <>
                    {renderSectionHeader(
                      isOrgType ? 'Institutional Information' : 'Business Information',
                      isOrgType ? 'Enterprise, NGO, diplomatic mission, or government details' : 'Storefront, supplier, or distributor operations'
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label={isOrgType ? 'Organization / Institution Name' : 'Business / Merchant Name'}
                        placeholder={isOrgType ? 'e.g. African Union Mission / Global Bank' : 'e.g. Apex Health Supplies Ltd.'}
                        value={merchName}
                        onChange={(e) => setMerchName(e.target.value)}
                        error={errors.merchName}
                        leftIcon={isOrgType ? <Building size={14} /> : <Briefcase size={14} />}
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Business Type ▾</label>
                        <select style={compactSelectStyle} value={merchType} onChange={(e) => handleMerchTypeChange(e.target.value)}>
                          <option value="Retailer">Retailer / Storefront</option>
                          <option value="Pharmacy Supplier">Pharmacy Supplier</option>
                          <option value="Equipment Vendor">Equipment Vendor</option>
                          <option value="Wholesaler">Wholesaler / Distributor</option>
                          <option value="Medical Supply">Medical Supply</option>
                          <option value="Wellness eCommerce">Wellness eCommerce</option>
                          <option value="Organization / Institution">Organization / Institution</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>
                          {isOrgType ? 'Industry / Sector ▾' : 'Category / Industry ▾'}
                        </label>
                        <select style={compactSelectStyle} value={merchCategory} onChange={(e) => setMerchCategory(e.target.value)}>
                          {isOrgType ? (
                            <>
                              <option value="Corporation / Enterprise">Corporation / Enterprise</option>
                              <option value="Embassy / Diplomatic Mission">Embassy / Diplomatic</option>
                              <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                              <option value="Government Agency">Government Agency</option>
                              <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                              <option value="Banking & Financial">Banking & Financial</option>
                              <option value="Corporate Health Benefits">Corporate Health Benefits</option>
                            </>
                          ) : (
                            <>
                              <option value="Health & Medical Supplies">Health & Medical Supplies</option>
                              <option value="Pharmaceuticals">Pharmaceuticals</option>
                              <option value="Diagnostic Equipment">Diagnostic Equipment</option>
                              <option value="Wellness & Nutrition">Wellness & Nutrition</option>
                              <option value="Personal Protective Equipment (PPE)">Personal Protective Equipment (PPE)</option>
                              <option value="Rehabilitation & Therapy">Rehabilitation & Therapy</option>
                            </>
                          )}
                        </select>
                      </div>
                      <PhoneInput
                        label={isOrgType ? 'Official Phone' : 'Business Phone'}
                        value={merchPhone}
                        onChange={(e164Val) => setMerchPhone(e164Val)}
                        error={errors.merchPhone}
                        required
                      />
                      <Input
                        compact
                        label={isOrgType ? 'Official Email' : 'Business Email'}
                        type="email"
                        placeholder={isOrgType ? 'admin@enterprise.org' : 'orders@merchant.com'}
                        value={merchEmail}
                        onChange={(e) => setMerchEmail(e.target.value)}
                        error={errors.merchEmail}
                        leftIcon={<Mail size={14} />}
                      />
                      <Input
                        compact
                        label="Website (Optional)"
                        placeholder={isOrgType ? 'https://www.organization.org' : 'https://www.merchant.com'}
                        value={merchWebsite}
                        onChange={(e) => setMerchWebsite(e.target.value)}
                        leftIcon={<Globe size={14} />}
                      />
                      <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                          {isOrgType ? 'Organization Scope & Mission' : 'Description'}
                        </label>
                        <textarea
                          rows={2}
                          style={{ ...compactSelectStyle, resize: 'vertical' }}
                          placeholder={isOrgType ? 'Institutional mission or employee health scope...' : 'Overview of products and operations...'}
                          value={merchDesc}
                          onChange={(e) => setMerchDesc(e.target.value)}
                        />
                      </div>
                    </div>

                    {renderSectionHeader(isOrgType ? 'Headquarters Location' : 'Business Location')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Country</label>
                        <select style={compactSelectStyle} value={merchCountry} onChange={(e) => setMerchCountry(e.target.value)}>
                          <option value="Ethiopia">Ethiopia</option>
                          <option value="Kenya">Kenya</option>
                          <option value="International">International</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <Input
                        compact
                        label="Region / State"
                        placeholder="Addis Ababa"
                        value={merchRegion}
                        onChange={(e) => setMerchRegion(e.target.value)}
                      />
                      <Input
                        compact
                        label="City"
                        placeholder="Addis Ababa"
                        value={merchCity}
                        onChange={(e) => setMerchCity(e.target.value)}
                      />
                      <Input
                        compact
                        label="Postal Code"
                        placeholder="1000"
                        value={merchPostal}
                        onChange={(e) => setMerchPostal(e.target.value)}
                      />
                      <Input
                        compact
                        label={isOrgType ? 'Headquarters Address' : 'Physical Address'}
                        placeholder={isOrgType ? 'HQ Tower / Campus' : 'Bole Sub-City, Worda 03'}
                        value={merchAddress}
                        onChange={(e) => setMerchAddress(e.target.value)}
                        leftIcon={<MapPin size={14} />}
                      />
                      <Input
                        compact
                        label="Map Location / GPS Pin"
                        placeholder="e.g. 9.0107° N, 38.7612° E"
                        value={merchMapLocation}
                        onChange={(e) => setMerchMapLocation(e.target.value)}
                      />
                    </div>

                    {renderSectionHeader(
                      isOrgType ? 'Institutional Documents (Optional at sign-up)' : 'Business Documents (Optional at sign-up)',
                      'You can upload registration and trade licenses now or later in your KYC Documents tab.'
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {(isOrgType
                        ? [
                            { key: 'charterDoc', docType: 'kyc_accreditation', label: 'Institutional Charter / Legal Registration' },
                            { key: 'operatingDoc', docType: 'kyc_license', label: 'Delegation / Operating License' },
                          ]
                        : [
                            { key: 'regCert', docType: 'kyc_registration', label: 'Registration Certificate' },
                            { key: 'tradeLicense', docType: 'kyc_license', label: 'Valid Trade License' },
                            { key: 'tinDoc', docType: 'tax_id', label: 'TIN / Tax Document' },
                          ]
                      ).map((doc) => (
                        <RegistrationFileUpload
                          key={doc.key}
                          docType={doc.docType}
                          label={doc.label}
                          apiBase={API_BASE}
                          onTokenReceived={(tokenData) => {
                            setStagedDocs((prev) => ({ ...prev, [doc.key]: tokenData }));
                          }}
                        />
                      ))}
                    </div>

                    {renderSectionHeader(isOrgType ? 'Representative & Account Information' : 'Account Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label={isOrgType ? 'Representative Name' : 'Contact Person'}
                        placeholder={isOrgType ? 'e.g. Dr. Hanna Tesfaye (Head of HR)' : 'Representative Full Name'}
                        value={merchContactPerson}
                        onChange={(e) => setMerchContactPerson(e.target.value)}
                        error={errors.merchContactPerson}
                      />
                      <Input
                        compact
                        label={isOrgType ? 'Representative Email' : 'Account Email'}
                        type="email"
                        placeholder={isOrgType ? 'rep@enterprise.org' : 'rep@merchant.com'}
                        value={merchContactEmail}
                        onChange={(e) => setMerchContactEmail(e.target.value)}
                        leftIcon={<Mail size={14} />}
                      />
                      <PhoneInput
                        label={isOrgType ? 'Representative Phone' : 'Account Phone'}
                        value={merchContactPhone}
                        onChange={(e164Val) => setMerchContactPhone(e164Val)}
                      />
                      <div>
                        <Input
                          compact
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 8 characters"
                          value={merchPassword}
                          onChange={(e) => setMerchPassword(e.target.value)}
                          error={errors.merchPassword}
                          leftIcon={<Lock size={14} />}
                        />
                        {renderPasswordStrength()}
                      </div>
                      <Input
                        compact
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={merchConfirmPassword}
                        onChange={(e) => setMerchConfirmPassword(e.target.value)}
                        error={errors.merchConfirm}
                        leftIcon={<Lock size={14} />}
                      />
                    </div>

                    <Button type="submit" variant="gold" size="md" fullWidth disabled={isSubmitting} style={{ marginTop: '14px' }}>
                      {isSubmitting
                        ? isOrgType
                          ? 'Registering Organization...'
                          : 'Submitting Application...'
                        : isOrgType
                        ? 'Register Organization'
                        : 'Register as Merchant'}
                    </Button>
                  </>
                )}

                {/* ------------------------------------------------------------- */}
                {/* OPTION 3: SERVICE PROVIDER FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'provider' && (
                  <>
                    {renderSectionHeader('Provider Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label="Provider / Organization Name"
                        placeholder="e.g. St. Michael Hospital"
                        value={provName}
                        onChange={(e) => setProvName(e.target.value)}
                        error={errors.provName}
                        leftIcon={<Building2 size={14} />}
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Provider Type ▾</label>
                        <select style={compactSelectStyle} value={provType} onChange={(e) => setProvType(e.target.value)}>
                          <option value="Hospital">Hospital</option>
                          <option value="Clinic">Specialty Clinic</option>
                          <option value="Pharmacy">Pharmacy</option>
                          <option value="Laboratory">Laboratory & Diagnostics</option>
                          <option value="Wellness Center">Wellness Retreat</option>
                          <option value="Ambulance Service">Ambulance Service</option>
                          <option value="Home Care">At-Home Care</option>
                          <option value="Diagnostic Center">Diagnostic Center</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Service Category ▾</label>
                        <select style={compactSelectStyle} value={provCategory} onChange={(e) => setProvCategory(e.target.value)}>
                          <option value="Outpatient & Inpatient Care">Inpatient / Outpatient</option>
                          <option value="Emergency & Critical Care">Emergency Care</option>
                          <option value="Diagnostic Scans & Pathology">Diagnostics & Labs</option>
                          <option value="Therapeutic Wellness">Therapeutic Wellness</option>
                        </select>
                      </div>
                      <PhoneInput
                        label="Official Phone"
                        value={provPhone}
                        onChange={(e164Val) => setProvPhone(e164Val)}
                        error={errors.provPhone}
                        required
                      />
                      <Input
                        compact
                        label="Official Email"
                        type="email"
                        placeholder="info@facility.com"
                        value={provEmail}
                        onChange={(e) => setProvEmail(e.target.value)}
                        error={errors.provEmail}
                        leftIcon={<Mail size={14} />}
                      />
                      <Input
                        compact
                        label="Website (Optional)"
                        placeholder="https://www.hospital.org"
                        value={provWebsite}
                        onChange={(e) => setProvWebsite(e.target.value)}
                        leftIcon={<Globe size={14} />}
                      />
                      <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Provider Description</label>
                        <textarea
                          rows={2}
                          style={{ ...compactSelectStyle, resize: 'vertical' }}
                          placeholder="Summary of specialties and credentials..."
                          value={provDesc}
                          onChange={(e) => setProvDesc(e.target.value)}
                        />
                      </div>
                    </div>

                    {renderSectionHeader('Location')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label="City / Region"
                        placeholder="Addis Ababa"
                        value={provCity}
                        onChange={(e) => setProvCity(e.target.value)}
                      />
                      <Input
                        compact
                        label="Branch / Location Code"
                        placeholder="Main Campus"
                        value={provServiceLocation}
                        onChange={(e) => setProvServiceLocation(e.target.value)}
                      />
                      <Input
                        compact
                        label="Facility Address"
                        placeholder="Africa Avenue, Kirkos"
                        value={provAddress}
                        onChange={(e) => setProvAddress(e.target.value)}
                        leftIcon={<MapPin size={14} />}
                      />
                    </div>

                    {renderSectionHeader('Services & Hours')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label="Services Offered"
                        placeholder="e.g. Cardiology, MRI, ICU"
                        value={provServicesOffered}
                        onChange={(e) => setProvServicesOffered(e.target.value)}
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Operating Hours</label>
                        <select style={compactSelectStyle} value={provOperatingHours} onChange={(e) => setProvOperatingHours(e.target.value)}>
                          <option value="24/7 Operations">24/7 Operations</option>
                          <option value="Mon-Sat 8:00 AM - 8:00 PM">Mon-Sat 8AM - 8PM</option>
                          <option value="Daily 9:00 AM - 6:00 PM">Daily 9AM - 6PM</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Availability</label>
                        <select style={compactSelectStyle} value={provAvailability} onChange={(e) => setProvAvailability(e.target.value)}>
                          <option value="Immediate & Scheduled">Immediate & Scheduled</option>
                          <option value="By Appointment Only">By Appointment</option>
                          <option value="Walk-in Accepted">Walk-in Accepted</option>
                        </select>
                      </div>
                    </div>

                    {renderSectionHeader(
                      'Accreditation Documents (Optional at sign-up)',
                      'You can upload health facility licenses now or later in your KYC Documents tab.'
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {[
                        { key: 'license', docType: 'kyc_license', label: 'Accreditation / Operating License' },
                        { key: 'boardCert', docType: 'kyc_accreditation', label: 'Medical Board Certification' },
                      ].map((doc) => (
                        <RegistrationFileUpload
                          key={doc.key}
                          docType={doc.docType}
                          label={doc.label}
                          apiBase={API_BASE}
                          onTokenReceived={(tokenData) => {
                            setStagedDocs((prev) => ({ ...prev, [doc.key]: tokenData }));
                          }}
                        />
                      ))}
                    </div>

                    {renderSectionHeader('Account Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <Input
                        compact
                        label="Contact Person"
                        placeholder="Medical Director or Operations Manager"
                        value={provContactPerson}
                        onChange={(e) => setProvContactPerson(e.target.value)}
                        error={errors.provContactPerson}
                      />
                      <Input
                        compact
                        label="Account Email"
                        type="email"
                        placeholder="rep@hospital.org"
                        value={provContactEmail}
                        onChange={(e) => setProvContactEmail(e.target.value)}
                        leftIcon={<Mail size={14} />}
                      />
                      <PhoneInput
                        label="Account Phone"
                        value={provContactPhone}
                        onChange={(e164Val) => setProvContactPhone(e164Val)}
                      />
                      <div>
                        <Input
                          compact
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 8 characters"
                          value={provPassword}
                          onChange={(e) => setProvPassword(e.target.value)}
                          error={errors.provPassword}
                          leftIcon={<Lock size={14} />}
                        />
                        {renderPasswordStrength()}
                      </div>
                      <Input
                        compact
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={provConfirmPassword}
                        onChange={(e) => setProvConfirmPassword(e.target.value)}
                        error={errors.provConfirm}
                        leftIcon={<Lock size={14} />}
                      />
                    </div>

                    <Button type="submit" variant="gold" size="md" fullWidth disabled={isSubmitting} style={{ marginTop: '14px' }}>
                      {isSubmitting ? 'Registering Provider...' : 'Register as Service Provider'}
                    </Button>
                  </>
                )}
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Already registered?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  style={{ color: 'var(--color-gold-deep)', fontWeight: 700 }}
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUBMITTED SUCCESS STATE */}
          {/* ========================================================================= */}
          {submittedSuccess && (
            <Card
              style={{
                textAlign: 'center',
                padding: '48px 32px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-light)',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
                maxWidth: '520px',
                margin: '20px auto',
              }}
            >
              {/* Checkmark icon (✓) */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.65rem',
                  color: 'var(--color-navy-dark)',
                  fontWeight: 800,
                  marginBottom: '14px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                Registration Successful
              </h3>

              {/* Message */}
              <div
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                  marginBottom: '32px',
                }}
              >
                <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--color-navy-dark)' }}>
                  Check your email.
                </p>
                <p style={{ margin: 0 }}>
                  We've sent a verification link to your email address. Please check your inbox to activate your account.
                </p>
              </div>

              {/* Primary Action Button: Sign In → */}
              <div style={{ marginBottom: '20px' }}>
                <Button
                  variant="gold"
                  size="lg"
                  onClick={() => onNavigate('login')}
                  style={{
                    minWidth: '220px',
                    padding: '12px 36px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(190, 155, 73, 0.35)',
                  }}
                >
                  Sign In →
                </Button>
              </div>

              {/* Secondary Link: Return to Home */}
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '6px 12px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy-dark)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  Return to Home
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
