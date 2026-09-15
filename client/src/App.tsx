import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import OAuthSuccessRedirect from "./components/Auth/OAuthSuccessRedirect";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";

// Dashboards
import Dashboard from "./components/Dashbords/Dashboard";
import SuperAdminDashboard from "./components/Dashbords/Admin/SuperAdminDashboard";
import MarketingDashboard from "./components/Dashbords/Admin/MarketingDashboard";
import CustomerSupportDashboard from "./components/Dashbords/Admin/CustomerSupportDashboard";
import ProviderDashboard from "./components/Dashbords/providor/ProviderDashbord";
import CorporateDashboard from "./components/Dashbords/CorporateDashboard";
import IndividualDashboard from "./components/Dashbords/individual/IndividualDashboard";
import DiasporaDashboard from "./components/Dashbords/Diaspora/DiasporaDashboard";
import PrivateRoute from "./components/Dashbords/PrivateRoute";

// Merchant Management (Task 1)
import {
  MerchantRegistrationWorkflow,
  MerchantDashboardView,
  MerchantProfileManagement,
  MerchantApprovalWorkflow,
} from "./components/MerchantManagement";

// Customer Management (Task 2)
import {
  CustomerRegistration,
  CustomerAuthRecovery,
  CustomerProfileManagement,
} from "./components/CustomerManagement";

// Gifting & Services
import GiftingOptions from "./components/GiftingOptions";
import GiftDetails from "./components/GiftDetails";
import SendGiftForm from "./components/Services/SendGiftForm";
import CartPage from "./components/Services/CartPage";
import ServiceList from "./components/Services/ServiceList";
import ServiceDetail from "./components/Services/ServiceDetail";
import AddService from "./components/Services/AddServiceForm";
import SelectMembership from "./components/SelectMembership";

// Admin features
import ManageMemberships from "./components/Dashbords/Admin/ManageMemberships";
import ManageServices from "./components/Dashbords/Admin/ManageServices";
import AdminAddGift from "./components/Dashbords/Admin/AdminAddGift";
import AdminAddProgram from "./components/Dashbords/Admin/AdminAddProgram";
import BlogCreate from "./components/Dashbords/Admin/BlogCreate";
import AdminBlogList from "./components/Dashbords/Admin/BlogList";
import AdminSupportRequests from "./components/Dashbords/Admin/AdminSupportRequests";
import AdminUserList from "./components/Dashbords/Admin/AdminUserList";
import AdminJobPost from "./components/Dashbords/Admin/AdminJobPost";
import AdminPurchaseList from "./components/Dashbords/Admin/AdminPurchaseList";
import GiftListAndConfirm from "./components/GiftListAndConfirm";
import ProviderVerification from "./components/Dashbords/Admin/ProviderVerification";
import ReferralsDashboard from "./components/Dashbords/Admin/ReferralsDashboard";
import SubscribersList from "./components/Dashbords/Admin/SubscribersList";
import CommunityList from "./components/Dashbords/Admin/CommunityList";
import DiasporaList from "./components/Dashbords/Admin/DiasporaList";
import KidneyPatientList from "./components/Dashbords/Admin/KidneyPatientList";
import DiplomaticCommunityList from "./components/Dashbords/Admin/DiplomaticCommunityList";

// Community & Programs
import CommunitySelection from "./components/CommunitySelection";
import KidneyPatientForm from "./components/KidneyPatientForm";
import SupportCommunityForm from "./components/SupportCommunityForm";
import DiasporaJoinForm from "./components/DiasporaJoinForm";
import DiplomaticCommunityForm from "./components/DiplomaticCommunityForm";
import HemodialysisPatientsList from "./components/HemodialysisPatientsList";
import PremiumCommunitySubscription from "./components/PremiumCommunitySubscription";
import WanawCommunityMembership from "./components/WanawCommunityMembership";
import MembershipLookup from "./components/MembershipLookup";
import RegisteredPartners from "./components/RegisteredPartners";
import PartnerWithUs from "./components/PartnerWithUs";
import Programs from "./components/pages/Programs";
import BlogList from "./components/pages/BlogList";
import BlogDetail from "./components/pages/BlogDetail";
import JobsList from "./components/JobsList";
import ApplyForm from "./components/ApplyForm";
import ApplicationsList from "./components/ApplicationsList";
import PaymentSuccess from "./components/pages/PaymentSuccess";
import PaymentOptions from "./components/pages/PaymentOptions";
import TermsAndConditions from "./components/pages/TermsAndConditions";
import SupportPage from "./components/SupportPage";
import CompanyInfo from "./components/CompanyInfo";
import DiasporaTest from "./components/DiasporaTest";
import PremiumSubscriptionPayment from "./components/pages/PremiumSubscriptionPayment";
import Unauthorized from "./components/Unauthorized";

