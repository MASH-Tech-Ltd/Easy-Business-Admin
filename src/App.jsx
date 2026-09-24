import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "./components/layout/AdminLayout";
import RequireAuth from "./components/RequireAuth";
import { lazy, Suspense } from "react";
const Overview = lazy(() => import("./pages/Overview"));
const Packages = lazy(() => import("./pages/Packages"));
const Clients = lazy(() => import("./pages/Clients"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Health = lazy(() => import("./pages/Health"));
const Billing = lazy(() => import("./pages/Billing"));
const Logs = lazy(() => import("./pages/Logs"));
const Database = lazy(() => import("./pages/Database"));
const Security = lazy(() => import("./pages/Security"));
const Users = lazy(() => import("./pages/Users"));
const FraudChecks = lazy(() => import("./pages/FraudChecks"));
const CourierCredentials = lazy(() => import("./pages/CourierCredentials"));
const Addons = lazy(() => import("./pages/Addons"));
const CustomerIntelligence = lazy(() => import("./pages/CustomerIntelligence"));
const SupportList = lazy(() => import("./pages/SupportList"));
const SupportDetails = lazy(() => import("./pages/SupportDetails"));
const AddonRequests = lazy(() => import("./pages/AddonRequests"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const GlobalSettings = lazy(() => import("./pages/GlobalSettings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ContactInquiries = lazy(() => import("./pages/ContactInquiries"));

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="packages" element={<Packages />} />
            <Route path="clients" element={<Clients />} />
            <Route path="users" element={<Users />} />
            <Route path="health" element={<Health />} />
            <Route path="billing" element={<Billing />} />
            <Route path="addon-requests" element={<AddonRequests />} />
            <Route path="logs" element={<Logs />} />
            <Route path="database" element={<Database />} />
            <Route path="security" element={<Security />} />
            <Route path="fraud-checks" element={<FraudChecks />} />
            <Route path="intelligence" element={<CustomerIntelligence />} />
            <Route path="addons" element={<Addons />} />
            <Route path="courier-credentials" element={<CourierCredentials />} />
            <Route path="support" element={<SupportList />} />
            <Route path="support/:id" element={<SupportDetails />} />
            <Route path="contact-inquiries" element={<ContactInquiries />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<GlobalSettings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
