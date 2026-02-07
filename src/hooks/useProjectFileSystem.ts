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

  const renameProject = useCallback((name: string) => {
    setProject(prev => ({ ...prev, name }));
  }, []);

  const resetProject = useCallback(() => {
    setProject(DEFAULT_PROJECT);
  }, []);

  /** Combine all project files into a single renderable HTML document */
  const getCompiledHTML = useCallback((
    supabaseConfig?: { url: string; anonKey: string } | null,
    stripeConfig?: { publishableKey: string } | null,
    envVars?: { key: string; value: string }[],
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

    // Inject environment variables
    if (envVars && envVars.length > 0) {
      const envObj = envVars.reduce((acc, v) => {
        if (v.key) acc[v.key] = v.value;
        return acc;
      }, {} as Record<string, string>);
      headInjects.push(`<script>window.ENV = ${JSON.stringify(envObj)};</script>`);
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

    // Inject JS files before </body>
    if (jsFiles.length > 0) {
      const jsInject = jsFiles
        .map(f => `<script>/* ${f.path} */\n${f.content}</script>`)
        .join('\n');
      if (compiled.includes('</body>')) {
        compiled = compiled.replace('</body>', `${jsInject}\n</body>`);
      } else {
        compiled += `\n${jsInject}`;
      }
    }

    return compiled;
  }, [project]);

  return {
    project,
    setFiles,
    upsertFile,
    deleteFile,
    setActiveFile,
    closeFile,
    renameProject,
    resetProject,
    getCompiledHTML,
    activeFile: project.files.find(f => f.path === project.activeFilePath) || null,
  };
}