// Service Requests
import RequestServiceForm from "./components/ServiceRequests/RequestServiceForm";
import MyRequestsPage from "./components/ServiceRequests/MyRequestsPage";
import RequestProposalsPage from "./components/ServiceRequests/RequestProposalsPage";
import BrowseRequestsPage from "./components/ServiceRequests/BrowseRequestsPage";

export default function App() {
  const location = useLocation();
  const hideNavbarPaths = ["/login", "/register"];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}

      <Routes>
        {/* Landing & Authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/oauth-success" element={<OAuthSuccessRedirect />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Unified Role Dashboards (Single Host) */}
        <Route path="/admin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="/marketing-dashboard" element={<MarketingDashboard />} />
        <Route path="/support-dashboard" element={<CustomerSupportDashboard />} />
        <Route path="/provider-dashboard" element={<ProviderDashboard />} />
        <Route path="/corporate-dashboard" element={<CorporateDashboard />} />
        <Route path="/individual-dashboard" element={<IndividualDashboard />} />
        <Route path="/diaspora-dashboard" element={<DiasporaDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Task 1: Merchant Management Module Routes */}
        <Route path="/merchant/register" element={<MerchantRegistrationWorkflow />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboardView />} />
        <Route path="/merchant/profile" element={<MerchantProfileManagement />} />
        <Route path="/merchant/approval" element={<MerchantApprovalWorkflow />} />

        {/* Task 2: Customer Management Module Routes */}
        <Route path="/customer/register" element={<CustomerRegistration />} />
        <Route path="/customer/login" element={<CustomerAuthRecovery />} />
        <Route path="/customer/profile" element={<CustomerProfileManagement />} />

        {/* Services & Gifting */}
        <Route path="/gifting-options" element={<GiftingOptions />} />
        <Route path="/services" element={<ServiceList />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/membership/select" element={<SelectMembership />} />
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
        <Route path="/diaspora-test" element={<DiasporaTest />} />
        <Route path="/payment-options" element={<PaymentOptions />} />
        <Route path="/partner-with-us" element={<PartnerWithUs />} />
        <Route path="/career/:jobId" element={<ApplyForm />} />
        <Route path="/careers" element={<JobsList />} />

        {/* Communities */}
        <Route path="/community" element={<CommunitySelection />} />
        <Route path="/community/kidney" element={<KidneyPatientForm />} />
        <Route path="/community/membership" element={<WanawCommunityMembership />} />
        <Route path="/community/diaspora" element={<DiasporaJoinForm />} />
        <Route path="/community/support" element={<SupportCommunityForm />} />
        <Route path="/community/diplomatic" element={<DiplomaticCommunityForm />} />
        <Route path="/community/premium" element={<PremiumCommunitySubscription />} />
        <Route path="/premium-subscription-payment" element={<PremiumSubscriptionPayment />} />
        <Route path="/community/hemodialysis" element={<HemodialysisPatientsList />} />

        {/* Admin Management Sub-Routes */}
        <Route path="/admin/partner" element={<RegisteredPartners />} />
        <Route path="/admin/manage-membership" element={<ManageMemberships />} />
        <Route path="/admin/provider-verification" element={<ProviderVerification />} />
        <Route path="/admin/Support-community" element={<MembershipLookup />} />
        <Route path="/admin/community-list" element={<CommunityList />} />
        <Route path="/admin/diaspora-list" element={<DiasporaList />} />
        <Route path="/admin/patient-list" element={<KidneyPatientList />} />
        <Route path="/admin/diplomatic-community-list" element={<DiplomaticCommunityList />} />
        <Route path="/admin/gift-list-confirm" element={<GiftListAndConfirm />} />
        <Route path="/admin/purchase-list" element={<AdminPurchaseList />} />
        <Route path="/admin/subscrpition-list" element={<SubscribersList />} />
        <Route path="/admin/manage-services" element={<ManageServices />} />
        <Route path="/admin/add-program" element={<AdminAddProgram />} />
        <Route path="/admin/user-lists" element={<AdminUserList />} />
        <Route path="/admin/add-service" element={<AddService />} />
        <Route path="/admin/referal-code" element={<ReferralsDashboard />} />
        <Route path="/admin/add-gift" element={<AdminAddGift />} />
        <Route path="/admin/blog-create" element={<BlogCreate />} />
        <Route path="/admin/blog-list" element={<AdminBlogList />} />
        <Route path="/admin/job-posting" element={<AdminJobPost />} />
        <Route path="/admin/support-requests" element={<AdminSupportRequests />} />
        <Route path="/admin/applicant-list" element={<ApplicationsList />} />

        {/* Service Requests */}
        <Route path="/request-service" element={<RequestServiceForm />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/requests/:id" element={<RequestProposalsPage />} />
        <Route path="/provider/requests" element={<BrowseRequestsPage />} />

        {/* Fallback */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
