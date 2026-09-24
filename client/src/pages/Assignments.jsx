import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  ClipboardList,
  Check,
  X,
  LogIn,
  Eye,
  Clock3,
  Download,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

import api from '../lib/api';
import { Button, EmptyState, PageHeader } from '../components/ui';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatStatus(status) {
  if (!status) return '-';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
  switch (status) {
    case 'pending':
      return 'status-amber';
    case 'assigned':
      return 'status-green';
    case 'rejected':
      return 'status-red';
    case 'overdue':
      return 'status-red';
    case 'returned':
      return 'status-blue';
    default:
      return 'status-slate';
  }
}

function getAssetName(assignment) {
  return (
    assignment.asset_name ||
    assignment.asset?.name ||
    assignment.asset_number ||
    assignment.asset?.asset_number ||
    assignment.asset_id ||
    'Unknown asset'
  );
}

function getAssetNumber(assignment) {
  return assignment.asset_number || assignment.asset?.asset_number || '';
}

function getUserName(assignment) {
  return (
    assignment.user_name ||
    assignment.user?.name ||
    assignment.assigned_to_name ||
    assignment.user?.full_name ||
    assignment.user_id ||
    'Unknown user'
  );
}

function getUserEmployeeId(assignment) {
  return (
    assignment.employee_id ||
    assignment.user_employee_id ||
    assignment.user?.employee_id ||
    ''
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`assignment-status ${getStatusClass(status)}`}>
      <span className="assignment-status-dot" />
      {formatStatus(status)}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, tone = '' }) {
  return (
    <div className={`assignment-stat-card ${tone}`}>
      <div className="assignment-stat-icon">
        <Icon size={18} />
      </div>
      <div className="assignment-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function AssignmentForm({ onClose, onCreated, notify, assets, users }) {
  const [form, setForm] = useState({
    asset_id: '',
    user_id: '',
    request_reason: '',
    expected_return: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await api.post('/api/assignments', {
        asset_id: form.asset_id,
        user_id: form.user_id,
        request_reason: form.request_reason.trim() || null,
        expected_return: form.expected_return || null,
      });

      notify?.('Assignment created');
      onCreated();
      onClose();
    } catch (err) {
      console.error('Create assignment failed', err);
      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to create assignment'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop assignment-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form className="modal assignment-modal" onSubmit={submit}>
        <div className="assignment-modal-header">
          <div className="assignment-modal-title">
            <div className="assignment-modal-icon">
              <ClipboardList size={18} />
            </div>
            <div>
              <p className="eyebrow">Inventory / Assignments</p>
              <h2>Assign asset</h2>
              <p>
                Assign an available asset to an employee and define its return requirements.
              </p>
            </div>
          </div>

          <button
            className="assignment-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="assignment-form-section">
          <div className="assignment-section-heading">
            <div className="assignment-section-icon">
              <ClipboardList size={15} />
            </div>
            <div>
              <strong>Assignment details</strong>
              <span>Choose the asset, employee and return information.</span>
            </div>
          </div>

          <div className="assignment-form-grid">
            <label>
              <span className="assignment-field-label">
                Asset <span className="required">*</span>
              </span>
              <select
                name="asset_id"
                value={form.asset_id}
                onChange={handleChange}
                required
              >
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_number || asset.name}
                    {asset.name && asset.asset_number ? ` — ${asset.name}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="assignment-field-label">
                Assign To <span className="required">*</span>
              </span>
              <select
                name="user_id"
                value={form.user_id}
                onChange={handleChange}
                required
              >
                <option value="">Select employee</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.full_name || user.email}
                    {user.employee_id ? ` — ${user.employee_id}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="assignment-full-field">
              <span className="assignment-field-label">Request Reason</span>
              <textarea
                name="request_reason"
                value={form.request_reason}
                onChange={handleChange}
                placeholder="Reason for assigning this asset"
                rows={4}
              />
            </label>

            <label>
              <span className="assignment-field-label">Expected Return</span>
              <input
                type="date"
                name="expected_return"
                value={form.expected_return}
                onChange={handleChange}
              />
            </label>

          </div>
        </div>

        <div className="assignment-modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={Plus} disabled={saving}>
            {saving ? 'Creating...' : 'Create assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AssignmentDetails({ assignment, onClose }) {
  const formatDateTime = (value) => {
    if (!value) return 'N/A';

    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  if (!assignment) return null;

  return (
    <div
      className="modal-backdrop assignment-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal assignment-modal assignment-details-modal">

  <div className="assignment-modal-header">

    <div className="assignment-modal-title">

      <div className="assignment-modal-icon">
        <Eye size={18} />
      </div>

      <div>
        <p className="eyebrow">Assignment details</p>

        <h2>{getAssetName(assignment)}</h2>

        <p>
          Complete allocation history, approval, rejection and return
          information.
        </p>
      </div>

    </div>

    <button
      className="assignment-modal-close"
      type="button"
      onClick={onClose}
      aria-label="Close"
    >
      <X size={18} />
    </button>

  </div>

  {/* Basic Assignment Information */}
  <div className="assignment-detail-grid">

    <div className="assignment-info-block">
      <span>Asset</span>
      <strong>
        {getAssetName(assignment)}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Asset Number</span>
      <strong>
        {getAssetNumber(assignment) || '-'}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Assigned To</span>
      <strong>
        {getUserName(assignment)}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Employee ID</span>
      <strong>
        {getUserEmployeeId(assignment) || '-'}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Status</span>
      <strong>
        <StatusBadge status={assignment.status} />
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Requested At</span>
      <strong>
        {formatDateTime(assignment.requested_at)}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Assigned Since</span>
      <strong>
        {formatDate(assignment.assigned_since)}
      </strong>
    </div>

    <div className="assignment-info-block">
      <span>Expected Return</span>
      <strong>
        {formatDate(assignment.expected_return)}
      </strong>
    </div>

  </div>


  {/* Approval Information */}
  {(assignment.approved_at || assignment.approved_by) && (
    <div className="assignment-detail-section">

      <span>Approval Information</span>

      <div className="assignment-detail-grid">

        <div className="assignment-info-block">
          <span>Approved At</span>
          <strong>
            {formatDateTime(assignment.approved_at)}
          </strong>
        </div>

        <div className="assignment-info-block">
          <span>Approved By</span>
          <strong>
            {assignment.approver_name || '-'}
          </strong>
        </div>

      </div>

    </div>
  )}


  {/* Rejection Information */}
  {(assignment.rejected_at || assignment.rejection_reason) && (
    <div className="assignment-detail-section rejection-detail">

      <span>Rejection Information</span>

      <div className="assignment-detail-grid">

        <div className="assignment-info-block">
          <span>Rejected At</span>
          <strong>
            {formatDateTime(assignment.rejected_at)}
          </strong>
        </div>

        <div className="assignment-info-block">
          <span>Rejected By</span>
          <strong>
            {assignment.approver_name || '-'}
          </strong>
        </div>

      </div>

      {assignment.rejection_reason && (
        <div className="assignment-detail-section">
          <span>Rejection Reason</span>
          <p>
            {assignment.rejection_reason}
          </p>
        </div>
      )}

    </div>
  )}


  {/* Request Information */}
  <div className="assignment-detail-section">

    <span>Request Reason</span>

    <p>
      {assignment.request_reason || 'No reason provided.'}
    </p>

  </div>


  {/* Return Information */}
  {(assignment.returned_at ||
    assignment.return_condition ||
    assignment.return_notes) && (

    <div className="assignment-detail-section">

      <span>Return Information</span>

      <div className="assignment-detail-grid">

        <div className="assignment-info-block">
          <span>Returned At</span>
          <strong>
            {formatDateTime(assignment.returned_at)}
          </strong>
        </div>

        <div className="assignment-info-block">
          <span>Return Condition</span>
          <strong>
            {assignment.return_condition || '-'}
          </strong>
        </div>

      </div>

      {assignment.return_notes && (
        <div className="assignment-detail-section">
          <span>Return Notes</span>

          <p>
            {assignment.return_notes}
          </p>
        </div>
      )}

    </div>
  )}


  {/* Record Information */}
  <div className="assignment-detail-section">

    <span>Record Information</span>

    <div className="assignment-detail-grid">

      <div className="assignment-info-block">
        <span>Assignment ID</span>
        <strong>
          {assignment.id || '-'}
        </strong>
      </div>

      <div className="assignment-info-block">
        <span>Created At</span>
        <strong>
          {formatDateTime(assignment.created_at)}
        </strong>
      </div>

      <div className="assignment-info-block">
        <span>Last Updated</span>
        <strong>
          {formatDateTime(assignment.updated_at)}
        </strong>
      </div>

    </div>

  </div>


  {/* Modal Actions */}
  <div className="assignment-modal-actions">

    <Button onClick={onClose}>
      Close
    </Button>

  </div>

</div>
    </div>
  );
}

export default function Assignments({ notify }) {
  const [assignments, setAssignments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All assignments');
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [exporting, setExporting] = useState(false);
  const handleExportCSV = async () => {
    try {
      setExporting(true);

      // Fetch all assignments, not just the current page
      const response = await api.get('/api/assignments', {
        params: {
          page: 1,
          limit: 100000,
        },
      });

      const assignments = Array.isArray(response?.data)
        ? response.data
        : [];

      if (!assignments.length) {
        notify?.('No assignments available to export.');
        return;
      }

      const formatCSVDateTime = (value) => {
        if (!value) return '';

        return new Date(value).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      };

      const formatCSVDate = (value) => {
        if (!value) return '';

        return new Date(value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      };

      const escapeCSV = (value) => {
        if (value === null || value === undefined) {
          return '';
        }

        const stringValue = String(value);

        return `"${stringValue.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Assignment ID',
        'Asset Number',
        'Asset Name',
        'Employee ID',
        'Assigned To',
        'Status',
        'Requested At',
        'Approved At',
        'Approved By',
        'Rejected At',
        'Assigned Since',
        'Expected Return',
        'Returned At',
        'Return Condition',
        'Request Reason',
        'Rejection Reason',
        'Return Notes',
        'Created At',
        'Updated At',
      ];

      const rows = assignments.map((assignment) => [
        assignment.id,
        assignment.asset_number,
        assignment.asset_name,
        assignment.user_employee_id,
        assignment.user_name,
        assignment.status,
        formatCSVDateTime(assignment.requested_at),
        formatCSVDateTime(assignment.approved_at),
        assignment.approver_name,
        formatCSVDateTime(assignment.rejected_at),
        formatCSVDate(assignment.assigned_since),
        formatCSVDate(assignment.expected_return),
        formatCSVDateTime(assignment.returned_at),
        assignment.return_condition,
        assignment.request_reason,
        assignment.rejection_reason,
        assignment.return_notes,
        formatCSVDateTime(assignment.created_at),
        formatCSVDateTime(assignment.updated_at),
      ]);

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) => row.map(escapeCSV).join(',')),
      ].join('\r\n');

      const blob = new Blob(
        [csvContent],
        { type: 'text/csv;charset=utf-8;' }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = `assignments_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      notify?.(
        `${assignments.length} assignments exported successfully.`
      );
    } catch (error) {
      console.error('Failed to export assignments:', error);

      notify?.(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to export assignments.'
      );
    } finally {
      setExporting(false);
    }
  };
  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const response = await api.get('/api/assignments', {
        params: {
          page,
          limit: 25,
        },
      });
      // api.js already returns response.data
      const assignmentRows = Array.isArray(response?.data)
        ? response.data
        : [];

      setAssignments(assignmentRows);

      setPagination({
        page: response?.pagination?.page || 1,
        limit: response?.pagination?.limit || 25,
        total: response?.pagination?.total ?? assignmentRows.length,
        totalPages:
          response?.pagination?.totalPages ??
          (assignmentRows.length > 0 ? 1 : 0),
      });
    } catch (err) {
      console.error(
        'Failed to fetch assignments:',
        err
      );

      console.error(
        'Assignment API error:',
        err?.response?.data || err
      );

      notify?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch assignments'
      );

      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchFormData = async () => {
    try {
      const [assetsResponse, usersResponse] = await Promise.all([
        api.get('/api/assets?limit=1000'),
        api.get('/api/users?limit=1000'),
      ]);

      const assetResult = assetsResponse?.data || assetsResponse;
      const userResult = usersResponse?.data || usersResponse;

      setAssets(
        Array.isArray(assetResult?.data)
          ? assetResult.data
          : Array.isArray(assetResult)
            ? assetResult
            : []
      );

      setUsers(
        Array.isArray(userResult?.data)
          ? userResult.data
          : Array.isArray(userResult)
            ? userResult
            : []
      );
    } catch (err) {
      console.error('Failed to fetch assignment form data', err);
      notify?.('Failed to load assets and employees');
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [page]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesFilter =
        filter === 'All assignments' || assignment.status === filter;

      const searchableText = `
        ${getAssetName(assignment)}
        ${getAssetNumber(assignment)}
        ${getUserName(assignment)}
        ${getUserEmployeeId(assignment)}
        ${assignment.request_reason || ''}
        ${assignment.status || ''}
      `.toLowerCase();

      return matchesFilter && (!query || searchableText.includes(query));
    });
  }, [assignments, search, filter]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      pending: assignments.filter((item) => item.status === 'pending').length,
      assigned: assignments.filter((item) => item.status === 'assigned').length,
      returned: assignments.filter((item) => item.status === 'returned').length,
    }),
    [assignments, pagination.total]
  );

  const openCreateForm = async () => {
    await fetchFormData();
    setShowForm(true);
  };

  const approveAssignment = async (assignment) => {
    try {
      await api.post(`/api/assignments/${assignment.id}/approve`);
      notify?.('Assignment approved');
      fetchAssignments();
    } catch (err) {
      console.error('Approve assignment failed', err);
      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to approve assignment'
      );
    }
  };

  const rejectAssignment = async (assignment) => {
    const reason = window.prompt('Enter rejection reason');
    if (reason === null) return;

    try {
      await api.post(`/api/assignments/${assignment.id}/reject`, {
        rejection_reason: reason || null,
      });
      notify?.('Assignment rejected');
      fetchAssignments();
    } catch (err) {
      console.error('Reject assignment failed', err);
      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to reject assignment'
      );
    }
  };

  const checkInAssignment = async (assignment) => {
    const confirmed = window.confirm(`Check in ${getAssetName(assignment)}?`);
    if (!confirmed) return;

    try {
      await api.post(`/api/assignments/${assignment.id}/check-in`, {});
      notify?.('Asset checked in');
      fetchAssignments();
    } catch (err) {
      console.error('Check-in failed', err);
      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to check in asset'
      );
    }
  };

  const clearSearch = () => {
    setSearch('');
    setFilter('All assignments');
    setPage(1);
  };

  const goToPage = (nextPage) => {
    if (
      nextPage < 1 ||
      (pagination.totalPages && nextPage > pagination.totalPages)
    ) {
      return;
    }
    setPage(nextPage);
  };

  return (
    <div className="page-stack assignments-page">
      <PageHeader
        eyebrow="Inventory / Assignments"
        title="Assignments"
        description="Manage asset assignments and track returns."
        action={
          <Button icon={Plus} onClick={openCreateForm}>
            Assign asset
          </Button>
        }
      />

      <div className="assignment-stats">
        <StatCard
          icon={ClipboardList}
          label="Total assignments"
          value={stats.total}
        />
        <StatCard
          icon={Clock3}
          label="Pending"
          value={stats.pending}
          tone="stat-amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Assigned"
          value={stats.assigned}
          tone="stat-green"
        />
        <StatCard
          icon={RotateCcw}
          label="Returned"
          value={stats.returned}
          tone="stat-purple"
        />
      </div>

      <div className="panel assignments-panel">
        <div className="assignment-panel-heading">
          <div>
            <p className="eyebrow">Assignment directory</p>
            <h2>Asset assignments</h2>
            <span>Review current allocations and take action on pending requests.</span>
          </div>
          <span className="assignment-result-count">
            {filteredAssignments.length} shown
          </span>
        </div>

        <div className="assignment-toolbar">
          <div className="assignment-search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by asset, employee, or reason..."
            />
          </div>

          <div className="assignment-toolbar-actions">
            <select
              className="assignment-filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="All assignments">All assignments</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="rejected">Rejected</option>
              <option value="overdue">Overdue</option>
              <option value="returned">Returned</option>
            </select>

            {(search || filter !== 'All assignments') && (
              <Button variant="secondary" onClick={clearSearch}>
                Clear
              </Button>
            )}
            {/* export button */}
            <button
              type="button"
              className="assignment-refresh-button"
              onClick={handleExportCSV}
              disabled={exporting}
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download size={17} />
            </button>
            <button
              className="assignment-refresh-button"
              type="button"
              onClick={fetchAssignments}
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="assignment-list">
          {loading ? (
            <div className="assignment-loading">
              <RefreshCw size={19} className="assignment-spin" />
              <span>Loading assignments...</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No assignments found"
              description={
                search || filter !== 'All assignments'
                  ? 'Try changing your search or filter.'
                  : 'No asset assignments have been created yet.'
              }
            />
          ) : (
            filteredAssignments.map((assignment) => (
              <div className="assignment-row" key={assignment.id}>
                <div className="assignment-main">
                  <div className="assignment-icon">
                    <ClipboardList size={18} />
                  </div>

                  <div className="assignment-primary">
                    <div className="assignment-title-row">
                      <h3>{getAssetName(assignment)}</h3>
                      <StatusBadge status={assignment.status} />
                    </div>

                    <div className="assignment-meta">
                      <span>
                        Asset <strong>{getAssetNumber(assignment) || '-'}</strong>
                      </span>
                      <span>
                        Assigned to <strong>{getUserName(assignment)}</strong>
                      </span>
                      {getUserEmployeeId(assignment) && (
                        <span>
                          Employee ID <strong>{getUserEmployeeId(assignment)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="assignment-return">
                  <span>Expected return</span>
                  <strong>{formatDate(assignment.expected_return)}</strong>
                </div>

                <div className="assignment-actions">
                  <button
                    className="assignment-row-action"
                    type="button"
                    title="View assignment"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <Eye size={15} />
                  </button>

                  {assignment.status === 'pending' && (
                    <>
                      <button
                        className="assignment-row-action assignment-action-success"
                        type="button"
                        title="Approve"
                        onClick={() => approveAssignment(assignment)}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        className="assignment-row-action assignment-action-danger"
                        type="button"
                        title="Reject"
                        onClick={() => rejectAssignment(assignment)}
                      >
                        <X size={15} />
                      </button>
                    </>
                  )}

                  {(assignment.status === 'assigned' || assignment.status === 'overdue') && (
                    <button
                      className="assignment-row-action assignment-action-primary"
                      type="button"
                      title="Check in"
                      onClick={() => checkInAssignment(assignment)}
                    >
                      <LogIn size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && pagination.totalPages > 0 && (
          <div className="assignment-pagination">
            <span>
              Page {pagination.page} of {pagination.totalPages}
              {pagination.total ? ` • ${pagination.total} total` : ''}
            </span>

            <div className="assignment-pagination-actions">
              <button
                type="button"
                className="assignment-pagination-button"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </button>

              {Array.from(
                { length: Math.min(pagination.totalPages, 5) },
                (_, index) => {
                  let pageNumber = index + 1;

                  if (pagination.totalPages > 5) {
                    if (
                      pagination.page >= 4 &&
                      pagination.page <= pagination.totalPages - 2
                    ) {
                      pageNumber = pagination.page - 2 + index;
                    } else if (pagination.page > pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index;
                    }
                  }

                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`assignment-pagination-number ${
                        pagination.page === pageNumber ? 'active' : ''
                      }`}
                      onClick={() => goToPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                }
              )}

              <button
                type="button"
                className="assignment-pagination-button"
                disabled={
                  !pagination.totalPages ||
                  pagination.page >= pagination.totalPages
                }
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AssignmentForm
          assets={assets}
          users={users}
          onClose={() => setShowForm(false)}
          onCreated={fetchAssignments}
          notify={notify}
        />
      )}

      {selectedAssignment && (
        <AssignmentDetails
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}
