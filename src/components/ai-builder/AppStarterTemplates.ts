/**
 * Full-app starter templates — pre-tested React scaffolds
 * that compile cleanly via Vite and the golden template.
 * 
 * Every template provides `src/App.tsx` (and optionally `src/index.css`).
 * The golden template (index.html, src/main.tsx, package.json) is merged
 * automatically in handleSelectStarterTemplate.
 */

import type { ProjectFile } from '@/hooks/useProjectFileSystem';

function f(path: string, content: string): ProjectFile {
  const ext = path.split('.').pop() || '';
  const langMap: Record<string, string> = {
    html: 'html', js: 'javascript', ts: 'typescript', tsx: 'typescriptreact',
    jsx: 'javascriptreact', css: 'css', json: 'json', md: 'markdown',
  };
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

// ─── Shared CSS reset ───
const baseCSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
`;

// ─────────────────────────────────────────────────────────────
// CRUD App (React)
// ─────────────────────────────────────────────────────────────
const crudAppTsx = `import { useState } from 'react';

type Item = { id: string; name: string; description: string; createdAt: string };

export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    try { return JSON.parse(localStorage.getItem('app_items') || '[]'); } catch { return []; }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const save = (updated: Item[]) => { setItems(updated); localStorage.setItem('app_items', JSON.stringify(updated)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) {
      save(items.map(i => i.id === editingId ? { ...i, name: name.trim(), description: description.trim() } : i));
    } else {
      save([...items, { id: crypto.randomUUID(), name: name.trim(), description: description.trim(), createdAt: new Date().toISOString() }]);
    }
    setName(''); setDescription(''); setEditingId(null); setShowForm(false);
  };

  const startEdit = (item: Item) => { setName(item.name); setDescription(item.description); setEditingId(item.id); setShowForm(true); };
  const deleteItem = (id: string) => { if (confirm('Delete this item?')) save(items.filter(i => i.id !== id)); };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>My Items</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setName(''); setDescription(''); }}
          style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
          + Add Item
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '1rem', background: '#fff', border: '1px solid #e0e7ff', borderRadius: 12, marginBottom: '1rem' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Item name" autoFocus
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {editingId ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
              style={{ padding: '0.5rem 1rem', background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}>
          <p style={{ fontSize: '1.125rem' }}>No items yet</p>
          <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Click "Add Item" to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <div>
                <p style={{ fontWeight: 500, color: '#111827' }}>{item.name}</p>
                {item.description && <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 2 }}>{item.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => startEdit(item)} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✏️</button>
                <button onClick={() => deleteItem(item.id)} style={{ padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Dashboard (React)
// ─────────────────────────────────────────────────────────────
const dashboardTsx = `import { useState } from 'react';

const stats = [
  { label: 'Total Users', value: '2,847', change: '+12.5%', up: true, icon: '👥' },
  { label: 'Revenue', value: '$48.2K', change: '+8.2%', up: true, icon: '💰' },
  { label: 'Active Projects', value: '24', change: '+3', up: true, icon: '📁' },
  { label: 'Completion Rate', value: '94.2%', change: '-1.1%', up: false, icon: '✅' },
];

const navItems = ['Overview', 'Users', 'Projects', 'Settings'];

const recentActivity = [
  { action: 'New user signed up', user: 'Alice Johnson', time: '2 min ago' },
  { action: 'Project completed', user: 'Bob Smith', time: '15 min ago' },
  { action: 'Payment received', user: 'Carol Davis', time: '1 hour ago' },
  { action: 'Support ticket opened', user: 'Dave Wilson', time: '2 hours ago' },
];

export default function App() {
  const [activeNav, setActiveNav] = useState('Overview');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside style={{ width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '2rem', padding: '0 0.5rem' }}>⚡ Dashboard</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button key={item} onClick={() => setActiveNav(item)}
              style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeNav === item ? '#eef2ff' : 'transparent',
                color: activeNav === item ? '#4338ca' : '#6b7280' }}>
              {item}
            </button>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '2rem', background: '#f9fafb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Dashboard</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 4 }}>Welcome back!</p>
          </div>
          <button style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            + New Project
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                  background: s.up ? '#dcfce7' : '#fee2e2', color: s.up ? '#15803d' : '#b91c1c' }}>{s.change}</span>
              </div>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{s.value}</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
            <h2 style={{ fontWeight: 600, color: '#111827' }}>Recent Activity</h2>
          </div>
          {recentActivity.map((a, i) => (
            <div key={i} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: i < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#111827' }}>{a.action}</p>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{a.user}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{a.time}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Landing Page (React)
// ─────────────────────────────────────────────────────────────
const landingTsx = `export default function App() {
  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Built for speed with optimized performance across all devices.' },
    { icon: '🔒', title: 'Secure by Default', desc: 'Enterprise-grade security with encryption built-in.' },
    { icon: '🎨', title: 'Beautiful Design', desc: 'Crafted with attention to every pixel and detail.' },
    { icon: '🔌', title: 'Easy Integration', desc: 'Works seamlessly with your favorite tools and services.' },
    { icon: '📊', title: 'Analytics Built-in', desc: 'Track what matters with real-time dashboards.' },
    { icon: '🌍', title: 'Global Scale', desc: 'Edge networks for fast access worldwide.' },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'CTO, TechCorp', quote: 'This product transformed how our team works. Highly recommended.' },
    { name: 'Marcus Johnson', role: 'Founder, StartupXYZ', quote: 'The best investment we made this year. Incredible ROI.' },
    { name: 'Emily Rodriguez', role: 'Product Lead, BigCo', quote: 'Simple, powerful, and beautifully designed.' },
  ];

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>✨ Product</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="#features" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>Features</a>
          <a href="#testimonials" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none' }}>Testimonials</a>
          <button style={{ padding: '0.5rem 1rem', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '5rem 1.5rem' }}>
        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#eef2ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 500, borderRadius: 99, marginBottom: '1.5rem' }}>
          🎉 Now in public beta
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
          Build something<br />
          <span style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            extraordinary
          </span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginTop: '1.5rem', maxWidth: 600, margin: '1.5rem auto 0' }}>
          The modern platform that helps teams ship faster and build products users love.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}>
            Start Free Trial
          </button>
          <button style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}>
            Watch Demo →
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Everything you need</h2>
          <p style={{ color: '#6b7280', marginTop: '0.75rem' }}>Packed with powerful features to accelerate your workflow.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {features.map(ft => (
            <div key={ft.title} style={{ padding: '1.5rem', borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>{ft.icon}</span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>{ft.title}</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', lineHeight: 1.6 }}>{ft.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" style={{ background: '#f9fafb', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: '3rem' }}>Loved by teams everywhere</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: '#fff', padding: '1.5rem', borderRadius: 16, border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#4b5563', fontStyle: 'italic', lineHeight: 1.6 }}>"{t.quote}"</p>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                  <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{t.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>Ready to get started?</h2>
        <p style={{ color: '#6b7280', marginTop: '0.75rem' }}>Join thousands of teams already using our platform.</p>
        <button style={{ marginTop: '2rem', padding: '0.75rem 2rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}>
          Start Free Trial
        </button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
          <span>© 2025 Product. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Todo App (React)
// ─────────────────────────────────────────────────────────────
const todoTsx = `import { useState } from 'react';

type Todo = { id: string; text: string; completed: boolean; createdAt: string };

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try { return JSON.parse(localStorage.getItem('todos') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const save = (updated: Todo[]) => { setTodos(updated); localStorage.setItem('todos', JSON.stringify(updated)); };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    save([...todos, { id: crypto.randomUUID(), text: input.trim(), completed: false, createdAt: new Date().toISOString() }]);
    setInput('');
  };

  const toggleTodo = (id: string) => save(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTodo = (id: string) => save(todos.filter(t => t.id !== id));
  const clearCompleted = () => save(todos.filter(t => !t.completed));

  const filtered = filter === 'active' ? todos.filter(t => !t.completed) : filter === 'completed' ? todos.filter(t => t.completed) : todos;
  const remaining = todos.filter(t => !t.completed).length;

  return (
    <div style={{ maxWidth: 512, margin: '0 auto', padding: '3rem 1rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, textAlign: 'center', color: '#111827', marginBottom: '2rem' }}>📝 Todo List</h1>

      <form onSubmit={addTodo} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="What needs to be done?" autoFocus
          style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: 12, fontSize: '0.875rem', outline: 'none' }} />
        <button type="submit" style={{ padding: '0.75rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}>
          Add
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['all', 'active', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 500, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: filter === f ? '#eef2ff' : '#f3f4f6', color: filter === f ? '#4338ca' : '#6b7280' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af' }}>{remaining} remaining</span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>No todos yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map(todo => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <button onClick={() => toggleTodo(todo.id)}
                style={{ width: 20, height: 20, borderRadius: '50%', border: todo.completed ? 'none' : '2px solid #d1d5db', background: todo.completed ? '#4f46e5' : 'transparent',
                  color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                {todo.completed ? '✓' : ''}
              </button>
              <span style={{ flex: 1, fontSize: '0.875rem', textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#9ca3af' : '#111827' }}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)}
                style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '0.875rem' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {todos.some(t => t.completed) && (
        <button onClick={clearCompleted}
          style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
          Clear completed ({todos.filter(t => t.completed).length})
        </button>
      )}
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// React SaaS Dashboard
// ─────────────────────────────────────────────────────────────
const saasDashboardTsx = `import { useState } from 'react';

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
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.1)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '2rem', padding: '0 0.5rem' }}>⚡ SaaSApp</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <button key={item} onClick={() => setActiveNav(item)}
              style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: activeNav === item ? '#4f46e5' : 'transparent', color: activeNav === item ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {item}
            </button>
          ))}
        </nav>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', padding: '0 0.5rem' }}>v1.0.0</div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginTop: 4 }}>Welcome back, Admin</p>
          </div>
          <button style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>+ New Project</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.25rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>{s.label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{s.value}</p>
              <span style={{ fontSize: '0.75rem', color: s.up ? '#34d399' : '#f87171' }}>{s.change}</span>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
          {['New user signup', 'Payment received', 'Project deployed', 'Support ticket resolved'].map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>{a}</span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{i + 1}h ago</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// E-commerce Store (React)
// ─────────────────────────────────────────────────────────────
const ecommerceTsx = `import { useState } from 'react';

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
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>🛍️ Store</h1>
          <button style={{ padding: '0.5rem 1rem', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
            🛒 Cart ({cartCount}) — \${cartTotal.toFixed(2)}
          </button>
        </div>
      </header>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              style={{ padding: '0.5rem 1rem', borderRadius: 99, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', border: filter === c ? 'none' : '1px solid #e5e7eb',
                background: filter === c ? '#111827' : '#fff', color: filter === c ? '#fff' : '#4b5563' }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.5rem' }}>
              <div style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: '1rem' }}>{p.image}</div>
              <h3 style={{ fontWeight: 600 }}>{p.name}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{p.category}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>\${p.price}</span>
                <button onClick={() => addToCart(p.id)}
                  style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Portfolio (React)
// ─────────────────────────────────────────────────────────────
const portfolioTsx = `export default function App() {
  const projects = [
    { title: 'Design System', desc: 'Component library for React', tech: ['React', 'TypeScript'], emoji: '🎨' },
    { title: 'Analytics Dashboard', desc: 'Real-time data visualization', tech: ['D3.js', 'Node.js'], emoji: '📊' },
    { title: 'Mobile App', desc: 'Cross-platform fitness tracker', tech: ['React Native', 'Firebase'], emoji: '📱' },
  ];
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>
        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>JD</span>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
          <a href="#projects" style={{ color: 'inherit', textDecoration: 'none' }}>Projects</a>
          <a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a>
        </div>
      </nav>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '6rem 2rem' }}>
        <p style={{ color: '#818cf8', fontWeight: 500, marginBottom: '1rem' }}>Hi, I'm</p>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.1 }}>Jane Doe</h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', maxWidth: 500 }}>Full-stack developer crafting beautiful, performant web experiences.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <a href="#contact" style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', borderRadius: 8, fontWeight: 500, textDecoration: 'none' }}>Get in Touch</a>
          <a href="#projects" style={{ padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 8, fontWeight: 500, textDecoration: 'none' }}>View Work</a>
        </div>
      </section>
      <section id="projects" style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Featured Projects</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {projects.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
              <span style={{ fontSize: '2.5rem' }}>{p.emoji}</span>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{p.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{p.desc}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {p.tech.map(t => <span key={t} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 4, fontSize: '0.75rem' }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="contact" style={{ maxWidth: 960, margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Let's Work Together</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>I'm always open to new opportunities.</p>
        <a href="mailto:hello@janedoe.com" style={{ padding: '0.75rem 2rem', background: '#4f46e5', color: '#fff', borderRadius: 8, fontWeight: 500, textDecoration: 'none', display: 'inline-block' }}>hello@janedoe.com</a>
      </section>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Chat Interface (React)
// ─────────────────────────────────────────────────────────────
const chatTsx = `import { useState } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; content: string };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() };
    const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'Thanks for your message! This is a demo response. Connect an AI API to make it real.' };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.875rem', fontWeight: 700 }}>AI</div>
        <div><h1 style={{ fontWeight: 600, fontSize: '0.875rem' }}>AI Assistant</h1><p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Online</p></div>
      </header>
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: 400, padding: '0.75rem 1rem', borderRadius: 16, fontSize: '0.875rem',
              background: msg.role === 'user' ? '#4f46e5' : '#fff', color: msg.role === 'user' ? '#fff' : '#1f2937',
              border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none' }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 700, margin: '0 auto' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..." style={{ flex: 1, padding: '0.75rem 1rem', background: '#f3f4f6', borderRadius: 12, border: 'none', fontSize: '0.875rem', outline: 'none' }} />
          <button onClick={sendMessage} style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>Send</button>
        </div>
      </div>
    </div>
  );
}
`;

// ─────────────────────────────────────────────────────────────
// Blank Project (React)
// ─────────────────────────────────────────────────────────────
const blankTsx = `export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>Hello World</h1>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Start building your app!</p>
      </div>
    </div>
  );
}
`;

// ─── Export all templates ────────────────────────────────────
// All templates provide src/App.tsx (merged onto golden template at selection time)
export const APP_STARTER_TEMPLATES: AppStarterTemplate[] = [
  {
    id: 'crud-app',
    name: 'CRUD App',
    description: 'A complete create, read, update, delete app with localStorage persistence.',
    icon: '📋',
    category: 'app',
    tags: ['crud', 'list', 'manager', 'data'],
    files: [
      f('src/App.tsx', crudAppTsx),
      f('src/index.css', baseCSS + 'body { background: #f9fafb; }\n'),
    ],
    aiContext: 'This project uses a React CRUD template with immutable state patterns, localStorage persistence, and inline styles. Maintain these patterns when extending. Use React state and hooks for all interactivity.',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Admin dashboard with sidebar, stats cards, and activity feed.',
    icon: '📊',
    category: 'app',
    tags: ['dashboard', 'admin', 'analytics', 'stats'],
    files: [
      f('src/App.tsx', dashboardTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'This project uses a React Dashboard template with sidebar navigation, stats grid, and activity feed. Uses inline styles. Extend with charts, user tables, and settings pages. Use React state and hooks.',
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Marketing landing page with hero, features, testimonials, and CTA.',
    icon: '🚀',
    category: 'site',
    tags: ['landing', 'marketing', 'hero', 'product'],
    files: [
      f('src/App.tsx', landingTsx),
      f('src/index.css', baseCSS + 'html { scroll-behavior: smooth; }\n'),
    ],
    aiContext: 'This project uses a React Landing Page template with hero, features, testimonials, and CTA sections. Uses inline styles for zero-dependency rendering. Extend with more sections, animations, or Tailwind CSS.',
  },
  {
    id: 'todo-app',
    name: 'Todo App',
    description: 'Feature-rich todo list with filters, completion tracking, and persistence.',
    icon: '✅',
    category: 'tool',
    tags: ['todo', 'tasks', 'productivity', 'checklist'],
    files: [
      f('src/App.tsx', todoTsx),
      f('src/index.css', baseCSS + 'body { background: #f9fafb; }\n'),
    ],
    aiContext: 'This project uses a React Todo App template with immutable state, filtering (all/active/completed), and localStorage persistence. Use React hooks for all interactivity.',
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with a minimal React setup.',
    icon: '📄',
    category: 'app',
    tags: ['blank', 'empty', 'scratch'],
    files: [
      f('src/App.tsx', blankTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'This is a blank React project. Generate all code from scratch following best practices: React hooks, immutable state, and clean component structure.',
  },

  // ─── React specialty templates ───

  {
    id: 'react-saas-dashboard',
    name: 'SaaS Dashboard',
    description: 'Dark-themed React dashboard with sidebar, stats cards, and activity feed.',
    icon: '📊',
    category: 'react',
    tags: ['dashboard', 'saas', 'admin', 'react', 'charts'],
    files: [
      f('src/App.tsx', saasDashboardTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'React SaaS dashboard template with dark theme, sidebar navigation, stats grid, and activity feed. Uses inline styles. Extend with charts, user tables, and settings pages.',
  },

  {
    id: 'react-ecommerce',
    name: 'E-commerce Store',
    description: 'Product grid with category filters and shopping cart.',
    icon: '🛒',
    category: 'react',
    tags: ['ecommerce', 'shop', 'cart', 'products', 'react'],
    files: [
      f('src/App.tsx', ecommerceTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'React e-commerce template with product grid, category filters, and shopping cart state. Extend with product details, checkout flow, and payment integration.',
  },

  {
    id: 'react-portfolio',
    name: 'Portfolio',
    description: 'Personal portfolio with hero, projects, and contact sections.',
    icon: '🎨',
    category: 'react',
    tags: ['portfolio', 'personal', 'resume', 'react'],
    files: [
      f('src/App.tsx', portfolioTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'React portfolio template with dark theme, hero section, project showcase, and contact. Extend with blog, testimonials, and animations.',
  },

  {
    id: 'react-chat',
    name: 'Chat Interface',
    description: 'AI chat app with message history and input.',
    icon: '💬',
    category: 'react',
    tags: ['chat', 'ai', 'messaging', 'react'],
    files: [
      f('src/App.tsx', chatTsx),
      f('src/index.css', baseCSS),
    ],
    aiContext: 'React chat interface template with message history and input. Extend with real AI API integration, streaming responses, and markdown rendering.',
  },
];
