import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from './components/layout/AdminLayout';
import RequireAuth from './components/RequireAuth';
import Overview from './pages/Overview';
import Packages from './pages/Packages';
import Clients from './pages/Clients';
import Login from './pages/Login';
import Register from './pages/Register';
import Health from './pages/Health';
import Billing from './pages/Billing';
import Logs from './pages/Logs';
import Database from './pages/Database';
import Security from './pages/Security';
import Users from './pages/Users';
import FraudChecks from './pages/FraudChecks';
import CourierCredentials from './pages/CourierCredentials';
import SupportList from './pages/SupportList';
import SupportDetails from './pages/SupportDetails';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      }>
        <Route index element={<Overview />} />
        <Route path="packages" element={<Packages />} />
        <Route path="clients" element={<Clients />} />
        <Route path="users" element={<Users />} />
        <Route path="health" element={<Health />} />
        <Route path="billing" element={<Billing />} />
        <Route path="logs" element={<Logs />} />
        <Route path="database" element={<Database />} />
        <Route path="security" element={<Security />} />
        <Route path="fraud-checks" element={<FraudChecks />} />
        <Route path="courier-credentials" element={<CourierCredentials />} />
        <Route path="support" element={<SupportList />} />
        <Route path="support/:id" element={<SupportDetails />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
