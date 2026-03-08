#!/bin/bash
# ============================================================
# Setup the Vite template project with all pre-installed deps
# Run this ONCE on the Droplet after initial deployment.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/template"

echo "🔨 Setting up Vite sandbox template..."

# Clean and create template dir
rm -rf "$TEMPLATE_DIR"
mkdir -p "$TEMPLATE_DIR/src"

# Create package.json with all common React ecosystem deps
cat > "$TEMPLATE_DIR/package.json" << 'EOF'
{
  "name": "vite-sandbox-template",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "lucide-react": "^0.462.0",
    "date-fns": "^3.6.0",
    "recharts": "^3.1.0",
    "framer-motion": "^12.23.0",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^2.5.2",
    "sonner": "^2.0.6",
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "@tanstack/react-query": "^5.56.2",
    "@supabase/supabase-js": "^2.50.3",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@radix-ui/react-icons": "^1.3.2",
    "cmdk": "^1.0.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "react-day-picker": "^8.10.1",
    "react-resizable-panels": "^2.1.3",
    "vaul": "^0.9.3",
    "next-themes": "^0.3.0",
    "zustand": "^4.5.5",
    "axios": "^1.7.7",
    "uuid": "^11.0.5",
    "canvas-confetti": "^1.9.4",
    "react-dropzone": "^14.3.8",
    "react-markdown": "^10.1.0",
    "react-color": "^2.19.3",
    "dompurify": "^3.2.6",
    "qrcode": "^1.5.4",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.0.0",
    "@hello-pangea/dnd": "^18.0.1",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@tailwindcss/typography": "^0.5.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
EOF

# Create tsconfig.json
cat > "$TEMPLATE_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
EOF

# Create default vite.config.ts
cat > "$TEMPLATE_DIR/vite.config.ts" << 'EOF'
import path from 'path';

let reactPlugins = [];
try {
  const mod = await import('@vitejs/plugin-react');
  const react = mod?.default;
  if (typeof react === 'function') reactPlugins = [react()];
} catch {
  // Keep config valid even if plugin isn't present yet.
}

export default {
  plugins: reactPlugins,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
};
EOF

# Create tailwind config
cat > "$TEMPLATE_DIR/tailwind.config.js" << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
EOF

# Create postcss config
cat > "$TEMPLATE_DIR/postcss.config.js" << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Create a minimal src/main.tsx placeholder (will be overwritten by user files)
cat > "$TEMPLATE_DIR/src/main.tsx" << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div>Loading...</div>
  </React.StrictMode>
);
EOF

# Install all dependencies (this is the slow part - only done once)
echo "📦 Installing dependencies (this takes a few minutes)..."
cd "$TEMPLATE_DIR"
npm install --prefer-offline --include=dev 2>&1

echo ""
echo "✅ Template ready at: $TEMPLATE_DIR"
echo "   node_modules size: $(du -sh node_modules | cut -f1)"
echo ""
echo "🚀 Start the server with: cd $SCRIPT_DIR && npm start"
