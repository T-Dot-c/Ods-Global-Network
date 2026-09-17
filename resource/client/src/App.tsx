import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import OAuthSuccessRedirect from "./components/Auth/OAuthSuccessRedirect";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import GiftingOptions from "./components/GiftingOptions";
import Dashboard from "./components/Dashbords/Dashboard";
import PrivateRoute from "./components/Dashbords/PrivateRoute";
import ServiceList from "./components/Services/ServiceList";
import ServiceDetail from "./components/Services/ServiceDetail";
import SelectMembership from "./components/SelectMembership";
import AddService from "./components/Services/AddServiceForm";


import CartPage from "./components/Services/CartPage";
import SendGiftForm from "./components/Services/SendGiftForm";
import PaymentSuccess from "./components/pages/PaymentSuccess";
import TermsAndConditions from "./components/pages/TermsAndConditions";
import GiftDetails from "./components/GiftDetails";
import SupportPage from "./components/SupportPage";
import CompanyInfo from "./components/CompanyInfo";
import Programs from "./components/pages/Programs";
import ManageMemberships from "./components/Dashbords/Admin/ManageMemberships";
import ManageServices from "./components/Dashbords/Admin/ManageServices";

import AdminAddGift from "./components/Dashbords/Admin/AdminAddGift";
import AdminAddProgram from "./components/Dashbords/Admin/AdminAddProgram";
import BlogCreate from "./components/Dashbords/Admin/BlogCreate";
import AdminBlogList from "./components/Dashbords/Admin/BlogList";
import BlogDetail from "./components/pages/BlogDetail";
import BlogList from "./components/pages/BlogList";
import AdminSupportRequests from "./components/Dashbords/Admin/AdminSupportRequests";
import AdminUserList from "./components/Dashbords/Admin/AdminUserList";

import IndividualDashboard from "./components/Dashbords/individual/IndividualDashboard";
import DiasporaDashboard from "./components/Dashbords/Diaspora/DiasporaDashboard";
import DiasporaTest from "./components/DiasporaTest";
import PaymentOptions from "./components/pages/PaymentOptions";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import WanawCommunityMembership from "./components/WanawCommunityMembership";
import PremiumCommunitySubscription from "./components/PremiumCommunitySubscription";
import PremiumSubscriptionPayment from "./components/pages/PremiumSubscriptionPayment";
import PartnerWithUs from "./components/PartnerWithUs";
import Unauthorized from "./components/Unauthorized"; // Create this
import ProviderDashboard from "./components/Dashbords/providor/ProviderDashbord";
import CommunityList from "./components/Dashbords/Admin/CommunityList ";
import AdminJobPost from "./components/Dashbords/Admin/AdminJobPost";
import ApplyForm from "./components/ApplyForm";
import JobsList from "./components/JobsList";
import ApplicationsList from "./components/ApplicationsList";
import MarketingDashboard from "./components/Dashbords/Admin/MarketingDashboard";
import CustomerSupportDashboard from "./components/Dashbords/Admin/CustomerSupportDashboard";
import SuperAdminDashboard from "./components/Dashbords/Admin/SuperAdminDashboard";
import GiftListAndConfirm from "./components/GiftListAndConfirm";
import AdminPurchaseList from "./components/Dashbords/Admin/AdminPurchaseList";
import KidneyPatientForm from "./components/KidneyPatientForm";
import CommunitySelection from "./components/CommunitySelection";
import SupportCommunityForm from "./components/SupportCommunityForm";
import DiasporaJoinForm from "./components/DiasporaJoinForm";
import DiplomaticCommunityForm from "./components/DiplomaticCommunityForm";
import DiasporaList from "./components/Dashbords/Admin/DiasporaList";
import KidneyPatientList from "./components/Dashbords/Admin/KidneyPatientList";
import DiplomaticCommunityList from "./components/Dashbords/Admin/DiplomaticCommunityList";
import SubscribersList from "./components/Dashbords/Admin/SubscribersList";
import HemodialysisPatientsList from "./components/HemodialysisPatientsList";
import MembershipLookup from "./components/MembershipLookup";


import RegisteredPartners from "./components/RegisteredPartners";

import ReferralsDashboard from "./components/Dashbords/Admin/ReferralsDashboard";
import ProviderVerification from "./components/Dashbords/Admin/ProviderVerification";
import RequestServiceForm from "./components/ServiceRequests/RequestServiceForm";
import MyRequestsPage from "./components/ServiceRequests/MyRequestsPage";
import RequestProposalsPage from "./components/ServiceRequests/RequestProposalsPage";
import BrowseRequestsPage from "./components/ServiceRequests/BrowseRequestsPage";





