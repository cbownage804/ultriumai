import RaySkillsPanel from '@/components/ray/RaySkillsPanel';

export default function RaySkills() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Ray Skills</h1>
        <p className="text-sm text-muted-foreground">
          One conversation, many skills. Ray decides which one to invoke — threat, device,
          identity, or your organization's knowledge base.
        </p>
      </div>
      <RaySkillsPanel />
    </div>
  );
}
