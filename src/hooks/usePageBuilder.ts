import { useState, useCallback } from 'react';

export interface PageBlock {
  id: string;
  type: 'hero' | 'navbar' | 'cards' | 'features' | 'cta' | 'footer' | 'form' | 'pricing' | 'testimonials' | 'faq' | 'gallery' | 'stats' | 'custom';
  label: string;
  props: Record<string, string>;
  order: number;
}

export interface PageConfig {
  id: string;
  name: string;
  blocks: PageBlock[];
  framework: 'react-tailwind' | 'html';
}

const BLOCK_TEMPLATES: Record<PageBlock['type'], { label: string; defaultProps: Record<string, string>; jsx: string }> = {
  hero: {
    label: 'Hero Section',
    defaultProps: { title: 'Welcome to Our App', subtitle: 'Build something amazing today', ctaText: 'Get Started', bgColor: 'bg-gradient-to-br from-blue-600 to-purple-700' },
    jsx: `<section className="{{bgColor}} text-white py-24 px-6 text-center">\n  <h1 className="text-5xl font-bold mb-4">{{title}}</h1>\n  <p className="text-xl opacity-80 mb-8 max-w-2xl mx-auto">{{subtitle}}</p>\n  <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">{{ctaText}}</button>\n</section>`,
  },
  navbar: {
    label: 'Navigation Bar',
    defaultProps: { brand: 'MyApp', links: 'Home,About,Contact' },
    jsx: `<nav className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">\n  <span className="text-xl font-bold">{{brand}}</span>\n  <div className="flex gap-6">\n    {["{{links}}".split(",").map(l => <a key={l} href="#" className="text-gray-600 hover:text-gray-900">{l.trim()}</a>)]}\n  </div>\n</nav>`,
  },
  cards: {
    label: 'Card Grid',
    defaultProps: { count: '3', title: 'Our Features' },
    jsx: `<section className="py-16 px-6">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">\n    {Array.from({length: {{count}}}).map((_, i) => (\n      <div key={i} className="bg-white rounded-xl p-6 shadow-md border">\n        <div className="h-12 w-12 bg-blue-100 rounded-lg mb-4" />\n        <h3 className="text-lg font-semibold mb-2">Feature {i+1}</h3>\n        <p className="text-gray-500">Description for this feature goes here.</p>\n      </div>\n    ))}\n  </div>\n</section>`,
  },
  features: {
    label: 'Feature List',
    defaultProps: { title: 'Why Choose Us' },
    jsx: `<section className="py-16 px-6 bg-gray-50">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="max-w-4xl mx-auto space-y-8">\n    {[1,2,3].map(i => (\n      <div key={i} className="flex gap-4 items-start">\n        <div className="h-10 w-10 bg-blue-500 rounded-lg shrink-0" />\n        <div><h3 className="font-semibold text-lg">Feature {i}</h3><p className="text-gray-500 mt-1">Detailed description of this amazing feature.</p></div>\n      </div>\n    ))}\n  </div>\n</section>`,
  },
  cta: {
    label: 'Call to Action',
    defaultProps: { title: 'Ready to get started?', buttonText: 'Sign Up Free' },
    jsx: `<section className="bg-blue-600 text-white py-16 px-6 text-center">\n  <h2 className="text-3xl font-bold mb-4">{{title}}</h2>\n  <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 mt-4">{{buttonText}}</button>\n</section>`,
  },
  footer: {
    label: 'Footer',
    defaultProps: { brand: 'MyApp', year: '2025' },
    jsx: `<footer className="bg-gray-900 text-gray-400 py-12 px-6">\n  <div className="max-w-6xl mx-auto flex justify-between">\n    <span>© {{year}} {{brand}}</span>\n    <div className="flex gap-4"><a href="#" className="hover:text-white">Privacy</a><a href="#" className="hover:text-white">Terms</a></div>\n  </div>\n</footer>`,
  },
  form: {
    label: 'Contact Form',
    defaultProps: { title: 'Contact Us' },
    jsx: `<section className="py-16 px-6">\n  <div className="max-w-md mx-auto">\n    <h2 className="text-2xl font-bold mb-6">{{title}}</h2>\n    <form className="space-y-4">\n      <input placeholder="Name" className="w-full border rounded-lg px-4 py-2" />\n      <input placeholder="Email" type="email" className="w-full border rounded-lg px-4 py-2" />\n      <textarea placeholder="Message" rows={4} className="w-full border rounded-lg px-4 py-2" />\n      <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold">Send</button>\n    </form>\n  </div>\n</section>`,
  },
  pricing: {
    label: 'Pricing Table',
    defaultProps: { title: 'Pricing' },
    jsx: `<section className="py-16 px-6 bg-gray-50">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">\n    {['Starter','Pro','Enterprise'].map((plan, idx) => (\n      <div key={plan} className={"bg-white rounded-xl p-8 shadow-md border " + (idx === 1 ? "ring-2 ring-blue-500" : "")}>\n        <h3 className="text-xl font-bold">{plan}</h3>\n        <p className="text-3xl font-bold mt-4">${'$'}{(idx+1)*29}<span className="text-sm text-gray-400">/mo</span></p>\n        <ul className="mt-6 space-y-2 text-gray-600">\n          <li>✓ Feature A</li><li>✓ Feature B</li>{idx > 0 && <li>✓ Feature C</li>}\n        </ul>\n        <button className="w-full mt-6 py-2 rounded-lg bg-blue-600 text-white font-semibold">Choose {plan}</button>\n      </div>\n    ))}\n  </div>\n</section>`,
  },
  testimonials: {
    label: 'Testimonials',
    defaultProps: { title: 'What Our Users Say' },
    jsx: `<section className="py-16 px-6">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">\n    {[1,2].map(i => (\n      <div key={i} className="bg-white rounded-xl p-6 shadow border">\n        <p className="text-gray-600 italic">"This product changed my workflow entirely."</p>\n        <p className="mt-4 font-semibold">User {i}</p>\n      </div>\n    ))}\n  </div>\n</section>`,
  },
  faq: {
    label: 'FAQ Section',
    defaultProps: { title: 'Frequently Asked Questions' },
    jsx: `<section className="py-16 px-6 bg-gray-50">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="max-w-3xl mx-auto space-y-4">\n    {[1,2,3].map(i => (\n      <details key={i} className="bg-white rounded-lg p-4 shadow-sm border">\n        <summary className="font-semibold cursor-pointer">Question {i}?</summary>\n        <p className="mt-2 text-gray-600">Answer to question {i} goes here.</p>\n      </details>\n    ))}\n  </div>\n</section>`,
  },
  gallery: {
    label: 'Image Gallery',
    defaultProps: { title: 'Gallery', count: '6' },
    jsx: `<section className="py-16 px-6">\n  <h2 className="text-3xl font-bold text-center mb-12">{{title}}</h2>\n  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">\n    {Array.from({length: {{count}}}).map((_, i) => (\n      <div key={i} className="aspect-square bg-gray-200 rounded-lg" />\n    ))}\n  </div>\n</section>`,
  },
  stats: {
    label: 'Stats Bar',
    defaultProps: {},
    jsx: `<section className="py-12 px-6 bg-blue-600 text-white">\n  <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">\n    {[['10K+','Users'],['99.9%','Uptime'],['50+','Features'],['24/7','Support']].map(([v,l]) => (\n      <div key={l}><p className="text-3xl font-bold">{v}</p><p className="opacity-80">{l}</p></div>\n    ))}\n  </div>\n</section>`,
  },
  custom: {
    label: 'Custom Block',
    defaultProps: { content: '<div>Custom content</div>' },
    jsx: `{{content}}`,
  },
};

