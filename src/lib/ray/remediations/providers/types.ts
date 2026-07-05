export interface ExecuteContext {
  userId: string;
  targetId: string;
  targetLabel?: string;
  params?: Record<string, unknown>;
  confirmed: boolean;
}

export interface ExecuteResult {
  auditId: string | null;
  agentActionId: string | null;
  startedAt: number;
  /** `queued` = async via agent; `inline` = ran synchronously (cloud). */
  kind: 'queued' | 'inline';
  result?: unknown;
}
