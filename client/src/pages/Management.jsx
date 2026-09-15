import { MoreHorizontal, Plus } from 'lucide-react';
import { Button, PageHeader } from '../components/ui';

export default function Management({ title, eyebrow, description, icon: Icon, items, onAdd }) {
  return <div className="page-stack"><PageHeader eyebrow={eyebrow} title={title} description={description} action={<Button icon={Plus} onClick={onAdd}>Add {title.slice(0, -1).toLowerCase()}</Button>} /><div className="management-grid">{items.map((item) => <div className="management-card" key={item.name}><div className="management-icon"><Icon size={19} /></div><div><h3>{item.name}</h3><p>{item.detail}</p></div><button className="row-action"><MoreHorizontal size={17} /></button></div>)}</div></div>;
}
