import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import {
  User,
  Mail,
  Phone,
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
  Upload,
  Stethoscope,
  Building,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

type RegistrationRole = 'customer' | 'merchant' | 'provider' | 'organization';

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

  // Merchant State
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
  const [merchDocsUploaded, setMerchDocsUploaded] = useState<Record<string, boolean>>({
    regCert: false,
    tradeLicense: false,
    tinDoc: false,
  });

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
  const [provDocsUploaded, setProvDocsUploaded] = useState<Record<string, boolean>>({
    license: false,
    boardCert: false,
  });

  // Business / Organization State
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('Corporation / Enterprise');
  const [orgIndustry, setOrgIndustry] = useState('Healthcare & Life Sciences');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgCountry, setOrgCountry] = useState('Ethiopia');
  const [orgCity, setOrgCity] = useState('Addis Ababa');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgRepName, setOrgRepName] = useState('');
  const [orgRepRole, setOrgRepRole] = useState('');
  const [orgRepEmail, setOrgRepEmail] = useState('');
  const [orgRepPhone, setOrgRepPhone] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [orgConfirmPassword, setOrgConfirmPassword] = useState('');
  const [orgDocsUploaded, setOrgDocsUploaded] = useState<Record<string, boolean>>({
    registration: false,
    operatingLicense: false,
  });

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
    if (role === 'provider') return provPassword;
    return orgPassword;
  };

  const currentStrength = getPasswordStrength(getActivePassword());

  const roleOptions: { key: RegistrationRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'customer',
      title: 'Customer',
      desc: 'Discover, book appointments, purchase gift cards, and manage health services.',
      icon: <User size={18} color="var(--color-gold-bright)" />,
    },
    {
      key: 'merchant',
      title: 'Merchant',
      desc: 'Sell pharmaceutical goods, medical equipment, and wellness products online.',
      icon: <Briefcase size={18} color="var(--color-gold-bright)" />,
    },
    {
      key: 'provider',
      title: 'Service Provider',
      desc: 'Accredited hospitals, clinics, diagnostic labs, specialists, and wellness retreats.',
      icon: <Stethoscope size={18} color="var(--color-gold-bright)" />,
    },
    {
      key: 'organization',
      title: 'Business / Organization',
      desc: 'Corporations, embassies, NGOs, and institutions managing enterprise healthcare benefits.',
      icon: <Building size={18} color="var(--color-gold-bright)" />,
    },
  ];

  const currentRoleConfig = roleOptions.find((r) => r.key === role) || roleOptions[0];

  const validateAndSubmit = (e: React.FormEvent) => {
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
      if (!merchName.trim()) newErrors.merchName = 'Business name is required';
      if (!merchPhone.trim()) newErrors.merchPhone = 'Phone is required';
      if (!merchEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchEmail)) {
        newErrors.merchEmail = 'Valid email is required';
      }
      if (!merchContactPerson.trim()) newErrors.merchContactPerson = 'Contact person is required';
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
    } else if (role === 'organization') {
      if (!orgName.trim()) newErrors.orgName = 'Organization name is required';
      if (!orgEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgEmail)) {
        newErrors.orgEmail = 'Valid email is required';
      }
      if (!orgRepName.trim()) newErrors.orgRepName = 'Representative is required';
      if (orgPassword.length < 8) newErrors.orgPassword = 'Min 8 chars required';
      if (orgPassword !== orgConfirmPassword) newErrors.orgConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
      }, 1000);
    }
  };

  // Compact select dropdown style helper
  const compactSelectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'rgba(8, 23, 56, 0.85)',
    border: '1px solid var(--color-border-dark)',
    borderRadius: '7px',
    color: 'var(--color-text-light)',
    fontSize: '0.86rem',
    outline: 'none',
  };

  // Compact Section title divider helper
  const renderSectionHeader = (title: string, subtitle?: string) => (
    <div style={{ margin: '14px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '4px' }}>
      <h4 style={{ fontSize: '0.92rem', color: 'var(--color-gold-bright)', fontWeight: 700 }}>{title}</h4>
      {subtitle && <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted-dark)' }}>{subtitle}</p>}
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
                backgroundColor: idx < currentStrength ? colors[currentStrength - 1] : 'rgba(255,255,255,0.1)',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '0.72rem', color: colors[currentStrength - 1] || 'var(--color-text-muted-dark)' }}>
          Password strength: {labels[currentStrength - 1] || 'Weak'}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-navy)',
        display: 'flex',
        alignItems: 'stretch',
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
            alt="ODS Global Net"
            style={{ height: '54px', marginBottom: '36px' }}
          />

          <h2 style={{ fontSize: '2.2rem', color: '#ffffff', marginBottom: '16px', lineHeight: 1.25 }}>
            Join the Premier <span className="gold-gradient-text">Connected Ecosystem</span>
          </h2>
          <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem', lineHeight: 1.5, maxWidth: '360px' }}>
            Empower your healthcare, commerce, or organization with verified digital credentialing and online appointments.
          </p>
        </div>

        {/* Feature badges */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '14px', margin: '32px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>End-to-End Encryption</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Strict credential verification & privacy</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(190, 155, 73, 0.15)', color: 'var(--color-gold-bright)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>Accelerated Onboarding</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Rapid account activation & portal routing</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>
          © {new Date().getFullYear()} ODS Global Net. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC REGISTRATION FORM */}
      <div
        style={{
          flex: '1 1 55%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '660px' }}>
          {/* ========================================================================= */}
          {/* STEP 1: COMPACT SELECT REGISTRATION TYPE SCREEN */}
          {/* ========================================================================= */}
          {currentStep === 'select' && !submittedSuccess && (
            <div
              style={{
                backgroundColor: 'rgba(8, 23, 56, 0.95)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '14px',
                padding: '30px 24px',
                boxShadow: 'var(--shadow-card-dark)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.75rem', color: '#ffffff', marginBottom: '6px' }}>
                  Create Your ODS Account
                </h2>
                <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem' }}>
                  Select how you want to use ODS Global Net.
                </p>
              </div>

              {/* Role Dropdown */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gold-bright)', marginBottom: '8px' }}>
                  Registering as ▾
                </label>
                <select
                  style={{ ...compactSelectStyle, padding: '10px 12px', fontSize: '0.92rem', fontWeight: 500 }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as RegistrationRole)}
                >
                  <option value="customer">Customer (Discover & Book Services)</option>
                  <option value="merchant">Merchant (Products, Supplies & Retail)</option>
                  <option value="provider">Service Provider (Hospitals, Clinics & Specialists)</option>
                  <option value="organization">Business / Organization (Enterprise & Institutions)</option>
                </select>

                {/* Role Description Preview Card */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(190, 155, 73, 0.08)',
                    border: '1px solid rgba(190, 155, 73, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(190, 155, 73, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {currentRoleConfig.icon}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{currentRoleConfig.title}</h5>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted-dark)' }}>{currentRoleConfig.desc}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Button size="md" variant="gold" fullWidth onClick={() => setCurrentStep('form')}>
                  Continue Registration <ArrowRight size={16} />
                </Button>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted-dark)' }}>
                  Already have an account?{' '}
                  <button
                    onClick={() => onNavigate('login')}
                    style={{ color: 'var(--color-gold-bright)', fontWeight: 600 }}
                  >
                    Login
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
                backgroundColor: 'rgba(8, 23, 56, 0.95)',
                border: '1px solid var(--color-border-dark)',
                borderRadius: '14px',
                padding: '24px',
                boxShadow: 'var(--shadow-card-dark)',
              }}
            >
              {/* Top Quick Role Selector Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(15, 40, 91, 0.6)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-dark)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted-dark)' }}>Role:</span>
                  <select
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--color-gold-bright)',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                    value={role}
                    onChange={(e) => setRole(e.target.value as RegistrationRole)}
                  >
                    <option value="customer" style={{ background: '#081738', color: '#fff' }}>Customer</option>
                    <option value="merchant" style={{ background: '#081738', color: '#fff' }}>Merchant</option>
                    <option value="provider" style={{ background: '#081738', color: '#fff' }}>Service Provider</option>
                    <option value="organization" style={{ background: '#081738', color: '#fff' }}>Organization</option>
                  </select>
                </div>

                <button
                  onClick={() => setCurrentStep('select')}
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--color-gold-mid)',
                    fontWeight: 600,
                  }}
                >
                  Overview ▾
                </button>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.4rem', color: '#ffffff', marginBottom: '4px' }}>
                  {role === 'customer' && 'Customer Registration'}
                  {role === 'merchant' && 'Merchant Registration'}
                  {role === 'provider' && 'Service Provider Registration'}
                  {role === 'organization' && 'Organization Registration'}
                </h3>
                <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.82rem' }}>
                  Enter your details below to activate your account.
                </p>
              </div>

              <form onSubmit={validateAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* ------------------------------------------------------------- */}
                {/* OPTION 1: CUSTOMER FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'customer' && (
                  <>
                    {renderSectionHeader('Personal Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                      <Input
                        compact
                        label="Phone Number"
                        type="tel"
                        placeholder="+251-91..."
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        error={errors.custPhone}
                        leftIcon={<Phone size={14} />}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={custEmailVerify}
                          onChange={(e) => setCustEmailVerify(e.target.checked)}
                          style={{ accentColor: 'var(--color-gold-mid)' }}
                        />
                        Send email verification link
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={custPhoneVerify}
                          onChange={(e) => setCustPhoneVerify(e.target.checked)}
                          style={{ accentColor: 'var(--color-gold-mid)' }}
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
                {/* OPTION 2: MERCHANT FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'merchant' && (
                  <>
                    {renderSectionHeader('Business Information')}
                    <Input
                      compact
                      label="Business / Merchant Name"
                      placeholder="e.g. Apex Health Supplies Ltd."
                      value={merchName}
                      onChange={(e) => setMerchName(e.target.value)}
                      error={errors.merchName}
                      leftIcon={<Briefcase size={14} />}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Business Type ▾</label>
                        <select style={compactSelectStyle} value={merchType} onChange={(e) => setMerchType(e.target.value)}>
                          <option value="Retailer">Retailer / Storefront</option>
                          <option value="Wholesaler">Wholesaler / Distributor</option>
                          <option value="Medical Supply">Medical Supply</option>
                          <option value="Wellness eCommerce">Wellness eCommerce</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Category ▾</label>
                        <select style={compactSelectStyle} value={merchCategory} onChange={(e) => setMerchCategory(e.target.value)}>
                          <option value="Health & Medical Supplies">Health & Medical Supplies</option>
                          <option value="Pharmaceuticals">Pharmaceuticals</option>
                          <option value="Diagnostic Equipment">Diagnostic Equipment</option>
                          <option value="Wellness & Nutrition">Wellness & Nutrition</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Description</label>
                      <textarea
                        rows={2}
                        style={{ ...compactSelectStyle, resize: 'vertical' }}
                        placeholder="Overview of products and operations..."
                        value={merchDesc}
                        onChange={(e) => setMerchDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Business Phone"
                        type="tel"
                        placeholder="+251-11-..."
                        value={merchPhone}
                        onChange={(e) => setMerchPhone(e.target.value)}
                        error={errors.merchPhone}
                        leftIcon={<Phone size={14} />}
                      />
                      <Input
                        compact
                        label="Business Email"
                        type="email"
                        placeholder="orders@merchant.com"
                        value={merchEmail}
                        onChange={(e) => setMerchEmail(e.target.value)}
                        error={errors.merchEmail}
                        leftIcon={<Mail size={14} />}
                      />
                    </div>

                    <Input
                      compact
                      label="Website (Optional)"
                      placeholder="https://www.merchant.com"
                      value={merchWebsite}
                      onChange={(e) => setMerchWebsite(e.target.value)}
                      leftIcon={<Globe size={14} />}
                    />

                    {renderSectionHeader('Business Location')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Country</label>
                        <select style={compactSelectStyle} value={merchCountry} onChange={(e) => setMerchCountry(e.target.value)}>
                          <option value="Ethiopia">Ethiopia</option>
                          <option value="Kenya">Kenya</option>
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    </div>

                    <Input
                      compact
                      label="Physical Address"
                      placeholder="Bole Sub-City, Worda 03"
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

                    {renderSectionHeader('Business Documents')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { key: 'regCert', label: 'Registration Certificate' },
                        { key: 'tradeLicense', label: 'Valid Trade License' },
                        { key: 'tinDoc', label: 'TIN Document' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => setMerchDocsUploaded((prev) => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                          style={{
                            border: '1px dashed var(--color-border-dark)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            backgroundColor: merchDocsUploaded[doc.key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(8, 23, 56, 0.5)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Upload size={14} color="var(--color-gold-bright)" />
                            <span style={{ fontSize: '0.82rem', color: '#ffffff' }}>{doc.label}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: merchDocsUploaded[doc.key] ? '#10b981' : 'var(--color-gold-mid)' }}>
                            {merchDocsUploaded[doc.key] ? '✓ Uploaded' : 'Upload'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {renderSectionHeader('Account Information')}
                    <Input
                      compact
                      label="Contact Person"
                      placeholder="Representative Full Name"
                      value={merchContactPerson}
                      onChange={(e) => setMerchContactPerson(e.target.value)}
                      error={errors.merchContactPerson}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Account Email"
                        type="email"
                        placeholder="rep@merchant.com"
                        value={merchContactEmail}
                        onChange={(e) => setMerchContactEmail(e.target.value)}
                        leftIcon={<Mail size={14} />}
                      />
                      <Input
                        compact
                        label="Account Phone"
                        type="tel"
                        placeholder="+251-911-..."
                        value={merchContactPhone}
                        onChange={(e) => setMerchContactPhone(e.target.value)}
                        leftIcon={<Phone size={14} />}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                      {isSubmitting ? 'Submitting Application...' : 'Register as Merchant'}
                    </Button>
                  </>
                )}

                {/* ------------------------------------------------------------- */}
                {/* OPTION 3: SERVICE PROVIDER FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'provider' && (
                  <>
                    {renderSectionHeader('Provider Information')}
                    <Input
                      compact
                      label="Provider / Organization Name"
                      placeholder="e.g. St. Michael Hospital"
                      value={provName}
                      onChange={(e) => setProvName(e.target.value)}
                      error={errors.provName}
                      leftIcon={<Building2 size={14} />}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Provider Description</label>
                      <textarea
                        rows={2}
                        style={{ ...compactSelectStyle, resize: 'vertical' }}
                        placeholder="Summary of specialties and credentials..."
                        value={provDesc}
                        onChange={(e) => setProvDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Official Phone"
                        type="tel"
                        placeholder="+251-11-..."
                        value={provPhone}
                        onChange={(e) => setProvPhone(e.target.value)}
                        error={errors.provPhone}
                        leftIcon={<Phone size={14} />}
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
                    </div>

                    <Input
                      compact
                      label="Website (Optional)"
                      placeholder="https://www.hospital.org"
                      value={provWebsite}
                      onChange={(e) => setProvWebsite(e.target.value)}
                      leftIcon={<Globe size={14} />}
                    />

                    {renderSectionHeader('Location')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                    </div>

                    <Input
                      compact
                      label="Facility Address"
                      placeholder="Africa Avenue, Kirkos"
                      value={provAddress}
                      onChange={(e) => setProvAddress(e.target.value)}
                      leftIcon={<MapPin size={14} />}
                    />

                    {renderSectionHeader('Services & Hours')}
                    <Input
                      compact
                      label="Services Offered"
                      placeholder="e.g. Cardiology, MRI, ICU"
                      value={provServicesOffered}
                      onChange={(e) => setProvServicesOffered(e.target.value)}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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

                    {renderSectionHeader('Documents')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { key: 'license', label: 'Accreditation / Operating License' },
                        { key: 'boardCert', label: 'Medical Board Certification' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => setProvDocsUploaded((prev) => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                          style={{
                            border: '1px dashed var(--color-border-dark)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            backgroundColor: provDocsUploaded[doc.key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(8, 23, 56, 0.5)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Upload size={14} color="var(--color-gold-bright)" />
                            <span style={{ fontSize: '0.82rem', color: '#ffffff' }}>{doc.label}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: provDocsUploaded[doc.key] ? '#10b981' : 'var(--color-gold-mid)' }}>
                            {provDocsUploaded[doc.key] ? '✓ Uploaded' : 'Upload'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {renderSectionHeader('Account Information')}
                    <Input
                      compact
                      label="Contact Person"
                      placeholder="Medical Director or Operations Manager"
                      value={provContactPerson}
                      onChange={(e) => setProvContactPerson(e.target.value)}
                      error={errors.provContactPerson}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Account Email"
                        type="email"
                        placeholder="rep@hospital.org"
                        value={provContactEmail}
                        onChange={(e) => setProvContactEmail(e.target.value)}
                        leftIcon={<Mail size={14} />}
                      />
                      <Input
                        compact
                        label="Account Phone"
                        type="tel"
                        placeholder="+251-911-..."
                        value={provContactPhone}
                        onChange={(e) => setProvContactPhone(e.target.value)}
                        leftIcon={<Phone size={14} />}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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

                {/* ------------------------------------------------------------- */}
                {/* OPTION 4: BUSINESS / ORGANIZATION FORM */}
                {/* ------------------------------------------------------------- */}
                {role === 'organization' && (
                  <>
                    {renderSectionHeader('Organization Information')}
                    <Input
                      compact
                      label="Organization Name"
                      placeholder="e.g. African Union Mission / Global Bank"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      error={errors.orgName}
                      leftIcon={<Building size={14} />}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Organization Type ▾</label>
                        <select style={compactSelectStyle} value={orgType} onChange={(e) => setOrgType(e.target.value)}>
                          <option value="Corporation / Enterprise">Corporation / Enterprise</option>
                          <option value="Embassy / Diplomatic Mission">Embassy / Diplomatic</option>
                          <option value="NGO / Non-Profit">NGO / Non-Profit</option>
                          <option value="Government Agency">Government Agency</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Industry ▾</label>
                        <select style={compactSelectStyle} value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)}>
                          <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                          <option value="Diplomatic & International">Diplomatic & International</option>
                          <option value="Banking & Financial">Banking & Financial</option>
                          <option value="Corporate Health Benefits">Corporate Health Benefits</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>Description</label>
                      <textarea
                        rows={2}
                        style={{ ...compactSelectStyle, resize: 'vertical' }}
                        placeholder="Institutional mission or employee health scope..."
                        value={orgDesc}
                        onChange={(e) => setOrgDesc(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Official Phone"
                        type="tel"
                        placeholder="+251-11-..."
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        leftIcon={<Phone size={14} />}
                      />
                      <Input
                        compact
                        label="Official Email"
                        type="email"
                        placeholder="admin@enterprise.org"
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                        error={errors.orgEmail}
                        leftIcon={<Mail size={14} />}
                      />
                    </div>

                    <Input
                      compact
                      label="Website (Optional)"
                      placeholder="https://www.organization.org"
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      leftIcon={<Globe size={14} />}
                    />

                    {renderSectionHeader('Location')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px' }}>Country</label>
                        <select style={compactSelectStyle} value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)}>
                          <option value="Ethiopia">Ethiopia</option>
                          <option value="International">International</option>
                        </select>
                      </div>
                      <Input
                        compact
                        label="City"
                        placeholder="Addis Ababa"
                        value={orgCity}
                        onChange={(e) => setOrgCity(e.target.value)}
                      />
                    </div>

                    <Input
                      compact
                      label="Headquarters Address"
                      placeholder="HQ Tower / Campus"
                      value={orgAddress}
                      onChange={(e) => setOrgAddress(e.target.value)}
                      leftIcon={<MapPin size={14} />}
                    />

                    {renderSectionHeader('Representative Information')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Representative Name"
                        placeholder="e.g. Dr. Hanna Tesfaye"
                        value={orgRepName}
                        onChange={(e) => setOrgRepName(e.target.value)}
                        error={errors.orgRepName}
                      />
                      <Input
                        compact
                        label="Position / Role"
                        placeholder="Head of HR"
                        value={orgRepRole}
                        onChange={(e) => setOrgRepRole(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <Input
                        compact
                        label="Representative Email"
                        type="email"
                        placeholder="rep@enterprise.org"
                        value={orgRepEmail}
                        onChange={(e) => setOrgRepEmail(e.target.value)}
                        leftIcon={<Mail size={14} />}
                      />
                      <Input
                        compact
                        label="Representative Phone"
                        type="tel"
                        placeholder="+251-911-..."
                        value={orgRepPhone}
                        onChange={(e) => setOrgRepPhone(e.target.value)}
                        leftIcon={<Phone size={14} />}
                      />
                    </div>

                    {renderSectionHeader('Documents')}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        { key: 'registration', label: 'Institutional Charter / Legal Registration' },
                        { key: 'operatingLicense', label: 'Delegation / Operating License' },
                      ].map((doc) => (
                        <div
                          key={doc.key}
                          onClick={() => setOrgDocsUploaded((prev) => ({ ...prev, [doc.key]: !prev[doc.key] }))}
                          style={{
                            border: '1px dashed var(--color-border-dark)',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            backgroundColor: orgDocsUploaded[doc.key] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(8, 23, 56, 0.5)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Upload size={14} color="var(--color-gold-bright)" />
                            <span style={{ fontSize: '0.82rem', color: '#ffffff' }}>{doc.label}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: orgDocsUploaded[doc.key] ? '#10b981' : 'var(--color-gold-mid)' }}>
                            {orgDocsUploaded[doc.key] ? '✓ Uploaded' : 'Upload'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {renderSectionHeader('Account')}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <Input
                          compact
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 8 characters"
                          value={orgPassword}
                          onChange={(e) => setOrgPassword(e.target.value)}
                          error={errors.orgPassword}
                          leftIcon={<Lock size={14} />}
                        />
                        {renderPasswordStrength()}
                      </div>

                      <Input
                        compact
                        label="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={orgConfirmPassword}
                        onChange={(e) => setOrgConfirmPassword(e.target.value)}
                        error={errors.orgConfirm}
                        leftIcon={<Lock size={16} />}
                      />
                    </div>

                    <Button type="submit" variant="gold" size="md" fullWidth disabled={isSubmitting} style={{ marginTop: '14px' }}>
                      {isSubmitting ? 'Registering Organization...' : 'Register Organization'}
                    </Button>
                  </>
                )}
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.85rem', color: 'var(--color-text-muted-dark)' }}>
                Already registered?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  style={{ color: 'var(--color-gold-bright)', fontWeight: 600 }}
                >
                  Sign In to Your Portal
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUBMITTED SUCCESS STATE */}
          {/* ========================================================================= */}
          {submittedSuccess && (
            <Card style={{ textAlign: 'center', padding: '36px 24px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={30} />
              </div>

              <h3 style={{ fontSize: '1.5rem', color: '#ffffff', marginBottom: '6px' }}>
                Registration Submitted
              </h3>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(190, 155, 73, 0.15)',
                  border: '1px solid var(--color-gold-mid)',
                  margin: '6px auto 16px',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                  {currentRoleConfig.title} Account Created
                </span>
              </div>

              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '22px' }}>
                {role === 'customer'
                  ? 'Your customer account is active! You can now sign in to discover, book, manage, and pay for services.'
                  : 'Your application has been received and queued for KYC & regulatory verification. Our team reviews submissions within our verified SLA.'}
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <Button variant="gold" size="sm" onClick={() => onNavigate('login')}>
                  Proceed to Login
                </Button>
                <Button variant="outline-gold" size="sm" onClick={() => onNavigate('home')}>
                  Return to Home
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