export function usePageBuilder() {
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [activePage, setActivePage] = useState<string | null>(null);

  const createPage = useCallback((name: string) => {
    const page: PageConfig = { id: crypto.randomUUID(), name, blocks: [], framework: 'react-tailwind' };
    setPages(prev => [...prev, page]);
    setActivePage(page.id);
    return page;
  }, []);

  const addBlock = useCallback((pageId: string, type: PageBlock['type']) => {
    const template = BLOCK_TEMPLATES[type];
    if (!template) return;
    const block: PageBlock = {
      id: crypto.randomUUID(),
      type,
      label: template.label,
      props: { ...template.defaultProps },
      order: 0,
    };
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const blocks = [...p.blocks, { ...block, order: p.blocks.length }];
      return { ...p, blocks };
    }));
  }, []);

  const removeBlock = useCallback((pageId: string, blockId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, blocks: p.blocks.filter(b => b.id !== blockId) } : p));
  }, []);

  const moveBlock = useCallback((pageId: string, blockId: string, direction: 'up' | 'down') => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const idx = p.blocks.findIndex(b => b.id === blockId);
      if (idx < 0) return p;
      const newIdx = direction === 'up' ? Math.max(0, idx - 1) : Math.min(p.blocks.length - 1, idx + 1);
      const blocks = [...p.blocks];
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { ...p, blocks: blocks.map((b, i) => ({ ...b, order: i })) };
    }));
  }, []);

  const updateBlockProp = useCallback((pageId: string, blockId: string, key: string, value: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? {
      ...p, blocks: p.blocks.map(b => b.id === blockId ? { ...b, props: { ...b.props, [key]: value } } : b)
    } : p));
  }, []);

  const generateCode = useCallback((pageId: string): string => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return '';
    const blocksJSX = page.blocks.map(block => {
      const template = BLOCK_TEMPLATES[block.type];
      if (!template) return '';
      let jsx = template.jsx;
      Object.entries(block.props).forEach(([k, v]) => {
        jsx = jsx.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
      });
      return jsx;
    }).join('\n\n');

    const name = page.name.replace(/[^a-zA-Z0-9]/g, '');
    return `export function ${name || 'Page'}() {\n  return (\n    <div className="min-h-screen">\n${blocksJSX}\n    </div>\n  );\n}`;
  }, [pages]);

  const getActivePage = useCallback(() => pages.find(p => p.id === activePage) || null, [pages, activePage]);
  const blockTypes = Object.entries(BLOCK_TEMPLATES).map(([type, t]) => ({ type: type as PageBlock['type'], label: t.label }));

  return {
    pages, activePage, setActivePage, createPage, addBlock, removeBlock, moveBlock,
    updateBlockProp, generateCode, getActivePage, blockTypes,
  };
}
