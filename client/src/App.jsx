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
    suppliers: <Management
      title="Suppliers"
      eyebrow="Operations / Suppliers"
      description="Keep purchasing contacts, terms, and vendor records current."
      icon={Truck}
      onAdd={() => notify('Supplier form opened.')}
      notify={notify}
      type="suppliers"
    />,
    customers: <Management
      title="Customers"
      eyebrow="Operations / Customers"
      description="Track assets received from customers without mixing them with purchased inventory."
      icon={Building2}
      onAdd={() => notify('Customer form opened.')}
      notify={notify}
      type="customers"
    />,
    users: <Management
      title="People"
      eyebrow="Organization / People"
      description="Manage employees, roles, reporting lines, and approval limits."
      icon={Users}
      onAdd={() => notify('People form opened.')}
      notify={notify}
      type="users"
    />,
    locations: <Management
      title="Locations"
      eyebrow="Organization / Locations"
      description="Organize assets across cities, departments, and projects."
      icon={MapPin}
      onAdd={() => notify('Location form opened.')}
      notify={notify}
      type="locations"
    />,
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