// Wrapper to conditionally render Navbar
const AppWrapper = () => {
  const location = useLocation();
  const hideNavbarPaths = ["/login", "/register", "/dashboard",];
  

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/oauth-success" element={<OAuthSuccessRedirect />} />
        <Route path="/gifting-options" element={<GiftingOptions />} />
        <Route path="/services" element={<ServiceList />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/membership/select" element={<SelectMembership/>} />
        
        <Route path="/cart" element={<CartPage />} />
        <Route path="/send-gift" element={<SendGiftForm />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/gifts/:slug" element={<GiftDetails />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/company" element={<CompanyInfo />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/blogs" element={<BlogList />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/individual-dashboard" element={<IndividualDashboard />} />
        <Route path="/diaspora-dashboard" element={<DiasporaDashboard />} />
        <Route path="/diaspora-test" element={<DiasporaTest />} />
        <Route path="/provider-dashboard" element={<ProviderDashboard />} />
        <Route path="/payment-options" element={<PaymentOptions />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/partner-with-us" element={<PartnerWithUs />} />
       <Route path="/career/:jobId" element={<ApplyForm  />} />
        <Route path="/community" element={<CommunitySelection />} />
  <Route path="/community/kidney" element={<KidneyPatientForm />} />
  <Route path="/community/membership" element={<WanawCommunityMembership />} />
  <Route path="/community/diaspora" element={<DiasporaJoinForm />} />
<Route path="/community/support" element={<SupportCommunityForm />} />
<Route path="/community/diplomatic" element={<DiplomaticCommunityForm />} />
<Route path="/community/premium" element={<PremiumCommunitySubscription />} />
<Route path="/premium-subscription-payment" element={<PremiumSubscriptionPayment />} />
<Route path="/admin/partner" element={<RegisteredPartners/>} />

   



  <Route path="/community/hemodialysis" element={<HemodialysisPatientsList />} />







        <Route path="/careers" element={<JobsList/>} />
        <Route
          path="/request-service"
          element={<RequestServiceForm />}
        />
        <Route
          path="/my-requests"
          element={
            <PrivateRoute requiredRole={["individual", "diaspora", "corporate", "user", "super_admin"]}>
              <MyRequestsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <PrivateRoute>
              <RequestProposalsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/provider/requests"
          element={
            <PrivateRoute requiredRole={["provider", "super_admin"]}>
              <BrowseRequestsPage />
            </PrivateRoute>
          }
        />


         
       

       
        
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🔐 Protected dashboard route */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
  path="/marketing-dashboard"
  element={
    <PrivateRoute requiredRole="marketing_admin">
      <MarketingDashboard />
    </PrivateRoute>
  }
/>
<Route
  path="/support-dashboard"
  element={
    <PrivateRoute requiredRole="customer_support_admin">
      <CustomerSupportDashboard />
    </PrivateRoute>
  }
/>
<Route
  path="/admin-dashboard"
  element={
    <PrivateRoute requiredRole="super_admin">
      <SuperAdminDashboard />
    </PrivateRoute>
  }
/>



    {/* 🔐 Super Admin Only */}
<Route
  path="/admin/manage-membership"
  element={
    <PrivateRoute requiredRole="super_admin">
      <ManageMemberships />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/provider-verification"
  element={
    <PrivateRoute requiredRole="super_admin">
      <ProviderVerification />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/Support-community"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <MembershipLookup/>
    </PrivateRoute>
  }
/>


<Route
  path="/admin/community-list"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <CommunityList />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/diaspora-list"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <DiasporaList/>
    </PrivateRoute>
  }
/>
<Route
  path="/admin/patient-list"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <KidneyPatientList/>
    </PrivateRoute>
  }
/>
<Route
  path="/admin/diplomatic-community-list"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <DiplomaticCommunityList/>
    </PrivateRoute>
  }
/>
<Route
  path="/admin/gift-list-confirm"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <GiftListAndConfirm/>
    </PrivateRoute>
  }
/>

<Route
  path="/admin/purchase-list"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <AdminPurchaseList/>
    </PrivateRoute>
  }
/>

<Route
  path="/admin/subscrpition-list"
  element={
    <PrivateRoute requiredRole={["marketing_admin", "super_admin"]}>
      <SubscribersList/>
    </PrivateRoute>
  }
/>



<Route
  path="/admin/manage-services"
  element={
    <PrivateRoute requiredRole="super_admin">
      <ManageServices />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/add-program"
  element={
    <PrivateRoute requiredRole="super_admin">
      <AdminAddProgram />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/user-lists"
  element={
    <PrivateRoute requiredRole={["customer_support_admin", "super_admin"]}>
      <AdminUserList />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/add-service"
  element={
    <PrivateRoute requiredRole="super_admin">
      <AddService />
    </PrivateRoute>
  }
/>
<Route
  path="/admin/referal-code"
  element={
    <PrivateRoute requiredRole="super_admin">
      <ReferralsDashboard />
    </PrivateRoute>
  }
/>



{/* 🎯 Marketing Admin + Super Admin */}
<Route
  path="/admin/add-gift"
  element={
    <PrivateRoute requiredRole={["marketing_admin", "super_admin"]}>
      <AdminAddGift />
    </PrivateRoute>
  }
/>


<Route
  path="/admin/blog-create"
  element={
    <PrivateRoute requiredRole={["marketing_admin", "super_admin"]}>
      <BlogCreate />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/blog-list"
  element={
    <PrivateRoute requiredRole="marketing_admin">
      <AdminBlogList />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/job-posting"
  element={
    <PrivateRoute requiredRole={["marketing_admin", "super_admin"]}>
      <AdminJobPost />
    </PrivateRoute>
  }
/>

{/* 🛎️ Customer Support Admin + Super Admin */}
<Route
  path="/admin/support-requests"
  element={
    <PrivateRoute requiredRole="customer_support_admin">
      <AdminSupportRequests />
    </PrivateRoute>
  }
/>

<Route
  path="/admin/applicant-list"
  element={
    <PrivateRoute requiredRole={["marketing_admin", "super_admin","customer_support_admin"]}>
      <ApplicationsList />
    </PrivateRoute>
  }
/>

      </Routes>
        
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default App;

