import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../api/api";

type Role =
  | "individual"
  | "provider"
  | "corporate"
  | "diaspora"
  | "standard_agent"
  | "elite_agent";

const roleHeadingMap: Record<Role, string> = {
  individual: "Create Your Account",
  provider: "Register as Service Provider",
  corporate: "Register as Corporate",
  diaspora: "Register as Diaspora Member",
  standard_agent: "Register as Standard Agent",
  elite_agent: "Register as Elite / Super Agent",
};

const roleActionMap: Record<Role, string> = {
  individual: "Create My Account",
  provider: "Register as Service Provider",
  corporate: "Register as Corporate",
  diaspora: "Register as Diaspora Member",
  standard_agent: "Create Standard Agent Account",
  elite_agent: "Create Elite Agent Account",
};

// btn-shine shimmer class is now defined globally in index.css (5-stop ODS gold gradient rule)

const inputCls =
  "w-full px-4 py-2.5 rounded-lg text-sm text-gray-800 placeholder-gray-400 outline-none transition-all duration-200 bg-white";
const inputStyle: React.CSSProperties = { border: "1.5px solid #E8E8E8" };

const onFocusFn = (
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  e.currentTarget.style.borderColor = "#EDC45B";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(237, 196, 91, 0.18)";
};

const onBlurFn = (
  e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  e.currentTarget.style.borderColor = "#E8E8E8";
  e.currentTarget.style.boxShadow = "none";
};

// Field labels: Left-aligned, ~6-8px (mb-2) gap below label before input box
const labelCls = "block text-sm font-semibold mb-2 text-left";
const labelStyle: React.CSSProperties = { color: "#0F285B" };

const fileCls =
  "w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-[#0F285B] file:text-xs file:font-semibold file:text-[#0F285B] file:bg-white hover:file:border-[#BE9B49] hover:file:text-[#BE9B49] hover:file:bg-[#FAF8F5] file:cursor-pointer file:transition-colors outline-none cursor-pointer";
const fileStyle: React.CSSProperties = {
  border: "1.5px solid #E8E8E8",
  borderRadius: "0.5rem",
  padding: "6px 8px",
  backgroundColor: "#F9FAFB",
};

