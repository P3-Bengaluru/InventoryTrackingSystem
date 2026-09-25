import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Clock3,
  Eye,
  FileText,
  History,
  MoreHorizontal,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';

import api from '../lib/api';
import {
  Badge,
  Button,
  Modal,
  PageHeader,
} from '../components/ui';


/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  inventory_check: 'Inventory Check',
  pending_approval: 'Pending Approval',
  self_approved: 'Self Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  ordered: 'Ordered',
  received: 'Received',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  critical: 'Critical',
};

const EMPTY_FORM = {
  department: '',
  project: '',
  location_id: '',
  request_type: 'new_purchase',
  item_name: '',
  category_id: '',
  specifications: '',
  quantity: 1,
  justification: '',
  estimated_cost: '',
  currency: 'INR',
  priority: 'normal',
};


/* ==========================================================================
   HELPERS
   ========================================================================== */

function normalizeListResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function getErrorMessage(
  error,
  fallback = 'Something went wrong.'
) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}


function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}


function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


function formatCurrency(value, currency = 'INR') {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `${currency} ${number.toLocaleString('en-IN')}`;
  }
}


function formatStatus(status) {
  return STATUS_LABELS[status] || status || '—';
}


function formatPriority(priority) {
  return PRIORITY_LABELS[priority] || priority || '—';
}


function getStatusClass(status) {
  switch (status) {
    case 'approved':
    case 'self_approved':
    case 'received':
      return 'status-green';

    case 'pending_approval':
    case 'inventory_check':
    case 'submitted':
    case 'ordered':
      return 'status-amber';

    case 'rejected':
    case 'cancelled':
      return 'status-red';

    case 'draft':
      return 'status-slate';

    default:
      return 'status-blue';
  }
}


function getPriorityClass(priority) {
  switch (priority) {
    case 'critical':
      return 'status-red';

    case 'high':
      return 'status-amber';

    case 'low':
      return 'status-slate';

    default:
      return 'status-blue';
  }
}


