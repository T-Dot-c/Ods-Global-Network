// (1) IMPORTS & STATE
import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import BASE_URL from "../../api/api";

type Role = "individual" | "provider" | "corporate" | "diaspora" | "standard_agent" | "elite_agent";

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

const RegisterForm = () => {
  const [role, setRole] = useState<Role>("individual");
  const [leadership, setLeadership] = useState<string>("");
  const [ownership, setOwnership] = useState<string>("");


  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    password: "",
    confirmPassword: "",
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

  // (2) HANDLERS
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as typeof role);
  };

const handleUserChange = (e: ChangeEvent<HTMLInputElement>) => {
  const { name, value, files } = e.target;

  if (files && files[0]) {
    // Map "id" input to "idFile" state
    const fieldName = name === "id" ? "idFile" : name;
    setUserForm({ ...userForm, [fieldName]: files[0] });
  } else {
    setUserForm({ ...userForm, [name]: value });
  }
};

// Build businessStatus array from Leadership + Ownership for API
const businessStatus = [leadership, ownership].filter(Boolean);


// Update single-value fields
const handleProviderChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, files } = e.target as HTMLInputElement;

  if (files && files.length > 0) {
    if (name === "servicePhotos") {
      // multiple files
      setProviderForm({ ...providerForm, servicePhotos: Array.from(files) });
    } else {
      setProviderForm({ ...providerForm, [name]: files[0] });
    }
  } else {
    setProviderForm({ ...providerForm, [name]: value });
  }
};

// Handle branches change
const handleBranchChange = (index: number, field: "city" | "location", value: string) => {
  const newBranches = [...providerForm.branches];
  newBranches[index][field] = value;
  setProviderForm({ ...providerForm, branches: newBranches });
};


const addBranch = () => {
  setProviderForm({
    ...providerForm,
    branches: [...providerForm.branches, { city: "", location: "" }],
  });
};

const removeBranch = (index: number) => {
  const newBranches = providerForm.branches.filter((_, i) => i !== index);
  setProviderForm({ ...providerForm, branches: newBranches });
};

// Handle banks change
const handleBankChange = (
  index: number,
  field: "bankName" | "accountNumber",
  value: string
) => {
  const newBanks = [...providerForm.banks];
  newBanks[index][field] = value;
  setProviderForm({ ...providerForm, banks: newBanks });
};


const addBank = () => {
  setProviderForm({
    ...providerForm,
    banks: [...providerForm.banks, { bankName: "", accountNumber: "" }],
  });
};

const removeBank = (index: number) => {
  const newBanks = providerForm.banks.filter((_, i) => i !== index);
  setProviderForm({ ...providerForm, banks: newBanks });
};

//membership
const [membership, setMembership] = useState<string>("Standard Member");

// Update membership when role changes
useEffect(() => {
  console.log("🔄 Role changed to:", role);
  if (role === "provider") {
    setMembership("Basic Provider");
    console.log("✅ Membership set to: Basic Provider");
  } else if (role === "individual" || role === "diaspora" || role === "corporate") {
    setMembership("Standard Member");
    console.log("✅ Membership set to: Standard Member");
  } else if (role === "standard_agent") {
    setMembership("Standard Agent");
  } else if (role === "elite_agent") {
    setMembership("Elite Agent");
  }
}, [role]);

const handleMembershipChange = (e: ChangeEvent<HTMLSelectElement>) => {
  setMembership(e.target.value);
};


