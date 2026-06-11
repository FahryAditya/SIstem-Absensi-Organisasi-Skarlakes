const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'app', 'dashboard', 'DashboardClient.tsx');
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { search: /bg-\[rgba\(84,130,180,0\.12\)\]/g, replace: 'bg-indigo-50' },
  { search: /text-\[\#5482B4\]/g, replace: 'text-indigo-600' },
  { search: /text-\[\#011025\]/g, replace: 'text-slate-900' },
  { search: /text-\[\#7EA0C5\]/g, replace: 'text-slate-500' },
  { search: /text-\[\#C2E8FF\]/g, replace: 'text-indigo-200' },
  { search: /from-\[\#052659\] to-\[\#5482B4\]/g, replace: 'from-indigo-900 to-indigo-600' },
  { search: /bg-\[\#052659\]/g, replace: 'bg-indigo-900' },
  { search: /bg-\[\#5482B4\]/g, replace: 'bg-indigo-500' },
  { search: /border-\[rgba\(84,130,180,0\.15\)\]/g, replace: 'border-slate-200' },
  { search: /\#5482B4/g, replace: '#8b5cf6' }, // violet-500
  { search: /\#C2E8FF/g, replace: '#ddd6fe' }, // violet-200
  { search: /\#052659/g, replace: '#4c1d95' }, // violet-900
  { search: /\#011025/g, replace: '#0f172a' }, // slate-900
  { search: /\#7EA0C5/g, replace: '#64748b' }, // slate-500
  { search: /bg-\[\#C2E8FF\]/g, replace: 'bg-indigo-100' }
];

for (const r of replacements) {
  content = content.replace(r.search, r.replace);
}

fs.writeFileSync(file, content);
console.log('Colors replaced in DashboardClient.tsx');
