import React, { useState } from 'react';
import Layout from './components/Layout';
import Overview from './components/Overview';
import IncidentTable from './components/IncidentTable';
import PolicyEngine from './components/PolicyEngine';
import Compliance from './components/Compliance';
import Login from './components/Login';
import { mockIncidents } from './mockData';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} onLogout={() => setUser(null)} activeView={activeView} setActiveView={setActiveView}>
      {activeView === 'overview' && (
        <>
          <Overview incidents={mockIncidents} />
          <IncidentTable incidents={mockIncidents} />
        </>
      )}
      {activeView === 'incidents' && (
        <IncidentTable incidents={mockIncidents} />
      )}
      {activeView === 'policies' && (
        <PolicyEngine />
      )}
      {activeView === 'compliance' && (
        <Compliance />
      )}
    </Layout>
  );
}
