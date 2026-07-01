import { devLog } from '@/lib/logger';
import { useState, useCallback, useEffect, useRef } from 'react';

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  /** Transient flag — set when the parser detects the file was still open at stream end without ===END===. Not persisted. */
  incomplete?: boolean;
}

/** Phase 86: Binary asset storage for images/blobs */
export interface ProjectAssetEntry {
  mimeType: string;
  dataUrl: string;
}

export interface ProjectState {
  name: string;
  files: ProjectFile[];
  activeFilePath: string | null;
  openFilePaths: string[];
  /** Phase 86: Binary assets record (path → data URL) — plain object for JSON-serializability */
  assets: Record<string, ProjectAssetEntry>;
}

function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss',
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', md: 'markdown',
    svg: 'xml',
  };
  return map[ext] || 'plaintext';
}

function detectReactProject(files: ProjectFile[]): boolean {
  return files.some((file) => {
    const normalizedPath = file.path.toLowerCase();
    if (normalizedPath === 'package.json' && /"react"\s*:/.test(file.content)) return true;
    if (!/\.(tsx|jsx|ts|js)$/.test(normalizedPath)) return false;
    return /from\s+['"]react['"]|import\s+React\b|createRoot\s*\(/.test(file.content);
  });
}

const DEFAULT_PROJECT: ProjectState = {
  name: 'Untitled Project',
  files: [],
  activeFilePath: null,
  openFilePaths: [],
  assets: {},
};

export function useProjectFileSystem() {
  const [project, setProject] = useState<ProjectState>(DEFAULT_PROJECT);

  const setFiles = useCallback((files: ProjectFile[]) => {
    setProject(prev => {
      const entryFile = files.find(f => f.path === 'index.html') || files[0];
      const filePaths = new Set(files.map(f => f.path));
      // Preserve existing open tabs that still exist, and ensure entry file is open
      const preservedOpen = prev.openFilePaths.filter(p => filePaths.has(p));
      const openFilePaths = preservedOpen.length > 0
        ? (entryFile && !preservedOpen.includes(entryFile.path)
            ? [...preservedOpen, entryFile.path]
            : preservedOpen)
        : (entryFile ? [entryFile.path] : []);
      return {
        ...prev,
        files,
        activeFilePath: prev.activeFilePath && filePaths.has(prev.activeFilePath)
          ? prev.activeFilePath
          : entryFile?.path || null,
        openFilePaths,
      };
    });
  }, []);

  const upsertFile = useCallback((path: string, content: string) => {
    setProject(prev => {
      const existing = prev.files.findIndex(f => f.path === path);
      const file: ProjectFile = { path, content, language: detectLanguage(path) };
      const files = existing >= 0
        ? prev.files.map((f, i) => (i === existing ? file : f))
        : [...prev.files, file];
      const openFilePaths = prev.openFilePaths.includes(path)
        ? prev.openFilePaths
        : [...prev.openFilePaths, path];
      return { ...prev, files, openFilePaths, activeFilePath: path };
    });
  }, []);

  const deleteFile = useCallback((path: string) => {
    setProject(prev => {
      const files = prev.files.filter(f => f.path !== path);
      const openFilePaths = prev.openFilePaths.filter(p => p !== path);
      const activeFilePath =
        prev.activeFilePath === path
          ? openFilePaths[openFilePaths.length - 1] || files[0]?.path || null
          : prev.activeFilePath;
      return { ...prev, files, openFilePaths, activeFilePath };
    });
  }, []);

  /** Phase 85: Rename a file and update import references in other files */
  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setProject(prev => {
      const files = prev.files.map(f => {
        if (f.path === oldPath) {
          return { ...f, path: newPath, language: detectLanguage(newPath) };
        }
        // Update import references in other files
        const oldBase = oldPath.replace(/\.[^.]+$/, '');
        const newBase = newPath.replace(/\.[^.]+$/, '');
        if (oldBase !== newBase && (f.language === 'javascript' || f.language === 'typescript')) {
          const oldRef = `./${oldBase}`;
          const newRef = `./${newBase}`;
          const updated = f.content
            .replace(new RegExp(`from\\s+['"]${escapeRegex(oldRef)}['"]`, 'g'), `from '${newRef}'`)
            .replace(new RegExp(`from\\s+['"]${escapeRegex(oldPath)}['"]`, 'g'), `from '${newPath}'`);
          if (updated !== f.content) return { ...f, content: updated };
        }
        return f;
      });
      const openFilePaths = prev.openFilePaths.map(p => p === oldPath ? newPath : p);
      const activeFilePath = prev.activeFilePath === oldPath ? newPath : prev.activeFilePath;
      return { ...prev, files, openFilePaths, activeFilePath };
    });
  }, []);

  /** Phase 86: Add a binary asset (image, font, etc.) */
  const addAsset = useCallback((path: string, dataUrl: string, mimeType: string) => {
    setProject(prev => {
      const assets = { ...prev.assets, [path]: { dataUrl, mimeType } };
      return { ...prev, assets };
    });
  }, []);

  /** Phase 86: Remove a binary asset */
  const removeAsset = useCallback((path: string) => {
    setProject(prev => {
      const { [path]: _, ...assets } = prev.assets;
      return { ...prev, assets };
    });
  }, []);

  const setActiveFile = useCallback((path: string) => {
    setProject(prev => {
      const openFilePaths = prev.openFilePaths.includes(path)
        ? prev.openFilePaths
        : [...prev.openFilePaths, path];
      return { ...prev, activeFilePath: path, openFilePaths };
    });
  }, []);

  const closeFile = useCallback((path: string) => {
    setProject(prev => {
      const openFilePaths = prev.openFilePaths.filter(p => p !== path);
      const activeFilePath =
        prev.activeFilePath === path
          ? openFilePaths[openFilePaths.length - 1] || null
          : prev.activeFilePath;
      return { ...prev, openFilePaths, activeFilePath };
    });
  }, []);

  const reorderOpenFiles = useCallback((paths: string[]) => {
    setProject(prev => ({ ...prev, openFilePaths: paths }));
  }, []);

  // Persist open tabs to localStorage
  const tabPersistKey = `ai-builder-tabs-${project.name}`;
  const isRestoredRef = useRef(false);

  useEffect(() => {
    if (project.openFilePaths.length > 0 && isRestoredRef.current) {
      try {
        localStorage.setItem(tabPersistKey, JSON.stringify({
          openPaths: project.openFilePaths,
          activePath: project.activeFilePath,
        }));
      } catch {}
    }
  }, [project.openFilePaths, project.activeFilePath, tabPersistKey]);

  // Restore tabs on mount when files are loaded
  useEffect(() => {
    if (isRestoredRef.current || project.files.length === 0) return;
    isRestoredRef.current = true;
    try {
      const saved = localStorage.getItem(tabPersistKey);
      if (!saved) return;
      const { openPaths, activePath } = JSON.parse(saved);
      if (!Array.isArray(openPaths)) return;
      const filePaths = new Set(project.files.map(f => f.path));
      const validPaths = openPaths.filter((p: string) => filePaths.has(p));
      if (validPaths.length > 0) {
        setProject(prev => ({
          ...prev,
          openFilePaths: validPaths,
          activeFilePath: activePath && filePaths.has(activePath) ? activePath : validPaths[0],
        }));
      }
    } catch {}
  }, [project.files.length, tabPersistKey]);

  const renameProject = useCallback((name: string) => {
    setProject(prev => ({ ...prev, name }));
  }, []);

  const resetProject = useCallback(() => {
    setProject(DEFAULT_PROJECT);
  }, []);

  /**
   * Sanitize HTML body content: detect raw template literals (${...}) outside
   * <script> and <style> tags and convert them into proper DOM manipulation.
   */
  const sanitizeTemplateLiterals = useCallback((html: string): string => {
    const segments: { text: string; isCode: boolean }[] = [];
    const tagPattern = /(<script[\s>][\s\S]*?<\/script>|<style[\s>][\s\S]*?<\/style>)/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(html)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: html.slice(lastIndex, match.index), isCode: false });
      }
      segments.push({ text: match[0], isCode: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < html.length) {
      segments.push({ text: html.slice(lastIndex), isCode: false });
    }

    const hasRawLiterals = segments.some(s => !s.isCode && /\$\{[^}]+\}/.test(s.text));
    if (!hasRawLiterals) return html;

    const sanitized = segments.map(s => {
      if (s.isCode) return s.text;
      return s.text.replace(/\$\{([^}]+)\}/g, '{{$1}}');
    }).join('');

    const fixerScript = `<script>
(function(){
  var body = document.body;
  if (!body) return;
  var html = body.innerHTML;
  if (html.indexOf('{{') === -1) return;
  body.innerHTML = html.replace(/\\{\\{([^}]+)\\}\\}/g, function(_, expr) {
    return '<span style="color:#888;font-style:italic">[' + expr.trim() + ']</span>';
  });
})();
</script>`;

    if (sanitized.includes('</body>')) {
      return sanitized.replace('</body>', fixerScript + '\n</body>');
    }
    return sanitized + '\n' + fixerScript;
  }, []);

  const addSandboxToIframes = (html: string) => html.replace(/<iframe\s+(?!.*?sandbox=)/gi, '<iframe sandbox="allow-scripts allow-same-origin allow-popups" ');

  const getCompiledHTML = useCallback((
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    envVars?: { key: string; value: string }[],
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    cdnPackages?: { name: string; version?: string; cdnUrl: string }[],
    jsBundler?: (files: ProjectFile[]) => string,
    linkedGPT?: { gptId: string; name: string; themeColor: string; widgetStyle: 'bubble' | 'inline'; position: 'bottom-right' | 'bottom-left'; welcomeMessage: string; placeholderPrompt: string } | null,
  ): string | null => {
    const { files, assets } = project;
    if (files.length === 0) return null;

    const isReact = detectReactProject(files);

    const htmlFiles = files.filter(f => f.language === 'html');
    const cssFiles = files.filter(f => f.language === 'css');
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');

    if (htmlFiles.length === 0 && !isReact) return null;
    if (htmlFiles.length === 0 && isReact) return null;

    const mainHTML = files.find(f => f.path === 'index.html') || htmlFiles[0];
    let compiled = mainHTML.content;

    // Strip local <script src> and <link href=css> tags that will be inlined
    const localPaths = new Set(files.map(f => f.path));
    compiled = compiled.replace(
      /<script\s+[^>]*src=['"]([^'"]+)['"]\s*><\/script>/gi,
      (match, src) => {
        if (src.startsWith('http') || src.startsWith('//')) return match;
        const normalized = src.startsWith('./') ? src.slice(2) : src;
        return localPaths.has(normalized) ? `<!-- inlined: ${normalized} -->` : match;
      }
    );
    compiled = compiled.replace(
      /<link\s+[^>]*href=['"]([^'"]+\.css)['"][^>]*>/gi,
      (match, href) => {
        if (href.startsWith('http') || href.startsWith('//')) return match;
        const normalized = href.startsWith('./') ? href.slice(2) : href;
        return localPaths.has(normalized) ? `<!-- inlined: ${normalized} -->` : match;
      }
    );

    // Phase 92: Replace relative <img src> with data URLs or placeholders
    if (Object.keys(assets).length > 0) {
      compiled = compiled.replace(
        /<img\s+([^>]*)src=['"]([^'"]+)['"]/gi,
        (match, before, src) => {
          if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) return match;
          const normalized = src.startsWith('./') ? src.slice(2) : src;
          const asset = assets[normalized];
          if (asset) return `<img ${before}src="${asset.dataUrl}"`;
          return match;
        }
      );
    }

    // Build head injections
    const headInjects: string[] = [];

    const envObj: Record<string, string> = {};
    if (envVars && envVars.length > 0) {
      for (const v of envVars) {
        if (v.key) envObj[v.key] = v.value;
      }
    }
    if (serviceKeys && serviceKeys.length > 0) {
      const SERVICE_ENV_MAP: Record<string, string> = {
        openai: 'OPENAI_API_KEY', anthropic: 'ANTHROPIC_API_KEY', google_ai: 'GOOGLE_AI_API_KEY',
        perplexity: 'PERPLEXITY_API_KEY', mistral: 'MISTRAL_API_KEY', cohere: 'COHERE_API_KEY',
        groq: 'GROQ_API_KEY', elevenlabs: 'ELEVENLABS_API_KEY', deepgram: 'DEEPGRAM_API_KEY',
        assemblyai: 'ASSEMBLYAI_API_KEY', replicate: 'REPLICATE_API_KEY', huggingface: 'HUGGINGFACE_API_KEY',
      };
      for (const sk of serviceKeys) {
        const envKey = SERVICE_ENV_MAP[sk.serviceId];
        if (envKey && sk.apiKey) envObj[envKey] = sk.apiKey;
      }
    }
    if (Object.keys(envObj).length > 0) {
      const maskedObj: Record<string, string> = {};
      for (const [k, v] of Object.entries(envObj)) {
        const isSecret = /key|secret|token|password|auth/i.test(k);
        maskedObj[k] = isSecret && v.length > 8 ? '****...' + v.slice(-6) : v;
      }
      headInjects.push(`<script>
window.ENV = ${JSON.stringify(envObj)};
if (typeof console !== 'undefined') {
  devLog('%c[ENV] Variables loaded:', 'color:#6ee7b7', ${JSON.stringify(maskedObj)});
}
</script>`);
    }

    if (cdnPackages && cdnPackages.length > 0) {
      for (const pkg of cdnPackages) {
        headInjects.push(`<script src="${pkg.cdnUrl}"></script>`);
      }
    }

    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      headInjects.push(`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script>
  const SUPABASE_URL = '${supabaseConfig.url}';
  const SUPABASE_ANON_KEY = '${supabaseConfig.anonKey}';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>`);
    }

    if (stripeConfig?.publishableKey) {
      headInjects.push(`<script src="https://js.stripe.com/v3/"></script>
<script>
  const STRIPE_PUBLISHABLE_KEY = '${stripeConfig.publishableKey}';
  const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
</script>`);
    }

    if (headInjects.length > 0) {
      const injection = headInjects.join('\n');
      if (compiled.includes('</head>')) {
        compiled = compiled.replace('</head>', `${injection}\n</head>`);
      } else {
        compiled = `${injection}\n${compiled}`;
      }
    }

    if (cssFiles.length > 0) {
      const cssInject = cssFiles
        .map(f => `<style>/* ${f.path} */\n${f.content}</style>`)
        .join('\n');
      if (compiled.includes('</head>')) {
        compiled = compiled.replace('</head>', `${cssInject}\n</head>`);
      } else {
        compiled = `<style>${cssFiles.map(f => f.content).join('\n')}</style>\n${compiled}`;
      }
    }

    if (jsFiles.length > 0) {
      let jsContent = jsBundler
        ? jsBundler(jsFiles)
        : jsFiles.map(f => `/* ${f.path} */\n${f.content}`).join('\n\n');
      // Escape </script> in JS content to prevent HTML parser from closing the tag prematurely
      jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');
      const jsInject = `<script>${jsContent}</script>`;
      if (compiled.includes('</body>')) {
        compiled = compiled.replace('</body>', `${jsInject}\n</body>`);
      } else {
        compiled += `\n${jsInject}`;
      }
    }

    // Inject GPT Chat Widget if linked
    if (linkedGPT?.gptId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const chatUrl = `${origin}/gpt/chat/${linkedGPT.gptId}`;
      const isBubble = linkedGPT.widgetStyle === 'bubble';
      const posRight = linkedGPT.position === 'bottom-right';
      const themeColor = linkedGPT.themeColor || '#6366f1';

      const widgetHTML = isBubble ? `
<!-- GPT Chat Widget: ${linkedGPT.name} -->
<style>
  #gpt-widget-bubble { position: fixed; ${posRight ? 'right: 20px;' : 'left: 20px;'} bottom: 20px; z-index: 9999; font-family: system-ui, -apple-system, sans-serif; }
  #gpt-widget-bubble .gpt-fab { width: 56px; height: 56px; border-radius: 50%; background: ${themeColor}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s; }
  #gpt-widget-bubble .gpt-fab:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.4); }
  #gpt-widget-bubble .gpt-fab svg { width: 24px; height: 24px; fill: white; }
  #gpt-widget-bubble .gpt-chat-frame { display: none; width: 380px; height: 560px; border: none; border-radius: 16px; box-shadow: 0 8px 40px rgba(0,0,0,0.4); margin-bottom: 12px; background: white; }
  #gpt-widget-bubble.open .gpt-chat-frame { display: block; }
  #gpt-widget-bubble.open .gpt-fab svg.icon-open { display: none; }
  #gpt-widget-bubble.open .gpt-fab svg.icon-close { display: block; }
  #gpt-widget-bubble .gpt-fab svg.icon-close { display: none; }
</style>
<div id="gpt-widget-bubble">
  <iframe class="gpt-chat-frame" src="${chatUrl}?embed=true&hideHeader=false" allow="microphone"></iframe>
  <button class="gpt-fab" onclick="this.parentElement.classList.toggle('open')">
    <svg class="icon-open" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
  </button>
</div>` : `
<!-- GPT Chat Widget: ${linkedGPT.name} (inline) -->
<style>
  #gpt-widget-inline { width: 100%; max-width: 440px; height: 520px; margin: 20px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.08); }
  #gpt-widget-inline iframe { width: 100%; height: 100%; border: none; }
</style>
<div id="gpt-widget-inline">
  <iframe src="${chatUrl}?embed=true&hideHeader=false" allow="microphone"></iframe>
</div>`;

      if (compiled.includes('</body>')) {
        compiled = compiled.replace('</body>', `${widgetHTML}\n</body>`);
      } else {
        compiled += `\n${widgetHTML}`;
      }
    }

    // ── Inject console/network interceptors + error boundary ──
    const interceptorScript = `<script>
(function(){
  if(window.__builderInjected) return;
  window.__builderInjected = true;

  function __previewSerializeArg(value, depth, seen) {
    if (value == null) return String(value);
    var type = typeof value;
    if (type === 'string') return value;
    if (type === 'number' || type === 'boolean' || type === 'bigint') return String(value);
    if (type === 'function') return '[Function ' + (value.name || 'anonymous') + ']';
    if (type === 'symbol') return value.toString();
    if (typeof Event !== 'undefined' && value instanceof Event) return '[Event ' + value.type + ' target=' + ((value.target && value.target.tagName) || 'unknown') + ']';
    if (typeof Node !== 'undefined' && value instanceof Node) return '[DOM ' + value.nodeName + ']';
    if (typeof Window !== 'undefined' && value instanceof Window) return '[Window]';
    if (seen.has(value)) return '[Circular]';
    if (depth >= 2) return Array.isArray(value) ? '[Array(' + value.length + ')]' : '[Object]';
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        return '[' + value.slice(0, 10).map(function(item){ return __previewSerializeArg(item, depth + 1, seen); }).join(', ') + (value.length > 10 ? ', …' : '') + ']';
      }
      var keys = Object.keys(value).slice(0, 12);
      var out = keys.map(function(key){ return key + ': ' + __previewSerializeArg(value[key], depth + 1, seen); }).join(', ');
      return '{' + out + (Object.keys(value).length > 12 ? ', …' : '') + '}';
    } catch (err) {
      return '[Unserializable ' + ((value && value.constructor && value.constructor.name) || 'Object') + ']';
    } finally {
      seen.delete(value);
    }
  }

  function __previewFormatConsoleArgs(argsLike) {
    try {
      return Array.prototype.slice.call(argsLike).map(function(arg){ return __previewSerializeArg(arg, 0, new WeakSet()); }).join(' ').slice(0, 4000);
    } catch (err) {
      return '[console serialization failed: ' + (err && err.message ? err.message : 'unknown') + ']';
    }
  }

  var origConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info, debug: console.debug };
  var seenMessages = {};
  ['log','warn','error','info','debug'].forEach(function(level){
    console[level] = function(){
      origConsole[level].apply(console, arguments);
      try {
        var msg = __previewFormatConsoleArgs(arguments);
        var key = level + ':' + msg;
        var now = Date.now();
        if (seenMessages[key] && now - seenMessages[key] < 500) return;
        seenMessages[key] = now;
        window.parent.postMessage({ type: '__CONSOLE_LOG__', level: level, message: msg, timestamp: now }, '*');
      } catch(e){}
    };
  });

  var origFetch = window.fetch;
  window.fetch = function(){
    var start = performance.now();
    var req = arguments[0];
    var url = typeof req === 'string' ? req : (req && req.url ? req.url : '');
    var method = 'GET';
    if (arguments[1] && arguments[1].method) method = arguments[1].method;
    if (typeof req === 'object' && req.method) method = req.method;

    // Phase 91: Intercept relative fetch URLs
    if (typeof req === 'string' && req.startsWith('/') && !req.startsWith('//')) {
      devLog('[Preview] Relative fetch URL "' + req + '" — returning mock response. Connect a backend to enable API calls.');
      return Promise.resolve(new Response(JSON.stringify({ message: 'Mock response — connect a backend for real API calls', path: req }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      }));
    }

    return origFetch.apply(this, arguments).then(function(res){
      var time = Math.round(performance.now() - start);
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: url, status: res.status, statusText: res.statusText, duration: time, ok: res.ok }, '*');
      return res;
    }).catch(function(err){
      var time = Math.round(performance.now() - start);
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: url, status: 0, statusText: 'Failed', duration: time, ok: false, error: err.message }, '*');
      throw err;
    });
  };

  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url){
    this.__bMethod = method;
    this.__bUrl = url;
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(){
    var self = this;
    var start = performance.now();
    self.addEventListener('loadend', function(){
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: self.__bMethod || 'GET', url: self.__bUrl || '', status: self.status, duration: Math.round(performance.now() - start) }, '*');
    });
    return origXHRSend.apply(this, arguments);
  };

  // Phase 88: localStorage/sessionStorage shim for srcdoc iframe
  (function() {
    var store = {};
    try { if (window.localStorage) return; } catch(e) {}
    var handler = {
      getItem: function(k) { return store[k] !== undefined ? store[k] : null; },
      setItem: function(k, v) { store[k] = String(v); window.parent.postMessage({ type: '__STORAGE_SET__', key: k, value: String(v) }, '*'); },
      removeItem: function(k) { delete store[k]; },
      clear: function() { store = {}; },
      get length() { return Object.keys(store).length; },
      key: function(i) { return Object.keys(store)[i] || null; }
    };
    try {
      Object.defineProperty(window, 'localStorage', { value: handler, writable: false });
      Object.defineProperty(window, 'sessionStorage', { value: handler, writable: false });
    } catch(e) {}
    window.addEventListener('message', function(ev) {
      if (ev.data && ev.data.type === '__STORAGE_RESTORE__' && ev.data.data) {
        store = ev.data.data;
      }
    });
  })();

  // Phase 89: window.location override to prevent iframe navigation breakage
  (function() {
    var origAssign = window.location.assign;
    var origReplace = window.location.replace;
    window.location.assign = function(url) {
      window.parent.postMessage({ type: '__PREVIEW_NAV__', href: url }, '*');
    };
    window.location.replace = function(url) {
      window.parent.postMessage({ type: '__PREVIEW_NAV__', href: url }, '*');
    };
    try {
      var loc = window.location;
      Object.defineProperty(window, 'location', {
        get: function() { return loc; },
        set: function(url) {
          window.parent.postMessage({ type: '__PREVIEW_NAV__', href: String(url) }, '*');
        }
      });
    } catch(e) {}
  })();

  // Phase 95: Pass dark mode preference to iframe
  (function() {
    var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mq) {
      document.documentElement.setAttribute('data-prefers-dark', mq.matches ? 'true' : 'false');
      mq.addEventListener('change', function(e) {
        document.documentElement.setAttribute('data-prefers-dark', e.matches ? 'true' : 'false');
      });
    }
  })();

  window.onerror = function(msg, src, line, col, err) {
    window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: String(msg), source: src || '', line: line || 0, col: col || 0, critical: true }, '*');
  };
  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Unhandled Promise: ' + (e.reason && e.reason.message ? e.reason.message : e.reason || 'Unknown'), source: '', line: 0, critical: false }, '*');
  });
})();
</script>`;

    // Inject before </head> or at start
    if (compiled.includes('</head>')) {
      compiled = compiled.replace('</head>', `${interceptorScript}\n</head>`);
    } else {
      compiled = `${interceptorScript}\n${compiled}`;
    }

    // Post-process: sanitize template literals & sandbox iframes
    compiled = sanitizeTemplateLiterals(compiled);
    compiled = addSandboxToIframes(compiled);

    return compiled;
  }, [project, sanitizeTemplateLiterals]);

  return {
    project,
    setFiles,
    upsertFile,
    deleteFile,
    renameFile,
    addAsset,
    removeAsset,
    setActiveFile,
    closeFile,
    reorderOpenFiles,
    renameProject,
    resetProject,
    getCompiledHTML,
    sanitizeTemplateLiterals,
    /** Derived: the currently active file object */
    activeFile: project.files.find(f => f.path === project.activeFilePath) || null,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
