import { devLog } from '@/lib/logger';
import { useState, useCallback } from 'react';

export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'panel' | 'transform' | 'prompt-modifier' | 'deploy-hook';
  entryPoint: string;
  permissions: string[];
  config: Record<string, any>;
  isPublished: boolean;
}

export interface SDKTemplate {
  name: string;
  type: PluginDefinition['type'];
  description: string;
  code: string;
}

const TEMPLATES: SDKTemplate[] = [
  {
    name: 'Custom Panel',
    type: 'panel',
    description: 'Add a new panel to the builder sidebar',
    code: `import { definePlugin } from '@ultrium/plugin-sdk';

export default definePlugin({
  name: 'my-custom-panel',
  version: '1.0.0',
  type: 'panel',
  
  panel: {
    title: 'My Panel',
    icon: 'Sparkles',
    render: (ctx) => {
      return \`
        <div class="p-4">
          <h3>Hello from My Plugin!</h3>
          <p>Project: \${ctx.projectName}</p>
          <p>Files: \${ctx.files.length}</p>
          <button onclick="ctx.insertCode('// Hello!')">Insert Code</button>
        </div>
      \`;
    },
  },
});`,
  },
  {
    name: 'Code Transform',
    type: 'transform',
    description: 'Transform code before or after AI generation',
    code: `import { definePlugin } from '@ultrium/plugin-sdk';

export default definePlugin({
  name: 'my-transform',
  version: '1.0.0',
  type: 'transform',
  
  transform: {
    // Runs after AI generates code
    afterGenerate: (files) => {
      return files.map(f => ({
        ...f,
        content: f.content.replace(/console\\.log/g, 'logger.info'),
      }));
    },
    
    // Runs before code is compiled
    beforeCompile: (code, filePath) => {
      return code;
    },
  },
});`,
  },
  {
    name: 'Prompt Modifier',
    type: 'prompt-modifier',
    description: 'Modify or enhance user prompts before sending to AI',
    code: `import { definePlugin } from '@ultrium/plugin-sdk';

export default definePlugin({
  name: 'my-prompt-enhancer',
  version: '1.0.0',
  type: 'prompt-modifier',
  
  promptModifier: {
    beforeSend: (prompt, context) => {
      // Add project-specific context
      return \`\${prompt}\\n\\nNote: This project uses \${context.framework} with \${context.cssFramework}.\`;
    },
  },
});`,
  },
  {
    name: 'Deploy Hook',
    type: 'deploy-hook',
    description: 'Run custom logic before or after deployment',
    code: `import { definePlugin } from '@ultrium/plugin-sdk';

export default definePlugin({
  name: 'my-deploy-hook',
  version: '1.0.0',
  type: 'deploy-hook',
  
  deployHook: {
    beforeDeploy: async (files, config) => {
      devLog.log('Running pre-deploy checks...');
      // Validate, lint, etc.
      return { proceed: true };
    },
    
    afterDeploy: async (result) => {
      devLog.log('Deploy complete:', result.url);
      // Send notification, update status, etc.
    },
  },
});`,
  },
];

export function usePluginSDK() {
  const [plugins, setPlugins] = useState<PluginDefinition[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<SDKTemplate | null>(null);

  const createPlugin = useCallback((name: string, type: PluginDefinition['type']): PluginDefinition => {
    const plugin: PluginDefinition = {
      id: crypto.randomUUID(),
      name,
      version: '1.0.0',
      description: '',
      author: '',
      type,
      entryPoint: `plugins/${name}/index.ts`,
      permissions: [],
      config: {},
      isPublished: false,
    };
    setPlugins(prev => [...prev, plugin]);
    return plugin;
  }, []);

  const updatePlugin = useCallback((id: string, updates: Partial<PluginDefinition>) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deletePlugin = useCallback((id: string) => {
    setPlugins(prev => prev.filter(p => p.id !== id));
  }, []);

  const publishPlugin = useCallback((id: string) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, isPublished: true } : p));
  }, []);

  const generateSDKTypes = useCallback((): string => {
    return `// @ultrium/plugin-sdk type definitions

interface PluginContext {
  projectName: string;
  files: { path: string; content: string }[];
  activeFile: string | null;
  framework: string;
  cssFramework: string;
  insertCode: (code: string) => void;
  updateFile: (path: string, content: string) => void;
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
}

interface PluginConfig {
  name: string;
  version: string;
  type: 'panel' | 'transform' | 'prompt-modifier' | 'deploy-hook';
  panel?: {
    title: string;
    icon: string;
    render: (ctx: PluginContext) => string;
  };
  transform?: {
    afterGenerate?: (files: { path: string; content: string }[]) => { path: string; content: string }[];
    beforeCompile?: (code: string, filePath: string) => string;
  };
  promptModifier?: {
    beforeSend?: (prompt: string, context: PluginContext) => string;
  };
  deployHook?: {
    beforeDeploy?: (files: { path: string; content: string }[], config: any) => Promise<{ proceed: boolean }>;
    afterDeploy?: (result: { url: string; success: boolean }) => Promise<void>;
  };
}

export function definePlugin(config: PluginConfig): PluginConfig;
`;
  }, []);

  return { plugins, templates: TEMPLATES, activeTemplate, setActiveTemplate, createPlugin, updatePlugin, deletePlugin, publishPlugin, generateSDKTypes };
}
