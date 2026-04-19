import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useApp } from './context/AppContext.jsx';

import HomePublic from './screens/HomePublic.jsx';
import Iscrizione from './screens/Iscrizione.jsx';
import Dashboard from './screens/Dashboard.jsx';
import PronosticiList from './screens/PronosticiList.jsx';
import Schedina from './screens/Schedina.jsx';
import Classifiche from './screens/Classifiche.jsx';
import Premi from './screens/Premi.jsx';
import Profilo from './screens/Profilo.jsx';
import Gruppi from './screens/Gruppi.jsx';
import LeadBoost from './screens/LeadBoost.jsx';
import PublicProfile from './screens/PublicProfile.jsx';
import SfidaMese from './screens/SfidaMese.jsx';
import Admin from './screens/Admin.jsx';

function Protected({ children }) {
  const { isAuthed, isSupabaseConfigured, loadingAuth } = useApp();
  // Senza Supabase configurato l'app resta navigabile come demo, così chi clona
  // il repo può esplorare la UI anche prima di aver collegato il DB.
  if (!isSupabaseConfigured) return children;
  if (loadingAuth) return null;
  if (!isAuthed) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <div className="b4f-fade-slide" key={location.pathname} style={{ width: '100%' }}>
        <Routes>
          <Route path="/" element={<HomePublic />} />
          <Route path="/iscrizione" element={<Iscrizione />} />
          <Route path="/home"            element={<Protected><Dashboard /></Protected>} />
          <Route path="/pronostici"      element={<Protected><PronosticiList /></Protected>} />
          <Route path="/pronostici/:id"  element={<Protected><Schedina /></Protected>} />
          <Route path="/classifiche"     element={<Protected><Classifiche /></Protected>} />
          <Route path="/premi"           element={<Protected><Premi /></Protected>} />
          <Route path="/gruppi"          element={<Protected><Gruppi /></Protected>} />
          <Route path="/boost"           element={<Protected><LeadBoost /></Protected>} />
          <Route path="/profilo"         element={<Protected><Profilo /></Protected>} />
          <Route path="/u/:handle"       element={<Protected><PublicProfile /></Protected>} />
          <Route path="/sfida"           element={<Protected><SfidaMese /></Protected>} />
          <Route path="/admin"           element={<Protected><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Layout>
  );
}
