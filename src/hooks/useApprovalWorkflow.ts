/**
 * Phase 117: Approval Workflows
 * Require approval before deploying to production.
 */
import { useCallback, useState } from 'react';

export interface ApprovalRequest {
  id: string;
  type: 'deploy' | 'merge' | 'settings-change' | 'member-add';
  title: string;
  description: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNote?: string;
  diff?: { filesChanged: number; additions: number; deletions: number };
  expiresAt: Date;
}

export function useApprovalWorkflow() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [requireApproval, setRequireApproval] = useState(false);

  const submitForApproval = useCallback((
    type: ApprovalRequest['type'],
    title: string,
    description: string,
    diff?: ApprovalRequest['diff'],
  ): ApprovalRequest => {
    const request: ApprovalRequest = {
      id: crypto.randomUUID(),
      type, title, description,
      submittedBy: 'You',
      submittedAt: new Date(),
      status: 'pending',
      diff,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };
    setRequests(prev => [request, ...prev]);
    return request;
  }, []);

  const approve = useCallback((requestId: string, note?: string) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? {
        ...r,
        status: 'approved' as const,
        reviewedBy: 'Reviewer',
        reviewedAt: new Date(),
        reviewNote: note,
      } : r
    ));
  }, []);

  const reject = useCallback((requestId: string, note?: string) => {
    setRequests(prev => prev.map(r =>
      r.id === requestId ? {
        ...r,
        status: 'rejected' as const,
        reviewedBy: 'Reviewer',
        reviewedAt: new Date(),
        reviewNote: note,
      } : r
    ));
  }, []);

  const cancelRequest = useCallback((requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }, []);

  const getPending = useCallback(() => {
    return requests.filter(r => r.status === 'pending');
  }, [requests]);

  const isApproved = useCallback((requestId: string) => {
    return requests.find(r => r.id === requestId)?.status === 'approved';
  }, [requests]);

  return {
    requests,
    requireApproval,
    setRequireApproval,
    submitForApproval,
    approve,
    reject,
    cancelRequest,
    getPending,
    isApproved,
    pendingCount: requests.filter(r => r.status === 'pending').length,
  };
}
