import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  BriefcaseBusiness,
  Building2,
  Check,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

const initialForm = {
  employee_id: '',
  name: '',
  email: '',
  password: '',
  role: 'engineer',
  manager_id: '',
  department: '',
  designation: '',
  phone: '',
  self_approve_limit: '0',
  budget_limit: '0',
};

function UserForm({ users, onClose, onCreated, notify }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const managers = useMemo(
    () => users.filter((user) => user.id && user.name),
    [users]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        employee_id: form.employee_id.trim(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        manager_id: form.manager_id || null,
        department: form.department.trim() || null,
        designation: form.designation.trim() || null,
        phone: form.phone.trim() || null,
        self_approve_limit: Number(form.self_approve_limit) || 0,
        budget_limit: Number(form.budget_limit) || 0,
      };

      await api.post('/api/users', payload);

      notify('User created successfully');
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create user failed', err);
      notify(err.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal modal-user-form" onSubmit={submit}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon">
              <User size={18} />
            </div>
            <div>
              <p className="eyebrow">Organization / People</p>
              <h2>Create user</h2>
              <p className="modal-subtitle">Add an employee and configure their access.</p>
            </div>
          </div>

          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <div className="form-section-icon"><User size={15} /></div>
            <div>
              <strong>Basic information</strong>
              <span>Employee identity and login details</span>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span className="field-label">
                Employee ID <span className="required">*</span>
              </span>
              <input
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                placeholder="EMP-001"
                autoComplete="off"
                required
              />
            </label>

            <label>
              <span className="field-label">
                Full name <span className="required">*</span>
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </label>

            <label>
              <span className="field-label">
                Email address <span className="required">*</span>
              </span>
              <span className="input-with-icon">
                <Mail size={14} />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label>
              Phone
              <span className="input-with-icon">
                <Phone size={14} />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </span>
            </label>

            <label className="full-field">
              <span className="field-label">
                Password <span className="required">*</span>
              </span>
              <span className="input-with-action">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a temporary password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <div className="form-section-icon"><BriefcaseBusiness size={15} /></div>
            <div>
              <strong>Organization details</strong>
              <span>Role, team and reporting structure</span>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span className="field-label">
                Role <span className="required">*</span>
              </span>
              <select name="role" value={form.role} onChange={handleChange} required>
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="project_manager">Project Manager</option>
                <option value="inventory_manager">Inventory Manager</option>
                <option value="admin">Admin</option>
                <option value="auditor">Auditor</option>
              </select>
            </label>

            <label>
              Manager
              <select name="manager_id" value={form.manager_id} onChange={handleChange}>
                <option value="">No manager</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}{manager.employee_id ? ` · ${manager.employee_id}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Department
              <span className="input-with-icon">
                <Building2 size={14} />
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Engineering"
                />
              </span>
            </label>

            <label>
              Designation
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Senior Engineer"
              />
            </label>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <div className="form-section-icon"><ShieldCheck size={15} /></div>
            <div>
              <strong>Approval limits</strong>
              <span>Optional spending limits for this user</span>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Self-approval limit
              <input
                name="self_approve_limit"
                type="number"
                min="0"
                step="1"
                value={form.self_approve_limit}
                onChange={handleChange}
                placeholder="0"
              />
            </label>

            <label>
              Budget limit
              <input
                name="budget_limit"
                type="number"
                min="0"
                step="1"
                value={form.budget_limit}
                onChange={handleChange}
                placeholder="0"
              />
            </label>

            <div className="form-note">
              <ShieldCheck size={14} />
              <span>Enter <strong>0</strong> when no approval limit is assigned.</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={saving ? Check : Plus} disabled={saving}>
            {saving ? 'Creating...' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function People({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users');
      const arr = Array.isArray(res) ? res : res.data || [];
      setItems(arr);
    } catch (err) {
      console.error('Failed to fetch users', err);
      notify(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Organization / People"
        title="People"
        description="Manage employees, roles, reporting lines, and approval limits."
        action={<Button icon={Plus} onClick={() => setShowForm(true)}>Add person</Button>}
      />

      <div className="management-grid">
        {loading ? (
          <p>Loading...</p>
        ) : (
          items.map((u) => (
            <div className="management-card" key={u.id}>
              <div className="management-icon"><User size={16} /></div>
              <div>
                <h3>{u.name}</h3>
                <p>{u.email} · {u.role}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <UserForm
          users={items}
          onClose={() => setShowForm(false)}
          onCreated={fetchUsers}
          notify={notify}
        />
      )}
    </div>
  );
}
