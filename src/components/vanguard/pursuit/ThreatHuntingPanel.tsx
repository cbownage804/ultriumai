import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crosshair, Search, Play, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Hunt {
  id: string;
  name: string;
  query: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  matches: number;
  created_at: string;
}

const sampleHunts: Hunt[] = [
  {
    id: "1",
    name: "Encoded PowerShell Detection",
    query: "process.command_line contains '-enc' OR process.command_line contains '-EncodedCommand'",
    type: "behavioral",
    status: "completed",
    matches: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Suspicious Registry Persistence",
    query: "registry.path contains 'CurrentVersion\\Run' AND registry.action = 'created'",
    type: "persistence",
    status: "running",
    matches: 0,
    created_at: new Date().toISOString(),
  },
];

export function ThreatHuntingPanel() {
  const [hunts, setHunts] = useState<Hunt[]>(sampleHunts);
  const [huntName, setHuntName] = useState("");
  const [huntQuery, setHuntQuery] = useState("");
  const [huntType, setHuntType] = useState("behavioral");

  const startHunt = () => {
    if (!huntName || !huntQuery) {
      toast.error("Please provide hunt name and query");
      return;
    }

    const newHunt: Hunt = {
      id: Date.now().toString(),
      name: huntName,
      query: huntQuery,
      type: huntType,
      status: "running",
      matches: 0,
      created_at: new Date().toISOString(),
    };

    setHunts([newHunt, ...hunts]);
    setHuntName("");
    setHuntQuery("");
    toast.success("Threat hunt started");

    // Simulate hunt completion
    setTimeout(() => {
      setHunts(prev => prev.map(h => 
        h.id === newHunt.id 
          ? { ...h, status: "completed", matches: Math.floor(Math.random() * 10) }
          : h
      ));
    }, 5000);
  };

  return (
    <div className="space-y-4">
      {/* New Hunt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Create Threat Hunt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Hunt name"
              value={huntName}
              onChange={(e) => setHuntName(e.target.value)}
            />
            <Select value={huntType} onValueChange={setHuntType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="persistence">Persistence</SelectItem>
                <SelectItem value="lateral_movement">Lateral Movement</SelectItem>
                <SelectItem value="exfiltration">Data Exfiltration</SelectItem>
                <SelectItem value="c2">C2 Communication</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Enter hunt query (e.g., process.name = 'powershell.exe' AND process.command_line contains '-enc')"
            value={huntQuery}
            onChange={(e) => setHuntQuery(e.target.value)}
            rows={3}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={startHunt} className="gap-2">
              <Play className="h-4 w-4" />
              Start Hunt
            </Button>
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Preview Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hunt Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Hunt Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: "LOLBins Usage", query: "process.name in ('certutil.exe', 'bitsadmin.exe', 'mshta.exe')" },
              { name: "Suspicious Downloads", query: "network.destination_port = 443 AND file.created = true" },
              { name: "Credential Access", query: "process.name = 'mimikatz.exe' OR file.path contains 'lsass'" },
              { name: "Scheduled Task Creation", query: "process.name = 'schtasks.exe' AND process.command_line contains '/create'" },
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setHuntName(template.name);
                  setHuntQuery(template.query);
                }}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Hunts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hunt History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {hunts.map((hunt) => (
                <div
                  key={hunt.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{hunt.name}</span>
                        <Badge variant="outline">{hunt.type}</Badge>
                        {hunt.status === "running" && (
                          <Badge className="bg-yellow-500">
                            <Clock className="h-3 w-3 mr-1 animate-spin" />
                            Running
                          </Badge>
                        )}
                        {hunt.status === "completed" && (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {hunt.status === "failed" && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                      <code className="text-xs text-muted-foreground mt-1 block font-mono">
                        {hunt.query}
                      </code>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{hunt.matches}</div>
                      <div className="text-xs text-muted-foreground">matches</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
