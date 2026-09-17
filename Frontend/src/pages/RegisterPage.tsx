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
  FileCheck,
  CheckCircle2,
  ArrowLeft,
  Clock,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: 'home' | 'login' | 'register') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'merchant'>('customer');

  // Customer state
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custConfirmPassword, setCustConfirmPassword] = useState('');
  const [custAgree, setCustAgree] = useState(false);

  // Merchant state
  const [orgName, setOrgName] = useState('');
  const [orgCategory, setOrgCategory] = useState('Hospital');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');
  const [merchantAgree, setMerchantAgree] = useState(false);

  // Visibility & Validation
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

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!custName.trim()) newErrors.custName = 'Full name is required';
    if (!custEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
      newErrors.custEmail = 'Valid email is required';
    }
    if (!custPhone.trim()) newErrors.custPhone = 'Mobile phone number is required';
    if (custPassword.length < 8) newErrors.custPassword = 'Password must be at least 8 characters';
    if (custPassword !== custConfirmPassword) newErrors.custConfirm = 'Passwords do not match';
    if (!custAgree) newErrors.custAgree = 'You must accept the terms of service';

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
      }, 1000);
    }
  };

  const handleMerchantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!orgName.trim()) newErrors.orgName = 'Organization / Practice name is required';
    if (!licenseNumber.trim()) newErrors.licenseNumber = 'Official license / registration number is required';
    if (!contactPerson.trim()) newErrors.contactPerson = 'Primary contact person is required';
    if (!merchantEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchantEmail)) {
      newErrors.merchantEmail = 'Valid official business email is required';
    }
    if (!merchantPhone.trim()) newErrors.merchantPhone = 'Official phone number is required';
    if (merchantPassword.length < 8) newErrors.merchantPassword = 'Password must be at least 8 characters';
    if (!merchantAgree) newErrors.merchantAgree = 'You must accept the Provider Compliance terms';

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
      }, 1200);
    }
  };

  const passwordScore = getPasswordStrength(activeTab === 'customer' ? custPassword : merchantPassword);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-navy)',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '620px' }}>
        {/* Navigation & Logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-gold-bright)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>

          <img
            src="/assets/brand/vector/ods-logo-gold-primary.svg"
            alt="ODS Global Network"
            style={{ height: '42px' }}
          />
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            backgroundColor: 'var(--color-navy-dark)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '28px',
            border: '1px solid var(--color-border-dark)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setErrors({}); setSubmittedSuccess(false); }}
            style={{
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === 'customer' ? 'var(--color-navy-dark)' : 'var(--color-text-muted-dark)',
              backgroundColor: activeTab === 'customer' ? 'var(--color-gold-bright)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--transition-fast)',
            }}
          >
            <User size={18} /> Individual / Customer
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('merchant'); setErrors({}); setSubmittedSuccess(false); }}
            style={{
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: activeTab === 'merchant' ? 'var(--color-navy-dark)' : 'var(--color-text-muted-dark)',
              backgroundColor: activeTab === 'merchant' ? 'var(--color-gold-bright)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Building2 size={18} /> Healthcare Provider / Merchant
          </button>
        </div>

        {/* Success confirmation */}
        {submittedSuccess ? (
          <Card style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '12px' }}>
              {activeTab === 'merchant' ? 'Provider Onboarding Submitted' : 'Welcome to ODS Global Network!'}
            </h2>
            <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
              {activeTab === 'merchant'
                ? 'Your healthcare provider registration has been submitted for automated credential verification. Per our platform KPIs, administration reviews occur within 5 minutes.'
                : 'Your individual account has been created. You can now browse verified healthcare providers, book priority appointments, and gift wellness vouchers.'}
            </p>
            <Button variant="gold" size="md" onClick={() => onNavigate('login')}>
              Proceed to Sign In
            </Button>
          </Card>
        ) : (
          <Card style={{ padding: '36px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.7rem', color: '#ffffff', marginBottom: '6px' }}>
                {activeTab === 'customer' ? 'Create Customer Account' : 'Register Service Provider'}
              </h2>
              <p style={{ color: 'var(--color-text-muted-dark)', fontSize: '0.9rem' }}>
                {activeTab === 'customer'
                  ? 'Access accredited clinics, specialized consultations, and digital health history.'
                  : 'Onboard your hospital, clinic, pharmacy, or diagnostic practice to the network.'}
              </p>
            </div>

            {/* SLA Notification for Merchants */}
            {activeTab === 'merchant' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(190, 155, 73, 0.12)',
                  border: '1px solid var(--color-gold-deep)',
                  marginBottom: '24px',
                }}
              >
                <Clock size={20} color="var(--color-gold-bright)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-gold-highlight)' }}>
                  KPI Mandate: Provider credential verification SLA is under 5 minutes from admin review.
                </span>
              </div>
            )}

            {activeTab === 'customer' ? (
              /* CUSTOMER FORM */
              <form onSubmit={handleCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Input
                  label="Full Legal Name"
                  placeholder="Abebe Kebede"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  error={errors.custName}
                  leftIcon={<User size={18} />}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Email Address"
                    placeholder="abebe@example.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    error={errors.custEmail}
                    leftIcon={<Mail size={18} />}
                  />

                  <Input
                    label="Mobile Phone Number"
                    placeholder="+251 91 234 5678"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    error={errors.custPhone}
                    leftIcon={<Phone size={18} />}
                  />
                </div>

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={custPassword}
                  onChange={(e) => setCustPassword(e.target.value)}
                  error={errors.custPassword}
                  leftIcon={<Lock size={18} />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ color: 'var(--color-text-muted-dark)', display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                {/* Password Strength Meter */}
                {custPassword && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          style={{
                            flex: 1,
                            borderRadius: '2px',
                            backgroundColor:
                              passwordScore >= step
                                ? passwordScore <= 2
                                  ? 'var(--color-warning)'
                                  : 'var(--color-success)'
                                : 'var(--color-border-dark)',
                            transition: 'background-color 0.3s ease',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-dark)' }}>
                      {passwordScore <= 1 ? 'Weak' : passwordScore <= 3 ? 'Medium' : 'Strong'} password
                    </span>
                  </div>
                )}

                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={custConfirmPassword}
                  onChange={(e) => setCustConfirmPassword(e.target.value)}
                  error={errors.custConfirm}
                  leftIcon={<Lock size={18} />}
                />

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={custAgree}
                    onChange={(e) => setCustAgree(e.target.checked)}
                    style={{ accentColor: 'var(--color-gold-mid)', marginTop: '3px' }}
                  />
                  <span>
                    I agree to the ODS Global Network <a href="#terms" style={{ color: 'var(--color-gold-bright)' }}>Terms of Service</a> and <a href="#privacy" style={{ color: 'var(--color-gold-bright)' }}>Privacy Policy</a>.
                  </span>
                </label>
                {errors.custAgree && <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{errors.custAgree}</span>}

                <Button type="submit" variant="gold" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Account...' : 'Complete Customer Registration'}
                </Button>
              </form>
            ) : (
              /* MERCHANT FORM */
              <form onSubmit={handleMerchantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <Input
                  label="Organization / Practice Name"
                  placeholder="e.g., St. Paul Specialized Medical Clinic"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  error={errors.orgName}
                  leftIcon={<Building2 size={18} />}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-light)' }}>
                    Provider Category
                  </label>
                  <select
                    value={orgCategory}
                    onChange={(e) => setOrgCategory(e.target.value)}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(8, 23, 56, 0.85)',
                      border: '1px solid var(--color-border-dark)',
                      borderRadius: '10px',
                      color: 'var(--color-text-light)',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Hospital">Hospital / Inpatient Center</option>
                    <option value="Clinic">Specialized Diagnostic Clinic</option>
                    <option value="Pharmacy">Accredited Pharmacy</option>
                    <option value="Laboratory">Pathology & Diagnostic Laboratory</option>
                    <option value="Wellness">Wellness Center & Spa</option>
                    <option value="Ambulance">24/7 Rapid Ambulance Service</option>
                    <option value="HomeCare">Licensed In-Home Nursing & Care</option>
                  </select>
                </div>

                <Input
                  label="Commercial / Medical License Number"
                  placeholder="e.g., MED-FDRE-2026-9912"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  error={errors.licenseNumber}
                  leftIcon={<FileCheck size={18} />}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Primary Contact Person"
                    placeholder="Dr. Meron Tadesse"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    error={errors.contactPerson}
                    leftIcon={<User size={18} />}
                  />

                  <Input
                    label="Official Business Email"
                    placeholder="contact@stpaulclinic.com"
                    value={merchantEmail}
                    onChange={(e) => setMerchantEmail(e.target.value)}
                    error={errors.merchantEmail}
                    leftIcon={<Mail size={18} />}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <Input
                    label="Business Phone Number"
                    placeholder="+251 11 654 3210"
                    value={merchantPhone}
                    onChange={(e) => setMerchantPhone(e.target.value)}
                    error={errors.merchantPhone}
                    leftIcon={<Phone size={18} />}
                  />

                  <Input
                    label="Account Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
                    error={errors.merchantPassword}
                    leftIcon={<Lock size={18} />}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted-dark)', cursor: 'pointer', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={merchantAgree}
                    onChange={(e) => setMerchantAgree(e.target.checked)}
                    style={{ accentColor: 'var(--color-gold-mid)', marginTop: '3px' }}
                  />
                  <span>
                    I certify that all medical credentials are valid and agree to the Provider Agreement and 5-minute administrative review.
                  </span>
                </label>
                {errors.merchantAgree && <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>{errors.merchantAgree}</span>}

                <Button type="submit" variant="gold" size="lg" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting Application...' : 'Submit Provider Application'}
                </Button>
              </form>
            )}
          </Card>
        )}

        {/* Link to login */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--color-text-muted-dark)' }}>
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            style={{ color: 'var(--color-gold-bright)', fontWeight: 600 }}
          >
            Sign In Here
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
