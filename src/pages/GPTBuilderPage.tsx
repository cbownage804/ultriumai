import { useParams } from 'react-router-dom';
import { GPTBuilderWorkspace } from '@/components/gpt-builder/GPTBuilderWorkspace';

export default function GPTBuilderPage() {
  const { gptId } = useParams<{ gptId?: string }>();

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
      <GPTBuilderWorkspace editGptId={gptId} />
    </div>
  );
}
