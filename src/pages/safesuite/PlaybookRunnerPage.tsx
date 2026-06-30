/**
 * Playbook runner page — Ray walks the user through a single playbook.
 */
import { useParams } from 'react-router-dom';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PlaybookRunner } from '@/components/ray/PlaybookRunner';

export default function PlaybookRunnerPage() {
  const { runId } = useParams<{ runId: string }>();

  return (
    <div className="flex flex-col gap-6">
      <RayPageHeader
        title="Working with Ray"
        subtitle="One step at a time"
        description="I'll stay with you until we're finished. Take each step at your pace — I'm not going anywhere."
      />
      {runId ? <PlaybookRunner runId={runId} /> : null}
    </div>
  );
}
