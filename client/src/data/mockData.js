import { ClipboardList, FileText, GitBranch, Laptop, Monitor, Package, Server, ShoppingCart, Smartphone, Wrench } from 'lucide-react';

export const initialAssets = [
  { id: 1, number: 'LAP-00042', name: 'MacBook Pro 14', category: 'Laptops', type: 'Hardware', status: 'Assigned', assignee: 'Priya Shah', location: 'Bangalore · Engineering · Alpha', serial: 'C02ZK09QMD6M', value: '₹1,84,900', warranty: '18 Jan 2027', source: 'Internal', icon: Laptop },
  { id: 2, number: 'DES-00018', name: 'Dell Precision 5820', category: 'Desktops', type: 'Hardware', status: 'Available', assignee: '—', location: 'Bangalore · Engineering · Beta', serial: 'DLP5820-8831', value: '₹1,26,500', warranty: '06 Mar 2026', source: 'Internal', icon: Monitor },
  { id: 3, number: 'TST-00007', name: 'Customer Test Bench', category: 'Test Benches', type: 'Hardware', status: 'Maintenance', assignee: '—', location: 'Bangalore · Engineering · Alpha', serial: 'TB-ACME-2207', value: 'Customer-owned', warranty: '—', source: 'Acme Systems', icon: Server },
  { id: 4, number: 'MON-00061', name: 'Dell UltraSharp U2723QE', category: 'Monitors & Displays', type: 'Hardware', status: 'Assigned', assignee: 'Arjun Rao', location: 'Pune · Engineering · Gamma', serial: 'CN0U2723-61', value: '₹54,900', warranty: '28 Nov 2026', source: 'Internal', icon: Monitor },
  { id: 5, number: 'MOB-00012', name: 'iPhone 15 Pro', category: 'Mobile Devices', type: 'Hardware', status: 'Lost', assignee: 'Karan Mehta', location: 'Bangalore · Operations · Common Area', serial: 'F2LQ9Y5V3M', value: '₹1,34,900', warranty: '12 Sep 2026', source: 'Internal', icon: Smartphone },
  { id: 6, number: 'SRV-00003', name: 'Dell PowerEdge R750', category: 'Servers', type: 'Hardware', status: 'In transit', assignee: '—', location: 'Bangalore · Operations · Alpha', serial: 'R750-00301', value: '₹4,80,000', warranty: '30 Jun 2028', source: 'Internal', icon: Server },
  { id: 7, number: 'SW-00029', name: 'Figma Professional', category: 'Design Tools', type: 'Software', status: 'Available', assignee: '—', location: 'Cloud license', serial: 'FIG-TEAM-29', value: '₹96,000 / yr', warranty: '31 Dec 2026', source: 'Internal', icon: FileText },
];

export const initialRequests = [
  { id: 'PR-0028', item: 'MacBook Pro 14', requester: 'Neha Kapoor', department: 'Design', priority: 'High', status: 'Pending approval', cost: '₹1,84,900', date: 'Today, 09:42' },
  { id: 'PR-0027', item: 'Development workstation', requester: 'Rohit Nair', department: 'Engineering', priority: 'Normal', status: 'Approved', cost: '₹1,26,500', date: 'Yesterday' },
  { id: 'PR-0026', item: 'Figma Professional seats', requester: 'Aisha Khan', department: 'Design', priority: 'Low', status: 'Ordered', cost: '₹96,000', date: '14 Sep 2026' },
  { id: 'PR-0025', item: 'Customer test bench repair', requester: 'Dev Mehta', department: 'Engineering', priority: 'Critical', status: 'In review', cost: '₹38,500', date: '13 Sep 2026' },
];

export const managementItems = {
  suppliers: [{ name: 'Dell Technologies', detail: 'Hardware · Bangalore · Net 30' }, { name: 'Apple India Pvt. Ltd.', detail: 'Hardware · Mumbai · Net 45' }, { name: 'Acme Systems', detail: 'Customer-provided assets · Pune' }, { name: 'Adobe Systems', detail: 'Software · Annual billing' }],
  customers: [{ name: 'Acme Systems', detail: '3 customer-provided assets · Active' }, { name: 'Northstar Labs', detail: '1 customer-provided asset · Active' }, { name: 'Vertex Mobility', detail: '0 customer-provided assets · Active' }],
  users: [{ name: 'Ananya Sen', detail: 'Administrator · Operations' }, { name: 'Priya Shah', detail: 'Engineer · Engineering' }, { name: 'Arjun Rao', detail: 'Project Manager · Engineering' }, { name: 'Neha Kapoor', detail: 'Designer · Design' }],
  locations: [{ name: 'Bangalore', detail: '5 departments · 9 projects' }, { name: 'Pune', detail: '3 departments · 4 projects' }, { name: 'Common Area', detail: 'Shared workspace · Bangalore' }],
  settings: [{ name: 'Company profile', detail: 'Northstar Labs · INR · India' }, { name: 'Approval rules', detail: '5 active budget tiers' }, { name: 'Alerts & notifications', detail: 'Email relay configured' }, { name: 'Security', detail: '15 minute access sessions' }],
};

export const assignmentRows = [
  { id: 1, item: 'MacBook Pro 14', requester: 'Neha Kapoor', status: 'Pending approval', requested: 'Today, 09:42' },
  { id: 2, item: 'Dell UltraSharp U2723QE', requester: 'Arjun Rao', status: 'Assigned', requested: '18 Aug 2026' },
  { id: 3, item: 'ThinkPad X1 Carbon', requester: 'Rohit Nair', status: 'Returned', requested: '12 Aug 2026' },
];

export const reallocationRows = [
  { id: 1, item: 'Dell UltraSharp U2723QE', from: 'Arjun Rao', to: 'Neha Kapoor', status: 'Pending approval', requested: 'Today' },
  { id: 2, item: 'MacBook Pro 13', from: 'Aisha Khan', to: 'Karan Mehta', status: 'Approved', requested: 'Yesterday' },
];

export const workflowIcons = { assignments: ClipboardList, reallocations: GitBranch, procurement: ShoppingCart, assets: Package, maintenance: Wrench };
