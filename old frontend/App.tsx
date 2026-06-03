// packages/frontend/src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../packages/frontend/stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import Profile from './pages/Profile';
import CreateGroup from './pages/CreateGroup';
import Layout from '../packages/frontend/components/Layout';

function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="groups/:groupId" element={<GroupDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="create-group" element={<CreateGroup />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;