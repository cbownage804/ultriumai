/**
 * Wave 5 Step 3: Generate contextual follow-up suggestions after AI generation.
 * Analyzes diff summary and file types to suggest next actions.
 */

export interface FollowUpSuggestion {
  label: string;
  prompt: string;
  icon: string;
}

interface DiffSummary {
  added: string[];
  modified: string[];
  deleted: string[];
}

export function generateFollowUpSuggestions(
  diffSummary?: DiffSummary | null,
  fileNames?: string[],
): FollowUpSuggestion[] {
  if (!diffSummary && (!fileNames || fileNames.length === 0)) return [];

  const suggestions: FollowUpSuggestion[] = [];
  const allFiles = [
    ...(diffSummary?.added || []),
    ...(diffSummary?.modified || []),
    ...(fileNames || []),
  ];

  const hasComponent = allFiles.some(f => f.includes('/components/') && (f.endsWith('.tsx') || f.endsWith('.jsx')));
  const hasPage = allFiles.some(f => f.includes('/pages/') || f.includes('Page.tsx') || f.includes('page.tsx'));
  const hasCSS = allFiles.some(f => f.endsWith('.css') || f.endsWith('.scss'));
  const hasAPI = allFiles.some(f => f.includes('/api/') || f.includes('supabase') || f.includes('fetch'));
  const hasAuth = allFiles.some(f => f.toLowerCase().includes('auth') || f.toLowerCase().includes('login'));
  const hasForm = allFiles.some(f => f.toLowerCase().includes('form'));
  const hasHook = allFiles.some(f => f.includes('/hooks/'));

  if (hasComponent) {
    suggestions.push(
      { label: 'Add tests', prompt: 'Write unit tests for the components you just created', icon: '🧪' },
      { label: 'Make responsive', prompt: 'Make these components fully responsive for mobile and tablet', icon: '📱' },
    );
  }

  if (hasPage && !hasCSS) {
    suggestions.push(
      { label: 'Polish styling', prompt: 'Add polished styling with animations and better visual hierarchy', icon: '🎨' },
    );
  }

  if (hasPage && !hasAuth) {
    suggestions.push(
      { label: 'Add auth', prompt: 'Add user authentication with protected routes', icon: '🔐' },
    );
  }

  if (hasAPI || hasHook) {
    suggestions.push(
      { label: 'Add error handling', prompt: 'Add proper error handling, loading states, and edge cases', icon: '🛡️' },
    );
  }

  if (hasForm) {
    suggestions.push(
      { label: 'Add validation', prompt: 'Add form validation with error messages and proper UX', icon: '✅' },
    );
  }

  if (!hasAPI && hasComponent) {
    suggestions.push(
      { label: 'Connect to database', prompt: 'Connect these components to a Supabase database', icon: '🗄️' },
    );
  }

  // Always offer a generic improvement
  if (suggestions.length < 2) {
    suggestions.push(
      { label: 'Improve UX', prompt: 'Improve the user experience with better interactions and feedback', icon: '✨' },
    );
  }

  // Cap at 3 suggestions
  return suggestions.slice(0, 3);
}
