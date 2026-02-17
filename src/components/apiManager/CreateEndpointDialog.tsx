import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useApiEndpoints } from "@/hooks/useApiEndpoints";

const COMMON_TABLES = [
  "custom_gpts", "gpt_conversations", "gpt_messages", "tickets",
  "helpdesk_tickets", "assets", "rmm_customers", "msp_clients",
  "leads", "invoices", "password_entries",
];

const METHODS = ["GET", "POST", "PUT", "DELETE"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEndpointDialog({ open, onOpenChange }: Props) {
  const { createEndpoint } = useApiEndpoints();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePath, setBasePath] = useState("");
  const [sourceTable, setSourceTable] = useState("");
  const [customTable, setCustomTable] = useState("");
  const [methods, setMethods] = useState<string[]>(["GET"]);
  const [requiresAuth, setRequiresAuth] = useState(true);
  const [rateLimitRpm, setRateLimitRpm] = useState(60);

  const effectiveTable = sourceTable === "__custom" ? customTable : sourceTable;

  const handleSubmit = () => {
    if (!name.trim() || !effectiveTable || !basePath.trim()) return;

    const path = basePath.startsWith("/") ? basePath : `/${basePath}`;

    createEndpoint.mutate(
      {
        name: name.trim(),
        description: description.trim() || null,
        base_path: path.toLowerCase().replace(/[^a-z0-9\-\/]/g, ""),
        source_table: effectiveTable,
        allowed_methods: methods,
        requires_auth: requiresAuth,
        rate_limit_rpm: rateLimitRpm,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setBasePath("");
    setSourceTable("");
    setCustomTable("");
    setMethods(["GET"]);
    setRequiresAuth(true);
    setRateLimitRpm(60);
  };

  const toggleMethod = (method: string) => {
    setMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create API Endpoint</DialogTitle>
          <DialogDescription>
            Expose a database table as a REST API endpoint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Endpoint Name</Label>
            <Input
              placeholder="e.g. Products API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What does this endpoint do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Path</Label>
              <Input
                placeholder="/products"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Source Table</Label>
              <Select value={sourceTable} onValueChange={setSourceTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TABLES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom">Custom table...</SelectItem>
                </SelectContent>
              </Select>
              {sourceTable === "__custom" && (
                <Input
                  placeholder="table_name"
                  value={customTable}
                  onChange={(e) => setCustomTable(e.target.value)}
                  className="mt-2"
                  maxLength={63}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allowed Methods</Label>
            <div className="flex gap-3">
              {METHODS.map((m) => (
                <label key={m} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={methods.includes(m)}
                    onCheckedChange={() => toggleMethod(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Authentication</Label>
              <p className="text-xs text-muted-foreground">API key required for access</p>
            </div>
            <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} />
          </div>

          <div className="space-y-2">
            <Label>Rate Limit (requests/minute)</Label>
            <Input
              type="number"
              value={rateLimitRpm}
              onChange={(e) => setRateLimitRpm(Number(e.target.value))}
              min={1}
              max={10000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !effectiveTable || !basePath.trim() || methods.length === 0 || createEndpoint.isPending}
          >
            {createEndpoint.isPending ? "Creating..." : "Create Endpoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