const RegisterForm = () => {
  const [role, setRole] = useState<Role>("individual");
  const [leadership, setLeadership] = useState<string>("");
  const [ownership, setOwnership] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    password: "",
    confirmPassword: "",
    country: "Ethiopia",
    insuranceProfile: "",
    idFile: null as File | null,
  });

  const [providerForm, setProviderForm] = useState({
    companyName: "",
    serviceType: "",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    city: "",
    location: "",
    tin: "",
    country: "Ethiopia",
    branches: [{ city: "", location: "" }],
    banks: [{ bankName: "", accountNumber: "" }],
    password: "",
    confirmPassword: "",
    license: null as File | null,
    tradeRegistration: null as File | null,
    servicePhotos: [] as File[],
    video: null as File | null,
    priceList: null as File | null,
  });

  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
  };

  const handleUserChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files[0]) {
      const fieldName = name === "id" ? "idFile" : name;
      setUserForm((prev) => ({ ...prev, [fieldName]: files[0] }));
    } else {
      setUserForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const businessStatus = [leadership, ownership].filter(Boolean);

  const handleProviderChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files.length > 0) {
      if (name === "servicePhotos") {
        setProviderForm((prev) => ({ ...prev, servicePhotos: Array.from(files) }));
      } else {
        setProviderForm((prev) => ({ ...prev, [name]: files[0] }));
      }
    } else {
      setProviderForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBranchChange = (index: number, field: "city" | "location", value: string) => {
    const b = [...providerForm.branches];
    b[index][field] = value;
    setProviderForm((prev) => ({ ...prev, branches: b }));
  };

  const addBranch = () =>
    setProviderForm((prev) => ({
      ...prev,
      branches: [...prev.branches, { city: "", location: "" }],
    }));

  const removeBranch = (index: number) =>
    setProviderForm((prev) => ({
      ...prev,
      branches: prev.branches.filter((_, i) => i !== index),
    }));

  const handleBankChange = (
    index: number,
    field: "bankName" | "accountNumber",
    value: string
  ) => {
    const b = [...providerForm.banks];
    b[index][field] = value;
    setProviderForm((prev) => ({ ...prev, banks: b }));
  };

  const addBank = () =>
    setProviderForm((prev) => ({
      ...prev,
      banks: [...prev.banks, { bankName: "", accountNumber: "" }],
    }));

  const removeBank = (index: number) =>
    setProviderForm((prev) => ({
      ...prev,
      banks: prev.banks.filter((_, i) => i !== index),
    }));

  const [membership, setMembership] = useState<string>("Standard Member");

  useEffect(() => {
    if (role === "provider") {
      setMembership("Basic Provider");
    } else if (["individual", "diaspora", "corporate"].includes(role)) {
      setMembership("Standard Member");
    } else if (role === "standard_agent") {
      setMembership("Standard Agent");
    } else if (role === "elite_agent") {
      setMembership("Elite Agent");
    }
  }, [role]);

  const handleMembershipChange = (e: ChangeEvent<HTMLSelectElement>) =>
    setMembership(e.target.value);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consent) {
      alert("You must agree to the data processing terms.");
      return;
    }

    setLoading(true);

    if (["individual", "diaspora", "standard_agent", "elite_agent"].includes(role)) {
      if (userForm.password !== userForm.confirmPassword) {
        alert("Passwords do not match");
        setLoading(false);
        return;
      }
      const fd = new FormData();
      fd.append("fullName", `${userForm.firstName} ${userForm.lastName}`.trim());
      fd.append("email", userForm.email);
      fd.append("phone", userForm.phone);
      fd.append("password", userForm.password);
      fd.append("role", role);
      fd.append("whatsapp", userForm.whatsapp);
      fd.append("telegram", userForm.telegram);
      fd.append("membership", membership);
      if (userForm.insuranceProfile) fd.append("insuranceProfile", userForm.insuranceProfile);
      if (userForm.idFile) fd.append("idFile", userForm.idFile);

      try {
        const res = await fetch(`${BASE_URL}/auth/register`, { method: "POST", body: fd });
        const d = await res.json();
        if (!res.ok) {
          alert(d.msg || "Registration failed");
          setLoading(false);
          return;
        }
        alert("Account created successfully!");
        navigate("/login");
      } catch (err) {
        console.error(err);
        alert("An error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Provider or Corporate
    if (!providerForm.companyName || !providerForm.serviceType) {
      alert("Company name and service type are required.");
      setLoading(false);
      return;
    }
    if (!providerForm.email || !providerForm.password) {
      alert("Email and password are required.");
      setLoading(false);
      return;
    }
    if (!providerForm.city || !providerForm.location) {
      alert("City and location are required.");
      setLoading(false);
      return;
    }
    if (providerForm.password !== providerForm.confirmPassword) {
      alert("Passwords do not match");
      setLoading(false);
      return;
    }

    const fp = new FormData();
    fp.append("fullName", providerForm.companyName.trim());
    fp.append("companyName", providerForm.companyName);
    fp.append("serviceType", providerForm.serviceType);
    fp.append("role", role);
    fp.append("email", providerForm.email);
    fp.append("phone", providerForm.phone);
    fp.append("whatsapp", providerForm.whatsapp);
    fp.append("telegram", providerForm.telegram);
    fp.append("city", providerForm.city);
    fp.append("location", providerForm.location);
    fp.append("password", providerForm.password);
    fp.append("tin", providerForm.tin);
    fp.append("branches", JSON.stringify(providerForm.branches));
    fp.append("banks", JSON.stringify(providerForm.banks));
    fp.append("businessStatus", JSON.stringify(businessStatus || []));
    fp.append("membership", membership);
    if (providerForm.license) fp.append("license", providerForm.license);
    if (providerForm.tradeRegistration) fp.append("tradeRegistration", providerForm.tradeRegistration);
    providerForm.servicePhotos.forEach((f) => fp.append("servicePhotos", f));
    if (providerForm.video) fp.append("video", providerForm.video);
    if (providerForm.priceList) fp.append("priceList", providerForm.priceList);
    if (userForm.idFile) fp.append("idFile", userForm.idFile);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, { method: "POST", body: fp });
      const d = await res.json();
      if (!res.ok) {
        alert(d.msg || "Provider registration failed");
        setLoading(false);
        return;
      }
      alert("Account created successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* ========================================================================= */}
      {/* 1️⃣ LEFT PANEL — REGISTRATION FORM                                        */}
      {/* ~40% width, white bg, independently scrollable, centered max-w ~480-520px  */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[40%] xl:w-[42%] bg-white flex flex-col justify-between px-6 sm:px-10 lg:px-12 py-10 lg:py-12 overflow-y-auto min-h-screen lg:h-screen">
        <div className="w-full max-w-[500px] mx-auto">
          {/* A. HEADER SECTION */}
          {/* Brand Logo Mark (80x80px): Centered horizontally, ~40-48px top margin from panel top */}
          <div className="flex justify-center pt-2 sm:pt-3 mb-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-105"
              style={{ backgroundColor: "#0F285B" }}
            >
              <img
                src="/brand/gold-logo-mark.svg"
                alt="ODS Global Net Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          {/* Page Heading: Centered horizontally, ~16px margin-top from logo */}
          <h1
            className="text-2xl sm:text-3xl font-bold text-center tracking-tight"
            style={{ color: "#0F285B" }}
          >
            {roleHeadingMap[role]}
          </h1>

          {/* Subheading: Centered horizontally, ~8px margin-top from heading, constrained to container */}
          <p className="text-center text-sm mt-2 mb-6 sm:mb-8 text-gray-500 max-w-sm mx-auto">
            Join the ODS Global Network for wellness, gifting, and services
          </p>

          {/* FORM: Wraps all account configuration and role fields with consistent ~20-24px vertical rhythm */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* B. ACCOUNT CONFIGURATION */}
            {/* "Registering as" label + dropdown */}
            <div>
              <label htmlFor="role" className={labelCls} style={labelStyle}>
                Registering as
              </label>
              <select
                id="role"
                className={inputCls}
                style={inputStyle}
                value={role}
                onChange={handleRoleChange}
                onFocus={onFocusFn}
                onBlur={onBlurFn}
              >
                <option value="individual">Individual User</option>
                <option value="provider">Service Provider</option>
                <option value="corporate">Corporate</option>
                <option value="diaspora">Ethiopian Diaspora</option>
                <option value="standard_agent">Standard Agent</option>
                <option value="elite_agent">Elite / Super Agent</option>
              </select>
            </div>

            {/* "Membership Level" label + dropdown/badge: Exactly consistent ~20-24px spacing */}
            <div>
              <label htmlFor="membership" className={labelCls} style={labelStyle}>
                Membership Level
              </label>
              {(role === "individual" || role === "diaspora" || role === "corporate") && (
                <select
                  id="membership"
                  name="membership"
                  value={membership}
                  onChange={handleMembershipChange}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={onFocusFn}
                  onBlur={onBlurFn}
                >
                  <option value="Standard Member">Standard Member</option>
                  <option value="Gold Member" disabled>
                    Gold Member (Coming Soon)
                  </option>
                  <option value="Platinum Member" disabled>
                    Platinum Member (Coming Soon)
                  </option>
                </select>
              )}
              {(role === "standard_agent" || role === "elite_agent") && (
                <p
                  className="text-sm py-2.5 px-3.5 rounded-lg"
                  style={{
                    border: "1.5px dashed #BE9B49",
                    backgroundColor: "#FAF8F5",
                    color: "#6B7280",
                  }}
                >
                  Agent tier:{" "}
                  <span className="font-semibold" style={{ color: "#0F285B" }}>
                    {role === "elite_agent" ? "Elite / Super Agent" : "Standard Agent"}
                  </span>
                  <span className="block text-xs mt-1 text-gray-500">
                    Dashboard access for certified professionals included.
                  </span>
                </p>
              )}
              {role === "provider" && (
                <select
                  id="membership"
                  name="membership"
                  value={membership}
                  onChange={handleMembershipChange}
                  className={inputCls}
                  style={inputStyle}
                  onFocus={onFocusFn}
                  onBlur={onBlurFn}
                >
                  <option value="Basic Provider">Basic Provider</option>
                  <option value="Premium Provider" disabled>
                    Premium Provider (Coming Soon)
                  </option>
                </select>
              )}
            </div>

            {/* C. ROLE-SPECIFIC FIELDS: Follows Membership Level with the exact same ~20-24px gap */}
            {/* ========================================================= */}
            {/* INDIVIDUAL / DIASPORA / AGENT FIELDS                      */}
            {/* ========================================================= */}
            {(role === "individual" ||
              role === "diaspora" ||
              role === "standard_agent" ||
              role === "elite_agent") && (
              <>
                {/* First Name / Last Name: 2-column grid, 50/50 split, ~16px gap */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        required
                        value={userForm.firstName}
                        onChange={handleUserChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        required
                        value={userForm.lastName}
                        onChange={handleUserChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                  </div>
                </div>

                {/* Email: Full-width, single column, ~20-24px vertical gap */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    value={userForm.email}
                    onChange={handleUserChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Phone Number: Full-width, single column, same vertical rhythm */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+251..."
                    required
                    value={userForm.phone}
                    onChange={handleUserChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* WhatsApp (Optional): Full-width, inline helper tag in #8D7338 */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    WhatsApp
                    <span
                      className="inline text-xs font-normal ml-1.5"
                      style={{ color: "#8D7338" }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    placeholder="+251 91 123 4567"
                    value={userForm.whatsapp}
                    onChange={handleUserChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Telegram (Optional): Full-width, same helper tag treatment */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Telegram
                    <span
                      className="inline text-xs font-normal ml-1.5"
                      style={{ color: "#8D7338" }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    placeholder="@username"
                    value={userForm.telegram}
                    onChange={handleUserChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Insurance Profile Link (Optional): Full-width URL input */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Insurance Profile Link (PDF/Image)
                    <span
                      className="inline text-xs font-normal ml-1.5"
                      style={{ color: "#8D7338" }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    name="insuranceProfile"
                    placeholder="https://example.com/insurance.pdf"
                    value={userForm.insuranceProfile}
                    onChange={handleUserChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Government ID / Licence / Yellow Card (Optional): Full-width file upload */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    {role === "diaspora"
                      ? "Yellow Card / Passport (PDF/Image)"
                      : "Government ID / Licence (PDF/Image)"}
                    <span
                      className="inline text-xs font-normal ml-1.5"
                      style={{ color: "#8D7338" }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="file"
                    name="idFile"
                    accept="application/pdf,image/*"
                    onChange={handleUserChange}
                    className={fileCls}
                    style={fileStyle}
                  />
                </div>

                {/* Password / Confirm Password: 2-column grid, 50/50 split, ~16px gap, ~24px margin-top */}
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        value={userForm.password}
                        onChange={handleUserChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        required
                        value={userForm.confirmPassword}
                        onChange={handleUserChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ========================================================= */}
            {/* SERVICE PROVIDER / CORPORATE FIELDS                       */}
            {/* ========================================================= */}
            {(role === "provider" || role === "corporate") && (
              <>
                {/* Company Name / Service Type: 2-column grid, 50/50 split */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      placeholder="ODS Health Partners Ltd."
                      required
                      value={providerForm.companyName}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    />
                  </div>

                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Service Type
                    </label>
                    <select
                      name="serviceType"
                      required
                      value={providerForm.serviceType}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    >
                      <option value="" disabled>
                        Select Service Type
                      </option>
                      <option value="Wellness Services">Wellness Services</option>
                      <option value="Medical">Medical Services</option>
                      <option value="Home Based/Mobile services">
                        Home Based/Mobile services
                      </option>
                      <option value="Hotel Rooms">Hotel Rooms</option>
                    </select>
                  </div>
                </div>

                {/* Leadership / Ownership dropdowns: 2-column grid, 50/50 split */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Business Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-gray-600">
                        Leadership
                      </label>
                      <select
                        value={leadership}
                        onChange={(e) => setLeadership(e.target.value)}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      >
                        <option value="">Select...</option>
                        <option value="Women Led">Women Led</option>
                        <option value="Non Women Led">Non Women Led</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5 text-gray-600">
                        Ownership
                      </label>
                      <select
                        value={ownership}
                        onChange={(e) => setOwnership(e.target.value)}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      >
                        <option value="">Select...</option>
                        <option value="Women Owned">Women Owned</option>
                        <option value="Non Women Owned">Non Women Owned</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Corporate Email: Full-width */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="partner@company.com"
                    required
                    value={providerForm.email}
                    onChange={handleProviderChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Corporate Phone / WhatsApp (Optional): 2-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Corporate Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+251..."
                      required
                      value={providerForm.phone}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      WhatsApp
                      <span
                        className="inline text-xs font-normal ml-1.5"
                        style={{ color: "#8D7338" }}
                      >
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      placeholder="+251 91 123 4567"
                      value={providerForm.whatsapp}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    />
                  </div>
                </div>

                {/* Telegram (Optional): Full-width */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Telegram
                    <span
                      className="inline text-xs font-normal ml-1.5"
                      style={{ color: "#8D7338" }}
                    >
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="telegram"
                    placeholder="@handle"
                    value={providerForm.telegram}
                    onChange={handleProviderChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* City / Physical Location / Address: 2-column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      placeholder="Addis Ababa"
                      required
                      value={providerForm.city}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Physical Location / Address
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Bole Subcity, House 123"
                      required
                      value={providerForm.location}
                      onChange={handleProviderChange}
                      className={inputCls}
                      style={inputStyle}
                      onFocus={onFocusFn}
                      onBlur={onBlurFn}
                    />
                  </div>
                </div>

                {/* TIN Number: Full-width */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    type="text"
                    name="tin"
                    placeholder="TIN Number"
                    required
                    value={providerForm.tin}
                    onChange={handleProviderChange}
                    className={inputCls}
                    style={inputStyle}
                    onFocus={onFocusFn}
                    onBlur={onBlurFn}
                  />
                </div>

                {/* Password / Confirm Password: 2-column grid, 50/50 split, ~24px margin-top */}
                <div className="pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        value={providerForm.password}
                        onChange={handleProviderChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                    <div>
                      <label className={labelCls} style={labelStyle}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        required
                        value={providerForm.confirmPassword}
                        onChange={handleProviderChange}
                        className={inputCls}
                        style={inputStyle}
                        onFocus={onFocusFn}
                        onBlur={onBlurFn}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Branch Manager */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Branches
                  </label>
                  <div className="space-y-3">
                    {providerForm.branches.map((branch, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                          <input
                            type="text"
                            placeholder="City"
                            value={branch.city}
                            onChange={(e) =>
                              handleBranchChange(idx, "city", e.target.value)
                            }
                            className={inputCls}
                            style={inputStyle}
                            onFocus={onFocusFn}
                            onBlur={onBlurFn}
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={branch.location}
                            onChange={(e) =>
                              handleBranchChange(idx, "location", e.target.value)
                            }
                            className={inputCls}
                            style={inputStyle}
                            onFocus={onFocusFn}
                            onBlur={onBlurFn}
                          />
                        </div>
                        {providerForm.branches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBranch(idx)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 transition-colors self-end sm:self-center"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={addBranch}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "#BE9B49" }}
                    >
                      + Add Branch
                    </button>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div>
                  <label className={labelCls} style={labelStyle}>
                    Bank Account Details
                  </label>
                  <div className="space-y-3">
                    {providerForm.banks.map((bank, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                          <select
                            value={bank.bankName}
                            onChange={(e) =>
                              handleBankChange(idx, "bankName", e.target.value)
                            }
                            className={inputCls}
                            style={inputStyle}
                            onFocus={onFocusFn}
                            onBlur={onBlurFn}
                          >
                            <option value="">Select Bank</option>
                            <option value="Commercial Bank of Ethiopia">
                              Commercial Bank of Ethiopia
                            </option>
                            <option value="Awash International Bank">
                              Awash International Bank
                            </option>
                            <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                            <option value="Dashen Bank">Dashen Bank</option>
                            <option value="Hibret Bank">Hibret Bank</option>
                            <option value="Nib Bank">Nib International Bank</option>
                            <option value="Wegagen Bank">Wegagen Bank</option>
                            <option value="Zemen Bank">Zemen Bank</option>
                            <option value="Abay Bank">Abay Bank</option>
                            <option value="Addis International Bank">
                              Addis International Bank
                            </option>
                            <option value="Amhara Bank">Amhara Bank</option>
                            <option value="Anbesa International Bank">
                              Anbesa International Bank
                            </option>
                            <option value="Berhan Bank">Berhan Bank</option>
                            <option value="Buna Bank">Buna Bank</option>
                            <option value="Cooperative Bank of Oromia">
                              Cooperative Bank of Oromia
                            </option>
                            <option value="Enat Bank">Enat Bank</option>
                            <option value="Goh Betoch Bank">Goh Betoch Bank</option>
                            <option value="Shebelle Bank">Shebelle Bank</option>
                            <option value="ZamZam Bank">ZamZam Bank</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Account Number"
                            value={bank.accountNumber}
                            onChange={(e) =>
                              handleBankChange(idx, "accountNumber", e.target.value)
                            }
                            className={inputCls}
                            style={inputStyle}
                            onFocus={onFocusFn}
                            onBlur={onBlurFn}
                          />
                        </div>
                        {providerForm.banks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBank(idx)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 transition-colors self-end sm:self-center"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={addBank}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: "#BE9B49" }}
                    >
                      + Add Bank Account
                    </button>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-5">
                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Business Licence (PDF/Image)
                    </label>
                    <input
                      type="file"
                      name="license"
                      accept="application/pdf,image/*"
                      onChange={handleProviderChange}
                      className={fileCls}
                      style={fileStyle}
                    />
                  </div>

                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Trade Registration (PDF/Image)
                    </label>
                    <input
                      type="file"
                      name="tradeRegistration"
                      accept="application/pdf,image/*"
                      onChange={handleProviderChange}
                      className={fileCls}
                      style={fileStyle}
                    />
                  </div>

                  <div>
                    <label className={labelCls} style={labelStyle}>
                      Price List / Quotation (PDF)
                      <span
                        className="inline text-xs font-normal ml-1.5"
                        style={{ color: "#8D7338" }}
                      >
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="file"
                      name="priceList"
                      accept=".pdf"
                      onChange={handleProviderChange}
                      className={fileCls}
                      style={fileStyle}
                    />
                  </div>
                </div>
              </>
            )}

            {/* D. LOCALIZATION & COMPLIANCE */}
            {/* Country (read-only, "Ethiopia") */}
            <div className="pt-1">
              <label className={labelCls} style={labelStyle}>
                Country
              </label>
              <input
                type="text"
                readOnly
                value="Ethiopia"
                className={inputCls}
                style={{
                  ...inputStyle,
                  backgroundColor: "#F9FAFB",
                  color: "#4B5563",
                  cursor: "default",
                }}
              />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 text-sm pt-1">
              <input
                id="consent"
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded cursor-pointer accent-[#BE9B49]"
              />
              <label
                htmlFor="consent"
                className="leading-relaxed text-gray-700 text-xs sm:text-sm text-left"
              >
                I consent to the collection and processing of my personal data in line with
                data regulations as described in the{" "}
                <a
                  href="#"
                  className="font-medium underline transition-colors"
                  style={{ color: "#BE9B49" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#8D7338")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#BE9B49")}
                >
                  Privacy Policy
                </a>{" "}
                &amp;{" "}
                <a
                  href="#"
                  className="font-medium underline transition-colors"
                  style={{ color: "#BE9B49" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#8D7338")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#BE9B49")}
                >
                  Merchant Service Agreement
                </a>
                .
              </label>
            </div>

            {/* E. ACTION & FOOTER */}
            {/* Primary CTA Button: Full-width, centered text, ~28-32px margin-top */}
            <div className="pt-3 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => {
                  if (!loading) setIsBtnHovered(true);
                }}
                onMouseLeave={() => setIsBtnHovered(false)}
                className={`w-full py-3.5 rounded-full font-semibold text-sm transition-all duration-300 transform active:scale-[0.98] ${
                  isBtnHovered && !loading ? "btn-shine" : "shadow-md"
                }`}
                style={{
                  background:
                    isBtnHovered && !loading
                      ? undefined
                      : "linear-gradient(135deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)",
                  color: "#0F285B",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-[#0F285B]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  roleActionMap[role] || "Create My Account"
                )}
              </button>
            </div>
          </form>

          {/* Login Link: Centered horizontally, ~16px margin-top from button */}
          <p className="text-center text-sm mt-5" style={{ color: "#0F285B" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold underline transition-colors"
              style={{ color: "#BE9B49" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#8D7338")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#BE9B49")}
            >
              Login
            </Link>
          </p>

          {/* Copyright: Centered horizontally, ~24px margin-top from login link, ~40px bottom padding */}
          <p className="text-center text-xs mt-6 mb-10 text-[#8D7338]">
            © All rights reserved by ODS Global Network
          </p>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 2️⃣ RIGHT PANEL — MARKETING / PROMOTIONAL SHOWCASE (Desktop only ≥1024px)                  */}
      {/* ~60% width, sticky viewport height (h-screen sticky top-0), my-auto for perfect vertical centering */}
      {/* Left-aligned within max-w ~480-520px, consistent left padding from panel edge (~64-80px)   */}
      {/* ========================================================================================= */}
      <div
        className="w-full lg:w-[60%] xl:w-[58%] hidden lg:flex flex-col justify-center items-start relative overflow-hidden px-8 sm:px-12 lg:pl-16 xl:pl-20 pr-8 sm:pr-12 h-screen sticky top-0"
        style={{ backgroundColor: "#0F285B" }}
      >
        {/* Ambient Canvas: Subtle dot pattern texture in lighter navy tone for depth */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, #224282 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient decorative soft gold lights */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "#BE9B49" }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "#EDC45B" }}
        />

        {/* Content Block: Vertically centered (my-auto) & left-aligned in max-w ~480-520px */}
        <div className="max-w-[500px] w-full relative z-10 my-auto">
          {/* Feature blocks container with precisely aligned vertical accent bar */}
          <div className="relative pl-6">
            {/* Precise Vertical Accent Line: Starts at top of first pill and stops at bottom of 4th text line */}
            <div
              className="absolute left-0 top-0.5 bottom-0.5 w-[3.5px] rounded-full"
              style={{ background: "linear-gradient(180deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)" }}
            />

            <div className="space-y-7 sm:space-y-8">
              {/* 1. Feature: Wellness Booking */}
              <div className="relative text-left">
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)", color: "#0F285B" }}
                >
                  Wellness Booking
                </span>
                <p className="text-white text-sm sm:text-base leading-relaxed">
                  Book <strong style={{ color: "#EDC45B" }}>holistic wellness</strong> &amp; spa
                  sessions effortlessly.
                </p>
              </div>

              {/* 2. Feature: Gift Services */}
              <div className="relative text-left">
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)", color: "#0F285B" }}
                >
                  Gift Services
                </span>
                <p className="text-white text-sm sm:text-base leading-relaxed">
                  Send <strong style={{ color: "#EDC45B" }}>curated gifts</strong> for corporate &amp;
                  personal occasions.
                </p>
              </div>

              {/* 3. Feature: Business Gifting */}
              <div className="relative text-left">
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)", color: "#0F285B" }}
                >
                  Business Gifting
                </span>
                <p className="text-white text-sm sm:text-base leading-relaxed">
                  Tailor <strong style={{ color: "#EDC45B" }}>business gifting</strong> for teams,
                  clients, and events.
                </p>
              </div>

              {/* 4. Feature: Event Reminders */}
              <div className="relative text-left">
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 shadow-sm"
                  style={{ background: "linear-gradient(90deg, #F5E189 0%, #EDC45B 25%, #BE9B49 50%, #BB9F54 75%, #8D7338 100%)", color: "#0F285B" }}
                >
                  Event Reminders
                </span>
                <p className="text-white text-sm sm:text-base leading-relaxed">
                  Never miss a special moment—let ODS Global Network{" "}
                  <strong style={{ color: "#EDC45B" }}>remind and deliver</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Horizontal Divider: Full width of content column, ~32-40px margin above & below */}
          <div
            className="w-full mt-9 pt-8"
            style={{ borderTop: "1px solid #EDC45B" }}
          >
            {/* Closing Tagline: Centered horizontally within the content column */}
            <p className="text-white font-medium text-base sm:text-lg text-center leading-relaxed">
              Your journey to wellness and meaningful giving starts here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