function StatusBadge({ status }) {
  return (
    <span
      className={`procurement-status ${getStatusClass(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}


function PriorityBadge({ priority }) {
  return (
    <span
      className={`procurement-status ${getPriorityClass(priority)}`}
    >
      {formatPriority(priority)}
    </span>
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
  tone = '',
}) {
  return (
    <div className={`procurement-stat-card ${tone}`}>
      <div className="procurement-stat-icon">
        <Icon size={18} />
      </div>

      <div className="procurement-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}


/* ==========================================================================
   TREE DATA HELPERS
   ========================================================================== */

/*
 * /api/categories/tree and /api/locations/tree can return nested data.
 *
 * This converts:
 *
 * [
 *   {
 *     id,
 *     name,
 *     children: [...]
 *   }
 * ]
 *
 * into a flat dropdown list while preserving hierarchy visually.
 */

function flattenTree(
  nodes,
  level = 0,
  result = []
) {
  if (!Array.isArray(nodes)) {
    return result;
  }

  nodes.forEach((node) => {
    if (!node) return;

    result.push({
      id: node.id,
      name:
        node.name ||
        node.label ||
        node.title ||
        node.location_name ||
        node.category_name ||
        node.code ||
        node.id,
      level,
    });

    if (Array.isArray(node.children)) {
      flattenTree(
        node.children,
        level + 1,
        result
      );
    }
  });

  return result;
}


function getTreeResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function getSupplierName(supplier) {
  return (
    supplier?.name ||
    supplier?.supplier_name ||
    supplier?.company_name ||
    supplier?.company ||
    supplier?.contact_name ||
    supplier?.id ||
    'Unnamed supplier'
  );
}


/* ==========================================================================
   PROCUREMENT FORM
   ========================================================================== */

function ProcurementForm({
  categories,
  locations,
  onClose,
  onCreated,
  notify,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const submit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!form.item_name.trim()) {
      notify?.('Item name is required.');
      return;
    }

    if (form.justification.trim().length < 20) {
      notify?.(
        'Justification must be at least 20 characters.'
      );
      return;
    }

    let specifications = {};

    if (form.specifications.trim()) {
      try {
        specifications = JSON.parse(
          form.specifications
        );

        if (
          typeof specifications !== 'object' ||
          Array.isArray(specifications) ||
          specifications === null
        ) {
          notify?.(
            'Specifications must be a JSON object.'
          );
          return;
        }
      } catch {
        notify?.(
          'Specifications must contain valid JSON.'
        );
        return;
      }
    }

    const payload = {
      department:
        form.department.trim(),

      project:
        form.project.trim(),

      location_id:
        form.location_id || null,

      request_type:
        form.request_type,

      item_name:
        form.item_name.trim(),

      category_id:
        form.category_id || null,

      specifications,

      quantity:
        Number(form.quantity) || 1,

      justification:
        form.justification.trim(),

      estimated_cost:
        form.estimated_cost === ''
          ? null
          : Number(form.estimated_cost),

      currency:
        form.currency || 'INR',

      priority:
        form.priority,
    };

    try {
      setSubmitting(true);
      console.log('Submitting procurement request:', payload);
      await api.post(
        '/api/procurement',
        payload
      );

      notify?.(
        'Procurement request created successfully.'
      );

      await onCreated?.();

      onClose?.();
    } catch (error) {
      console.error(
        'Failed to create procurement request',
        error
      );

      notify?.(
        getErrorMessage(
          error,
          'Failed to create procurement request.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Modal
      title="Raise procurement request"
      onClose={
        submitting
          ? undefined
          : onClose
      }
    >
      <form
        className="form-grid procurement-form"
        onSubmit={submit}
      >

        {/* --------------------------------------------------------------- */}
        {/* Request Details                                                 */}
        {/* --------------------------------------------------------------- */}

        <div className="procurement-form-section">
          <div className="procurement-section-heading">
            <ShoppingCart size={16} />
            Request details
          </div>

          <div className="procurement-form-grid">

            <label>
              Request type

              <select
                name="request_type"
                value={form.request_type}
                onChange={handleChange}
              >
                <option value="new_purchase">
                  New purchase
                </option>

                <option value="existing_asset">
                  Existing asset
                </option>
              </select>
            </label>


            <label>
              Item name

              <input
                name="item_name"
                value={form.item_name}
                onChange={handleChange}
                required
                placeholder="What do you need?"
              />
            </label>


            <label>
              Category

              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {`${'— '.repeat(category.level)}${category.name}`}
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              Quantity

              <input
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>


            <label>
              Priority

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="low">
                  Low
                </option>

                <option value="normal">
                  Normal
                </option>

                <option value="high">
                  High
                </option>

                <option value="critical">
                  Critical
                </option>
              </select>
            </label>


            <label>
              Estimated cost

              <input
                type="number"
                name="estimated_cost"
                min="0"
                step="0.01"
                value={form.estimated_cost}
                onChange={handleChange}
                placeholder="85000"
              />
            </label>


            <label>
              Currency

              <input
                name="currency"
                value={form.currency}
                onChange={handleChange}
                maxLength={5}
              />
            </label>

          </div>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Organisation Details                                            */}
        {/* --------------------------------------------------------------- */}

        <div className="procurement-form-section">
          <div className="procurement-section-heading">
            <FileText size={16} />
            Organisation details
          </div>

          <div className="procurement-form-grid">

            <label>
              Department

              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Engineering"
              />
            </label>


            <label>
              Project

              <input
                name="project"
                value={form.project}
                onChange={handleChange}
                placeholder="ADAS Development"
              />
            </label>


            <label>
              Location

              <select
                name="location_id"
                value={form.location_id}
                onChange={handleChange}
              >
                <option value="">
                  Select location
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {`${'— '.repeat(location.level)}${location.name}`}
                    </option>
                  )
                )}
              </select>
            </label>

          </div>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Specifications                                                  */}
        {/* --------------------------------------------------------------- */}

        <div className="procurement-form-section">
          <div className="procurement-section-heading">
            <FileText size={16} />
            Specifications
          </div>

          <label className="full-field">
            Equipment specifications

            <textarea
              name="specifications"
              value={form.specifications}
              onChange={handleChange}
              rows={7}
              placeholder={`{
  "processor": "Intel Core i7",
  "ram": "16GB",
  "storage": "512GB SSD",
  "os": "Windows 11"
}`}
            />

            <small className="procurement-field-help">
              Enter specifications as a JSON object.
            </small>
          </label>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Justification                                                   */}
        {/* --------------------------------------------------------------- */}

        <div className="procurement-form-section">
          <div className="procurement-section-heading">
            <Search size={16} />
            Requirement justification
          </div>

          <label className="full-field">
            Justification

            <textarea
              name="justification"
              value={form.justification}
              onChange={handleChange}
              required
              minLength={20}
              rows={6}
              placeholder="Required for development and testing activities"
            />
          </label>
        </div>


        {/* --------------------------------------------------------------- */}
        {/* Actions                                                         */}
        {/* --------------------------------------------------------------- */}

        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Creating...'
              : 'Create request'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}


/* ==========================================================================
   APPROVAL MODAL
   ========================================================================== */

function ApprovalModal({
  request,
  approval,
  decision,
  onClose,
  onComplete,
  notify,
}) {
  const [comments, setComments] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const isApprove =
    decision === 'approved';


  const submit = async () => {
    if (saving) return;

    if (
      !isApprove &&
      !comments.trim()
    ) {
      notify?.(
        'Please provide a rejection reason.'
      );
      return;
    }

    try {
      setSaving(true);

      await api.patch(
        `/api/procurement/${request.id}/approvals/${approval.id}`,
        {
          decision,
          comments:
            comments.trim() || undefined,
        }
      );

      notify?.(
        isApprove
          ? 'Procurement request approved.'
          : 'Procurement request rejected.'
      );

      await onComplete?.();
    } catch (error) {
      console.error(
        'Failed to action procurement approval',
        error
      );

      notify?.(
        getErrorMessage(
          error,
          'Failed to process approval.'
        )
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal
      title={
        isApprove
          ? 'Approve procurement request'
          : 'Reject procurement request'
      }
      onClose={
        saving
          ? undefined
          : onClose
      }
    >
      <div className="procurement-action-modal">

        <div className="procurement-action-summary">
          <strong>
            {request.item_name}
          </strong>

          <span>
            Approval level {approval.level}
            {' · '}
            {approval.approver_role}
          </span>

          <span>
            Estimated cost:{' '}
            {formatCurrency(
              request.estimated_cost,
              request.currency
            )}
          </span>
        </div>


        <label>
          {isApprove
            ? 'Comments'
            : 'Rejection reason'}

          <textarea
            value={comments}
            onChange={(event) =>
              setComments(
                event.target.value
              )
            }
            rows={5}
            placeholder={
              isApprove
                ? 'Optional approval comments...'
                : 'Explain why this request is being rejected...'
            }
          />
        </label>


        <div className="modal-actions">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant={
              isApprove
                ? 'primary'
                : 'danger'
            }
            onClick={submit}
            disabled={saving}
          >
            {saving
              ? 'Processing...'
              : isApprove
                ? 'Approve request'
                : 'Reject request'}
          </Button>
        </div>

      </div>
    </Modal>
  );
}


/* ==========================================================================
   ORDER MODAL
   ========================================================================== */

function OrderModal({
  request,
  suppliers,
  onClose,
  onComplete,
  notify,
}) {
  const [form, setForm] = useState({
    supplier_id: '',
    po_number: '',
    quoted_cost:
      request?.estimated_cost || '',
    expected_delivery: '',
  });

  const [saving, setSaving] =
    useState(false);


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  const submit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!form.supplier_id) {
      notify?.(
        'Please select a supplier.'
      );
      return;
    }

    if (!form.po_number.trim()) {
      notify?.(
        'PO number is required.'
      );
      return;
    }

    try {
      setSaving(true);

      await api.patch(
        `/api/procurement/${request.id}/order`,
        {
          supplier_id:
            form.supplier_id,

          po_number:
            form.po_number.trim(),

          quoted_cost:
            form.quoted_cost === ''
              ? undefined
              : Number(form.quoted_cost),

          expected_delivery:
            form.expected_delivery ||
            undefined,
        }
      );

      notify?.(
        'Procurement request marked as ordered.'
      );

      await onComplete?.();
    } catch (error) {
      console.error(
        'Failed to mark procurement as ordered',
        error
      );

      notify?.(
        getErrorMessage(
          error,
          'Failed to mark request as ordered.'
        )
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal
      title="Mark request as ordered"
      onClose={
        saving
          ? undefined
          : onClose
      }
    >
      <form
        className="form-grid procurement-form"
        onSubmit={submit}
      >

        <div className="procurement-action-summary">
          <strong>
            {request.item_name}
          </strong>

          <span>
            Estimated:{' '}
            {formatCurrency(
              request.estimated_cost,
              request.currency
            )}
          </span>
        </div>


        <label>
          Supplier

          <select
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            required
          >
            <option value="">
              Select supplier
            </option>

            {suppliers.map(
              (supplier) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {getSupplierName(
                    supplier
                  )}
                </option>
              )
            )}
          </select>
        </label>


        <label>
          PO number

          <input
            name="po_number"
            value={form.po_number}
            onChange={handleChange}
            required
            placeholder="PO-00001"
          />
        </label>


        <label>
          Quoted cost

          <input
            type="number"
            name="quoted_cost"
            min="0"
            step="0.01"
            value={form.quoted_cost}
            onChange={handleChange}
            placeholder="85000"
          />
        </label>


        <label>
          Expected delivery

          <input
            type="date"
            name="expected_delivery"
            value={
              form.expected_delivery
            }
            onChange={handleChange}
          />
        </label>


        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Mark ordered'}
          </Button>
        </div>

      </form>
    </Modal>
  );
}


/* ==========================================================================
   DETAILS MODAL
   ========================================================================== */

function ProcurementDetails({
  request,
  onClose,
  onRefresh,
  onApprove,
  onReject,
  onOrder,
  notify,
}) {
  const [details, setDetails] =
    useState(request);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [historyLoading, setHistoryLoading] =
    useState(false);


  const loadDetails =
    useCallback(async () => {
      if (!request?.id) return;

      try {
        setLoading(true);

        const data =
          await api.get(
            `/api/procurement/${request.id}`
          );

        setDetails(data);
      } catch (error) {
        console.error(
          'Failed to load procurement details',
          error
        );

        notify?.(
          getErrorMessage(
            error,
            'Failed to load request details.'
          )
        );
      } finally {
        setLoading(false);
      }
    }, [request?.id, notify]);


  const loadHistory =
    useCallback(async () => {
      if (!request?.id) return;

      try {
        setHistoryLoading(true);

        const data =
          await api.get(
            `/api/procurement/${request.id}/history`
          );

        setHistory(
          normalizeListResponse(data)
        );
      } catch (error) {
        console.error(
          'Failed to load procurement history',
          error
        );

        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }, [request?.id]);


  useEffect(() => {
    loadDetails();
    loadHistory();
  }, [
    loadDetails,
    loadHistory,
  ]);


  const approvals =
    details?.approvals || [];


  const pendingApproval =
    approvals.find(
      (approval) =>
        approval.status === 'pending'
    );


  const canApprove =
    details?.status ===
      'pending_approval' &&
    pendingApproval;


  const canOrder =
    details?.status ===
      'approved' ||
    details?.status ===
      'self_approved';


  const canReceive =
    details?.status ===
    'ordered';


  const canCancel = [
    'draft',
    'submitted',
    'pending_approval',
  ].includes(details?.status);


  const refresh = async () => {
    await loadDetails();
    await loadHistory();
    await onRefresh?.();
  };


  const receive = async () => {
    try {
      await api.patch(
        `/api/procurement/${details.id}/receive`
      );

      notify?.(
        'Procurement request marked as received.'
      );

      await refresh();
    } catch (error) {
      console.error(
        'Failed to receive procurement',
        error
      );

      notify?.(
        getErrorMessage(
          error,
          'Failed to mark request as received.'
        )
      );
    }
  };


  const cancel = async () => {
    const confirmed =
      window.confirm(
        'Are you sure you want to cancel this procurement request?'
      );

    if (!confirmed) return;

    try {
      await api.patch(
        `/api/procurement/${details.id}/cancel`
      );

      notify?.(
        'Procurement request cancelled.'
      );

      await refresh();
    } catch (error) {
      console.error(
        'Failed to cancel procurement',
        error
      );

      notify?.(
        getErrorMessage(
          error,
          'Failed to cancel request.'
        )
      );
    }
  };


  return (
    <Modal
      title="Procurement request"
      onClose={onClose}
    >
      {loading ? (
        <div className="procurement-loading">
          <RefreshCw
            size={18}
            className="procurement-spin"
          />

          Loading request details...
        </div>
      ) : (
        <div className="procurement-details">

          <div className="procurement-details-header">
            <div>
              <span className="procurement-details-id mono">
                {details.id}
              </span>

              <h3>
                {details.item_name}
              </h3>

              <div className="procurement-details-meta">
                <StatusBadge
                  status={
                    details.status
                  }
                />

                <PriorityBadge
                  priority={
                    details.priority
                  }
                />
              </div>
            </div>

            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refresh}
            >
              Refresh
            </Button>
          </div>


          {details.matched_asset_id && (
            <div className="procurement-match-card">
              <div className="procurement-match-icon">
                <Search size={17} />
              </div>

              <div>
                <strong>
                  Inventory match found
                </strong>

                <span>
                  {details.matched_notes ||
                    'An available inventory asset matched this request.'}
                </span>
              </div>
            </div>
          )}


          <div className="procurement-detail-grid">

            <div className="procurement-info-block">
              <span>
                Request type
              </span>

              <strong>
                {details.request_type ===
                'existing_asset'
                  ? 'Existing asset'
                  : 'New purchase'}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Category
              </span>

              <strong>
                {details.category_id ||
                  '—'}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Quantity
              </span>

              <strong>
                {details.quantity || 1}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Estimated cost
              </span>

              <strong>
                {formatCurrency(
                  details.estimated_cost,
                  details.currency
                )}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Quoted cost
              </span>

              <strong>
                {formatCurrency(
                  details.quoted_cost,
                  details.currency
                )}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Department
              </span>

              <strong>
                {details.department ||
                  '—'}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Project
              </span>

              <strong>
                {details.project ||
                  '—'}
              </strong>
            </div>


            <div className="procurement-info-block">
              <span>
                Created
              </span>

              <strong>
                {formatDateTime(
                  details.created_at
                )}
              </strong>
            </div>

          </div>


          <div className="procurement-detail-section">
            <div className="procurement-section-heading">
              <FileText size={16} />
              Justification
            </div>

            <p className="procurement-detail-text">
              {details.justification ||
                'No justification provided.'}
            </p>
          </div>


          {details.specifications && (
            <div className="procurement-detail-section">
              <div className="procurement-section-heading">
                <FileText size={16} />
                Specifications
              </div>

              <pre className="procurement-specifications">
                {typeof details.specifications ===
                'string'
                  ? details.specifications
                  : JSON.stringify(
                      details.specifications,
                      null,
                      2
                    )}
              </pre>
            </div>
          )}


          {details.rejection_reason && (
            <div className="procurement-rejection">
              <X size={16} />

              <div>
                <strong>
                  Rejection reason
                </strong>

                <span>
                  {details.rejection_reason}
                </span>
              </div>
            </div>
          )}


          <div className="procurement-detail-section">
            <div className="procurement-section-heading">
              <Check size={16} />
              Approval chain
            </div>

            {approvals.length === 0 ? (
              <div className="procurement-empty-inline">
                No approval steps are associated
                with this request.
              </div>
            ) : (
              <div className="procurement-approval-list">
                {approvals.map(
                  (approval) => (
                    <div
                      key={approval.id}
                      className="procurement-approval-row"
                    >
                      <div className="procurement-approval-level">
                        {approval.level}
                      </div>

                      <div className="procurement-approval-main">
                        <strong>
                          {approval.approver_role}
                        </strong>

                        <span>
                          {approval.status}
                        </span>

                        {approval.comments && (
                          <small>
                            {approval.comments}
                          </small>
                        )}
                      </div>

                      <span
                        className={`procurement-status ${getStatusClass(
                          approval.status
                        )}`}
                      >
                        {approval.status}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>


          <div className="procurement-detail-section">
            <div className="procurement-section-heading">
              <History size={16} />
              Activity history
            </div>

            {historyLoading ? (
              <div className="procurement-empty-inline">
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="procurement-empty-inline">
                No activity history available.
              </div>
            ) : (
              <div className="procurement-history-list">
                {history.map(
                  (entry, index) => (
                    <div
                      key={
                        entry.id ||
                        index
                      }
                      className="procurement-history-row"
                    >
                      <div className="procurement-history-dot" />

                      <div>
                        <strong>
                          {entry.action ||
                            entry.event ||
                            entry.action_type ||
                            'Activity'}
                        </strong>

                        <span>
                          {entry.created_at
                            ? formatDateTime(
                                entry.created_at
                              )
                            : '—'}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>


          <div className="modal-actions procurement-detail-actions">

            {canApprove && (
              <>
                <Button
                  variant="danger"
                  icon={X}
                  onClick={() =>
                    onReject?.(
                      details,
                      pendingApproval
                    )
                  }
                >
                  Reject
                </Button>

                <Button
                  icon={Check}
                  onClick={() =>
                    onApprove?.(
                      details,
                      pendingApproval
                    )
                  }
                >
                  Approve
                </Button>
              </>
            )}


            {canOrder && (
              <Button
                icon={Truck}
                onClick={() =>
                  onOrder?.(details)
                }
              >
                Mark ordered
              </Button>
            )}


            {canReceive && (
              <Button
                icon={PackageCheck}
                onClick={receive}
              >
                Mark received
              </Button>
            )}


            {canCancel && (
              <Button
                variant="secondary"
                icon={X}
                onClick={cancel}
              >
                Cancel request
              </Button>
            )}


            <Button
              variant="secondary"
              onClick={onClose}
            >
              Close
            </Button>

          </div>

        </div>
      )}
    </Modal>
  );
}


/* ==========================================================================
   MAIN PROCUREMENT PAGE
   ========================================================================== */

export default function Procurement({
  notify,
}) {
  const [requests, setRequests] =
    useState([]);

  const [pendingApprovals, setPendingApprovals] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [locations, setLocations] =
    useState([]);

  const [suppliers, setSuppliers] =
    useState([]);


  const [loading, setLoading] =
    useState(true);

  const [masterDataLoading, setMasterDataLoading] =
    useState(true);

  const [pendingLoading, setPendingLoading] =
    useState(false);


  const [activeTab, setActiveTab] =
    useState('all');

  const [search, setSearch] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [approvalAction, setApprovalAction] =
    useState(null);

  const [orderRequest, setOrderRequest] =
    useState(null);

  const [actionMenu, setActionMenu] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);


  /* ---------------------------------------------------------------------- */
  /* Load procurement                                                       */
  /* ---------------------------------------------------------------------- */

  const fetchRequests =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await api.get(
            '/api/procurement'
          );

        setRequests(
          normalizeListResponse(
            response
          )
        );
      } catch (error) {
        console.error(
          'Failed to fetch procurement requests',
          error
        );

        notify?.(
          getErrorMessage(
            error,
            'Failed to load procurement requests.'
          )
        );

        setRequests([]);
      } finally {
        setLoading(false);
      }
    }, [notify]);


  /* ---------------------------------------------------------------------- */
  /* Load pending approvals                                                */
  /* ---------------------------------------------------------------------- */

  const fetchPendingApprovals =
    useCallback(async () => {
      try {
        setPendingLoading(true);

        const response =
          await api.get(
            '/api/procurement/pending-approvals'
          );

        setPendingApprovals(
          normalizeListResponse(
            response
          )
        );
      } catch (error) {
        console.error(
          'Failed to fetch pending approvals',
          error
        );

        setPendingApprovals([]);
      } finally {
        setPendingLoading(false);
      }
    }, []);


  /* ---------------------------------------------------------------------- */
  /* Load categories, locations and suppliers                              */
  /* ---------------------------------------------------------------------- */

  const fetchMasterData =
    useCallback(async () => {
      try {
        setMasterDataLoading(true);

        const [
          categoriesResponse,
          locationsResponse,
          suppliersResponse,
        ] = await Promise.all([
          api.get(
            '/api/categories/tree'
          ),

          api.get(
            '/api/locations/tree'
          ),

          api.get(
            '/api/suppliers'
          ),
        ]);


        /* --------------------------------------------------------------- */
        /* Categories                                                      */
        /* --------------------------------------------------------------- */

        const categoryTree =
          getTreeResponse(
            categoriesResponse
          );

        setCategories(
          flattenTree(categoryTree)
        );


        /* --------------------------------------------------------------- */
        /* Locations                                                       */
        /* --------------------------------------------------------------- */

        const locationTree =
          getTreeResponse(
            locationsResponse
          );

        setLocations(
          flattenTree(locationTree)
        );


        /* --------------------------------------------------------------- */
        /* Suppliers                                                       */
        /* --------------------------------------------------------------- */

        setSuppliers(
          normalizeListResponse(
            suppliersResponse
          )
        );

      } catch (error) {
        console.error(
          'Failed to fetch procurement master data',
          error
        );

        notify?.(
          getErrorMessage(
            error,
            'Failed to load categories, locations or suppliers.'
          )
        );

        setCategories([]);
        setLocations([]);
        setSuppliers([]);
      } finally {
        setMasterDataLoading(false);
      }
    }, [notify]);


  /* ---------------------------------------------------------------------- */
  /* Initial load                                                           */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    fetchRequests();
    fetchPendingApprovals();
    fetchMasterData();
  }, [
    fetchRequests,
    fetchPendingApprovals,
    fetchMasterData,
  ]);


  /* ---------------------------------------------------------------------- */
  /* Refresh                                                               */
  /* ---------------------------------------------------------------------- */

  const refresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);

      await Promise.all([
        fetchRequests(),
        fetchPendingApprovals(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };


  /* ---------------------------------------------------------------------- */
  /* Created                                                                */
  /* ---------------------------------------------------------------------- */

  const handleCreated =
    async () => {
      await Promise.all([
        fetchRequests(),
        fetchPendingApprovals(),
      ]);
    };


  /* ---------------------------------------------------------------------- */
  /* Action complete                                                        */
  /* ---------------------------------------------------------------------- */

  const handleActionComplete =
    async () => {
      setApprovalAction(null);
      setOrderRequest(null);

      await Promise.all([
        fetchRequests(),
        fetchPendingApprovals(),
      ]);

      setSelectedRequest(null);
    };


  /* ---------------------------------------------------------------------- */
  /* Filtering                                                              */
  /* ---------------------------------------------------------------------- */

  const filteredRequests =
    useMemo(() => {
      let result = [
        ...requests,
      ];


      if (
        activeTab ===
        'approval'
      ) {
        const pendingIds =
          new Set(
            pendingApprovals.map(
              (approval) =>
                approval.procurement_id
            )
          );

        result =
          result.filter(
            (request) =>
              pendingIds.has(
                request.id
              )
          );
      }


      if (
        activeTab ===
        'ordered'
      ) {
        result =
          result.filter(
            (request) =>
              request.status ===
              'ordered'
          );
      }


      if (search.trim()) {
        const query =
          search
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (request) =>
              [
                request.id,
                request.item_name,
                request.department,
                request.project,
                request.status,
                request.priority,
                request.po_number,
                request.matched_notes,
              ]
                .filter(Boolean)
                .some((value) =>
                  String(value)
                    .toLowerCase()
                    .includes(query)
                )
          );
      }


      return result;
    }, [
      requests,
      activeTab,
      search,
      pendingApprovals,
    ]);


  /* ---------------------------------------------------------------------- */
  /* Stats                                                                  */
  /* ---------------------------------------------------------------------- */

  const stats =
    useMemo(() => ({
      total:
        requests.length,

      pending:
        requests.filter(
          (request) =>
            request.status ===
            'pending_approval'
        ).length,

      approved:
        requests.filter(
          (request) =>
            request.status ===
              'approved' ||
            request.status ===
              'self_approved'
        ).length,

      ordered:
        requests.filter(
          (request) =>
            request.status ===
            'ordered'
        ).length,
    }), [requests]);


  /* ---------------------------------------------------------------------- */
  /* Tabs                                                                   */
  /* ---------------------------------------------------------------------- */

  const tabs = [
    {
      id: 'all',
      label: 'All requests',
      count: requests.length,
    },
    {
      id: 'my',
      label: 'My requests',
    },
    {
      id: 'approval',
      label: 'Needs approval',
      count:
        pendingApprovals.length,
    },
    {
      id: 'ordered',
      label: 'Ordered',
      count: stats.ordered,
    },
  ];


  /* ---------------------------------------------------------------------- */
  /* Open details                                                           */
  /* ---------------------------------------------------------------------- */

  const openDetails =
    (request) => {
      setActionMenu(null);
      setSelectedRequest(
        request
      );
    };


  /* ---------------------------------------------------------------------- */
  /* Approval                                                               */
  /* ---------------------------------------------------------------------- */

  const openApprove =
    (request, approval) => {
      setActionMenu(null);
      setSelectedRequest(null);

      setApprovalAction({
        request,
        approval,
        decision:
          'approved',
      });
    };


  const openReject =
    (request, approval) => {
      setActionMenu(null);
      setSelectedRequest(null);

      setApprovalAction({
        request,
        approval,
        decision:
          'rejected',
      });
    };


  /* ---------------------------------------------------------------------- */
  /* Order                                                                  */
  /* ---------------------------------------------------------------------- */

  const openOrder =
    (request) => {
      setActionMenu(null);
      setSelectedRequest(null);

      setOrderRequest(
        request
      );
    };


  /* ---------------------------------------------------------------------- */
  /* Receive                                                                */
  /* ---------------------------------------------------------------------- */

  const receiveFromRow =
    async (request) => {
      setActionMenu(null);

      try {
        await api.patch(
          `/api/procurement/${request.id}/receive`
        );

        notify?.(
          'Procurement request marked as received.'
        );

        await refresh();
      } catch (error) {
        console.error(
          'Failed to receive procurement',
          error
        );

        notify?.(
          getErrorMessage(
            error,
            'Failed to mark request as received.'
          )
        );
      }
    };


  /* ---------------------------------------------------------------------- */
  /* Cancel                                                                 */
  /* ---------------------------------------------------------------------- */

  const cancelFromRow =
    async (request) => {
      setActionMenu(null);

      const confirmed =
        window.confirm(
          'Are you sure you want to cancel this procurement request?'
        );

      if (!confirmed) return;

      try {
        await api.patch(
          `/api/procurement/${request.id}/cancel`
        );

        notify?.(
          'Procurement request cancelled.'
        );

        await refresh();
      } catch (error) {
        console.error(
          'Failed to cancel procurement',
          error
        );

        notify?.(
          getErrorMessage(
            error,
            'Failed to cancel request.'
          )
        );
      }
    };


  /* ---------------------------------------------------------------------- */
  /* Pending approval lookup                                                */
  /* ---------------------------------------------------------------------- */

  const getPendingApproval =
    (request) =>
      pendingApprovals.find(
        (approval) =>
          approval.procurement_id ===
          request.id
      );


  /* ---------------------------------------------------------------------- */
  /* Row action menu                                                        */
  /* ---------------------------------------------------------------------- */

  const renderActions =
    (request) => {
      const pendingApproval =
        getPendingApproval(
          request
        );

      const canApprove =
        pendingApproval &&
        request.status ===
          'pending_approval';

      const canOrder =
        request.status ===
          'approved' ||
        request.status ===
          'self_approved';

      const canReceive =
        request.status ===
        'ordered';

      const canCancel = [
        'draft',
        'submitted',
        'pending_approval',
      ].includes(
        request.status
      );


      return (
        <div className="procurement-row-actions">

          <button
            className="row-action"
            title="Actions"
            onClick={(event) => {
              event.stopPropagation();

              setActionMenu(
                (current) =>
                  current ===
                  request.id
                    ? null
                    : request.id
              );
            }}
          >
            <MoreHorizontal
              size={17}
            />
          </button>


          {actionMenu ===
            request.id && (
            <div
              className="procurement-action-menu"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                onClick={() =>
                  openDetails(
                    request
                  )
                }
              >
                <Eye size={15} />
                View details
              </button>


              {canApprove && (
                <>
                  <button
                    onClick={() =>
                      openApprove(
                        request,
                        pendingApproval
                      )
                    }
                  >
                    <Check size={15} />
                    Approve
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      openReject(
                        request,
                        pendingApproval
                      )
                    }
                  >
                    <X size={15} />
                    Reject
                  </button>
                </>
              )}


              {canOrder && (
                <button
                  onClick={() =>
                    openOrder(
                      request
                    )
                  }
                >
                  <Truck size={15} />
                  Mark ordered
                </button>
              )}


              {canReceive && (
                <button
                  onClick={() =>
                    receiveFromRow(
                      request
                    )
                  }
                >
                  <PackageCheck
                    size={15}
                  />
                  Mark received
                </button>
              )}


              {canCancel && (
                <button
                  className="danger"
                  onClick={() =>
                    cancelFromRow(
                      request
                    )
                  }
                >
                  <X size={15} />
                  Cancel
                </button>
              )}

            </div>
          )}

        </div>
      );
    };


  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className="page-stack procurement-page">

      <PageHeader
        eyebrow="Operations / Procurement"
        title="Procurement"
        description="Search existing inventory first, then move new purchases through approval."
        action={
          <Button
            icon={Plus}
            onClick={() =>
              setShowForm(true)
            }
          >
            New request
          </Button>
        }
      />


      {/* ------------------------------------------------------------------ */}
      {/* Banner                                                             */}
      {/* ------------------------------------------------------------------ */}

      <div className="procurement-banner">

        <div className="banner-icon">
          <ShoppingCart size={20} />
        </div>

        <div>
          <strong>
            Inventory-first workflow
          </strong>

          <span>
            Existing-asset requests automatically check
            available inventory before being routed for approval.
          </span>
        </div>

        <Button
          variant="secondary"
          icon={Search}
          onClick={() =>
            setShowForm(true)
          }
        >
          Search inventory
        </Button>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Stats                                                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="procurement-stats">

        <StatCard
          icon={FileText}
          label="Total requests"
          value={stats.total}
        />

        <StatCard
          icon={Clock3}
          label="Pending approval"
          value={stats.pending}
          tone="stat-amber"
        />

        <StatCard
          icon={Check}
          label="Approved"
          value={stats.approved}
          tone="stat-green"
        />

        <StatCard
          icon={Truck}
          label="Ordered"
          value={stats.ordered}
          tone="stat-purple"
        />

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Main Panel                                                         */}
      {/* ------------------------------------------------------------------ */}

      <div className="panel procurement-panel">

        {/* Tabs */}

        <div className="filter-tabs procurement-tabs">

          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={
                activeTab ===
                tab.id
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveTab(
                  tab.id
                )
              }
            >
              {tab.label}

              {typeof tab.count ===
                'number' && (
                <span className="tab-count">
                  {tab.count}
                </span>
              )}
            </button>
          ))}

        </div>


        {/* Toolbar */}

        <div className="procurement-toolbar">

          <div className="procurement-search">

            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search requests..."
            />

            {search && (
              <button
                className="procurement-search-clear"
                onClick={() =>
                  setSearch('')
                }
              >
                <X size={14} />
              </button>
            )}

          </div>


          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </Button>

        </div>


        {/* Table */}

        <div className="table-wrap">

          {loading ? (

            <div className="procurement-loading">

              <RefreshCw
                size={18}
                className="procurement-spin"
              />

              Loading procurement requests...

            </div>

          ) : filteredRequests.length === 0 ? (

            <div className="procurement-empty">

              <div className="procurement-empty-icon">
                <ShoppingCart size={22} />
              </div>

              <strong>
                {search
                  ? 'No matching requests'
                  : activeTab ===
                      'approval'
                    ? pendingLoading
                      ? 'Loading approvals...'
                      : 'No requests need your approval'
                    : 'No procurement requests'}
              </strong>

              <span>
                {search
                  ? 'Try changing your search.'
                  : 'Create a new procurement request to get started.'}
              </span>

              {!search &&
                activeTab ===
                  'all' && (
                  <Button
                    icon={Plus}
                    onClick={() =>
                      setShowForm(
                        true
                      )
                    }
                  >
                    New request
                  </Button>
                )}

            </div>

          ) : (

            <table className="procurement-table">

              <thead>
                <tr>
                  <th>
                    Request
                  </th>

                  <th>
                    Requested by
                  </th>

                  <th>
                    Priority
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Estimated cost
                  </th>

                  <th>
                    Created
                  </th>

                  <th />
                </tr>
              </thead>


              <tbody>

                {filteredRequests.map(
                  (request) => (
                    <tr
                      key={request.id}
                      className="procurement-table-row"
                      onClick={() =>
                        openDetails(
                          request
                        )
                      }
                    >

                      <td>
                        <div>
                          <strong className="mono">
                            {request.id}
                          </strong>

                          <span className="cell-subtitle">
                            {request.item_name ||
                              'Unnamed item'}
                          </span>
                        </div>
                      </td>


                      <td>
                        <div>
                          <strong>
                            {request.requested_by ||
                              '—'}
                          </strong>

                          <span className="cell-subtitle">
                            {request.department ||
                              'No department'}
                          </span>
                        </div>
                      </td>


                      <td>
                        <PriorityBadge
                          priority={
                            request.priority
                          }
                        />
                      </td>


                      <td>
                        <StatusBadge
                          status={
                            request.status
                          }
                        />
                      </td>


                      <td>
                        {formatCurrency(
                          request.estimated_cost,
                          request.currency
                        )}
                      </td>


                      <td className="muted-cell">
                        {formatDate(
                          request.created_at
                        )}
                      </td>


                      <td>
                        {renderActions(
                          request
                        )}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
          )}

        </div>


        {/* Footer */}

        {!loading &&
          filteredRequests.length >
            0 && (
            <div className="procurement-table-footer">

              Showing{' '}
              <strong>
                {filteredRequests.length}
              </strong>{' '}
              of{' '}
              <strong>
                {requests.length}
              </strong>{' '}
              requests

            </div>
          )}

      </div>


      {/* ------------------------------------------------------------------ */}
      {/* Create Form                                                        */}
      {/* ------------------------------------------------------------------ */}

      {showForm && (
        <ProcurementForm
          categories={categories}
          locations={locations}
          notify={notify}
          onClose={() =>
            setShowForm(false)
          }
          onCreated={
            handleCreated
          }
        />
      )}


      {/* ------------------------------------------------------------------ */}
      {/* Details                                                            */}
      {/* ------------------------------------------------------------------ */}

      {selectedRequest && (
        <ProcurementDetails
          request={
            selectedRequest
          }
          notify={notify}
          onClose={() =>
            setSelectedRequest(
              null
            )
          }
          onRefresh={
            refresh
          }
          onApprove={
            openApprove
          }
          onReject={
            openReject
          }
          onOrder={
            openOrder
          }
        />
      )}


      {/* ------------------------------------------------------------------ */}
      {/* Approval                                                           */}
      {/* ------------------------------------------------------------------ */}

      {approvalAction && (
        <ApprovalModal
          request={
            approvalAction.request
          }
          approval={
            approvalAction.approval
          }
          decision={
            approvalAction.decision
          }
          notify={notify}
          onClose={() =>
            setApprovalAction(
              null
            )
          }
          onComplete={
            handleActionComplete
          }
        />
      )}


      {/* ------------------------------------------------------------------ */}
      {/* Order                                                              */}
      {/* ------------------------------------------------------------------ */}

      {orderRequest && (
        <OrderModal
          request={
            orderRequest
          }
          suppliers={
            suppliers
          }
          notify={notify}
          onClose={() =>
            setOrderRequest(
              null
            )
          }
          onComplete={
            handleActionComplete
          }
        />
      )}

    </div>
  );
}