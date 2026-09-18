import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import {
  Download,
  Filter,
  Laptop,
  Monitor,
  Server,
  Smartphone,
  FileText,
  MoreHorizontal,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Badge, Button, EmptyState, Info, Modal, PageHeader } from '../components/ui';

const ICON_MAP = {
  Laptop: Laptop,
  Monitor: Monitor,
  Server: Server,
  Smartphone: Smartphone,
  FileText: FileText,
  // default fallback
  default: Laptop,
};

export default function Assets({ notify }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All assets');
  const [modal, setModal] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/assets');
        // Assuming API returns { data: [...] } or just array
        const assetsArray = Array.isArray(data) ? data : data.data || [];
        setAssets(assetsArray);
      } catch (err) {
        console.error('Failed to fetch assets', err);
        notify('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [notify]);

  const filteredAssets = useMemo(() => assets.filter((asset) => (filter === 'All assets' || asset.status === filter || asset.type === filter) && `${asset.number} ${asset.name} ${asset.category} ${asset.assignee}`.toLowerCase().includes(search.toLowerCase())), [assets, filter, search]);

  const addAsset = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newAsset = {
      name: form.get('name'),
      category: form.get('category'),
      serial: form.get('serial') || undefined,
      value: form.get('value') || undefined,
      source: form.get('source') || 'Internal',
    };
    try {
      await api.post('/api/assets', newAsset);
      setModal(null);
      notify('Asset created successfully.');
      // Refetch assets
      const data = await api.get('/api/assets');
      setAssets(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Failed to create asset', err);
      notify('Failed to create asset');
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Inventory / Assets"
        title="Assets"
        description="Track every device, license, and customer-provided asset in one place."
        action={
          <Button icon={Plus} onClick={() => setModal('add')}>
            Add asset
          </Button>
        }
      />
      <div className="panel">
        <div className="toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by asset number, name, serial..."
            />
          </div>
          <div className="toolbar-actions">
            <button className="filter-button">
              <Filter size={15} /> Filters <span>2</span>
            </button>
            <button className="icon-button">
              <Download size={17} />
            </button>
            <button className="icon-button">
              <MoreHorizontal size={17} />
            </button>
          </div>
        </div>
        <div className="filter-tabs">
          {['All assets', 'Hardware', 'Software', 'Available', 'Assigned', 'Maintenance'].map((tab) => (
            <button
              key={tab}
              className={filter === tab ? 'active' : ''}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="table-wrap">
          {loading ? (
            <p>Loading assets...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Location</th>
                    <th>Warranty</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td>
                        <div className="asset-cell">
                          <div className="asset-thumb">
                            const Icon = ICON_MAP[asset.icon] || ICON_MAP.default;
                            <Icon size={17} />
                          </div>
                          <div>
                            <strong className="mono">{asset.number}</strong>
                            <span>{asset.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{asset.category}</td>
                      <td>
                        <Badge>{asset.status}</Badge>
                      </td>
                      <td>{asset.assignee}</td>
                      <td className="muted-cell">{asset.location}</td>
                      <td>{asset.warranty}</td>
                      <td>
                        <button
                          className="row-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAsset(asset);
                          }}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAssets.length === 0 && (
                <EmptyState title="No assets found" text="Try another search or clear the current filters." />
              )}
            </>
          )}
        </div>
        <div className="table-footer">
          <span>
            Showing <strong>{filteredAssets.length}</strong> of {assets.length} assets
          </span>
          <div className="pagination">
            <button disabled>←</button>
            <button className="current">1</button>
            <button>2</button>
            <button>3</button>
            <button>→</button>
          </div>
        </div>
      </div>
      {modal === 'add' && (
        <Modal title="Add a new asset" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={addAsset}>
            <label>
              Asset name
              <input name="name" required placeholder="e.g. Lenovo ThinkPad X1" />
            </label>
            <label>
              Category
              <select name="category">
                <option>Laptops</option>
                <option>Desktops</option>
                <option>Monitors & Displays</option>
                <option>Test Benches</option>
                <option>Mobile Devices</option>
              </select>
            </label>
            <label>
              Serial number
              <input name="serial" placeholder="Optional serial number" />
            </label>
            <label>
              Purchase value
              <input name="value" placeholder="₹0.00" />
            </label>
            <label>
              Source
              <select name="source">
                <option>Internal</option>
                <option>Customer-provided</option>
              </select>
            </label>
            <div className="form-note">
              <ShieldCheck size={16} />
              The asset number will be generated automatically from its category.
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Create asset</Button>
            </div>
          </form>
        </Modal>
      )}
      {selectedAsset && (
        <AssetDetail asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
      )}
    </div>
  );
}

function AssetDetail({ asset, onClose }) {
  const Icon = ICON_MAP[asset.icon] || ICON_MAP.default;
  return (
    <Modal title={asset.name} onClose={onClose} wide>
      <div className="detail-top">
        <div className="detail-visual">
          <Icon size={38} />
        </div>
        <div>
          <p className="mono accent-text">{asset.number}</p>
          <h3>{asset.name}</h3>
          <p>{asset.category} · {asset.source}</p>
        </div>
        <Badge>{asset.status}</Badge>
      </div>
      <div className="detail-grid">
        <Info label="Serial number" value={asset.serial} mono />
        <Info label="Assigned to" value={asset.assignee} />
        <Info label="Location" value={asset.location} />
        <Info label="Purchase value" value={asset.value} />
        <Info label="Warranty expiry" value={asset.warranty} />
        <Info label="Customer reference" value={asset.source === 'Internal' ? 'Not applicable' : 'ACME-TB-2207'} />
      </div>
      <div className="detail-section">
        <div className="section-heading">
          <h3>Asset history</h3>
          <span className="muted-cell">Last 5 events</span>
        </div>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon green"><ShieldCheck size={15} /></div>
            <div>
              <strong>Asset record updated</strong>
              <span>Location confirmed by Ananya Sen</span>
            </div>
            <time>Today</time>
          </div>
          <div className="activity-item">
            <div className="activity-icon blue"><QrCode size={15} /></div>
            <div>
              <strong>Assignment created</strong>
              <span>Assigned to {asset.assignee}</span>
            </div>
            <time>18 Aug 2026</time>
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <Button variant="secondary" icon={QrCode}>View QR code</Button>
        <Button variant="secondary" icon={RotateCcw}>Rotate QR</Button>
        <Button onClick={onClose}>Close</Button>
      </div>
    </Modal>
  );
}
