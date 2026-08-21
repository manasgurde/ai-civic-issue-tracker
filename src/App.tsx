import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminZones from './pages/AdminZones';
import AdminWorkers from './pages/AdminWorkers';
import ComplaintNew from './pages/ComplaintNew';
import MapView from './pages/MapView';
import AdminMap from './pages/AdminMap';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaints" element={<Dashboard />} />
        <Route path="/complaints/new" element={<ComplaintNew />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Worker routes */}
        <Route path="/worker" element={<WorkerDashboard />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/complaints" element={<AdminComplaints />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/zones" element={<AdminZones />} />
        <Route path="/admin/map" element={<AdminMap />} />
        <Route path="/admin/workers" element={<AdminWorkers />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
