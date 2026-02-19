import { useState, useCallback } from 'react';

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface ProjectState {
  name: string;
  files: ProjectFile[];
  activeFilePath: string | null;
  openFilePaths: string[];
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

const DEFAULT_PROJECT: ProjectState = {
  name: 'Untitled Project',
  files: [],
  activeFilePath: null,
  openFilePaths: [],
};

export function useProjectFileSystem() {
  const [project, setProject] = useState<ProjectState>(DEFAULT_PROJECT);

  const setFiles = useCallback((files: ProjectFile[]) => {
    setProject(prev => {
      const entryFile = files.find(f => f.path === 'index.html') || files[0];
      return {
        ...prev,
        files,
        activeFilePath: prev.activeFilePath && files.some(f => f.path === prev.activeFilePath)
          ? prev.activeFilePath
          : entryFile?.path || null,
        openFilePaths: entryFile ? [entryFile.path] : [],
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

  const setActiveFile = useCallback((path: string) => {
    setProject(prev => ({
      ...prev,
      activeFilePath: path,
      openFilePaths: prev.openFilePaths.includes(path)
        ? prev.openFilePaths
        : [...prev.openFilePaths, path],
    }));
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

  const renameProject = useCallback((name: string) => {
    setProject(prev => ({ ...prev, name }));
  }, []);

  const resetProject = useCallback(() => {
    setProject(DEFAULT_PROJECT);
  }, []);

  /**
   * Sanitize HTML body content: detect raw template literals (${...}) outside
   * <script> and <style> tags and convert them into proper DOM manipulation.
   * This prevents broken previews when the AI generates template literals in HTML.
   */
  const sanitizeTemplateLiterals = useCallback((html: string): string => {
    // Split HTML into script/style blocks and "other" (HTML body) segments
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

    // Check if any non-code segment has raw template literals
    const hasRawLiterals = segments.some(s => !s.isCode && /\$\{[^}]+\}/.test(s.text));
    if (!hasRawLiterals) return html;

    // Escape raw template literals in HTML body to prevent broken rendering
    const sanitized = segments.map(s => {
      if (s.isCode) return s.text;
      // Replace ${expr} with a visible placeholder so the page doesn't break
      return s.text.replace(/\$\{([^}]+)\}/g, '{{$1}}');
    }).join('');

    // Inject a small script that resolves {{expr}} placeholders via the nearest
    // data context, or simply shows them as-is.  This keeps the page functional.
    const fixerScript = `<script>
(function(){
  // Auto-fix: AI generated template literals outside script tags.
  // Replace {{expr}} placeholders with evaluated values if possible.
  var body = document.body;
  if (!body) return;
  var html = body.innerHTML;
  if (html.indexOf('{{') === -1) return;
  // Just display the placeholder names cleanly instead of breaking
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

  /** Combine all project files into a single renderable HTML document */
  const getCompiledHTML = useCallback((
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    envVars?: { key: string; value: string }[],
    serviceKeys?: { id: string; serviceId: string; apiKey: string }[],
    cdnPackages?: { name: string; version?: string; cdnUrl: string }[],
    jsBundler?: (files: ProjectFile[]) => string,
    linkedGPT?: { gptId: string; name: string; themeColor: string; widgetStyle: 'bubble' | 'inline'; position: 'bottom-right' | 'bottom-left'; welcomeMessage: string; placeholderPrompt: string } | null,
  ): string | null => {
    const { files } = project;
    if (files.length === 0) return null;

    const htmlFiles = files.filter(f => f.language === 'html');
    const cssFiles = files.filter(f => f.language === 'css');
    const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');

    if (htmlFiles.length === 0) return null;

    const mainHTML = files.find(f => f.path === 'index.html') || htmlFiles[0];
    let compiled = mainHTML.content;

    // Build head injections
    const headInjects: string[] = [];

    // Inject environment variables + service keys into window.ENV
    const envObj: Record<string, string> = {};
    if (envVars && envVars.length > 0) {
      for (const v of envVars) {
        if (v.key) envObj[v.key] = v.value;
      }
    }
    // Inject service API keys using their catalog env key names
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
      headInjects.push(`<script>window.ENV = ${JSON.stringify(envObj)};</script>`);
    }

    // Inject CDN packages
    if (cdnPackages && cdnPackages.length > 0) {
      for (const pkg of cdnPackages) {
        headInjects.push(`<script src="${pkg.cdnUrl}"></script>`);
      }
    }

    // Inject Supabase SDK if configured
    if (supabaseConfig?.url && supabaseConfig?.anonKey) {
      headInjects.push(`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script>
  const SUPABASE_URL = '${supabaseConfig.url}';
  const SUPABASE_ANON_KEY = '${supabaseConfig.anonKey}';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>`);
    }

    // Inject Stripe.js if configured
    if (stripeConfig?.publishableKey) {
      headInjects.push(`<script src="https://js.stripe.com/v3/"></script>
<script>
  const STRIPE_PUBLISHABLE_KEY = '${stripeConfig.publishableKey}';
  const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
</script>`);
    }

    // Apply head injections
    if (headInjects.length > 0) {
      const injection = headInjects.join('\n');
      if (compiled.includes('</head>')) {
        compiled = compiled.replace('</head>', `${injection}\n</head>`);
      } else {
        compiled = `${injection}\n${compiled}`;
      }
    }

    // Inject CSS files before </head>
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

    // Inject JS files before </body> — use bundler if provided for proper import resolution
    if (jsFiles.length > 0) {
      const jsContent = jsBundler
        ? jsBundler(jsFiles)
        : jsFiles.map(f => `/* ${f.path} */\n${f.content}`).join('\n\n');
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

    // ── Inject error boundary & error overlay (Phase 1A) ──
    const errorBoundaryScript = `<script>
(function(){
  // Global error overlay container
  var overlay = document.createElement('div');
  overlay.id = '__error_overlay__';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);color:#fff;font-family:system-ui,-apple-system,sans-serif;padding:40px;overflow:auto;';
  document.addEventListener('DOMContentLoaded', function(){ document.body.appendChild(overlay); });

  var errorCount = 0;
  var MAX_ERRORS = 10;
  var shownErrors = new Set();

  function showOverlay(title, msg, stack) {
    if (!overlay) return;
    if (shownErrors.has(msg)) return;
    shownErrors.add(msg);
    errorCount++;
    if (errorCount > MAX_ERRORS) return;

    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = '<div style="max-width:600px;width:100%;text-align:left;">'
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">'
      + '<div style="width:48px;height:48px;border-radius:12px;background:rgba(239,68,68,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
      + '<svg width="24" height="24" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      + '</div>'
      + '<div><h2 style="margin:0;font-size:20px;font-weight:700;color:#fca5a5;">' + title + '</h2>'
      + '<p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.5);">An error occurred in the preview</p></div>'
      + '</div>'
      + '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:16px;margin-bottom:16px;">'
      + '<p style="margin:0;font-size:14px;color:#fca5a5;word-break:break-word;">' + msg.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>'
      + (stack ? '<pre style="margin:12px 0 0;font-size:11px;color:rgba(255,255,255,0.35);overflow-x:auto;white-space:pre-wrap;max-height:200px;">' + stack.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</pre>' : '')
      + '</div>'
      + '<div style="display:flex;gap:8px;">'
      + '<button onclick="document.getElementById(\\'__error_overlay__\\').style.display=\\'none\\'" style="padding:8px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:#fff;font-size:13px;cursor:pointer;">Dismiss</button>'
      + '<button onclick="location.reload()" style="padding:8px 16px;border-radius:8px;border:none;background:rgba(239,68,68,0.3);color:#fca5a5;font-size:13px;cursor:pointer;">Reload</button>'
      + '</div>'
      + '</div>';

    // Notify parent for auto-fix pipeline
    window.parent.postMessage({ type: '__PREVIEW_CRITICAL_ERROR__', message: msg, stack: stack || '', title: title }, '*');
  }

  // Catch synchronous errors
  window.onerror = function(msg, source, line, col, error) {
    var stack = error && error.stack ? error.stack : '';
    showOverlay('Runtime Error', String(msg), stack);
    window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: String(msg), source: source || '', line: line || 0, col: col || 0, critical: true }, '*');
    return true; // Prevent default browser error display
  };

  // Catch async errors
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason || 'Unknown async error');
    var stack = e.reason && e.reason.stack ? e.reason.stack : '';
    showOverlay('Unhandled Promise Rejection', msg, stack);
    window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Unhandled Promise: ' + msg, source: '', line: 0, critical: true }, '*');
  });

  // Catch syntax errors in dynamically loaded scripts
  document.addEventListener('error', function(e) {
    if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
      var src = e.target.src || e.target.href || 'unknown';
      showOverlay('Resource Load Error', 'Failed to load: ' + src, '');
    }
  }, true);
})();
</script>`;

    // Inject error boundary BEFORE </head> (early, before any app scripts)
    if (compiled.includes('</head>')) {
      compiled = compiled.replace('</head>', errorBoundaryScript + '\n</head>');
    } else if (compiled.includes('<body')) {
      compiled = compiled.replace('<body', errorBoundaryScript + '\n<body');
    } else {
      compiled = errorBoundaryScript + '\n' + compiled;
    }

    return sanitizeTemplateLiterals(compiled);
  }, [project, sanitizeTemplateLiterals]);

  return {
    project,
    setFiles,
    upsertFile,
    deleteFile,
    setActiveFile,
    closeFile,
    reorderOpenFiles,
    renameProject,
    resetProject,
    getCompiledHTML,
    activeFile: project.files.find(f => f.path === project.activeFilePath) || null,
  };
}
