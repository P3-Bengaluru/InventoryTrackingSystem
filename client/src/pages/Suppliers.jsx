import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Building2, CheckCircle2, Globe, Mail, MapPin, Phone, Plus, Truck, UserRound, X } from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

const initialForm = {
  name: '', contact_person: '', email: '', phone: '', address: '',
  city: '', website: '', gstin: '', payment_terms: '', notes: '',
};

function normalizeList(response) {
  if (Array.isArray(response)) return { items: response, pagination: null };
  if (Array.isArray(response?.data)) return { items: response.data, pagination: response.pagination || null };
  if (Array.isArray(response?.data?.data)) {
    return { items: response.data.data, pagination: response.data.pagination || response.pagination || null };
  }
  return { items: [], pagination: response?.pagination || response?.data?.pagination || null };
}

function SupplierForm({ editingSupplier, onClose, onSaved, notify }) {
  const [form, setForm] = useState(editingSupplier ? {
    name: editingSupplier.name || '',
    contact_person: editingSupplier.contact_person || '',
    email: editingSupplier.email || '',
    phone: editingSupplier.phone || '',
    address: editingSupplier.address || '',
    city: editingSupplier.city || '',
    website: editingSupplier.website || '',
    gstin: editingSupplier.gstin || '',
    payment_terms: editingSupplier.payment_terms || '',
    notes: editingSupplier.notes || '',
  } : initialForm);
  const [saving, setSaving] = useState(false);

  const change = (e) => setForm((v) => ({ ...v, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return notify('Supplier name is required');

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        contact_person: form.contact_person.trim() || null,
        email: form.email.trim().toLowerCase() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        website: form.website.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        payment_terms: form.payment_terms.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingSupplier) {
        await api.put(`/api/suppliers/${editingSupplier.id}`, payload);
        notify('Supplier updated successfully');
      } else {
        await api.post('/api/suppliers', payload);
        notify('Supplier created successfully');
      }

      await onSaved();
      onClose();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <form className="modal supplier-modal" onSubmit={submit}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon"><Truck size={18} /></div>
            <div>
              <p className="eyebrow">Operations / Suppliers</p>
              <h2>{editingSupplier ? 'Edit supplier' : 'Add supplier'}</h2>
              <p className="modal-subtitle">
                {editingSupplier ? 'Update supplier contact and commercial information.' : 'Add a supplier to your procurement records.'}
              </p>
            </div>
          </div>
          <button className="icon-button modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="supplier-form-body">
          <div className="form-section">
            <div className="form-section-heading">
              <div className="form-section-icon"><Building2 size={15} /></div>
              <div><strong>Supplier information</strong><span>Basic supplier and contact details</span></div>
            </div>
            <div className="form-grid">
                 
              <label><span className="field-label">Supplier name <span className="required">*</span></span>
                <input name="name" value={form.name} onChange={change} placeholder="Supplier company name" required />
              </label>
              <label>Contact person
                <input name="contact_person" value={form.contact_person} onChange={change} placeholder="Primary contact" />
              </label>
              <label>Email
                <input type="email" name="email" value={form.email} onChange={change} placeholder="supplier@example.com" />
              </label>
              <label>Phone
                <input type="tel" name="phone" value={form.phone} onChange={change} placeholder="+91 98765 43210" />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <div className="form-section-icon"><MapPin size={15} /></div>
              <div><strong>Address</strong><span>Supplier location details</span></div>
            </div>
            <div className="form-grid">
              <label>City
                <input name="city" value={form.city} onChange={change} placeholder="Bengaluru" />
              </label>
              <label>Website
                <input type="url" name="website" value={form.website} onChange={change} placeholder="https://example.com" />
              </label>
              <label className="full-field">Address
                <textarea name="address" value={form.address} onChange={change} placeholder="Full supplier address" rows="3" />
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <div className="form-section-icon"><Truck size={15} /></div>
              <div><strong>Commercial details</strong><span>Tax and payment information</span></div>
            </div>
            <div className="form-grid">
              <label>GSTIN
                <input name="gstin" value={form.gstin} onChange={change} placeholder="GST identification number" />
              </label>
              <label>Payment terms
                <input name="payment_terms" value={form.payment_terms} onChange={change} placeholder="e.g. Net 30" />
              </label>
              <label className="full-field">Notes
                <textarea name="notes" value={form.notes} onChange={change} placeholder="Additional supplier notes" rows="3" />
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" icon={Plus} disabled={saving}>// todo: add some padding around the buttons
            {saving ? (editingSupplier ? 'Updating...' : 'Creating...') : (editingSupplier ? 'Update supplier' : 'Create supplier')}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SupplierCard({ supplier, onEdit, onDeactivate }) {
  return (
    <div className="supplier-card">
      <div className="supplier-card-top">
        <div className="supplier-avatar">{supplier.name?.charAt(0)?.toUpperCase() || 'S'}</div>
        <div className="supplier-title">
          <strong>{supplier.name}</strong>
          <span>{supplier.contact_person || 'No contact person'}</span>
        </div>
        <span className={`supplier-status ${supplier.is_active ? 'active' : 'inactive'}`}>
          {supplier.is_active ? <><CheckCircle2 size={12} /> Active</> : 'Inactive'}
        </span>
      </div>

      <div className="supplier-details">
        {supplier.email && <div><Mail size={14} /><span>{supplier.email}</span></div>}
        {supplier.phone && <div><Phone size={14} /><span>{supplier.phone}</span></div>}
        {supplier.city && <div><MapPin size={14} /><span>{supplier.city}</span></div>}
        {supplier.website && <div><Globe size={14} /><span>{supplier.website}</span></div>}
      </div>

      {(supplier.gstin || supplier.payment_terms) && (
        <div className="supplier-commercial">
          {supplier.gstin && <span><strong>GSTIN</strong>{supplier.gstin}</span>}
          {supplier.payment_terms && <span><strong>Terms</strong>{supplier.payment_terms}</span>}
        </div>
      )}

      <div className="supplier-card-footer">
        <button type="button" className="supplier-action-button" onClick={() => onEdit(supplier)}>Edit</button>
        {supplier.is_active && (
          <button type="button" className="supplier-action-button danger" onClick={() => onDeactivate(supplier)}>
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}

export default function Suppliers({ notify }) {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (activeOnly) params.is_active = true;

      const result = normalizeList(await api.get('/api/suppliers', { params }));
      setSuppliers(result.items);
      setPagination(result.pagination);
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 250);
    return () => clearTimeout(timer);
  }, [search, activeOnly]);

  const stats = useMemo(() => ({
    total: pagination?.total ?? suppliers.length,
    active: suppliers.filter((s) => s.is_active).length,
    inactive: suppliers.filter((s) => !s.is_active).length,
    withContact: suppliers.filter((s) => s.contact_person || s.email || s.phone).length,
  }), [suppliers, pagination]);

  const openCreate = () => {
    setEditingSupplier(null);
    setShowForm(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const deactivateSupplier = async (supplier) => {
    if (!window.confirm(`Deactivate "${supplier.name}"?`)) return;
    try {
      await api.post(`/api/suppliers/${supplier.id}/deactivate`);
      notify('Supplier deactivated successfully');
      await fetchSuppliers();
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to deactivate supplier');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations / Suppliers"
        title="Suppliers"
        description="Manage supplier contacts, commercial details and procurement relationships."
        action={<Button icon={Plus} onClick={openCreate}>Add supplier</Button>}
      />

      <div className="supplier-stat-grid">
        <div className="supplier-stat-card">
          <div className="supplier-stat-icon blue"><Truck size={17} /></div>
          <div><span>Total suppliers</span><strong>{stats.total}</strong></div>
        </div>
        <div className="supplier-stat-card">
          <div className="supplier-stat-icon green"><CheckCircle2 size={17} /></div>
          <div><span>Active suppliers</span><strong>{stats.active}</strong></div>
        </div>
        <div className="supplier-stat-card">
          <div className="supplier-stat-icon violet"><UserRound size={17} /></div>
          <div><span>With contact details</span><strong>{stats.withContact}</strong></div>
        </div>
        <div className="supplier-stat-card">
          <div className="supplier-stat-icon amber"><Building2 size={17} /></div>
          <div><span>Inactive suppliers</span><strong>{stats.inactive}</strong></div>
        </div>
      </div>

      <div className="panel suppliers-panel">
        <div className="suppliers-toolbar">
          <div>
            <h2>Supplier directory</h2>
            <p>View and manage supplier information used by procurement.</p>
          </div>
          <div className="supplier-toolbar-actions">
            <div className="supplier-search">
              <span>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..." />
            </div>
            <button type="button" className={`supplier-filter-button ${activeOnly ? 'active' : ''}`} onClick={() => setActiveOnly((v) => !v)}>
              Active only
            </button>
          </div>
        </div>

        <div className="suppliers-content">
          {loading ? (
            <div className="supplier-empty">
              <div className="empty-icon"><Truck size={18} /></div>
              <h3>Loading suppliers</h3>
              <p>Fetching the supplier directory...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="supplier-empty">
              <div className="empty-icon"><Truck size={18} /></div>
              <h3>No suppliers found</h3>
              <p>{search ? 'Try a different search term.' : 'Add your first supplier to start building the directory.'}</p>
              {!search && <Button icon={Plus} onClick={openCreate}>Add supplier</Button>}
            </div>
          ) : (
            <div className="supplier-grid">
              {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} onEdit={openEdit} onDeactivate={deactivateSupplier} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <SupplierForm
          editingSupplier={editingSupplier}
          onClose={() => { setShowForm(false); setEditingSupplier(null); }}
          onSaved={fetchSuppliers}
          notify={notify}
        />
      )}
    </div>
  );
}
