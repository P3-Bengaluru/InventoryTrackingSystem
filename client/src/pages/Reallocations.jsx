import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  ArrowRightLeft,
  Check,
  X,
  Eye,
  Clock3,
  Download,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

import api from '../lib/api';
import { Button, EmptyState, PageHeader } from '../components/ui';

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

    case 'approved':
      return 'status-green';

    case 'rejected':
      return 'status-red';

    case 'completed':
      return 'status-blue';

    default:
      return 'status-slate';
  }
}

function getAssetName(reallocation) {
  return (
    reallocation.asset_name ||
    reallocation.asset?.name ||
    reallocation.asset_number ||
    reallocation.asset?.asset_number ||
    reallocation.asset_id ||
    'Unknown asset'
  );
}

function getAssetNumber(reallocation) {
  return (
    reallocation.asset_number ||
    reallocation.asset?.asset_number ||
    ''
  );
}

function getFromUserName(reallocation) {
  return (
    reallocation.from_user_name ||
    reallocation.fromUser?.name ||
    reallocation.from_user?.name ||
    reallocation.from_user?.full_name ||
    reallocation.from_user_id ||
    'Unknown user'
  );
}

function getToUserName(reallocation) {
  return (
    reallocation.to_user_name ||
    reallocation.toUser?.name ||
    reallocation.to_user?.name ||
    reallocation.to_user?.full_name ||
    reallocation.to_user_id ||
    'Unknown user'
  );
}

function getRequestedByName(reallocation) {
  return (
    reallocation.requested_by_name ||
    reallocation.requestedBy?.name ||
    reallocation.requested_by_user?.name ||
    reallocation.requested_by ||
    'Unknown user'
  );
}

function getApproverName(reallocation) {
  return (
    reallocation.approver_name ||
    reallocation.approver?.name ||
    '-'
  );
}

function getAssetAssignedToId(asset) {
  return asset?.assigned_to || '';
}

function getUserName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.email ||
    user?.id ||
    'Unknown user'
  );
}

