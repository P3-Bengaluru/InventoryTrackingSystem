import { Bell, Building2, ChevronDown, CircleHelp, LayoutDashboard, Menu, MoreHorizontal, Package, Settings, ShoppingCart, Truck, Users, MapPin, ClipboardList, GitBranch } from 'lucide-react';

const navGroups = [
  { label: 'Workspace', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Inventory', items: [{ id: 'assets', label: 'Assets', icon: Package }, { id: 'assignments', label: 'Assignments', icon: ClipboardList }, { id: 'reallocations', label: 'Reallocations', icon: GitBranch }] },
  { label: 'Operations', items: [{ id: 'procurement', label: 'Procurement', icon: ShoppingCart }, { id: 'suppliers', label: 'Suppliers', icon: Truck }, { id: 'customers', label: 'Customers', icon: Building2 }] },
  { label: 'Organization', items: [{ id: 'users', label: 'People', icon: Users }, { id: 'locations', label: 'Locations', icon: MapPin }, { id: 'reports', label: 'Reports', icon: LayoutDashboard }] },
];

export function Sidebar({ activeView, setActiveView, collapsed, setCollapsed }) {
  return <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}><div className="brand"><div className="brand-mark"><Package size={20} /></div><div className="brand-name"><strong>nexa<span>desk</span></strong><small>Inventory OS</small></div><button className="collapse-button" onClick={() => setCollapsed(!collapsed)}><Menu size={17} /></button></div><div className="workspace-select"><div className="workspace-avatar">NS</div><div><strong>Northstar Labs</strong><span>Operations workspace</span></div><ChevronDown size={15} /></div><nav>{navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-label">{group.label}</span>{group.items.map((item) => <button key={item.id} className={`nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => setActiveView(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'procurement' && <b>3</b>}</button>)}</div>)}</nav><div className="sidebar-bottom"><button className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}><Settings size={18} /><span>Settings</span></button><div className="user-mini"><div className="avatar">AS</div><div><strong>Ananya Sen</strong><span>Administrator</span></div><button><MoreHorizontal size={16} /></button></div></div></aside>;
}

export function Topbar({ onSearch, onHelp }) {
  return <header className="topbar"><div className="global-search"><span>⌕</span><input onChange={(event) => onSearch(event.target.value)} placeholder="Search assets, people, requests..." /><kbd>⌘ K</kbd></div><div className="topbar-actions"><button className="help-button" onClick={onHelp}><CircleHelp size={17} /> Help center</button><button className="notification-button"><Bell size={18} /><span /></button><div className="topbar-avatar">AS</div></div></header>;
}
