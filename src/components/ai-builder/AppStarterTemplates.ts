/**
 * Full-app starter templates — pre-tested multi-file scaffolds
 * that the AI extends instead of writing from scratch.
 */

import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function f(path: string, content: string): ProjectFile {
  const ext = path.split('.').pop() || '';
  const langMap: Record<string, string> = { html: 'html', js: 'javascript', ts: 'typescript', css: 'css', json: 'json', md: 'markdown' };
  return { path, content, language: langMap[ext] || ext };
}

export interface AppStarterTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'app' | 'site' | 'tool' | 'react';
  tags: string[];
  files: ProjectFile[];
  aiContext: string;
}

// ─── Shared HTML shell ───
const htmlShell = (title: string, extraStyle = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; }
    ${extraStyle}
  </style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div id="app"></div>
  <script src="app.js"><\/script>
</body>
</html>`;

// ─── CRUD App JS ───
const crudAppJs = `// ─── State Management ───
let items = JSON.parse(localStorage.getItem('app_items') || '[]');
let editingId = null;

function saveItems() { localStorage.setItem('app_items', JSON.stringify(items)); }

function addItem(data) {
  const item = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
  items = [...items, item];
  saveItems(); render();
}

function updateItem(id, updates) {
  items = items.map(item => item.id === id ? { ...item, ...updates } : item);
  saveItems(); render();
}

function deleteItem(id) {
  if (!confirm('Delete this item?')) return;
  items = items.filter(item => item.id !== id);
  saveItems(); render();
}

