import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import {
  HodPortalLayout,
  PrincipalPortalLayout,
  UserPortalLayout,
  WorkerPortalLayout,
} from './App';
import { AuthProvider } from './lib/auth';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { ConfigPage } from './pages/principal/ConfigPage';
import { AuditPage } from './pages/principal/AuditPage';
import { PrincipalComplaintDetail } from './pages/principal/PrincipalComplaintDetail';
import { PrincipalComplaints } from './pages/principal/PrincipalComplaints';
import { PrincipalOverview } from './pages/principal/PrincipalOverview';
import { StaffPage } from './pages/principal/StaffPage';
import { HodComplaintDetail } from './pages/hod/HodComplaintDetail';
import { HodDashboard } from './pages/hod/HodDashboard';
import { HodEscalated } from './pages/hod/HodEscalated';
import { MyComplaints } from './pages/user/MyComplaints';
import { NewComplaint } from './pages/user/NewComplaint';
import { UserComplaintDetail } from './pages/user/UserComplaintDetail';
import { UserDashboard } from './pages/user/UserDashboard';
import { WorkerComplaintDetail } from './pages/worker/WorkerComplaintDetail';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';

export default function Root() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route path="/user" element={<UserPortalLayout />}>
            <Route index element={<UserDashboard />} />
            <Route path="new" element={<NewComplaint />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="complaints/:id" element={<UserComplaintDetail />} />
          </Route>

          <Route path="/worker" element={<WorkerPortalLayout />}>
            <Route index element={<WorkerDashboard />} />
            <Route path="complaints/:id" element={<WorkerComplaintDetail />} />
          </Route>

          <Route path="/hod" element={<HodPortalLayout />}>
            <Route index element={<HodDashboard />} />
            <Route path="escalated" element={<HodEscalated />} />
            <Route path="complaints/:id" element={<HodComplaintDetail />} />
          </Route>

          <Route path="/principal" element={<PrincipalPortalLayout />}>
            <Route index element={<PrincipalOverview />} />
            <Route path="complaints" element={<PrincipalComplaints />} />
            <Route path="complaints/:id" element={<PrincipalComplaintDetail />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="config" element={<ConfigPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
