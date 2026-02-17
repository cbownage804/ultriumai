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
  category: 'app' | 'site' | 'tool';
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
];
