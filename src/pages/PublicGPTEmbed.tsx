import { useParams, useSearchParams } from "react-router-dom";
import EmbeddableGPTChat from "@/components/gpt/EmbeddableGPTChat";

const PublicGPTEmbed = () => {
  const { gptId } = useParams();
  const [searchParams] = useSearchParams();
  
  const isEmbed = searchParams.get('embed') === 'true';
  const hideHeader = searchParams.get('hideHeader') === 'true';

  if (!gptId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Invalid GPT ID</p>
      </div>
    );
  }

  return (
    <div className={`${isEmbed ? 'h-screen' : 'min-h-screen'}`}>
      <EmbeddableGPTChat 
        gptId={gptId} 
        isEmbed={isEmbed}
        hideHeader={hideHeader}
      />
    </div>
  );
};

export default PublicGPTEmbed;
