import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Layers3,
  Package,
  Plus,
  X,
} from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

const initialForm = {
  name: '',
  parent_id: '',
  description: '',
  sort_order: 0,
};

function flattenCategories(nodes, result = []) {
  nodes.forEach((category) => {
    result.push(category);

    if (Array.isArray(category.children) && category.children.length) {
      flattenCategories(category.children, result);
    }
  });

  return result;
}

function CategoryParentName(category) {
  return category.name;
}

function CategoryForm({ categories, editingCategory, onClose, onSaved, notify }) {
  const [form, setForm] = useState(
    editingCategory
      ? {
          name: editingCategory.name || '',
          parent_id: editingCategory.parent_id || '',
          description: editingCategory.description || '',
          sort_order: editingCategory.sort_order ?? 0,
        }
      : initialForm
  );
  const [saving, setSaving] = useState(false);

  const parents = useMemo(
    () =>
      categories
        .filter((category) => !editingCategory || String(category.id) !== String(editingCategory.id))
        .sort((a, b) => {
          const levelDiff = Number(a.level || 0) - Number(b.level || 0);
          return (
            levelDiff ||
            String(a.name || '').localeCompare(String(b.name || ''))
          );
        }),
    [categories, editingCategory]
  );

  const selectedParent = categories.find(
    (category) => String(category.id) === String(form.parent_id)
  );

  const calculatedLevel = selectedParent
    ? Number(selectedParent.level || 1) + 1
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
        type: 'asset',
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, payload);
        notify('Category updated successfully');
      } else {
        await api.post('/api/categories', payload);
        notify('Category created successfully');
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Save category failed', err);
      notify(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="modal modal-category-form" onSubmit={submit}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-title-icon">
              <Package size={18} />
            </div>

            <div>
              <p className="eyebrow">Assets / Categories</p>
              <h2>{editingCategory ? 'Edit category' : 'Add category'}</h2>
              <p className="modal-subtitle">
                {editingCategory
                  ? 'Update the category and its asset classification details.'
                  : 'Create a category and place it in the asset hierarchy.'}
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
            <div className="form-section-icon">
              <Package size={15} />
            </div>

            <div>
              <strong>Category details</strong>
              <span>Name, hierarchy and asset classification</span>
            </div>
          </div>

          <div className="form-grid">
            <label className="full-field">
              Category name <span className="required">*</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Laptop"
                autoComplete="off"
                required
              />
            </label>

            <label>
              Parent category
              <select
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
              >
                <option value="">No parent · Top-level category</option>

                {parents.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'· '.repeat(Math.max(Number(category.level || 1) - 1, 0))}
                    {CategoryParentName(category)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Resulting level
              <div className="category-level-preview">
                <span>L{calculatedLevel}</span>
                <small>
                  {calculatedLevel === 1
                    ? 'Top-level category'
                    : `Child of ${selectedParent?.name || 'selected parent'}`}
                </small>
              </div>
            </label>

            <label>
              Sort order
              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                min="0"
              />
            </label>

            <label className="full-field">
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Laptop and notebook computers"
                rows="4"
              />
            </label>

            <div className="form-note full-field">
              <FolderTree size={14} />
              <span>
                {selectedParent
                  ? `This category will be created under ${selectedParent.name} at level ${calculatedLevel}.`
                  : 'No parent selected. This will create a top-level category at level 1.'}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" icon={Plus} disabled={saving}>
            {saving
              ? editingCategory
                ? 'Updating...'
                : 'Creating...'
              : editingCategory
                ? 'Update category'
                : 'Create category'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CategoryNode({ category, expanded, onToggle, onEdit, onDeactivate }) {
  const children = Array.isArray(category.children)
    ? category.children
    : [];

  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(String(category.id));

  return (
    <div className="category-node">
      <div className="category-row">
        <button
          className={`category-expand ${hasChildren ? '' : 'is-empty'}`}
          type="button"
          onClick={() => hasChildren && onToggle(category.id)}
          aria-label={
            hasChildren
              ? isExpanded
                ? 'Collapse category'
                : 'Expand category'
              : 'No child categories'
          }
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )
          ) : (
            <span />
          )}
        </button>

        <div className="category-icon">
          {Number(category.level) === 1 ? (
            <Package size={16} />
          ) : (
            <FolderTree size={15} />
          )}
        </div>

        <div className="category-copy">
          <strong>{category.name}</strong>
          <span>
            Level {category.level}
            {category.description ? ` · ${category.description}` : ''}
          </span>
        </div>

        <span className="category-level-badge">
          L{category.level}
        </span>

        <div className="category-row-actions">
          <button
            type="button"
            className="category-action-button"
            onClick={() => onEdit(category)}
          >
            Edit
          </button>

          {category.is_active && (
            <button
              type="button"
              className="category-action-button danger"
              onClick={() => onDeactivate(category)}
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="category-children">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Categories({ notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const fetchCategories = async () => {
    try {
      setLoading(true);

      const res = await api.get('/api/categories/tree');

      const tree = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];

      setItems(tree);

      setExpanded(
        new Set(
          flattenCategories(tree)
            .filter(
              (category) =>
                Array.isArray(category.children) &&
                category.children.length > 0
            )
            .map((category) => String(category.id))
        )
      );
    } catch (err) {
      console.error('Failed to fetch categories', err);
      notify(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const flatCategories = useMemo(
    () => flattenCategories(items),
    [items]
  );

  const stats = useMemo(() => {
    const levels = flatCategories.reduce((result, category) => {
      const level = Number(category.level || 1);
      result[level] = (result[level] || 0) + 1;
      return result;
    }, {});

    return {
      total: flatCategories.length,
      topLevel: items.length,
      deepest: Object.keys(levels).length
        ? Math.max(...Object.keys(levels).map(Number))
        : 0,
      children: flatCategories.filter(
        (category) => category.parent_id != null
      ).length,
    };
  }, [flatCategories, items]);

  const activeCount = flatCategories.filter(
    (category) => category.is_active
  ).length;

  const toggleCategory = (id) => {
    setExpanded((current) => {
      const next = new Set(current);
      const key = String(id);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const expandAll = () => {
    setExpanded(
      new Set(
        flatCategories
          .filter(
            (category) =>
              Array.isArray(category.children) &&
              category.children.length > 0
          )
          .map((category) => String(category.id))
      )
    );
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  const openCreate = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const deactivateCategory = async (category) => {
    if (!window.confirm(`Deactivate "${category.name}"?`)) return;

    try {
      await api.post(`/api/categories/${category.id}/deactivate`);
      notify('Category deactivated successfully');
      await fetchCategories();
    } catch (err) {
      console.error('Deactivate category failed', err);
      notify(err.message || 'Failed to deactivate category');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Assets / Categories"
        title="Categories"
        description="Manage asset categories and organize them in a hierarchical structure."
        action={
          <Button
            icon={Plus}
            onClick={openCreate}
          >
            Add category
          </Button>
        }
      />

      <div className="category-stat-grid">
        <div className="category-stat-card">
          <div className="category-stat-icon blue">
            <Package size={17} />
          </div>
          <div>
            <span>Total categories</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="category-stat-icon green">
            <Layers3 size={17} />
          </div>
          <div>
            <span>Top-level categories</span>
            <strong>{stats.topLevel}</strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="category-stat-icon violet">
            <FolderTree size={17} />
          </div>
          <div>
            <span>Hierarchy depth</span>
            <strong>{stats.deepest || 0}</strong>
          </div>
        </div>

        <div className="category-stat-card">
          <div className="category-stat-icon amber">
            <Package size={17} />
          </div>
          <div>
            <span>Active categories</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
      </div>

      <div className="panel category-panel">
        <div className="category-toolbar">
          <div>
            <h2>Category hierarchy</h2>
            <p>
              Browse asset categories from top-level groups down to nested
              classifications.
            </p>
          </div>

          <div className="category-toolbar-actions">
            <button
              type="button"
              className="category-text-button"
              onClick={expandAll}
            >
              Expand all
            </button>

            <button
              type="button"
              className="category-text-button"
              onClick={collapseAll}
            >
              Collapse all
            </button>
          </div>
        </div>

        <div className="category-tree">
          {loading ? (
            <div className="category-empty">
              <div className="empty-icon">
                <Package size={18} />
              </div>
              <h3>Loading categories</h3>
              <p>Fetching the category hierarchy...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="category-empty">
              <div className="empty-icon">
                <Package size={18} />
              </div>
              <h3>No categories yet</h3>
              <p>
                Create your first top-level category to start the hierarchy.
              </p>
              <Button
                icon={Plus}
                onClick={openCreate}
              >
                Add category
              </Button>
            </div>
          ) : (
            items.map((category) => (
              <CategoryNode
                key={category.id}
                category={category}
                expanded={expanded}
                onToggle={toggleCategory}
                onEdit={openEdit}
                onDeactivate={deactivateCategory}
              />
            ))
          )}
        </div>
      </div>

      {showForm && (
        <CategoryForm
          categories={flatCategories}
          editingCategory={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
          onSaved={fetchCategories}
          notify={notify}
        />
      )}
    </div>
  );
}
