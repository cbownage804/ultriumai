import RaySkillsPanel from '@/components/ray/RaySkillsPanel';

export default function RaySkills() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Ray</h1>
        <p className="text-sm text-muted-foreground">
          One conversation. Ray decides which skill to invoke behind the scenes —
          you just ask.
        </p>
      </div>
      <RaySkillsPanel />
    </div>
  );
}