const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  if (!consent) {
    alert("You must agree to the data processing terms.");
    return;
  }

  // ------------------- INDIVIDUAL / DIASPORA / AGENTS -------------------
   if (role === "individual" || role === "diaspora" || role === "standard_agent" || role === "elite_agent") {
    if (userForm.password !== userForm.confirmPassword) {
      alert("Passwords do not match");
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

    // ✅ Append file with the correct field name expected by backend
    if (userForm.idFile) fd.append("idFile", userForm.idFile);

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        body: fd,
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        console.error("Registration failed:", responseData);
        alert(responseData.msg || "Registration failed");
        return;
      }

      alert("Account created successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Registration error:", err);
      alert("An error occurred during registration. Please try again.");
    }

    return;
  }

  // ------------------- PROVIDER / CORPORATE -------------------
  if (!providerForm.companyName || !providerForm.serviceType) {
    alert("Company name and service type are required.");
    return;
  }

  if (!providerForm.email || !providerForm.password) {
    alert("Email and password are required.");
    return;
  }

  if (!providerForm.city || !providerForm.location) {
    alert("City and location are required.");
    return;
  }

  if (providerForm.password !== providerForm.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  const fdProv = new FormData();
  fdProv.append("fullName", providerForm.companyName.trim());
  fdProv.append("companyName", providerForm.companyName);
  fdProv.append("serviceType", providerForm.serviceType);
  fdProv.append("role", role);
  fdProv.append("email", providerForm.email);
  fdProv.append("phone", providerForm.phone);
  fdProv.append("whatsapp", providerForm.whatsapp);
  fdProv.append("telegram", providerForm.telegram);
  fdProv.append("city", providerForm.city);
  fdProv.append("location", providerForm.location);
  fdProv.append("password", providerForm.password);
  fdProv.append("tin", providerForm.tin);
  fdProv.append("branches", JSON.stringify(providerForm.branches));
  fdProv.append("banks", JSON.stringify(providerForm.banks));
  fdProv.append("businessStatus", JSON.stringify(businessStatus || []));
  fdProv.append("membership", membership);
  
  console.log("🔍 Provider registration debug:", {
    role: role,
    membership: membership,
    companyName: providerForm.companyName,
    serviceType: providerForm.serviceType,
    businessStatus: businessStatus,
    branches: providerForm.branches,
    banks: providerForm.banks,
    servicePhotos: providerForm.servicePhotos,
    servicePhotosLength: providerForm.servicePhotos?.length
  });


 if (providerForm.license) fdProv.append("license", providerForm.license);
if (providerForm.tradeRegistration) fdProv.append("tradeRegistration", providerForm.tradeRegistration); // corrected
if (providerForm.servicePhotos && providerForm.servicePhotos.length > 0) {
  providerForm.servicePhotos.forEach(file => fdProv.append("servicePhotos", file));
}
if (providerForm.video) fdProv.append("video", providerForm.video);
if (providerForm.priceList) fdProv.append("priceList", providerForm.priceList);
// Add idFile for providers (using company name as fullName, but still need idFile)
if (userForm.idFile) fdProv.append("idFile", userForm.idFile);


  try {
    const resProv = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      body: fdProv,
    });

    const responseData = await resProv.json();

    if (!resProv.ok) {
      console.error("Provider registration failed:", responseData);
      alert(responseData.msg || "Provider registration failed");
      return;
    }

    alert("Account created successfully!");
    navigate("/login");
  } catch (err) {
    console.error("Provider registration error:", err);
    alert("An error occurred during registration. Please try again.");
  }
};



  /* ──────────────────── 4️⃣ RENDER ──────────────────── */
  return (
    <div className="relative min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left: Form Section */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-4 sm:p-6 md:p-10 z-10 relative">
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8 w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src="/wanaw gifting logo.jpeg" alt="ODS Global Network Logo" className="h-16 w-16 rounded-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold mb-6 text-center text-[#1c2b21]">
            {roleHeadingMap[role]}
          </h2>

          {/* Role selector */}
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Registering as
            </label>
            <select
              id="role"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              value={role}
              onChange={handleRoleChange}
            >
              <option value="individual">Individual User</option>
              <option value="provider">Service Provider</option>
              <option value="corporate">Corporate</option>
              <option value="diaspora">Ethiopian Diaspora</option>
              <option value="standard_agent">Standard Agent</option>
              <option value="elite_agent">Elite / Super Agent</option>
            </select>
          </div>
{/* Membership Options */}
<div className="mb-4">
  <label htmlFor="membership" className="block text-sm font-medium text-gray-700 mb-1">
    Membership Level
  </label>

  { (role === "individual" || role === "diaspora" || role === "corporate") && (
    <select
      id="membership"
      name="membership"
      value={membership}
      onChange={handleMembershipChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    >
      <option value="Standard Member">Standard Member</option>
      <option value="Gold Member" disabled>Gold Member (Coming Soon)</option>
      <option value="Platinum Member" disabled>Platinum Member (Coming Soon)</option>
    </select>
  )}

  {(role === "standard_agent" || role === "elite_agent") && (
    <p className="text-sm text-gray-600 py-2 border border-dashed border-gray-200 rounded-md px-3">
      Agent tier:{" "}
      <span className="font-semibold text-[#1c2b21]">
        {role === "elite_agent" ? "Elite / Super Agent" : "Standard Agent"}
      </span>
      <span className="block text-xs text-gray-500 mt-1">
        Dashboard access to professionals and their bookings is included for your tier.
      </span>
    </p>
  )}

  {role === "provider" && (
    <select
      id="membership"
      name="membership"
      value={membership}
      onChange={handleMembershipChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    >
      <option value="Basic Provider">Basic Provider</option>
      <option value="Premium Provider" disabled>Premium Provider (Coming Soon)</option>
    </select>
  )}
</div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* INDIVIDUAL FORM FIELDS */}
            {(role === "individual" || role === "diaspora" || role === "standard_agent" || role === "elite_agent") && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    required
                    value={userForm.firstName}
                    onChange={handleUserChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    required
                    value={userForm.lastName}
                    onChange={handleUserChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={userForm.email}
                  onChange={handleUserChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  required
                  value={userForm.phone || ""}
                  onChange={handleUserChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                {(role === "diaspora" || role === "individual") && (
  <>
    <input
      type="tel"
      name="whatsapp"
      placeholder="WhatsApp (Optional)"
      value={userForm.whatsapp}
      onChange={handleUserChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
    <input
      type="text"
      name="telegram"
      placeholder="Telegram (Optional)"
      value={userForm.telegram}
      onChange={handleUserChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
    <label className="block text-sm font-medium text-gray-700 mt-2">
  Insurance Profile Link (PDF/Image) <span className="text-gray-500 text-xs">(Optional)</span>
</label>
<input
  type="url"
  name="insuranceProfile"
  placeholder="https://example.com/file.pdf"
  onChange={handleUserChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

  </>
)}

{role === "diaspora" && (
  <>
    <label className="block text-sm font-medium text-gray-700 mt-2">
      Yellow Card/Passport (PDF/Image) <span className="text-gray-500 text-xs">(Optional)</span>
    </label>
    <input
      type="file"
      name="idFile" 
      accept="application/pdf,image/*"
      onChange={handleUserChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
  </>
)}

{(role === "individual" || role === "standard_agent" || role === "elite_agent") && (
  <>
    <label className="block text-sm font-medium text-gray-700 mt-2">
      Government ID / licence (PDF/Image) <span className="text-gray-500 text-xs">(Optional)</span>
    </label>
    <input
      type="file"
      name="idFile" 
      accept="application/pdf,image/*"
      onChange={handleUserChange}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
  </>
)}


                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={userForm.password}
                    onChange={handleUserChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    value={userForm.confirmPassword}
                    onChange={handleUserChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </>
            )}

            {/* PROVIDER / CORPORATE / DIASPORA FORM FIELDS */}
            {(role === "provider" || role === "corporate" ) && (
              <>
                <input
                  type="text"
                  name="companyName"
                  placeholder="Company Name"
                  required
                  value={providerForm.companyName}
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <select
                  name="serviceType"
                  required
                  value={providerForm.serviceType}
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="" disabled>
                    Select Service Type
                  </option>
                  <option value="Wellness Services">Wellness Services</option>
                  <option value="Medical">Medical Services</option>
                  <option value="Home Based/Mobile services">Home Based/Mobile services</option>
                  <option value="Hotel Rooms">Hotel Rooms</option>
                </select>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Status
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Leadership</label>
                      <select
                        value={leadership}
                        onChange={(e) => setLeadership(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="Women Led">Women Led</option>
                        <option value="Non Women Led">Non Women Led</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ownership</label>
                      <select
                        value={ownership}
                        onChange={(e) => setOwnership(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="Women Owned">Women Owned</option>
                        <option value="Non Women Owned">Non Women Owned</option>
                      </select>
                    </div>
                  </div>
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={providerForm.email}
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              <input
  type="tel"
  name="phone"
  placeholder="Phone"
  required
  value={providerForm.phone}
  onChange={handleProviderChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

<input
  type="tel"
  name="whatsapp"
  placeholder="WhatsApp (Optional)"
  value={providerForm.whatsapp}
  onChange={handleProviderChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

<input
  type="text"
  name="telegram"
  placeholder="Telegram (Optional)"
  value={providerForm.telegram}
  onChange={handleProviderChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    value={providerForm.city}
                    onChange={handleProviderChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="text"
                    name="location"
                    placeholder="Exact Location / Address"
                    required
                    value={providerForm.location}
                    onChange={handleProviderChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                {/* Password */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={providerForm.password}
                    onChange={handleProviderChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    required
                    value={providerForm.confirmPassword}
                    onChange={handleProviderChange}
                    className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                {/* Files */}
                <label className="block text-sm font-medium text-gray-700 mt-2">License (PDF/Image)</label>
                <input
                  type="file"
                  name="license"
                  accept="application/pdf,image/*"
                  required
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <label className="block text-sm font-medium text-gray-700 mt-2">Trade Registration (PDF/Image)</label>
                <input
                  type="file"
                  name="tradeRegistration"
                  accept="application/pdf,image/*"
                  required
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <label className="block text-sm font-medium text-gray-700 mt-2">Service Centre Photos (up to 5)</label>
                <input
                  type="file"
                  name="servicePhotos"
                  accept="image/*"
                  multiple
                  required
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <label className="block text-sm font-medium text-gray-700 mt-2">Intro Video (optional)</label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleProviderChange}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
                <div className="border p-3 border-gray-300 rounded">
          <label className="block text-sm font-medium text-gray-700 mt-2">ODS Global Network card </label>
          <input
            type="file"
            name="healthCardDoc"
            onChange={handleProviderChange}
            className="border border-gray-300 p-2 w-full mt-2"
            disabled // inactive for now
          />
          <p className="text-sm text-gray-500 mt-1">(Document upload coming soon)</p>
        </div>
        <label className="block text-sm font-medium text-gray-700 mt-2">
  Insurance Profile Link (PDF/Image) <span className="text-gray-500 text-xs">(Optional)</span>
</label>
<input
  type="url"
  name="insuranceProfile"
  placeholder="https://example.com/file.pdf"
  onChange={handleUserChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

                {/* TIN */}
<input
  type="text"
  name="tin"
  placeholder="Tax Identification Number (TIN)"
  required
  value={providerForm.tin}
  onChange={handleProviderChange}
  className="w-full p-2 border border-gray-300 rounded text-sm"
/>

{/* Branches */}
{providerForm.branches.map((branch, idx) => (
  <div key={idx} className="flex gap-2 mb-2">
    <input
      type="text"
      placeholder="City"
      value={branch.city}
      onChange={(e) => handleBranchChange(idx, "city", e.target.value)}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
    <input
      type="text"
      placeholder="Location"
      value={branch.location}
      onChange={(e) => handleBranchChange(idx, "location", e.target.value)}
      className="w-full p-2 border border-gray-300 rounded text-sm"
    />
    {providerForm.branches.length > 1 && (
      <button type="button" onClick={() => removeBranch(idx)} className="text-red-500">
        Remove
      </button>
    )}
  </div>
))}

  <button type="button" onClick={addBranch} className="text-blue-500 mt-1">+ Add Branch</button>


{/* Banks */}
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mt-2">Bank Accounts</label>
  {providerForm.banks.map((bank, idx) => (
    <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
<select
  value={bank.bankName}
  onChange={(e) => handleBankChange(idx, "bankName", e.target.value)}
  className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
>
  <option value="">Select Bank</option>
  <option value="Abay Bank">Abay Bank</option>
  <option value="Addis International Bank">Addis International Bank</option>
  <option value="Ahadu Bank">Ahadu Bank</option>
  <option value="Amhara Bank">Amhara Bank</option>
  <option value="Anbesa International Bank">Anbesa International Bank</option>
  <option value="Awash International Bank">Awash International Bank</option>

  <option value="Bank of Abyssinia">Bank of Abyssinia</option>
  <option value="Berhan Bank">Berhan Bank</option>
  <option value="Buna Bank">Buna Bank</option>
  <option value="Buna Cooperative Bank of Oromia">Buna Cooperative Bank of Oromia</option>
  <option value="Commercial Bank of Ethiopia">Commercial Bank of Ethiopia</option>
  <option value="Dashen Bank">Dashen Bank</option>
  <option value="Debub Global Bank">Debub Global Bank</option>
  <option value="Dire Microfinance Institution">Dire Microfinance Institution</option>
  <option value="Enat Bank">Enat Bank</option>
  <option value="Goh Betoch Bank">Goh Betoch Bank</option>
  <option value="Hibret Bank">Hibret Bank</option>
  <option value="Nib Bank">Nib International Bank</option>
  <option value="Shebelle Bank">Shebelle Bank</option>
  <option value="Siket Bank">Siket Bank</option>
  <option value="Sidamo Bank">Sidamo Bank</option>
  <option value="Wegagen Bank">Wegagen Bank</option>
  <option value="ZamZam Bank">ZamZam Bank</option>
  <option value="Zemen Bank">Zemen Bank</option>
</select>



      <input
        type="text"
        placeholder="Account Number"
        value={bank.accountNumber}
        onChange={(e) => handleBankChange(idx, "accountNumber", e.target.value)}
        className="w-full sm:w-1/2 p-2 border border-gray-300 rounded text-sm"
      />
      {providerForm.banks.length > 1 && (
        <button type="button" onClick={() => removeBank(idx)} className="text-red-500">Remove</button>
      )}
    </div>
  ))}
  <button type="button" onClick={addBank} className="text-blue-500 mt-1">+ Add Bank Account</button>
</div>

                
  <label htmlFor="priceList" className="block text-sm font-medium text-gray-700 mb-1">
    Service Price List / Quotation Document (PDF)
  </label>
  <input
    type="file"
    id="priceList"
    name="priceList"
    accept=".pdf"
    onChange={handleProviderChange}
    className="w-full p-2 border border-gray-300 rounded text-sm"
  />


              </>
            )}

            {/* Country (static) */}
            <input
              type="text"
              disabled
              value="Ethiopia"
              className="w-full p-2 border rounded text-sm border-gray-300 cursor-not-allowed"
            />

            {/* Consent */}
            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label className="leading-snug">
                I consent to the collection and processing of my personal data in line with data regulations as described in the <a href="#" className="text-blue-600 underline">Privacy Policy</a> & <a href="#" className="text-blue-600 underline">Merchant Service Agreement</a>.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-[#D4AF37] text-[#1c2b21] font-semibold py-2 rounded-full hover:rounded-md transition"
            >
              {roleActionMap[role]}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1c2b21] text-lg hover:underline">
              Login
            </Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-12">Ⓒ All rights reserved by ODS Global Network</p>
        </div>
      </div>

   {/* Wave Divider */}
      <div className="hidden md:block absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 z-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-4">
          <path d="M0,0 C50,50 50,50 100,100 L100,0 Z" fill="#fafafa" />
        </svg>
      </div>

      {/* Right: Info Section (unchanged) */}
      <div className="w-full md:w-1/2 hidden md:flex justify-center bg-green relative overflow-hidden z-0">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}></div>
        <div className="text-left px-6 sm:px-10 max-w-md mx-auto mt-40 relative z-10">
          <div className="space-y-6 border-l-4 border-[#D4AF37] pl-6 relative">
            <div className="relative">
              <span className="inline-block bg-[#D4AF37] text-green-900 text-xs font-semibold px-3 py-1 rounded-full mb-1">Wellness Booking</span>
              <p className="text-white">Book <strong className="text-yellow-200">holistic wellness</strong> & spa sessions effortlessly.</p>
            </div>
            <div className="relative">
              <span className="inline-block bg-[#D4AF37] text-green-900 text-xs font-semibold px-3 py-1 rounded-full mb-1">Gift Services</span>
              <p className="text-white">Send <strong className="text-yellow-200">curated gifts</strong> for corporate & personal occasions.</p>
            </div>
            <div className="relative">
              <span className="inline-block bg-[#D4AF37] text-green-900 text-xs font-semibold px-3 py-1 rounded-full mb-1">Business Gifting</span>
              <p className="text-white">Tailor <strong className="text-yellow-200">business gifting</strong> for teams, clients, and events.</p>
            </div>
            <div className="relative">
              <span className="inline-block bg-[#D4AF37] text-green-900 text-xs font-semibold px-3 py-1 rounded-full mb-1">Event Reminders</span>
              <p className="text-white">Never miss a special moment—let ODS Global Network <strong className="text-yellow-200">remind and deliver</strong>.</p>
            </div>
          </div>
          <div className="mt-10 border-t pt-5 border-yellow-200">
            <p className="text-white font-semibold text-base text-center">Your journey to wellness and meaningful giving starts here</p>
          </div>
        </div>
      </div>
    </div>
   
  );
};

export default RegisterForm;

