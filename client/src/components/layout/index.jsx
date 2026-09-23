import {
  Bell,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  GitBranch,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },

  {
    label: 'Inventory',
    items: [
      {
        id: 'assets',
        label: 'Assets',
        icon: Package,
      },
      {
        id: 'assignments',
        label: 'Assignments',
        icon: ClipboardList,
      },
      {
        id: 'reallocations',
        label: 'Reallocations',
        icon: GitBranch,
      },
    ],
  },

  {
    label: 'Operations',
    items: [
      {
        id: 'procurement',
        label: 'Procurement',
        icon: ShoppingCart,
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        icon: Truck,
      },
    ],
  },

  {
    label: 'Organization',
    items: [
      {
        id: 'users',
        label: 'People',
        icon: Users,
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: Layers,
      },
      {
        id: 'locations',
        label: 'Locations',
        icon: MapPin,
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: LayoutDashboard,
      },
    ],
  },
];

function getUserAvatar(user) {
  const initials =
    user?.name
      ?.match(/\b(\w)/g)
      ?.join('')
      ?.toUpperCase() || 'US';

  return initials.substring(0, 2);
}

export function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  user,
  onLogout,
}) {
  const avatar = getUserAvatar(user);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleToggleSidebar = () => {
    setCollapsed((current) => !current);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl((current) =>
      current ? null : event.currentTarget
    );
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
    handleClose();
    onLogout?.();
  };

  return (
    <>
      <aside
        className={`sidebar ${
          collapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <div className="brand">
          {/* Brand mark now also toggles the sidebar */}
          <button
            type="button"
            className="brand-mark"
            onClick={handleToggleSidebar}
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            <Package size={20} />
          </button>

          <div className="brand-name">
            <strong>
              P3<span> ITS</span>
            </strong>
            <small>Inventory Tracking System</small>
          </div>

          <button
            type="button"
            className="collapse-button"
            onClick={handleToggleSidebar}
            aria-label={
              collapsed
                ? 'Expand sidebar'
                : 'Collapse sidebar'
            }
          >
            <Menu size={17} />
          </button>
        </div>

        <div className="workspace-select">
          <div className="workspace-avatar">
            {avatar}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>

          <ChevronDown size={15} />
        </div>

        <nav>
          {navGroups.map((group) => (
            <div
              className="nav-group"
              key={group.label}
            >
              <span className="nav-label">
                {group.label}
              </span>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`nav-item ${
                      activeView === item.id
                        ? 'active'
                        : ''
                    }`}
                    onClick={() =>
                      setActiveView(item.id)
                    }
                  >
                    <Icon size={18} />

                    <span>{item.label}</span>

                    {item.id === 'procurement' && (
                      <b>3</b>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className={`nav-item ${
              activeView === 'settings'
                ? 'active'
                : ''
            }`}
            onClick={() => setActiveView('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="user-mini">
            <div
              className="avatar"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {avatar}
            </div>

            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {anchorEl && (
        <>
          {/* Outside click layer */}
          <div
            className="user-menu-overlay"
            onMouseDown={handleClose}
          />

          {/* Fixed menu so viewport coordinates are correct */}
          <div
            className="user-menu"
            style={{
              position: 'fixed',
              top: anchorEl.getBoundingClientRect().bottom + 6,
              left: anchorEl.getBoundingClientRect().left,
              zIndex: 1000,
              minWidth: '150px',
            }}
          >
            <button
              type="button"
              className="user-menu-item"
              onClick={handleViewProfile}
            >
              View Profile
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </>
  );
}

export function Topbar({
  user,
  onLogout,
  onSearch,
  onHelp,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const avatar = getUserAvatar(user);

  const handleClick = (event) => {
    event.stopPropagation();

    setAnchorEl((current) =>
      current ? null : event.currentTarget
    );
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
    handleClose();
    onLogout?.();
  };

  return (
    <>
      <header className="topbar">
        <div className="global-search">
          <span>⌕</span>

          <input
            onChange={(event) =>
              onSearch?.(event.target.value)
            }
            placeholder="Search assets, people, requests..."
          />

          <kbd>⌘ K</kbd>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="help-button"
            onClick={onHelp}
          >
            <CircleHelp size={17} />
            Help center
          </button>

          <button
            type="button"
            className="notification-button"
          >
            <Bell size={18} />
            <span />
          </button>

          <div className="topbar-avatar">
            <div
              className="avatar"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {avatar}
            </div>
          </div>
        </div>
      </header>

      {anchorEl && (
        <>
          <div
            className="user-menu-overlay"
            onMouseDown={handleClose}
          />

          <div
            className="user-menu topbar-user-menu"
            style={{
              position: 'fixed',
              top: anchorEl.getBoundingClientRect().bottom + 6,
              right:
                window.innerWidth -
                anchorEl.getBoundingClientRect().right,
              zIndex: 1000,
              minWidth: '150px',
            }}
          >
            <button
              type="button"
              className="user-menu-item"
              onClick={handleViewProfile}
            >
              View Profile
            </button>

            <button
              type="button"
              className="user-menu-item"
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </>
  );
}