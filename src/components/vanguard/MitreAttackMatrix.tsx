import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Shield, AlertTriangle, ExternalLink, Crosshair } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TechniqueMapping {
  id: string;
  tactic_id: string;
  tactic_name: string;
  technique_id: string;
  technique_name: string;
  sub_technique_id?: string;
  sub_technique_name?: string;
  confidence: number;
  evidence: any;
  created_at: string;
}

// MITRE ATT&CK Tactics in kill chain order
const TACTICS = [
  { id: 'TA0043', name: 'Reconnaissance', color: 'bg-slate-500' },
  { id: 'TA0042', name: 'Resource Development', color: 'bg-slate-600' },
  { id: 'TA0001', name: 'Initial Access', color: 'bg-red-600' },
  { id: 'TA0002', name: 'Execution', color: 'bg-red-500' },
  { id: 'TA0003', name: 'Persistence', color: 'bg-orange-600' },
  { id: 'TA0004', name: 'Privilege Escalation', color: 'bg-orange-500' },
  { id: 'TA0005', name: 'Defense Evasion', color: 'bg-yellow-600' },
  { id: 'TA0006', name: 'Credential Access', color: 'bg-yellow-500' },
  { id: 'TA0007', name: 'Discovery', color: 'bg-green-600' },
  { id: 'TA0008', name: 'Lateral Movement', color: 'bg-green-500' },
  { id: 'TA0009', name: 'Collection', color: 'bg-blue-600' },
  { id: 'TA0011', name: 'Command & Control', color: 'bg-blue-500' },
  { id: 'TA0010', name: 'Exfiltration', color: 'bg-purple-600' },
  { id: 'TA0040', name: 'Impact', color: 'bg-purple-500' },
];

export function MitreAttackMatrix() {
  const [mappings, setMappings] = useState<TechniqueMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueMapping | null>(null);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('mitre_attack_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMappings(data || []);
    } catch (err) {
      console.error('Failed to load MITRE mappings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Group mappings by tactic
  const mappingsByTactic = TACTICS.map(tactic => ({
    ...tactic,
    techniques: mappings.filter(m => m.tactic_id === tactic.id),
  }));

  const totalDetections = mappings.length;
  const uniqueTechniques = new Set(mappings.map(m => m.technique_id)).size;
  const tacticsUsed = new Set(mappings.map(m => m.tactic_id)).size;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Detections</p>
                <p className="text-2xl font-bold text-red-500">{totalDetections}</p>
              </div>
              <Target className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Techniques</p>
                <p className="text-2xl font-bold text-orange-500">{uniqueTechniques}</p>
              </div>
              <Crosshair className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tactics Observed</p>
                <p className="text-2xl font-bold text-blue-500">{tacticsUsed}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ATT&CK Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            MITRE ATT&CK Matrix
            <a 
              href="https://attack.mitre.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-auto text-xs text-primary flex items-center gap-1 font-normal"
            >
              View Full Framework <ExternalLink className="h-3 w-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading matrix...</div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-2 min-w-[1200px] pb-4">
                {mappingsByTactic.map((tactic) => (
                  <div key={tactic.id} className="flex-1 min-w-[120px]">
                    {/* Tactic Header */}
                    <div className={`${tactic.color} text-white text-xs font-medium px-2 py-2 rounded-t text-center`}>
                      {tactic.name}
                    </div>
                    
                    {/* Techniques */}
                    <div className="border border-t-0 rounded-b min-h-[200px] p-1 space-y-1 bg-muted/20">
                      {tactic.techniques.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4">
                          <span className="text-xs text-muted-foreground">No detections</span>
                        </div>
                      ) : (
                        tactic.techniques.map((technique) => (
                          <button
                            key={technique.id}
                            onClick={() => setSelectedTechnique(technique)}
                            className={`w-full text-left p-2 rounded text-xs transition-colors ${
                              technique.confidence >= 0.8 
                                ? 'bg-red-500/30 hover:bg-red-500/40 border border-red-500/50' 
                                : technique.confidence >= 0.5
                                ? 'bg-orange-500/30 hover:bg-orange-500/40 border border-orange-500/50'
                                : 'bg-yellow-500/30 hover:bg-yellow-500/40 border border-yellow-500/50'
                            }`}
                          >
                            <div className="font-medium truncate">{technique.technique_id}</div>
                            <div className="text-muted-foreground truncate">{technique.technique_name}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/50" />
              High Confidence (≥80%)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500/50" />
              Medium Confidence (50-79%)
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500/50" />
              Low Confidence (&lt;50%)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technique Detail Dialog */}
      <Dialog open={!!selectedTechnique} onOpenChange={() => setSelectedTechnique(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {selectedTechnique?.technique_id}
            </DialogTitle>
          </DialogHeader>
          {selectedTechnique && (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-medium">{selectedTechnique.technique_name}</p>
                {selectedTechnique.sub_technique_name && (
                  <p className="text-sm text-muted-foreground">
                    Sub-technique: {selectedTechnique.sub_technique_id} - {selectedTechnique.sub_technique_name}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tactic</p>
                  <p className="font-medium">{selectedTechnique.tactic_name}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="font-medium">{Math.round(selectedTechnique.confidence * 100)}%</p>
                </div>
              </div>

              {selectedTechnique.evidence && (
                <div>
                  <p className="text-sm font-medium mb-2">Evidence</p>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedTechnique.evidence, null, 2)}
                  </pre>
                </div>
              )}

              <Button asChild variant="outline" className="w-full">
                <a 
                  href={`https://attack.mitre.org/techniques/${selectedTechnique.technique_id.replace('.', '/')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on MITRE ATT&CK <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
