import { useState, useEffect } from 'react';
import api from '../lib/api';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

export default function Management({ title, eyebrow, description, icon: Icon, onAdd, type, notify }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/api/${type}`);
        // Assuming paginated response { data: [...] }
        const dataArray = Array.isArray(data) ? data : data.data || [];
        setItems(dataArray);
      } catch (err) {
        console.error(`Failed to fetch ${type}`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [type, notify]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={<Button icon={Plus} onClick={onAdd}>Add {title.slice(0, -1).toLowerCase()}</Button>}
      />
      <div className="management-grid">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {items.map((item) => (
              <div className="management-card" key={item.id || item.name}>
                <div className="management-icon"><Icon size={19} /></div>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                </div>
                <button className="row-action"><MoreHorizontal size={17} /></button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
