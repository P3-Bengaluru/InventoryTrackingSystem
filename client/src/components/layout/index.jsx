import { Bell, Building2, ChevronDown, CircleHelp, LayoutDashboard, Menu, MoreHorizontal, Package, Settings, ShoppingCart, Truck, Users, MapPin, ClipboardList, GitBranch, Layers } from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  { label: 'Workspace', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { label: 'Inventory', items: [{ id: 'assets', label: 'Assets', icon: Package }, { id: 'assignments', label: 'Assignments', icon: ClipboardList }, { id: 'reallocations', label: 'Reallocations', icon: GitBranch }] },
  { label: 'Operations', items: [{ id: 'procurement', label: 'Procurement', icon: ShoppingCart }, { id: 'suppliers', label: 'Suppliers', icon: Truck }, ] },
  { label: 'Organization', items: [{ id: 'users', label: 'People', icon: Users }, { id: 'categories', label: 'Categories', icon: Layers }, { id: 'locations', label: 'Locations', icon: MapPin }, { id: 'reports', label: 'Reports', icon: LayoutDashboard }] },
];

export function Sidebar({ activeView, setActiveView, collapsed, setCollapsed, user, onLogout }) {
  const initials = user?.name?.match(/\b(\w)/g)?.join('').toUpperCase() || 'US';
  const avatar = initials.substring(0, 2);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    // TODO: navigate to profile page
    alert('View profile not implemented');
    handleClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    handleClose();
  };

  // Calculate menu position
  let menuStyle = {};
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    menuStyle = {
      position: 'absolute',
      top: `${rect.bottom}px`,
      left: `${rect.left}px`,
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '150px',
      padding: '8px 0',
    };
  }

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Package size={20} /></div>
          <div className="brand-name">
            <strong>nexa<span>desk</span></strong>
            <small>Inventory OS</small>
          </div>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)}>
            <Menu size={17} />
          </button>
        </div>
        <div className="workspace-select">
          <div className="workspace-avatar">{avatar}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => setActiveView(item.id)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.id === 'procurement' && <b>3</b>}
                </button>
              ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveView('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <div className="user-mini" style={{ position: 'relative' }}>
          <div className="avatar" onClick={handleClick} style={{ cursor: 'pointer' }}>
            {avatar}
          </div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
          {/* User menu */}
          {anchorEl && (
            <div style={menuStyle}>
              <div className="user-menu-item" onClick={handleViewProfile} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                View Profile
              </div>
              <div className="user-menu-item" onClick={handleLogoutClick} style={{ padding: '8px 16px', cursor: 'pointer', borderTop: '1px solid #eee' }}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
    {/* Close menu when clicking outside */}
    <div onMouseDown={(e) => {
      if (anchorEl && !e.target.closest('.user-mini') && !e.target.closest('.user-menu')) {
        handleClose();
      }
    }} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: anchorEl ? 'auto' : 'none' }} />
    </>
  );
}

export function Topbar({ user, onLogout, onSearch, onHelp }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const initials = user?.name?.match(/\b(\w)/g)?.join('').toUpperCase() || 'US';
  const avatar = initials.substring(0, 2);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewProfile = () => {
    // TODO: navigate to profile page
    alert('View profile not implemented');
    handleClose();
  };

  const handleLogoutClick = () => {
    onLogout();
    handleClose();
  };

  // Calculate menu position
  let menuStyle = {};
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    menuStyle = {
      position: 'absolute',
      top: `${rect.bottom}px`,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      zIndex: 1000,
      minWidth: '150px',
      padding: '8px 0',
    };
  }

  return (
    <header className="topbar">
      <div className="global-search">
        <span>⌕</span>
        <input
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search assets, people, requests..."
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="topbar-actions">
        <button className="help-button" onClick={onHelp}>
          <CircleHelp size={17} />
          Help center
        </button>
        <button className="notification-button">
          <Bell size={18} />
          <span />
        </button>
        <div className="topbar-avatar" style={{ position: 'relative' }}>
          <div className="avatar" onClick={handleClick} style={{ cursor: 'pointer' }}>
            {avatar}
          </div>
          {/* User menu */}
          {anchorEl && (
            <div style={menuStyle}>
              <div className="user-menu-item" onClick={handleViewProfile} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                View Profile
              </div>
              <div className="user-menu-item" onClick={handleLogoutClick} style={{ padding: '8px 16px', cursor: 'pointer', borderTop: '1px solid #eee' }}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
