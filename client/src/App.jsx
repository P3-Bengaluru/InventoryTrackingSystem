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
import { assignmentRows, initialAssets, initialRequests, managementItems, reallocationRows } from './data/mockData';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [assets, setAssets] = useState(initialAssets);
  const [requests, setRequests] = useState(initialRequests);
  const [toast, setToast] = useState('');
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const navigate = (view) => setActiveView(view);

  const content = {
    dashboard: <Dashboard onNavigate={navigate} />,
    assets: <Assets assets={assets} setAssets={setAssets} notify={notify} />,
    assignments: <WorkflowList title="Assignments" eyebrow="Inventory / Assignments" description="Review checkouts, returns, and outstanding asset requests." icon={ClipboardList} actionLabel="New assignment" onAction={() => notify('Assignment request form opened.')} rows={assignmentRows} />,
    reallocations: <WorkflowList title="Reallocations" eyebrow="Inventory / Reallocations" description="Move assigned assets between people with a clear approval trail." icon={GitBranch} actionLabel="Request reallocation" onAction={() => notify('Reallocation request form opened.')} rows={reallocationRows} />,
    procurement: <Procurement requests={requests} setRequests={setRequests} notify={notify} />,
    suppliers: <Management title="Suppliers" eyebrow="Operations / Suppliers" description="Keep purchasing contacts, terms, and vendor records current." icon={Truck} onAdd={() => notify('Supplier form opened.')} items={managementItems.suppliers} />,
    customers: <Management title="Customers" eyebrow="Operations / Customers" description="Track assets received from customers without mixing them with purchased inventory." icon={Building2} onAdd={() => notify('Customer form opened.')} items={managementItems.customers} />,
    users: <Management title="People" eyebrow="Organization / People" description="Manage employees, roles, reporting lines, and approval limits." icon={Users} onAdd={() => notify('People form opened.')} items={managementItems.users} />,
    locations: <Management title="Locations" eyebrow="Organization / Locations" description="Organize assets across cities, departments, and projects." icon={MapPin} onAdd={() => notify('Location form opened.')} items={managementItems.locations} />,
    reports: <Reports />,
    settings: <Management title="Settings" eyebrow="Workspace / Settings" description="Configure alerts, approvals, company details, and integrations." icon={Settings} onAdd={() => notify('Settings are already up to date.')} items={managementItems.settings} />,
  }[activeView] || <Dashboard onNavigate={navigate} />;

  return <div className="app-shell"><Sidebar activeView={activeView} setActiveView={setActiveView} collapsed={collapsed} setCollapsed={setCollapsed} /><main className={`main ${collapsed ? 'main-expanded' : ''}`}><Topbar onSearch={(value) => value && notify(`Searching for "${value}"`)} onHelp={() => notify('Help center is ready for your team.')} /><div className="content">{content}</div></main><Toast message={toast} /></div>;
}

import { ClipboardList } from 'lucide-react';
