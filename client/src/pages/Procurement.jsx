import { useState, useEffect } from 'react';
import api from '../lib/api';
import { MoreHorizontal, Plus, RotateCcw, Search, ShoppingCart } from 'lucide-react';
import { Badge, Button, Modal, PageHeader } from '../components/ui';

export default function Procurement({ notify }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/procurement`);
        // Assuming paginated response { data: [...] }
        const dataArray = Array.isArray(data) ? data : data.data || [];
        setRequests(dataArray);
      } catch (err) {
        console.error('Failed to fetch procurement requests', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [notify]);

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newRequest = {
      item: form.get('item'),
      requester: 'Ananya Sen', // TODO: get from auth user
      department: 'Operations', // TODO: get from auth user
      priority: form.get('priority'),
      status: 'Draft',
      cost: form.get('cost') || undefined,
      // date will be set by server
    };
    try {
      await api.post(`/api/procurement`, newRequest);
      setModal(false);
      notify('Procurement request saved as draft.');
      // Refetch requests
      const data = await api.get(`/api/procurement`);
      const dataArray = Array.isArray(data) ? data : data.data || [];
      setRequests(dataArray);
    } catch (err) {
      console.error('Failed to create procurement request', err);
      notify('Failed to save request');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Operations / Procurement"
        title="Procurement"
        description="Search existing inventory first, then move new purchases through approval."
        action={<Button icon={Plus} onClick={() => setModal(true)}>New request</Button>}
      />
      <div className="procurement-banner">
        <div className="banner-icon"><ShoppingCart size={20} /></div>
        <div>
          <strong>Inventory-first workflow</strong>
          <span>Before raising a purchase, search available and assigned assets to avoid unnecessary spend.</span>
        </div>
        <Button variant="secondary" onClick={() => setModal(true)}>Search inventory</Button>
      </div>
      <div className="panel">
        <div className="filter-tabs">
          <button className="active">All requests</button>
          <button>My requests</button>
          <button>Needs approval <span className="tab-count">3</span></button>
          <button>Ordered</button>
        </div>
        <div className="table-wrap">
          {loading ? (
            <p>Loading requests...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Requested by</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Estimated cost</th>
                    <th>Created</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <div>
                          <strong className="mono">{request.id}</strong>
                          <span className="cell-subtitle">{request.item}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong>{request.requester}</strong>
                          <span className="cell-subtitle">{request.department}</span>
                        </div>
                      </td>
                      <td>
                        <Badge>{request.priority}</Badge>
                      </td>
                      <td>
                        <Badge>{request.status}</Badge>
                      </td>
                      <td>{request.cost}</td>
                      <td className="muted-cell">{request.date}</td>
                      <td>
                        <button className="row-action"><MoreHorizontal size={17} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
      {modal && (
        <Modal title="Raise procurement request" onClose={() => setModal(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              Item name
              <input name="item" required placeholder="What do you need?" />
            </label>
            <label>
              Request type
              <select>
                <option>New purchase</option>
                <option>Existing asset</option>
              </select>
            </label>
            <label>
              Priority
              <select name="priority">
                <option>Normal</option>
                <option>Low</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </label>
            <label>
              Estimated cost
              <input name="cost" placeholder="₹0.00" />
            </label>
            <label className="full-field">
              Justification
              <textarea required minLength="20" placeholder="Tell us why this request is needed..." />
            </label>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save request</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