function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function render() {
  document.getElementById('app').innerHTML = \`
    <div class="max-w-2xl mx-auto px-4 py-8">
      <header class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900">My Items</h1>
        <button onclick="showAddForm()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">+ Add Item</button>
      </header>
      <div id="form-container"></div>
      <div class="space-y-2">
        \${items.length === 0 ? '<div class="text-center py-16 text-gray-400"><p class="text-lg">No items yet</p><p class="text-sm mt-1">Click "Add Item" to get started</p></div>' : items.map(item => \`
          <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-sm transition group">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900">\${escapeHtml(item.name)}</p>
              \${item.description ? \`<p class="text-sm text-gray-500 mt-0.5">\${escapeHtml(item.description)}</p>\` : ''}
            </div>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="startEdit('\${item.id}')" class="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition">✏️</button>
              <button onclick="event.stopPropagation(); deleteItem('\${item.id}')" class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">🗑️</button>
            </div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}

function showAddForm() { editingId = null; renderForm({ name: '', description: '' }); }
function startEdit(id) { const item = items.find(i => i.id === id); if (!item) return; editingId = id; renderForm(item); }

function renderForm(data) {
  const c = document.getElementById('form-container');
  if (!c) { render(); return; }
  c.innerHTML = \`
    <div class="p-4 bg-white rounded-xl border border-indigo-200 mb-4">
      <div class="space-y-3">
        <input id="input-name" type="text" value="\${escapeHtml(data.name || '')}" placeholder="Item name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm" />
        <input id="input-desc" type="text" value="\${escapeHtml(data.description || '')}" placeholder="Description (optional)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm" />
        <div class="flex gap-2">
          <button onclick="handleSubmit()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition">\${editingId ? 'Update' : 'Add'}</button>
          <button onclick="cancelForm()" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm transition">Cancel</button>
        </div>
      </div>
    </div>
  \`;
  document.getElementById('input-name')?.focus();
}

function handleSubmit() {
  const name = document.getElementById('input-name')?.value?.trim();
  const description = document.getElementById('input-desc')?.value?.trim();
  if (!name) return;
  if (editingId) { updateItem(editingId, { name, description }); } else { addItem({ name, description }); }
  editingId = null;
}

function cancelForm() { editingId = null; render(); }
render();`;

// ─── Dashboard JS ───
const dashboardJs = `const stats = [
  { label: 'Total Users', value: '2,847', change: '+12.5%', trend: 'up', icon: '👥' },
  { label: 'Revenue', value: '$48.2K', change: '+8.2%', trend: 'up', icon: '💰' },
  { label: 'Active Projects', value: '24', change: '+3', trend: 'up', icon: '📁' },
  { label: 'Completion Rate', value: '94.2%', change: '-1.1%', trend: 'down', icon: '✅' },
];

const recentActivity = [
  { action: 'New user signed up', user: 'Alice Johnson', time: '2 min ago' },
  { action: 'Project completed', user: 'Bob Smith', time: '15 min ago' },
  { action: 'Payment received', user: 'Carol Davis', time: '1 hour ago' },
  { action: 'Support ticket opened', user: 'Dave Wilson', time: '2 hours ago' },
];

function render() {
  document.getElementById('app').innerHTML = \`
    <div class="flex min-h-screen">
      <aside class="w-60 bg-white border-r border-gray-200 p-4 hidden md:block">
        <div class="text-xl font-bold text-gray-900 mb-8 px-2">⚡ Dashboard</div>
        <nav class="space-y-1">
          <a href="#" class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700">📊 Overview</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">👥 Users</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">📁 Projects</a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50">⚙️ Settings</a>
        </nav>
      </aside>
      <main class="flex-1 p-6 md:p-8">
        <div class="flex items-center justify-between mb-8">
          <div><h1 class="text-2xl font-bold text-gray-900">Dashboard</h1><p class="text-sm text-gray-500 mt-1">Welcome back!</p></div>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">+ New Project</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          \${stats.map(s => \`
            <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition">
              <div class="flex items-center justify-between mb-3">
                <span class="text-2xl">\${s.icon}</span>
                <span class="text-xs font-medium px-2 py-1 rounded-full \${s.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">\${s.change}</span>
              </div>
              <p class="text-2xl font-bold text-gray-900">\${s.value}</p>
              <p class="text-sm text-gray-500 mt-1">\${s.label}</p>
            </div>
          \`).join('')}
        </div>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100"><h2 class="font-semibold text-gray-900">Recent Activity</h2></div>
          <div class="divide-y divide-gray-100">
            \${recentActivity.map(a => \`
              <div class="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                <div><p class="text-sm text-gray-900">\${a.action}</p><p class="text-xs text-gray-500 mt-0.5">\${a.user}</p></div>
                <span class="text-xs text-gray-400">\${a.time}</span>
              </div>
            \`).join('')}
          </div>
        </div>
      </main>
    </div>
  \`;
}
render();`;

// ─── Landing Page JS ───
const landingJs = `const features = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Built for speed with optimized performance.' },
  { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security built-in.' },
  { icon: '🎨', title: 'Beautiful Design', desc: 'Crafted with attention to detail.' },
  { icon: '🔌', title: 'Easy Integration', desc: 'Works with your favorite tools.' },
  { icon: '📊', title: 'Analytics Built-in', desc: 'Track what matters with dashboards.' },
  { icon: '🌍', title: 'Global Scale', desc: 'Edge networks for fast access worldwide.' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'CTO, TechCorp', quote: 'This product transformed how our team works.' },
  { name: 'Marcus Johnson', role: 'Founder, StartupXYZ', quote: 'The best investment we made this year.' },
  { name: 'Emily Rodriguez', role: 'Product Lead, BigCo', quote: 'Simple, powerful, beautifully designed.' },
];

function render() {
  document.getElementById('app').innerHTML = \`
    <nav class="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
      <div class="text-xl font-bold text-gray-900">✨ Product</div>
      <div class="flex items-center gap-6">
        <a href="#features" class="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Features</a>
        <a href="#testimonials" class="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">Testimonials</a>
        <button class="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition">Get Started</button>
      </div>
    </nav>
    <section class="max-w-4xl mx-auto text-center px-6 py-20 md:py-32">
      <div class="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full mb-6">🎉 Now in public beta</div>
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">Build something<br><span style="background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent">extraordinary</span></h1>
      <p class="text-lg text-gray-500 mt-6 max-w-2xl mx-auto">The modern platform that helps teams ship faster and build products users love.</p>
      <div class="flex items-center justify-center gap-4 mt-8">
        <button class="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25">Start Free Trial</button>
        <button class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">Watch Demo →</button>
      </div>
    </section>
    <section id="features" class="max-w-6xl mx-auto px-6 py-20">
      <div class="text-center mb-16"><h2 class="text-3xl font-bold text-gray-900">Everything you need</h2><p class="text-gray-500 mt-3">Packed with powerful features.</p></div>
      <div class="grid md:grid-cols-3 gap-8">
        \${features.map(ft => \`<div class="p-6 rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all"><span class="text-3xl mb-4 block">\${ft.icon}</span><h3 class="text-lg font-semibold text-gray-900">\${ft.title}</h3><p class="text-sm text-gray-500 mt-2">\${ft.desc}</p></div>\`).join('')}
      </div>
    </section>
    <section id="testimonials" class="bg-gray-50 py-20">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Loved by teams everywhere</h2>
        <div class="grid md:grid-cols-3 gap-6">
          \${testimonials.map(t => \`<div class="bg-white p-6 rounded-2xl border border-gray-200"><p class="text-gray-600 italic">"\${t.quote}"</p><div class="mt-4 pt-4 border-t border-gray-100"><p class="font-semibold text-gray-900 text-sm">\${t.name}</p><p class="text-xs text-gray-500">\${t.role}</p></div></div>\`).join('')}
        </div>
      </div>
    </section>
    <section class="max-w-4xl mx-auto text-center px-6 py-20">
      <h2 class="text-3xl font-bold text-gray-900">Ready to get started?</h2>
      <p class="text-gray-500 mt-3">Join thousands of teams already using our platform.</p>
      <button class="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/25">Start Free Trial</button>
    </section>
    <footer class="border-t border-gray-200 py-8"><div class="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500"><span>© 2025 Product. All rights reserved.</span><div class="flex gap-6"><a href="#" class="hover:text-gray-900">Privacy</a><a href="#" class="hover:text-gray-900">Terms</a></div></div></footer>
  \`;
}
render();`;

// ─── Todo App JS ───
const todoJs = `let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let filter = 'all';

function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }
function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function addTodo(text) {
  if (!text.trim()) return;
  todos = [...todos, { id: crypto.randomUUID(), text: text.trim(), completed: false, createdAt: new Date().toISOString() }];
  saveTodos(); render();
}

function toggleTodo(id) { todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t); saveTodos(); render(); }
function deleteTodo(id) { todos = todos.filter(t => t.id !== id); saveTodos(); render(); }
function clearCompleted() { todos = todos.filter(t => !t.completed); saveTodos(); render(); }
function getFiltered() { return filter === 'active' ? todos.filter(t => !t.completed) : filter === 'completed' ? todos.filter(t => t.completed) : todos; }

function render() {
  const filtered = getFiltered();
  const remaining = todos.filter(t => !t.completed).length;
  document.getElementById('app').innerHTML = \`
    <div class="max-w-lg mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-center text-gray-900 mb-8">📝 Todo List</h1>
      <form onsubmit="event.preventDefault(); addTodo(this.input.value); this.input.value = '';" class="flex gap-2 mb-6">
        <input name="input" type="text" placeholder="What needs to be done?" autofocus class="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm" />
        <button type="submit" class="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium text-sm">Add</button>
      </form>
      <div class="flex items-center gap-2 mb-4">
        \${['all','active','completed'].map(ft => \`<button onclick="filter='\${ft}';render()" class="px-3 py-1.5 text-xs font-medium rounded-lg transition \${filter === ft ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}">\${ft.charAt(0).toUpperCase()+ft.slice(1)}</button>\`).join('')}
        <span class="ml-auto text-xs text-gray-400">\${remaining} remaining</span>
      </div>
      <div class="space-y-1.5">
        \${filtered.length === 0 ? '<div class="text-center py-12 text-gray-400">No todos yet</div>' : filtered.map(todo => \`
          <div class="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 group hover:shadow-sm transition">
            <button onclick="toggleTodo('\${todo.id}')" class="h-5 w-5 rounded-full border-2 flex items-center justify-center transition \${todo.completed ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 hover:border-indigo-400'}">\${todo.completed ? '✓' : ''}</button>
            <span class="flex-1 text-sm \${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}">\${escapeHtml(todo.text)}</span>
            <button onclick="event.stopPropagation(); deleteTodo('\${todo.id}')" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition text-xs">✕</button>
          </div>
        \`).join('')}
      </div>
      \${todos.some(t => t.completed) ? \`<button onclick="clearCompleted()" class="mt-4 text-xs text-gray-400 hover:text-red-500 transition">Clear completed (\${todos.filter(t=>t.completed).length})</button>\` : ''}
    </div>
  \`;
}
render();`;

// ─── Export all templates ────────────────────────────────────
export const APP_STARTER_TEMPLATES: AppStarterTemplate[] = [
  {
    id: 'crud-app',
    name: 'CRUD App',
    description: 'A complete create, read, update, delete app with localStorage persistence.',
    icon: '📋',
    category: 'app',
    tags: ['crud', 'list', 'manager', 'data'],
    files: [
      f('index.html', htmlShell('My App', '.fade-in { animation: fadeIn 0.2s ease-out; }\n    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }')),
      f('app.js', crudAppJs),
    ],
    aiContext: 'This project uses a CRUD starter template with immutable state patterns (.map/.filter), localStorage persistence, escapeHtml for XSS safety, and event.stopPropagation() on delete buttons. Maintain these patterns when extending.',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Admin dashboard with sidebar, stats cards, and activity feed.',
    icon: '📊',
    category: 'app',
    tags: ['dashboard', 'admin', 'analytics', 'stats'],
    files: [
      f('index.html', htmlShell('Dashboard', '.stat-card { transition: transform 0.15s, box-shadow 0.15s; }\n    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1); }')),
      f('app.js', dashboardJs),
    ],
    aiContext: 'This project uses a Dashboard starter template with sidebar layout, stats cards, and activity feed. Maintain the component-based render pattern and responsive grid layout when extending.',
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Marketing landing page with hero, features, testimonials, and CTA.',
    icon: '🚀',
    category: 'site',
    tags: ['landing', 'marketing', 'hero', 'product'],
    files: [
      f('index.html', htmlShell('Product Landing Page', 'scroll-behavior: smooth;')),
      f('app.js', landingJs),
    ],
    aiContext: 'This project uses a Landing Page starter template with hero, features, testimonials, and CTA sections. Maintain the section-based layout and responsive patterns when extending.',
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Feature-rich todo list with filters, completion tracking, and animations.',
    icon: '✅',
    category: 'tool',
    tags: ['todo', 'tasks', 'productivity', 'checklist'],
    files: [
      f('index.html', htmlShell('Todo App', '.todo-enter { animation: slideIn 0.2s ease-out; }\n    @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }')),
      f('app.js', todoJs),
    ],
    aiContext: 'This project uses a Todo App starter template with immutable array updates, filtering (all/active/completed), localStorage persistence, escapeHtml for security, and event.stopPropagation() on delete buttons.',
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a minimal HTML + JS setup.',
    icon: '📄',
    category: 'app',
    tags: ['blank', 'empty', 'scratch'],
    files: [
      f('index.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My App</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>body { font-family: 'Inter', system-ui, sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
  <div id="app" class="text-center">
    <h1 class="text-2xl font-bold text-gray-900">Hello World</h1>
    <p class="text-gray-500 mt-2">Start building your app!</p>
  </div>
  <script src="app.js"><\/script>
</body>
</html>`),
      f('app.js', `// Your app code here\nconsole.log('App loaded');`),
    ],
    aiContext: 'This is a blank project. Generate all code from scratch following best practices: immutable state, localStorage persistence, escapeHtml for XSS safety, and a render() function pattern.',
  },

  // ─── React Templates (Phase 70) ───

  {
    id: 'react-saas-dashboard',
    name: 'SaaS Dashboard',
    description: 'React dashboard with sidebar, stats cards, charts, and user management.',
    icon: '📊',
    category: 'react',
    tags: ['dashboard', 'saas', 'admin', 'react', 'charts'],
    files: [
      f('App.tsx', `import { useState } from 'react';

const stats = [
  { label: 'Total Users', value: '12,847', change: '+12.5%', up: true },
  { label: 'Revenue', value: '$148.2K', change: '+8.2%', up: true },
  { label: 'Active Projects', value: '284', change: '+23', up: true },
  { label: 'Churn Rate', value: '2.4%', change: '-0.3%', up: false },
];

const navItems = ['Dashboard', 'Users', 'Projects', 'Analytics', 'Settings'];

export default function App() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <aside className="w-56 border-r border-white/10 p-4 flex flex-col">
        <h1 className="text-lg font-bold mb-8 px-2">⚡ SaaSApp</h1>
        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <button key={item} onClick={() => setActiveNav(item)}
              className={\`w-full text-left px-3 py-2 text-sm rounded-lg transition \${activeNav === item ? 'bg-indigo-600 text-white' : 'text-white/60 hover:bg-white/5'}\`}>
              {item}
            </button>
          ))}
        </nav>
        <div className="text-xs text-white/30 px-2">v1.0.0</div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold">Dashboard</h2><p className="text-white/40 text-sm mt-1">Welcome back, Admin</p></div>
          <button className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">+ New Project</button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-white/40 text-sm">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
              <span className={\`text-xs \${s.up ? 'text-emerald-400' : 'text-red-400'}\`}>{s.change}</span>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          {['New user signup', 'Payment received', 'Project deployed', 'Support ticket resolved'].map((a, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/70">{a}</span>
              <span className="text-xs text-white/30">{i + 1}h ago</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}`),
      f('styles.css', `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', system-ui, sans-serif; }`),
    ],
    aiContext: 'React SaaS dashboard template with sidebar navigation, stats grid, and activity feed. Uses Tailwind CSS. Extend with charts, user tables, and settings pages.',
  },

  {
    id: 'react-ecommerce',
    name: 'E-commerce Store',
    description: 'Product grid with filters, cart, and checkout flow.',
    icon: '🛒',
    category: 'react',
    tags: ['ecommerce', 'shop', 'cart', 'products', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, image: '🎧', category: 'Electronics' },
  { id: 2, name: 'Running Shoes', price: 129.99, image: '👟', category: 'Sports' },
  { id: 3, name: 'Coffee Maker', price: 49.99, image: '☕', category: 'Home' },
  { id: 4, name: 'Backpack', price: 59.99, image: '🎒', category: 'Accessories' },
  { id: 5, name: 'Smart Watch', price: 199.99, image: '⌚', category: 'Electronics' },
  { id: 6, name: 'Yoga Mat', price: 29.99, image: '🧘', category: 'Sports' },
];

type CartItem = { id: number; qty: number };

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filtered = filter === 'All' ? products : products.filter(p => p.category === filter);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartTotal = cart.reduce((s, c) => s + (products.find(p => p.id === c.id)?.price || 0) * c.qty, 0);

  const addToCart = (id: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      return existing ? prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { id, qty: 1 }];
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">🛍️ Store</h1>
          <button className="relative px-4 py-2 bg-gray-900 text-white rounded-lg text-sm">
            🛒 Cart ({cartCount}) — \${cartTotal.toFixed(2)}
          </button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={\`px-4 py-2 rounded-full text-sm font-medium transition \${filter === c ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}\`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border p-6 hover:shadow-lg transition">
              <div className="text-6xl mb-4 text-center">{p.image}</div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-gray-500 text-sm">{p.category}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-bold">\${p.price}</span>
                <button onClick={() => addToCart(p.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`),
    ],
    aiContext: 'React e-commerce template with product grid, category filters, and shopping cart state. Extend with product details page, checkout flow, and Stripe integration.',
  },

  {
    id: 'react-portfolio',
    name: 'Portfolio',
    description: 'Personal portfolio with hero, projects, about, and contact sections.',
    icon: '🎨',
    category: 'react',
    tags: ['portfolio', 'personal', 'resume', 'react'],
    files: [
      f('App.tsx', `export default function App() {
  const projects = [
    { title: 'Design System', desc: 'Component library for React', tech: ['React', 'TypeScript'], emoji: '🎨' },
    { title: 'Analytics Dashboard', desc: 'Real-time data visualization', tech: ['D3.js', 'Node.js'], emoji: '📊' },
    { title: 'Mobile App', desc: 'Cross-platform fitness tracker', tech: ['React Native', 'Firebase'], emoji: '📱' },
  ];
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-6 max-w-5xl mx-auto">
        <span className="font-bold text-lg">JD</span>
        <div className="flex gap-6 text-sm text-white/60">
          <a href="#projects" className="hover:text-white transition">Projects</a>
          <a href="#about" className="hover:text-white transition">About</a>
          <a href="#contact" className="hover:text-white transition">Contact</a>
        </div>
      </nav>
      <section className="max-w-5xl mx-auto px-8 py-24">
        <p className="text-indigo-400 font-medium mb-4">Hi, I'm</p>
        <h1 className="text-5xl font-bold leading-tight">Jane Doe</h1>
        <p className="text-xl text-white/50 mt-4 max-w-lg">Full-stack developer crafting beautiful, performant web experiences.</p>
        <div className="flex gap-4 mt-8">
          <a href="#contact" className="px-6 py-3 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition">Get in Touch</a>
          <a href="#projects" className="px-6 py-3 border border-white/20 rounded-lg font-medium hover:bg-white/5 transition">View Work</a>
        </div>
      </section>
      <section id="projects" className="max-w-5xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold mb-8">Featured Projects</h2>
        <div className="grid gap-6">
          {projects.map((p, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex items-start gap-6 hover:bg-white/[0.07] transition">
              <span className="text-4xl">{p.emoji}</span>
              <div>
                <h3 className="text-lg font-semibold">{p.title}</h3>
                <p className="text-white/50 mt-1">{p.desc}</p>
                <div className="flex gap-2 mt-3">{p.tech.map(t => <span key={t} className="px-2 py-1 bg-white/10 rounded text-xs">{t}</span>)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="contact" className="max-w-5xl mx-auto px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Let's Work Together</h2>
        <p className="text-white/50 mb-8">I'm always open to new opportunities.</p>
        <a href="mailto:hello@janedoe.com" className="px-8 py-3 bg-indigo-600 rounded-lg font-medium hover:bg-indigo-500 transition inline-block">hello@janedoe.com</a>
      </section>
    </div>
  );
}`),
    ],
    aiContext: 'React portfolio template with hero, project showcase, and contact section. Dark theme with Tailwind CSS. Extend with blog, testimonials, and animations.',
  },

  {
    id: 'react-chat',
    name: 'Chat Interface',
    description: 'AI chat app with message history and streaming-style responses.',
    icon: '💬',
    category: 'react',
    tags: ['chat', 'ai', 'messaging', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date() };
    const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'Thanks for your message! This is a demo response. Connect an AI API to make it real.', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">AI</div>
        <div><h1 className="font-semibold text-sm">AI Assistant</h1><p className="text-xs text-gray-400">Online</p></div>
      </header>
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-md px-4 py-3 rounded-2xl text-sm \${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border rounded-bl-md text-gray-800'}\`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white border-t p-4">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..." className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={sendMessage} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">Send</button>
        </div>
      </div>
    </div>
  );
}`),
    ],
    aiContext: 'React chat interface template with message history and input. Extend with real AI API integration, streaming responses, and markdown rendering.',
  },

  {
    id: 'react-kanban',
    name: 'Project Board',
    description: 'Kanban board with draggable cards across columns.',
    icon: '📋',
    category: 'react',
    tags: ['kanban', 'board', 'tasks', 'project', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

type Task = { id: string; title: string; priority: 'low' | 'medium' | 'high' };
type Column = { id: string; title: string; tasks: Task[] };

const initialColumns: Column[] = [
  { id: 'todo', title: '📋 To Do', tasks: [
    { id: '1', title: 'Design landing page', priority: 'high' },
    { id: '2', title: 'Write API docs', priority: 'medium' },
  ]},
  { id: 'progress', title: '🔄 In Progress', tasks: [
    { id: '3', title: 'Build auth system', priority: 'high' },
  ]},
  { id: 'done', title: '✅ Done', tasks: [
    { id: '4', title: 'Setup CI/CD', priority: 'low' },
  ]},
];

const priorityColors = { low: 'bg-blue-100 text-blue-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };

export default function App() {
  const [columns, setColumns] = useState(initialColumns);
  const [newTask, setNewTask] = useState('');

  const addTask = (colId: string) => {
    if (!newTask.trim()) return;
    setColumns(prev => prev.map(col => col.id === colId ? { ...col, tasks: [...col.tasks, { id: crypto.randomUUID(), title: newTask.trim(), priority: 'medium' }] } : col));
    setNewTask('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b px-8 py-4"><h1 className="text-lg font-bold">📋 Project Board</h1></header>
      <div className="flex gap-6 p-8 overflow-x-auto">
        {columns.map(col => (
          <div key={col.id} className="bg-white rounded-xl border w-80 shrink-0">
            <div className="px-4 py-3 border-b font-semibold text-sm flex items-center justify-between">
              {col.title}
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{col.tasks.length}</span>
            </div>
            <div className="p-3 space-y-2 min-h-[200px]">
              {col.tasks.map(task => (
                <div key={task.id} className="bg-gray-50 border rounded-lg p-3 hover:shadow-sm transition cursor-pointer">
                  <p className="text-sm font-medium text-gray-800">{task.title}</p>
                  <span className={\`text-[10px] px-2 py-0.5 rounded-full font-medium mt-2 inline-block \${priorityColors[task.priority]}\`}>{task.priority}</span>
                </div>
              ))}
            </div>
            <div className="px-3 pb-3">
              <input value={col.id === 'todo' ? newTask : ''} onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask(col.id)}
                placeholder="+ Add task" className="w-full px-3 py-2 text-sm bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`),
    ],
    aiContext: 'React Kanban board template with columns and task cards. Extend with drag-and-drop (react-beautiful-dnd), task details modal, and assignees.',
  },

  {
    id: 'react-blog',
    name: 'Blog / CMS',
    description: 'Blog with article list, categories, and reading view.',
    icon: '📝',
    category: 'react',
    tags: ['blog', 'cms', 'articles', 'content', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

const posts = [
  { id: 1, title: 'Getting Started with React', excerpt: 'Learn the fundamentals of React and build your first component.', category: 'Tutorial', date: 'Jan 15, 2025', readTime: '5 min', emoji: '⚛️' },
  { id: 2, title: 'Tailwind CSS Best Practices', excerpt: 'Tips and tricks for writing clean, maintainable Tailwind CSS.', category: 'CSS', date: 'Jan 12, 2025', readTime: '4 min', emoji: '🎨' },
  { id: 3, title: 'TypeScript for Beginners', excerpt: 'A gentle introduction to TypeScript and its benefits.', category: 'Tutorial', date: 'Jan 10, 2025', readTime: '6 min', emoji: '📘' },
  { id: 4, title: 'Building REST APIs', excerpt: 'Design and implement robust REST APIs with Node.js.', category: 'Backend', date: 'Jan 8, 2025', readTime: '8 min', emoji: '🔌' },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', ...new Set(posts.map(p => p.category))];
  const filtered = selectedCategory === 'All' ? posts : posts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold">📝 DevBlog</h1>
          <p className="text-gray-500 text-sm mt-1">Thoughts on web development</p>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)}
              className={\`px-3 py-1.5 rounded-full text-sm transition \${selectedCategory === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}>
              {c}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {filtered.map(post => (
            <article key={post.id} className="border rounded-xl p-6 hover:shadow-md transition cursor-pointer group">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span>{post.date}</span>·<span>{post.readTime} read</span>·<span className="text-indigo-500">{post.category}</span>
              </div>
              <h2 className="text-lg font-semibold group-hover:text-indigo-600 transition">{post.emoji} {post.title}</h2>
              <p className="text-gray-500 text-sm mt-2">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}`),
    ],
    aiContext: 'React blog template with article list and category filters. Extend with full article view, search, markdown rendering, and CMS backend.',
  },

  {
    id: 'react-finance',
    name: 'Finance Dashboard',
    description: 'Financial overview with balance, transactions, and spending categories.',
    icon: '💰',
    category: 'react',
    tags: ['finance', 'money', 'dashboard', 'banking', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

const transactions = [
  { id: 1, name: 'Salary', amount: 5200, type: 'income' as const, date: 'Feb 1', icon: '💼' },
  { id: 2, name: 'Rent', amount: -1500, type: 'expense' as const, date: 'Feb 2', icon: '🏠' },
  { id: 3, name: 'Groceries', amount: -89.50, type: 'expense' as const, date: 'Feb 3', icon: '🛒' },
  { id: 4, name: 'Freelance', amount: 1200, type: 'income' as const, date: 'Feb 4', icon: '💻' },
  { id: 5, name: 'Netflix', amount: -15.99, type: 'expense' as const, date: 'Feb 5', icon: '🎬' },
  { id: 6, name: 'Gas', amount: -45, type: 'expense' as const, date: 'Feb 5', icon: '⛽' },
];

export default function App() {
  const balance = transactions.reduce((s, t) => s + t.amount, 0);
  const income = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">💰 My Finances</h1>
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 mb-8">
          <p className="text-white/70 text-sm">Total Balance</p>
          <p className="text-4xl font-bold mt-2">\${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-8 mt-6">
            <div><p className="text-white/60 text-xs">Income</p><p className="text-lg font-semibold text-emerald-300">+\${income.toFixed(2)}</p></div>
            <div><p className="text-white/60 text-xs">Expenses</p><p className="text-lg font-semibold text-red-300">-\${expenses.toFixed(2)}</p></div>
          </div>
        </div>
        <h2 className="font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
              <span className="text-2xl">{t.icon}</span>
              <div className="flex-1"><p className="font-medium text-sm">{t.name}</p><p className="text-xs text-white/40">{t.date}</p></div>
              <span className={\`font-semibold \${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                {t.amount > 0 ? '+' : ''}\${Math.abs(t.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`),
    ],
    aiContext: 'React finance dashboard template with balance card, income/expense summary, and transaction list. Extend with charts, budgets, and category breakdown.',
  },

  {
    id: 'react-booking',
    name: 'Booking System',
    description: 'Appointment booking with calendar and time slot selection.',
    icon: '📅',
    category: 'react',
    tags: ['booking', 'calendar', 'appointments', 'scheduling', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

const services = [
  { id: 1, name: 'Consultation', duration: '30 min', price: '$50', emoji: '💼' },
  { id: 2, name: 'Full Session', duration: '60 min', price: '$90', emoji: '⏰' },
  { id: 3, name: 'Premium Package', duration: '90 min', price: '$120', emoji: '⭐' },
];

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border shadow-lg max-w-lg w-full p-8">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={\`flex-1 h-1.5 rounded-full transition \${step >= s ? 'bg-indigo-600' : 'bg-gray-200'}\`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-6">Select a Service</h2>
            <div className="space-y-3">
              {services.map(s => (
                <button key={s.id} onClick={() => { setSelectedService(s.id); setStep(2); }}
                  className={\`w-full text-left p-4 rounded-xl border-2 transition \${selectedService === s.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}\`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.emoji}</span>
                    <div className="flex-1"><p className="font-semibold">{s.name}</p><p className="text-xs text-gray-500">{s.duration}</p></div>
                    <span className="font-bold text-indigo-600">{s.price}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-6">Pick a Date & Time</h2>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500" />
            {selectedDate && (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {timeSlots.map(t => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={\`py-2 rounded-lg text-sm font-medium transition \${selectedTime === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}\`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-lg text-sm">Back</button>
              <button onClick={() => selectedTime && setStep(3)} disabled={!selectedTime}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40">
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold">Booking Confirmed!</h2>
            <p className="text-gray-500 mt-2">{services.find(s => s.id === selectedService)?.name} on {selectedDate} at {selectedTime}</p>
            <button onClick={() => { setStep(1); setSelectedService(null); setSelectedDate(''); setSelectedTime(''); }}
              className="mt-6 px-6 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition">Book Another</button>
          </div>
        )}
      </div>
    </div>
  );
}`),
    ],
    aiContext: 'React booking system template with multi-step flow: service selection, date/time picker, and confirmation. Extend with form validation, backend integration, and email confirmation.',
  },

  {
    id: 'react-social-feed',
    name: 'Social Feed',
    description: 'Social media feed with posts, likes, and comments.',
    icon: '📱',
    category: 'react',
    tags: ['social', 'feed', 'posts', 'community', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

type Post = { id: string; author: string; avatar: string; content: string; likes: number; liked: boolean; comments: number; time: string };

const initialPosts: Post[] = [
  { id: '1', author: 'Sarah Chen', avatar: '👩‍💻', content: 'Just shipped a new feature! 🚀 The team worked so hard on this.', likes: 42, liked: false, comments: 8, time: '2h' },
  { id: '2', author: 'Alex Rivera', avatar: '🧑‍🎨', content: 'New design system is looking clean. Dark mode support coming soon!', likes: 67, liked: true, comments: 15, time: '4h' },
  { id: '3', author: 'Jordan Lee', avatar: '👨‍🔬', content: 'Published my research on AI-powered code generation. Link in bio!', likes: 128, liked: false, comments: 23, time: '6h' },
];

export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState('');

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const addPost = () => {
    if (!newPost.trim()) return;
    setPosts(prev => [{ id: crypto.randomUUID(), author: 'You', avatar: '😊', content: newPost.trim(), likes: 0, liked: false, comments: 0, time: 'now' }, ...prev]);
    setNewPost('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-6 py-4"><h1 className="text-lg font-bold">📱 Feed</h1></div>
      </header>
      <main className="max-w-xl mx-auto px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's on your mind?"
            className="w-full resize-none outline-none text-sm" rows={3} />
          <div className="flex justify-end mt-2">
            <button onClick={addPost} disabled={!newPost.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40">Post</button>
          </div>
        </div>
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-xl border p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{post.avatar}</span>
              <div><p className="font-semibold text-sm">{post.author}</p><p className="text-xs text-gray-400">{post.time} ago</p></div>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-6 mt-4 pt-3 border-t">
              <button onClick={() => toggleLike(post.id)} className={\`flex items-center gap-1.5 text-sm transition \${post.liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}\`}>
                {post.liked ? '❤️' : '🤍'} {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition">💬 {post.comments}</button>
              <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-500 transition ml-auto">🔗 Share</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}`),
    ],
    aiContext: 'React social feed template with posts, likes, and comments. Extend with user profiles, image uploads, real-time updates, and comment threads.',
  },

  {
    id: 'react-ai-chatbot',
    name: 'AI Chatbot',
    description: 'GPT-style chatbot with system prompts and conversation management.',
    icon: '🤖',
    category: 'react',
    tags: ['ai', 'chatbot', 'gpt', 'assistant', 'react'],
    files: [
      f('App.tsx', `import { useState } from 'react';

type Message = { id: string; role: 'system' | 'user' | 'assistant'; content: string };

const presets = [
  { name: 'General Assistant', prompt: 'You are a helpful assistant.', emoji: '🤖' },
  { name: 'Code Helper', prompt: 'You are an expert programmer. Help with code questions.', emoji: '💻' },
  { name: 'Creative Writer', prompt: 'You are a creative writing assistant.', emoji: '✍️' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(presets[0].prompt);
  const [showSettings, setShowSettings] = useState(false);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    const aiResponse: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'This is a demo response. Connect to OpenAI/Anthropic API for real responses.\\n\\nTo integrate:\\n1. Add your API key\\n2. Call the completions endpoint\\n3. Stream the response' };
    setMessages(prev => [...prev, userMsg, aiResponse]);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <aside className={\`w-64 bg-gray-900 border-r border-white/10 p-4 flex flex-col \${showSettings ? '' : 'hidden md:flex'}\`}>
        <h2 className="font-bold mb-4">🤖 AI Chatbot</h2>
        <div className="space-y-2 mb-6">
          {presets.map(p => (
            <button key={p.name} onClick={() => setSystemPrompt(p.prompt)}
              className={\`w-full text-left px-3 py-2 rounded-lg text-sm transition \${systemPrompt === p.prompt ? 'bg-indigo-600' : 'hover:bg-white/5 text-white/60'}\`}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
        <div className="mt-auto">
          <button onClick={() => setMessages([])} className="w-full px-3 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition">🗑️ Clear Chat</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-white/20">
              <div className="text-center"><p className="text-4xl mb-4">🤖</p><p>Start a conversation</p></div>
            </div>
          )}
          {messages.filter(m => m.role !== 'system').map(msg => (
            <div key={msg.id} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
              <div className={\`max-w-lg px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap \${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/10'}\`}>{msg.content}</div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <button onClick={() => setShowSettings(!showSettings)} className="md:hidden px-3 py-3 bg-white/10 rounded-xl">⚙️</button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything..." className="flex-1 px-4 py-3 bg-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={send} className="px-6 py-3 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition">Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}`),
    ],
    aiContext: 'React AI chatbot template with preset system prompts and conversation management. Extend with real API integration (OpenAI/Anthropic), streaming, and markdown rendering.',
  },
];
