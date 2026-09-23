import { useState } from 'react';
import { BarChart3, Building2, GitBranch, MapPin, Package, Settings, ShoppingCart, Truck, Users } from 'lucide-react';
import { Sidebar, Topbar } from './components/layout';
import { Toast } from './components/ui';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import WorkflowList from './pages/Workflow';
import Procurement from './pages/Procurement';
import Management from './pages/Management';
import Reports from './pages/Reports';
import People from './pages/People';
import Categories from './pages/Categories';
import Locations from './pages/Location';
import Suppliers from './pages/Suppliers';
import { ClipboardList } from 'lucide-react';
import LoginView from './pages/LoginView';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState('');
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const navigate = (view) => setActiveView(view);

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    // Render the login page standalone (no app-shell/sidebar)
    return (
      <div className="login-screen">
        <LoginView />
      </div>
    );
  }

  const content = {
    dashboard: <Dashboard onNavigate={navigate} />,
    assets: <Assets notify={notify} />,
    assignments: <WorkflowList
      title="Assignments"
      eyebrow="Inventory / Assignments"
      description="Review checkouts, returns, and outstanding asset requests."
      icon={ClipboardList}
      endpoint="assignments"
      actionLabel="New assignment"
      onAction={() => notify('Assignment request form opened.')}
    />,
    reallocations: <WorkflowList
      title="Reallocations"
      eyebrow="Inventory / Reallocations"
      description="Move assigned assets between people with a clear approval trail."
      icon={GitBranch}
      endpoint="reallocations"
      actionLabel="Request reallocation"
      onAction={() => notify('Reallocation request form opened.')}
    />,
    procurement: <Procurement notify={notify} />,
    suppliers:<Suppliers notify={notify} />,
    categories:<Categories notify={notify} />,
    users: <People notify={notify} />,
    locations: <Locations notify={notify} />,
    reports: <Reports notify={notify} />,
    settings: <Management
      title="Settings"
      eyebrow="Workspace / Settings"
      description="Configure alerts, approvals, company details, and integrations."
      icon={Settings}
      onAdd={() => notify('Settings are already up to date.')}
      notify={notify}
      type="settings"
    />,
  }[activeView] || <Dashboard onNavigate={navigate} />;

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
        onLogout={logout}
      />
      <main className={`main ${collapsed ? 'main-expanded' : ''}`}>
        <Topbar
          user={user}
          onLogout={logout}
          onSearch={(value) => value && notify(`Searching for "${value}"`)}
          onHelp={() => notify('Help center is ready for your team.')}
        />
        <div className="content">{content}</div>
      </main>
      <Toast message={toast} />
    </div>
  );
}
