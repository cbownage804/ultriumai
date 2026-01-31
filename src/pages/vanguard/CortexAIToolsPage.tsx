import { useEffect } from 'react';
import { CortexAITools, CortexAIToolsExtended } from '@/components/vanguard/cortex';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2 } from 'lucide-react';

export default function CortexAIToolsPage() {
  useEffect(() => {
    document.title = 'AI Tools | Ultrium Vanguard';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="core" className="w-full">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="core" className="data-[state=active]:bg-purple-500/20">
            <Sparkles className="h-4 w-4 mr-2" />
            Core AI Tools (8)
          </TabsTrigger>
          <TabsTrigger value="extended" className="data-[state=active]:bg-cyan-500/20">
            <Wand2 className="h-4 w-4 mr-2" />
            Extended AI Tools (4)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="core" className="mt-6">
          <CortexAITools />
        </TabsContent>
        
        <TabsContent value="extended" className="mt-6">
          <CortexAIToolsExtended />
        </TabsContent>
      </Tabs>
    </div>
  );
}
