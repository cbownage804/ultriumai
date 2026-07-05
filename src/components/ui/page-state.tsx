import type { ReactNode } from 'react';

/**
 * Wrayth Three-State UI Standard
 * ------------------------------
 * Every data-driven page / section renders EXACTLY ONE of three states.
 * There is NEVER a fourth "placeholder / sample / seed" state.
 *
 *   Loading  → query in flight, or Ray is actively working
 *   Empty    → query resolved with zero rows AND nothing in progress
 *   Active   → query resolved with ≥1 real row
 *
 * Use `<PageState>` or `usePageState()` on every new surface — do not roll
 * your own conditional rendering, and do not render sample data as a
 * fallback for the empty branch.
 *
 * See mem://preferences/wrayth-three-state-ui.
 */

export type PageStateKind = 'loading' | 'empty' | 'active';

export interface UsePageStateInput {
  /** True while the underlying query / job is running. */
  isLoading: boolean;
  /**
   * True when the resolved dataset contains at least one real row.
   * If unknown (still loading), pass false — the loading branch wins.
   */
  hasData: boolean;
  /**
   * Optional Ray-processing signal — treat as Loading even after the initial
   * fetch resolves (e.g. a scan is running server-side).
   */
  isProcessing?: boolean;
}

export function usePageState({ isLoading, hasData, isProcessing }: UsePageStateInput): PageStateKind {
  if (isLoading || isProcessing) return 'loading';
  if (!hasData) return 'empty';
  return 'active';
}

export interface PageStateProps {
  /** Explicit state — if you already computed it via `usePageState`. */
  state?: PageStateKind;
  /** Or let PageState compute it for you. */
  isLoading?: boolean;
  isProcessing?: boolean;
  hasData?: boolean;

  loading: ReactNode;
  empty: ReactNode;
  /** Active is passed as children so JSX composition reads naturally. */
  children: ReactNode;
}

/**
 * Renders one of three states. Nothing else.
 *
 * ```tsx
 * <PageState
 *   isLoading={q.isLoading}
 *   hasData={(q.data?.length ?? 0) > 0}
 *   loading={<Skeleton className="h-48 w-full" />}
 *   empty={
 *     <RayZeroState
 *       title="I'm waiting for your first device to check in."
 *       body="Once you install the Wrayth agent, devices appear here automatically."
 *       action={{ label: 'Download agent', href: '/app/devices/download' }}
 *     />
 *   }
 * >
 *   <DeviceList data={q.data!} />
 * </PageState>
 * ```
 */
export function PageState({
  state,
  isLoading,
  isProcessing,
  hasData,
  loading,
  empty,
  children,
}: PageStateProps) {
  const kind =
    state ??
    usePageState({
      isLoading: !!isLoading,
      isProcessing,
      hasData: !!hasData,
    });

  if (kind === 'loading') return <>{loading}</>;
  if (kind === 'empty') return <>{empty}</>;
  return <>{children}</>;
}
