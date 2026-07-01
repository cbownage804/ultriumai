/**
 * VaultTabs — sub-navigation for the Vault.
 *
 * Mounted at the top of Passwords, Notes, Cards, Identity, and Health so
 * users can move fluidly between the different vault surfaces without
 * hunting through the primary sidebar.
 */

import { NavLink } from 'react-router-dom';
import { Key, StickyNote, CreditCard, IdCard, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/app/passwords', label: 'Passwords', icon: Key, end: true },
  { to: '/app/passwords/notes', label: 'Notes', icon: StickyNote },
  { to: '/app/passwords/cards', label: 'Cards', icon: CreditCard },
  { to: '/app/passwords/identity', label: 'Identity', icon: IdCard },
  { to: '/app/passwords/health', label: 'Health', icon: ShieldCheck },
];

export function VaultTabs() {
  return (
    <nav
      aria-label="Vault sections"
      className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card/40 p-1"
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex min-h-[40px] items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
              isActive
                ? 'bg-violet-500/15 text-violet-200 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.25)]'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]',
            )
          }
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default VaultTabs;
