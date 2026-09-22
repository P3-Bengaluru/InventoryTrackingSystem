import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers3,
  MapPin,
  Plus,
  X,
} from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

const initialForm = {
  name: '',
  parent_id: '',
  code: '',
  address: '',
};

function normalizeLocationTree(nodes, parentId = null, result = []) {
  if (!Array.isArray(nodes)) return result;

  nodes.forEach((node) => {
    if (!node || node.id == null) return;

    const normalized = {
      ...node,
      parent_id: node.parent_id ?? parentId,
      level: Number(node.level || (parentId ? 2 : 1)),
    };

    // Keep only the location itself in the flat collection. Children are
    // flattened below so the existing tree renderer can work with either a
    // nested /tree response or a flat response.
    const children = Array.isArray(node.children) ? node.children : [];
    delete normalized.children;
    result.push(normalized);

    normalizeLocationTree(children, node.id, result);
  });

  return result;
}

function LocationForm({ locations, onClose, onCreated, notify }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const parents = useMemo(
    () =>
      locations
        .filter((location) => Number(location.level) < 3)
        .sort((a, b) => {
          const levelDiff = Number(a.level || 0) - Number(b.level || 0);
          return (
            levelDiff ||
            String(a.name || '').localeCompare(String(b.name || ''))
          );
        }),
    [locations]
  );

  const selectedParent = locations.find(
    (location) => String(location.id) === String(form.parent_id)
  );

  const calculatedLevel = selectedParent
    ? Number(selectedParent.level) + 1
    : 1;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id || null,
        code: form.code.trim().toUpperCase() || null,
        address:
          calculatedLevel === 1
            ? form.address.trim() || null
            : null,
      };

      await api.post('/api/locations', payload);

      notify('Location created successfully');
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create location failed', err);
      notify(err.message || 'Failed to create location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal modal-location-form" onSubmit={submit}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon">
              <MapPin size={18} />
            </div>
            <div>
              <p className="eyebrow">Organization / Locations</p>
              <h2>Add location</h2>
              <p className="modal-subtitle">
                Create a location and place it in the organization hierarchy.
              </p>
            </div>
          </div>

          <button
            className="icon-button modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <div className="form-section-icon"><MapPin size={15} /></div>
            <div>
              <strong>Location details</strong>
              <span>Name, hierarchy and location code</span>
            </div>
          </div>

          <div className="form-grid">
            <label className="full-field">
              <span className="field-label">
                Location name <span className="required">*</span>
              </span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Bangalore"
                autoComplete="off"
                required
              />
            </label>

            <label>
              Parent location
              <select name="parent_id" value={form.parent_id} onChange={handleChange}>
                <option value="">No parent · Top-level site</option>
                {parents.map((location) => (
                  <option key={location.id} value={location.id}>
                    {'· '.repeat(Math.max(Number(location.level || 1) - 1, 0))}
                    {location.name} {location.code ? `(${location.code})` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Resulting level
              <div className="location-level-preview">
                <span>L{calculatedLevel}</span>
                <small>
                  {calculatedLevel === 1
                    ? 'Top-level site'
                    : `Child of ${selectedParent?.name || 'selected parent'}`}
                </small>
              </div>
            </label>

            <label>
              Location code
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="BLR"
                maxLength={30}
                autoComplete="off"
              />
            </label>

            {calculatedLevel === 1 && (
              <label>
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Bangalore, Karnataka"
                  autoComplete="street-address"
                />
              </label>
            )}

            <div className="form-note full-field">
              <FolderTree size={14} />
              <span>
                {selectedParent
                  ? `This location will be created under ${selectedParent.name} at level ${calculatedLevel}.`
                  : 'No parent selected. This will create a top-level location at level 1.'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" icon={Plus} disabled={saving}>
            {saving ? 'Creating...' : 'Create location'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LocationNode({ location, childrenByParent, expanded, onToggle }) {
  const children = childrenByParent.get(String(location.id)) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(String(location.id));

  return (
    <div className="location-node">
      <div className="location-row">
        <button
          className={`location-expand ${hasChildren ? '' : 'is-empty'}`}
          type="button"
          onClick={() => hasChildren && onToggle(location.id)}
          aria-label={hasChildren ? (isExpanded ? 'Collapse location' : 'Expand location') : 'No child locations'}
        >
          {hasChildren
            ? (isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />)
            : <span />}
        </button>

        <div className="location-icon">
          {location.level === 1 ? <Building2 size={16} /> : <MapPin size={15} />}
        </div>

        <div className="location-copy">
          <strong>{location.name}</strong>
          <span>
            Level {location.level}
            {location.code ? ` · ${location.code}` : ''}
          </span>
        </div>

        <span className="location-level-badge">L{location.level}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="location-children">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              childrenByParent={childrenByParent}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Locations({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(new Set());

  const fetchLocations = async () => {
    try {
      setLoading(true);

      // The tree endpoint already returns the complete location hierarchy.
      const res = await api.get('/api/locations/tree');
      const raw = Array.isArray(res)
        ? res
        : res?.data?.locations || res?.data?.tree || res?.data || res?.locations || res?.tree || [];

      // /tree commonly returns nested children. Flatten it once while keeping
      // parent_id relationships so the UI can render and expand any depth.
      const flattened = normalizeLocationTree(raw);
      setItems(flattened);
    } catch (err) {
      console.error('Failed to fetch locations', err);
      notify(err.message || 'Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const childrenByParent = useMemo(() => {
    const map = new Map();

    items.forEach((location) => {
      const key = location.parent_id == null ? 'root' : String(location.parent_id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(location);
    });

    map.forEach((children) => {
      children.sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''))
      );
    });

    return map;
  }, [items]);

  const rootLocations = childrenByParent.get('root') || [];

  const stats = useMemo(() => {
    const levels = items.reduce((result, location) => {
      const level = Number(location.level || 1);
      result[level] = (result[level] || 0) + 1;
      return result;
    }, {});

    return {
      total: items.length,
      topLevel: rootLocations.length,
      deepest: Object.keys(levels).length ? Math.max(...Object.keys(levels).map(Number)) : 0,
      children: items.filter((location) => location.parent_id != null).length,
    };
  }, [items, rootLocations.length]);

  const toggleLocation = (id) => {
    setExpanded((current) => {
      const next = new Set(current);
      const key = String(id);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  };

  const expandAll = () => {
    setExpanded(new Set(
      items
        .filter((location) => childrenByParent.has(String(location.id)))
        .map((location) => String(location.id))
    ));
  };

  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Organization / Locations"
        title="Locations"
        description="Manage sites, departments, projects, and other locations in a hierarchical structure."
        action={
          <Button icon={Plus} onClick={() => setShowForm(true)}>
            Add location
          </Button>
        }
      />

      <div className="location-stat-grid">
        <div className="location-stat-card">
          <div className="location-stat-icon blue"><MapPin size={17} /></div>
          <div>
            <span>Total locations</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="location-stat-card">
          <div className="location-stat-icon green"><Building2 size={17} /></div>
          <div>
            <span>Top-level sites</span>
            <strong>{stats.topLevel}</strong>
          </div>
        </div>

        <div className="location-stat-card">
          <div className="location-stat-icon violet"><Layers3 size={17} /></div>
          <div>
            <span>Hierarchy depth</span>
            <strong>{stats.deepest || 0}</strong>
          </div>
        </div>

        <div className="location-stat-card">
          <div className="location-stat-icon amber"><FolderTree size={17} /></div>
          <div>
            <span>Nested locations</span>
            <strong>{stats.children}</strong>
          </div>
        </div>
      </div>

      <div className="panel location-panel">
        <div className="location-toolbar">
          <div>
            <h2>Location hierarchy</h2>
            <p>Browse the organization from site level down to projects and areas.</p>
          </div>

          <div className="location-toolbar-actions">
            <button type="button" className="location-text-button" onClick={expandAll}>
              Expand all
            </button>
            <button type="button" className="location-text-button" onClick={collapseAll}>
              Collapse all
            </button>
          </div>
        </div>

        <div className="location-tree">
          {loading ? (
            <div className="location-empty">
              <div className="empty-icon"><MapPin size={18} /></div>
              <h3>Loading locations</h3>
              <p>Fetching the location hierarchy...</p>
            </div>
          ) : rootLocations.length === 0 ? (
            <div className="location-empty">
              <div className="empty-icon"><MapPin size={18} /></div>
              <h3>No locations yet</h3>
              <p>Create your first top-level location to start the hierarchy.</p>
              <Button icon={Plus} onClick={() => setShowForm(true)}>Add location</Button>
            </div>
          ) : (
            rootLocations.map((location) => (
              <LocationNode
                key={location.id}
                location={location}
                childrenByParent={childrenByParent}
                expanded={expanded}
                onToggle={toggleLocation}
              />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <LocationForm
          locations={items}
          onClose={() => setShowForm(false)}
          onCreated={fetchLocations}
          notify={notify}
        />
      )}
    </div>
  );
}
