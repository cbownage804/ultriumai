import { useParams, useSearchParams } from 'react-router-dom';
import { GPTBuilderWorkspace } from '@/components/gpt-builder/GPTBuilderWorkspace';

export default function GPTBuilderPage() {
  const { gptId } = useParams<{ gptId?: string }>();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template') || undefined;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
      <GPTBuilderWorkspace editGptId={gptId} templateId={templateId} />
    </div>
  );
}