function getUserEmployeeId(user) {
  return (
    user?.employee_id ||
    user?.employeeId ||
    ''
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({ status }) {
  return (
    <span className={`assignment-status ${getStatusClass(status)}`}>
      <span className="assignment-status-dot" />
      {formatStatus(status)}
    </span>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

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

/* =========================================================
   REALLOCATION FORM
   ========================================================= */

function ReallocationForm({
  onClose,
  onCreated,
  notify,
  assets,
  users,
}) {
  const [form, setForm] = useState({
    asset_id: '',
    to_user_id: '',
    reason: '',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  const assignedAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset?.status === 'assigned' &&
        asset?.is_active !== false
    );
  }, [assets]);

  const selectedAsset = useMemo(() => {
    return assets.find(
      (asset) => asset.id === form.asset_id
    );
  }, [assets, form.asset_id]);

  const currentAssigneeId =
    getAssetAssignedToId(selectedAsset);

  const currentAssignee = useMemo(() => {
    return users.find(
      (user) => user.id === currentAssigneeId
    );
  }, [users, currentAssigneeId]);

  const targetUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user?.is_active !== false &&
        user.id !== currentAssigneeId
    );
  }, [users, currentAssigneeId]);

  const currentAssigneeName =
    currentAssignee?.name ||
    currentAssignee?.full_name ||
    selectedAsset?.assigned_to_name ||
    currentAssigneeId ||
    'Current assignee unavailable';

  const currentAssigneeEmployeeId =
    getUserEmployeeId(currentAssignee) ||
    selectedAsset?.assigned_to_employee_id ||
    '';

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'asset_id') {
      setForm((current) => ({
        ...current,
        asset_id: value,
        to_user_id: '',
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      await api.post('/api/reallocations', {
        asset_id: form.asset_id,
        to_user_id: form.to_user_id,
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null,
      });

      notify?.('Reallocation request created');

      onCreated();
      onClose();
    } catch (err) {
      console.error(
        'Create reallocation failed',
        err
      );

      notify?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to create reallocation request'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop assignment-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        className="modal assignment-modal"
        onSubmit={submit}
      >
        {/* -------------------------------------------------
            MODAL HEADER
        ------------------------------------------------- */}

        <div className="assignment-modal-header">
          <div className="assignment-modal-title">
            <div className="assignment-modal-icon">
              <ArrowRightLeft size={18} />
            </div>

            <div>
              <p className="eyebrow">
                Inventory / Reallocations
              </p>

              <h2>Reallocate asset</h2>

              <p>
                Move an assigned asset from its current
                employee to another employee.
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

        {/* -------------------------------------------------
            REALLOCATION DETAILS
        ------------------------------------------------- */}

        <div className="assignment-form-section">
          <div className="assignment-section-heading">
            <div className="assignment-section-icon">
              <ArrowRightLeft size={15} />
            </div>

            <div>
              <strong>Reallocation details</strong>

              <span>
                Choose the assigned asset and its new employee.
              </span>
            </div>
          </div>

          <div className="assignment-form-grid">
            {/* Asset */}

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
                <option value="">
                  Select assigned asset
                </option>

                {assignedAssets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.asset_number || asset.name}
                    {asset.name &&
                    asset.asset_number
                      ? ` — ${asset.name}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Current assignee */}

            <label>
              <span className="assignment-field-label">
                Current Assignee
              </span>

              <input
                type="text"
                value={
                  form.asset_id
                    ? currentAssigneeName
                    : ''
                }
                placeholder="Select an asset"
                readOnly
              />
            </label>

            {/* Target user */}

            <label>
              <span className="assignment-field-label">
                Reallocate To{' '}
                <span className="required">*</span>
              </span>

              <select
                name="to_user_id"
                value={form.to_user_id}
                onChange={handleChange}
                required
                disabled={!form.asset_id}
              >
                <option value="">
                  Select employee
                </option>

                {targetUsers.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {getUserName(user)}
                    {getUserEmployeeId(user)
                      ? ` — ${getUserEmployeeId(user)}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Current employee ID */}

            <label>
              <span className="assignment-field-label">
                Current Employee ID
              </span>

              <input
                type="text"
                value={
                  form.asset_id
                    ? currentAssigneeEmployeeId
                    : ''
                }
                placeholder="—"
                readOnly
              />
            </label>

            {/* Reason */}

            <label className="assignment-full-field">
              <span className="assignment-field-label">
                Reason
              </span>

              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="Reason for reallocating this asset"
                rows={4}
              />
            </label>

            {/* Notes */}

            <label className="assignment-full-field">
              <span className="assignment-field-label">
                Notes
              </span>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes"
                rows={4}
              />
            </label>
          </div>
        </div>

        {/* -------------------------------------------------
            MODAL ACTIONS
        ------------------------------------------------- */}

        <div className="assignment-modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            icon={ArrowRightLeft}
            disabled={
              saving ||
              assignedAssets.length === 0
            }
          >
            {saving
              ? 'Creating...'
              : 'Create reallocation'}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   REALLOCATION DETAILS
   ========================================================= */

function ReallocationDetails({
  reallocation,
  onClose,
}) {
  if (!reallocation) {
    return null;
  }

  return (
    <div
      className="modal-backdrop assignment-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal assignment-modal assignment-details-modal">
        {/* -------------------------------------------------
            HEADER
        ------------------------------------------------- */}

        <div className="assignment-modal-header">
          <div className="assignment-modal-title">
            <div className="assignment-modal-icon">
              <Eye size={18} />
            </div>

            <div>
              <p className="eyebrow">
                Reallocation details
              </p>

              <h2>
                {getAssetName(reallocation)}
              </h2>

              <p>
                Complete reallocation request,
                approval and transfer information.
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

        {/* -------------------------------------------------
            BASIC INFORMATION
        ------------------------------------------------- */}

        <div className="assignment-detail-grid">
          <div className="assignment-info-block">
            <span>Asset</span>

            <strong>
              {getAssetName(reallocation)}
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>Asset Number</span>

            <strong>
              {getAssetNumber(reallocation) || '-'}
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>From User</span>

            <strong>
              {getFromUserName(reallocation)}
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>To User</span>

            <strong>
              {getToUserName(reallocation)}
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>Requested By</span>

            <strong>
              {getRequestedByName(reallocation)}
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>Status</span>

            <strong>
              <StatusBadge
                status={reallocation.status}
              />
            </strong>
          </div>

          <div className="assignment-info-block">
            <span>Requested At</span>

            <strong>
              {formatDateTime(
                reallocation.requested_at
              )}
            </strong>
          </div>
        </div>

        {/* -------------------------------------------------
            APPROVAL INFORMATION
        ------------------------------------------------- */}

        {(reallocation.approved_at ||
          reallocation.approved_by ||
          reallocation.approver_name) && (
          <div className="assignment-detail-section">
            <span>
              Approval Information
            </span>

            <div className="assignment-detail-grid">
              <div className="assignment-info-block">
                <span>Approved At</span>

                <strong>
                  {formatDateTime(
                    reallocation.approved_at
                  )}
                </strong>
              </div>

              <div className="assignment-info-block">
                <span>Approved By</span>

                <strong>
                  {getApproverName(
                    reallocation
                  )}
                </strong>
              </div>

              <div className="assignment-info-block">
                <span>Approver Role</span>

                <strong>
                  {reallocation.approver_role
                    ? formatStatus(
                        reallocation.approver_role
                      )
                    : '-'}
                </strong>
              </div>

              <div className="assignment-info-block">
                <span>Completed At</span>

                <strong>
                  {formatDateTime(
                    reallocation.completed_at
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------
            REJECTION INFORMATION
        ------------------------------------------------- */}

        {(reallocation.rejected_at ||
          reallocation.rejection_reason ||
          reallocation.status === 'rejected') && (
          <div className="assignment-detail-section rejection-detail">
            <span>
              Rejection Information
            </span>

            <div className="assignment-detail-grid">
              <div className="assignment-info-block">
                <span>Rejected At</span>

                <strong>
                  {formatDateTime(
                    reallocation.rejected_at
                  )}
                </strong>
              </div>

              <div className="assignment-info-block">
                <span>Rejected By</span>

                <strong>
                  {getApproverName(
                    reallocation
                  )}
                </strong>
              </div>
            </div>

            {reallocation.rejection_reason && (
              <div className="assignment-detail-section">
                <span>
                  Rejection Reason
                </span>

                <p>
                  {reallocation.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------
            REQUEST INFORMATION
        ------------------------------------------------- */}

        <div className="assignment-detail-section">
          <span>
            Request Information
          </span>

          <div className="assignment-detail-grid">
            <div className="assignment-info-block">
              <span>Reason</span>

              <strong>
                {reallocation.reason || '-'}
              </strong>
            </div>

            <div className="assignment-info-block">
              <span>Notes</span>

              <strong>
                {reallocation.notes || '-'}
              </strong>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            RECORD INFORMATION
        ------------------------------------------------- */}

        <div className="assignment-detail-section">
          <span>
            Record Information
          </span>

          <div className="assignment-detail-grid">
            <div className="assignment-info-block">
              <span>Reallocation ID</span>

              <strong>
                {reallocation.id || '-'}
              </strong>
            </div>

            <div className="assignment-info-block">
              <span>Created At</span>

              <strong>
                {formatDateTime(
                  reallocation.created_at
                )}
              </strong>
            </div>

            <div className="assignment-info-block">
              <span>Last Updated</span>

              <strong>
                {formatDateTime(
                  reallocation.updated_at
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            ACTIONS
        ------------------------------------------------- */}

        <div className="assignment-modal-actions">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function Reallocations({ notify }) {
  const [reallocations, setReallocations] =
    useState([]);

  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('All reallocations');

  const [showForm, setShowForm] =
    useState(false);

  const [
    selectedReallocation,
    setSelectedReallocation,
  ] = useState(null);

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 0,
    });

  const [exporting, setExporting] =
    useState(false);

  /* =====================================================
     EXPORT CSV
  ===================================================== */

  const handleExportCSV = async () => {
    try {
      setExporting(true);

      const response = await api.get(
        '/api/reallocations',
        {
          params: {
            page: 1,
            limit: 100000,
          },
        }
      );

      const reallocationRows =
        Array.isArray(response?.data)
          ? response.data
          : [];

      if (!reallocationRows.length) {
        notify?.(
          'No reallocations available to export.'
        );

        return;
      }

      const formatCSVDateTime = (value) => {
        if (!value) return '';

        return new Date(value).toLocaleString(
          'en-IN',
          {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }
        );
      };

      const escapeCSV = (value) => {
        if (
          value === null ||
          value === undefined
        ) {
          return '';
        }

        const stringValue = String(value);

        return `"${stringValue.replace(
          /"/g,
          '""'
        )}"`;
      };

      const headers = [
        'Reallocation ID',
        'Asset Number',
        'Asset Name',
        'From User',
        'To User',
        'Requested By',
        'Status',
        'Requested At',
        'Approved At',
        'Approved By',
        'Approver Role',
        'Completed At',
        'Reason',
        'Rejection Reason',
        'Notes',
        'Created At',
        'Updated At',
      ];

      const rows =
        reallocationRows.map(
          (reallocation) => [
            reallocation.id,
            getAssetNumber(reallocation),
            getAssetName(reallocation),
            getFromUserName(reallocation),
            getToUserName(reallocation),
            getRequestedByName(
              reallocation
            ),
            reallocation.status,
            formatCSVDateTime(
              reallocation.requested_at
            ),
            formatCSVDateTime(
              reallocation.approved_at
            ),
            getApproverName(
              reallocation
            ),
            reallocation.approver_role
              ? formatStatus(
                  reallocation.approver_role
                )
              : '',
            formatCSVDateTime(
              reallocation.completed_at
            ),
            reallocation.reason,
            reallocation.rejection_reason,
            reallocation.notes,
            formatCSVDateTime(
              reallocation.created_at
            ),
            formatCSVDateTime(
              reallocation.updated_at
            ),
          ]
        );

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) =>
          row.map(escapeCSV).join(',')
        ),
      ].join('\r\n');

      const blob = new Blob(
        [csvContent],
        {
          type: 'text/csv;charset=utf-8;',
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `reallocations_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      notify?.(
        `${reallocationRows.length} reallocations exported successfully.`
      );
    } catch (error) {
      console.error(
        'Failed to export reallocations:',
        error
      );

      notify?.(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to export reallocations.'
      );
    } finally {
      setExporting(false);
    }
  };

  /* =====================================================
     FETCH REALLOCATIONS
  ===================================================== */

  const fetchReallocations = async () => {
    try {
      setLoading(true);

      const response = await api.get(
        '/api/reallocations',
        {
          params: {
            page,
            limit: 25,
          },
        }
      );

      /*
       * api.js already returns response.data
       *
       * Expected:
       * {
       *   data: [],
       *   pagination: {}
       * }
       */

      const reallocationRows =
        Array.isArray(response?.data)
          ? response.data
          : [];

      setReallocations(
        reallocationRows
      );

      setPagination({
        page:
          response?.pagination?.page ||
          1,

        limit:
          response?.pagination?.limit ||
          25,

        total:
          response?.pagination?.total ??
          reallocationRows.length,

        totalPages:
          response?.pagination?.totalPages ??
          (
            reallocationRows.length > 0
              ? 1
              : 0
          ),
      });
    } catch (err) {
      console.error(
        'Failed to fetch reallocations:',
        err
      );

      console.error(
        'Reallocation API error:',
        err?.response?.data || err
      );

      notify?.(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to fetch reallocations'
      );

      setReallocations([]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     FETCH FORM DATA
  ===================================================== */

  const fetchFormData = async () => {
    try {
      const [
        assetsResponse,
        usersResponse,
      ] = await Promise.all([
        api.get('/api/assets?limit=1000'),
        api.get('/api/users?limit=1000'),
      ]);

      const assetResult =
        assetsResponse?.data ||
        assetsResponse;

      const userResult =
        usersResponse?.data ||
        usersResponse;

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
      console.error(
        'Failed to fetch reallocation form data',
        err
      );

      notify?.(
        'Failed to load assets and employees'
      );
    }
  };

  /* =====================================================
     INITIAL / PAGE FETCH
  ===================================================== */

  useEffect(() => {
    fetchReallocations();
  }, [page]);

  /* =====================================================
     FILTERING
  ===================================================== */

  const filteredReallocations =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return reallocations.filter(
        (reallocation) => {
          const matchesFilter =
            filter === 'All reallocations' ||
            reallocation.status ===
              filter;

          const searchableText = `
            ${getAssetName(reallocation)}
            ${getAssetNumber(reallocation)}
            ${getFromUserName(reallocation)}
            ${getToUserName(reallocation)}
            ${getRequestedByName(reallocation)}
            ${reallocation.reason || ''}
            ${reallocation.notes || ''}
            ${reallocation.rejection_reason || ''}
            ${reallocation.status || ''}
          `.toLowerCase();

          return (
            matchesFilter &&
            (!query ||
              searchableText.includes(
                query
              ))
          );
        }
      );
    }, [
      reallocations,
      search,
      filter,
    ]);

  /* =====================================================
     STATS
  ===================================================== */

  const stats = useMemo(
    () => ({
      total: pagination.total,

      pending:
        reallocations.filter(
          (item) =>
            item.status === 'pending'
        ).length,

      approved:
        reallocations.filter(
          (item) =>
            item.status === 'approved'
        ).length,

      rejected:
        reallocations.filter(
          (item) =>
            item.status === 'rejected'
        ).length,
    }),
    [
      reallocations,
      pagination.total,
    ]
  );

  /* =====================================================
     CREATE FORM
  ===================================================== */

  const openCreateForm = async () => {
    await fetchFormData();

    setShowForm(true);
  };

  /* =====================================================
     APPROVE
  ===================================================== */

  const approveReallocation = async (
    reallocation
  ) => {
    const confirmed =
      window.confirm(
        `Approve reallocation of ${getAssetName(
          reallocation
        )} from ${getFromUserName(
          reallocation
        )} to ${getToUserName(
          reallocation
        )}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await api.post(
        `/api/reallocations/${reallocation.id}/approve`
      );

      notify?.(
        'Reallocation approved'
      );

      fetchReallocations();
    } catch (err) {
      console.error(
        'Approve reallocation failed',
        err
      );

      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to approve reallocation'
      );
    }
  };

  /* =====================================================
     REJECT
  ===================================================== */

  const rejectReallocation = async (
    reallocation
  ) => {
    const reason = window.prompt(
      'Enter rejection reason'
    );

    if (reason === null) {
      return;
    }

    try {
      await api.post(
        `/api/reallocations/${reallocation.id}/reject`,
        {
          rejection_reason:
            reason || null,
        }
      );

      notify?.(
        'Reallocation rejected'
      );

      fetchReallocations();
    } catch (err) {
      console.error(
        'Reject reallocation failed',
        err
      );

      notify?.(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to reject reallocation'
      );
    }
  };

  /* =====================================================
     CLEAR SEARCH / FILTER
  ===================================================== */

  const clearSearch = () => {
    setSearch('');
    setFilter('All reallocations');
    setPage(1);
  };

  /* =====================================================
     PAGINATION
  ===================================================== */

  const goToPage = (nextPage) => {
    if (
      nextPage < 1 ||
      (
        pagination.totalPages &&
        nextPage >
          pagination.totalPages
      )
    ) {
      return;
    }

    setPage(nextPage);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="page-stack assignments-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <PageHeader
        eyebrow="Inventory / Reallocations"
        title="Reallocations"
        description="Manage asset reallocations between employees."
        action={
          <Button
            icon={Plus}
            onClick={openCreateForm}
          >
            Reallocate asset
          </Button>
        }
      />

      {/* =================================================
          STATS
      ================================================= */}

      <div className="assignment-stats">
        <StatCard
          icon={ArrowRightLeft}
          label="Total reallocations"
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
          label="Approved"
          value={stats.approved}
          tone="stat-green"
        />

        <StatCard
          icon={RotateCcw}
          label="Rejected"
          value={stats.rejected}
          tone="stat-purple"
        />
      </div>

      {/* =================================================
          MAIN PANEL
      ================================================= */}

      <div className="panel assignments-panel">
        <div className="assignment-panel-heading">
          <div>
            <p className="eyebrow">
              Reallocation directory
            </p>

            <h2>
              Asset reallocations
            </h2>

            <span>
              Review asset transfer requests
              and take action on pending
              reallocations.
            </span>
          </div>

          <span className="assignment-result-count">
            {filteredReallocations.length}{' '}
            shown
          </span>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="assignment-toolbar">
          <div className="assignment-search-field">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

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
                setFilter(
                  event.target.value
                );

                setPage(1);
              }}
            >
              <option value="All reallocations">
                All reallocations
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            {(search ||
              filter !==
                'All reallocations') && (
              <Button
                variant="secondary"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}

            {/* Export */}

            <button
              type="button"
              className="assignment-refresh-button"
              onClick={
                handleExportCSV
              }
              disabled={exporting}
              title="Export CSV"
              aria-label="Export CSV"
            >
              <Download size={17} />
            </button>

            {/* Refresh */}

            <button
              className="assignment-refresh-button"
              type="button"
              onClick={
                fetchReallocations
              }
              title="Refresh"
              aria-label="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* =================================================
            LIST
        ================================================= */}

        <div className="assignment-list">
          {loading ? (
            <div className="assignment-loading">
              <RefreshCw
                size={19}
                className="assignment-spin"
              />

              <span>
                Loading reallocations...
              </span>
            </div>
          ) : filteredReallocations.length ===
            0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No reallocations found"
              description={
                search ||
                filter !==
                  'All reallocations'
                  ? 'Try changing your search or filter.'
                  : 'No asset reallocations have been created yet.'
              }
            />
          ) : (
            filteredReallocations.map(
              (reallocation) => (
                <div
                  className="assignment-row"
                  key={reallocation.id}
                >
                  {/* -----------------------------------------
                      MAIN
                  ----------------------------------------- */}

                  <div className="assignment-main">
                    <div className="assignment-icon">
                      <ArrowRightLeft
                        size={18}
                      />
                    </div>

                    <div className="assignment-primary">
                      <div className="assignment-title-row">
                        <h3>
                          {getAssetName(
                            reallocation
                          )}
                        </h3>

                        <StatusBadge
                          status={
                            reallocation.status
                          }
                        />
                      </div>

                      <div className="assignment-meta">
                        <span>
                          Asset{' '}
                          <strong>
                            {getAssetNumber(
                              reallocation
                            ) || '-'}
                          </strong>
                        </span>

                        <span>
                          From{' '}
                          <strong>
                            {getFromUserName(
                              reallocation
                            )}
                          </strong>
                        </span>

                        <span>
                          To{' '}
                          <strong>
                            {getToUserName(
                              reallocation
                            )}
                          </strong>
                        </span>

                        <span>
                          Requested by{' '}
                          <strong>
                            {getRequestedByName(
                              reallocation
                            )}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* -----------------------------------------
                      REQUESTED DATE
                  ----------------------------------------- */}

                  <div className="assignment-return">
                    <span>
                      Requested
                    </span>

                    <strong>
                      {formatDate(
                        reallocation.requested_at
                      )}
                    </strong>
                  </div>

                  {/* -----------------------------------------
                      ACTIONS
                  ----------------------------------------- */}

                  <div className="assignment-actions">
                    {/* View */}

                    <button
                      className="assignment-row-action"
                      type="button"
                      title="View reallocation"
                      aria-label="View reallocation"
                      onClick={() =>
                        setSelectedReallocation(
                          reallocation
                        )
                      }
                    >
                      <Eye size={15} />
                    </button>

                    {/* Pending actions */}

                    {reallocation.status ===
                      'pending' && (
                      <>
                        <button
                          className="assignment-row-action assignment-action-success"
                          type="button"
                          title="Approve"
                          aria-label="Approve"
                          onClick={() =>
                            approveReallocation(
                              reallocation
                            )
                          }
                        >
                          <Check
                            size={15}
                          />
                        </button>

                        <button
                          className="assignment-row-action assignment-action-danger"
                          type="button"
                          title="Reject"
                          aria-label="Reject"
                          onClick={() =>
                            rejectReallocation(
                              reallocation
                            )
                          }
                        >
                          <X size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            )
          )}
        </div>

        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          pagination.totalPages > 0 && (
            <div className="assignment-pagination">
              <span>
                Page {pagination.page} of{' '}
                {pagination.totalPages}

                {pagination.total
                  ? ` • ${pagination.total} total`
                  : ''}
              </span>

              <div className="assignment-pagination-actions">
                <button
                  type="button"
                  className="assignment-pagination-button"
                  disabled={
                    pagination.page <= 1
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page - 1
                    )
                  }
                >
                  Previous
                </button>

                {Array.from(
                  {
                    length: Math.min(
                      pagination.totalPages,
                      5
                    ),
                  },
                  (_, index) => {
                    let pageNumber =
                      index + 1;

                    if (
                      pagination.totalPages >
                      5
                    ) {
                      if (
                        pagination.page >=
                          4 &&
                        pagination.page <=
                          pagination.totalPages -
                            2
                      ) {
                        pageNumber =
                          pagination.page -
                          2 +
                          index;
                      } else if (
                        pagination.page >
                        pagination.totalPages -
                          2
                      ) {
                        pageNumber =
                          pagination.totalPages -
                          4 +
                          index;
                      }
                    }

                    return (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`assignment-pagination-number ${
                          pagination.page ===
                          pageNumber
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          goToPage(
                            pageNumber
                          )
                        }
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
                    pagination.page >=
                      pagination.totalPages
                  }
                  onClick={() =>
                    goToPage(
                      pagination.page + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </div>

      {/* =================================================
          CREATE FORM
      ================================================= */}

      {showForm && (
        <ReallocationForm
          assets={assets}
          users={users}
          onClose={() =>
            setShowForm(false)
          }
          onCreated={
            fetchReallocations
          }
          notify={notify}
        />
      )}

      {/* =================================================
          DETAILS
      ================================================= */}

      {selectedReallocation && (
        <ReallocationDetails
          reallocation={
            selectedReallocation
          }
          onClose={() =>
            setSelectedReallocation(null)
          }
        />
      )}
    </div>
  );
}