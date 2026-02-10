import { GPTBuilderWorkspace } from '@/components/gpt-builder/GPTBuilderWorkspace';

export default function GPTBuilderPage() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]" style={{ height: '100dvh' }}>
      <GPTBuilderWorkspace />
    </div>
  );
}
