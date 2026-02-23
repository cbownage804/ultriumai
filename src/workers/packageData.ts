/**
 * Package data for the compiler worker.
 * Lives inside src/workers/ to avoid React Refresh preamble injection.
 * 
 * IMPORTANT: This file must NOT use `export interface` or `export type` 
 * because the SWC parserConfig skips worker files (returns undefined),
 * and Vite may serve them without full TS transpilation.
 */

const ESM_SH = 'https://esm.sh';

export const DEFAULT_PACKAGES = [
  { name: 'lucide-react', version: '0.462.0', cdnUrl: `${ESM_SH}/lucide-react@0.462.0?external=react`, peerDeps: ['react'] },
  { name: 'date-fns', version: '3.6.0', cdnUrl: `${ESM_SH}/date-fns@3.6.0` },
  { name: 'recharts', version: '3.1.0', cdnUrl: `${ESM_SH}/recharts@3.1.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'framer-motion', version: '12.23.0', cdnUrl: `${ESM_SH}/framer-motion@12.23.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'react-router-dom', version: '6.26.2', cdnUrl: `${ESM_SH}/react-router-dom@6.26.2?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'clsx', version: '2.1.1', cdnUrl: `${ESM_SH}/clsx@2.1.1` },
  { name: 'zustand', version: '4.5.5', cdnUrl: `${ESM_SH}/zustand@4.5.5?external=react`, peerDeps: ['react'] },
  { name: 'axios', version: '1.7.7', cdnUrl: `${ESM_SH}/axios@1.7.7` },
  { name: 'zod', version: '3.23.8', cdnUrl: `${ESM_SH}/zod@3.23.8` },
  { name: 'sonner', version: '2.0.6', cdnUrl: `${ESM_SH}/sonner@2.0.6?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'class-variance-authority', version: '0.7.1', cdnUrl: `${ESM_SH}/class-variance-authority@0.7.1` },
  { name: 'tailwind-merge', version: '2.5.2', cdnUrl: `${ESM_SH}/tailwind-merge@2.5.2` },
  { name: '@tanstack/react-query', version: '5.56.2', cdnUrl: `${ESM_SH}/@tanstack/react-query@5.56.2?external=react`, peerDeps: ['react'] },
  { name: 'react-hook-form', version: '7.53.0', cdnUrl: `${ESM_SH}/react-hook-form@7.53.0?external=react`, peerDeps: ['react'] },
  { name: 'react-icons', version: '5.4.0', cdnUrl: `${ESM_SH}/react-icons@5.4.0?external=react`, peerDeps: ['react'] },
  { name: '@headlessui/react', version: '2.2.0', cdnUrl: `${ESM_SH}/@headlessui/react@2.2.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'uuid', version: '11.0.5', cdnUrl: `${ESM_SH}/uuid@11.0.5` },
  { name: 'lodash-es', version: '4.17.21', cdnUrl: `${ESM_SH}/lodash-es@4.17.21` },
  { name: 'dayjs', version: '1.11.13', cdnUrl: `${ESM_SH}/dayjs@1.11.13` },
  { name: '@radix-ui/react-slot', version: '1.1.0', cdnUrl: `${ESM_SH}/@radix-ui/react-slot@1.1.0?external=react`, peerDeps: ['react'] },
  { name: '@radix-ui/react-icons', version: '1.3.2', cdnUrl: `${ESM_SH}/@radix-ui/react-icons@1.3.2?external=react`, peerDeps: ['react'] },
  { name: 'react-hot-toast', version: '2.4.1', cdnUrl: `${ESM_SH}/react-hot-toast@2.4.1?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
  { name: 'cmdk', version: '1.0.0', cdnUrl: `${ESM_SH}/cmdk@1.0.0?external=react,react-dom`, peerDeps: ['react', 'react-dom'] },
];
