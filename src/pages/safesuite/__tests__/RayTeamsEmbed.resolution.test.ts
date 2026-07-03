import { describe, it, expect } from 'vitest';
import { resolveEmbedOrg } from '../RayTeamsEmbed';

const orgA = { id: 'a', name: 'Org A' };
const orgB = { id: 'b', name: 'Org B' };

describe('resolveEmbedOrg (Teams embed org resolution)', () => {
  it('prefers explicit ?orgId when the user belongs to it', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: 'b',
      tenantLinkedOrg: { id: 'a', name: 'Org A' },
      activeOrg: orgA,
      orgs: [orgA, orgB],
    });
    expect(r).toEqual({ id: 'b', name: 'Org B', source: 'query' });
  });

  it('falls through to tenant link when explicit orgId is not in the user’s org set (guessed id cannot bypass membership)', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: 'not-mine',
      tenantLinkedOrg: { id: 'a', name: 'Org A' },
      activeOrg: null,
      orgs: [orgA],
    });
    expect(r).toEqual({ id: 'a', name: 'Org A', source: 'tenant_link' });
  });

  it('ignores tenant link if the user does not belong to the linked org', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: null,
      tenantLinkedOrg: { id: 'stranger-org', name: 'Not Mine' },
      activeOrg: orgA,
      orgs: [orgA],
    });
    expect(r).toEqual({ id: 'a', name: 'Org A', source: 'active' });
  });

  it('uses active org when no query param or tenant link', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: null,
      tenantLinkedOrg: null,
      activeOrg: orgB,
      orgs: [orgA, orgB],
    });
    expect(r).toEqual({ id: 'b', name: 'Org B', source: 'active' });
  });

  it('returns null (picker/solo) when nothing resolves', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: 'not-mine',
      tenantLinkedOrg: null,
      activeOrg: null,
      orgs: [],
    });
    expect(r).toBeNull();
  });

  it('never resolves to an org the user does not belong to, even with every hint pointing at it', () => {
    const r = resolveEmbedOrg({
      explicitOrgId: 'ghost',
      tenantLinkedOrg: { id: 'ghost', name: 'Ghost Org' },
      activeOrg: null,
      orgs: [orgA],
    });
    // Falls through to active (null) — must NOT return the ghost org.
    expect(r).toBeNull();
  });
});
