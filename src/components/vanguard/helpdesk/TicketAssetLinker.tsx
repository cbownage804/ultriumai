/**
 * Asset-Ticket Linker - Link assets/devices to tickets
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Monitor, 
  Plus, 
  X, 
  Search,
  HardDrive,
  Laptop,
  Server,
  Printer,
  Smartphone,
  Link2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  asset_tag: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  status: string | null;
}

interface LinkedAsset extends Asset {
  link_notes?: string;
}

interface TicketAssetLinkerProps {
  ticketId: string;
}

export const TicketAssetLinker = ({ ticketId }: TicketAssetLinkerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchLinkedAssets();
    fetchAvailableAssets();
  }, [ticketId, user?.id]);

  const fetchLinkedAssets = async () => {
    const { data, error } = await (supabase as any)
      .from('vanguard_ticket_assets')
      .select(`
        id,
        link_notes,
        asset:assets(id, name, asset_tag, serial_number, manufacturer, model, status)
      `)
      .eq('ticket_id', ticketId);

    if (data) {
      const assets = data
        .filter((item: any) => item.asset)
        .map((item: any) => ({
          ...item.asset,
          link_notes: item.link_notes
        }));
      setLinkedAssets(assets);
    }
    setLoading(false);
  };

  const fetchAvailableAssets = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('assets')
      .select('id, name, asset_tag, serial_number, manufacturer, model, status')
      .eq('user_id', user.id)
      .limit(100);

    if (data) setAvailableAssets(data);
  };

  const handleLinkAsset = async (assetId: string) => {
    if (!user?.id) return;

    const { error } = await (supabase as any)
      .from('vanguard_ticket_assets')
      .insert({
        ticket_id: ticketId,
        asset_id: assetId,
        linked_by: user.id
      });

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already Linked", description: "This asset is already linked to this ticket." });
      } else {
        toast({ title: "Error", description: "Failed to link asset.", variant: "destructive" });
      }
    } else {
      toast({ title: "Asset Linked", description: "Asset has been linked to this ticket." });
      fetchLinkedAssets();
      setDialogOpen(false);
    }
  };

  const handleUnlinkAsset = async (assetId: string) => {
    const { error } = await (supabase as any)
      .from('vanguard_ticket_assets')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('asset_id', assetId);

    if (error) {
      toast({ title: "Error", description: "Failed to unlink asset.", variant: "destructive" });
    } else {
      toast({ title: "Asset Unlinked", description: "Asset has been removed from this ticket." });
      fetchLinkedAssets();
    }
  };

  const getAssetIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('laptop')) return <Laptop className="h-4 w-4" />;
    if (lower.includes('server')) return <Server className="h-4 w-4" />;
    if (lower.includes('printer')) return <Printer className="h-4 w-4" />;
    if (lower.includes('phone') || lower.includes('mobile')) return <Smartphone className="h-4 w-4" />;
    if (lower.includes('drive') || lower.includes('storage')) return <HardDrive className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const filteredAssets = availableAssets.filter(asset => 
    !linkedAssets.some(la => la.id === asset.id) &&
    (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     asset.asset_tag?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Link2 className="h-5 w-5 text-purple-400" />
            Linked Assets
            {linkedAssets.length > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400">{linkedAssets.length}</Badge>
            )}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Link Asset to Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search assets..."
                    className="pl-9 bg-white/5 border-white/10"
                  />
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {filteredAssets.length === 0 ? (
                      <div className="text-center py-8 text-white/60">
                        <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No assets found</p>
                      </div>
                    ) : (
                      filteredAssets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 cursor-pointer"
                          onClick={() => handleLinkAsset(asset.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                              {getAssetIcon(asset.name)}
                            </div>
                            <div>
                              <p className="text-white font-medium">{asset.name}</p>
                              <p className="text-xs text-white/60">
                                {asset.asset_tag && `Tag: ${asset.asset_tag}`}
                                {asset.serial_number && ` • S/N: ${asset.serial_number}`}
                              </p>
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-white/40" />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-white/60">Loading...</div>
        ) : linkedAssets.length === 0 ? (
          <div className="text-center py-6 text-white/60">
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets linked</p>
            <p className="text-xs">Click + to link an asset</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedAssets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                    {getAssetIcon(asset.name)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{asset.name}</p>
                    <p className="text-xs text-white/60">
                      {asset.manufacturer} {asset.model}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-white/40 hover:text-red-400"
                  onClick={() => handleUnlinkAsset(asset.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketAssetLinker;
