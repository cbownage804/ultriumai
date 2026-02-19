import { useState, useCallback } from 'react';

export interface WebhookConfig {
  id: string;
  name: string;
  triggerTable: string;
  triggerEvent: 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  targetUrl: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  payloadTemplate?: string;
  isActive: boolean;
  retryCount: number;
  createdAt: Date;
}

export interface WebhookTestResult {
  webhookId: string;
  success: boolean;
  statusCode: number;
  responseBody: string;
  duration: number;
  timestamp: Date;
}

export function useWebhookBuilder() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [testResults, setTestResults] = useState<WebhookTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addWebhook = useCallback((name: string, triggerTable: string, targetUrl: string): WebhookConfig => {
    const webhook: WebhookConfig = {
      id: crypto.randomUUID(),
      name,
      triggerTable,
      triggerEvent: 'INSERT',
      targetUrl,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      isActive: true,
      retryCount: 3,
      createdAt: new Date(),
    };
    setWebhooks(prev => [...prev, webhook]);
    return webhook;
  }, []);

  const updateWebhook = useCallback((id: string, updates: Partial<WebhookConfig>) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const removeWebhook = useCallback((id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  }, []);

  const toggleWebhook = useCallback((id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
  }, []);

  const testWebhook = useCallback(async (id: string) => {
    const webhook = webhooks.find(w => w.id === id);
    if (!webhook) return;

    setIsTesting(true);
    const start = performance.now();
    const mockPayload = {
      event: webhook.triggerEvent,
      table: webhook.triggerTable,
      record: { id: crypto.randomUUID(), created_at: new Date().toISOString() },
      old_record: null,
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch(webhook.targetUrl, {
        method: webhook.method,
        headers: webhook.headers,
        body: webhook.payloadTemplate
          ? webhook.payloadTemplate.replace('{{payload}}', JSON.stringify(mockPayload))
          : JSON.stringify(mockPayload),
      });
      const body = await res.text();
      const result: WebhookTestResult = {
        webhookId: id,
        success: res.ok,
        statusCode: res.status,
        responseBody: body.slice(0, 1000),
        duration: Math.round(performance.now() - start),
        timestamp: new Date(),
      };
      setTestResults(prev => [result, ...prev].slice(0, 20));
    } catch (err) {
      setTestResults(prev => [{
        webhookId: id,
        success: false,
        statusCode: 0,
        responseBody: err instanceof Error ? err.message : String(err),
        duration: Math.round(performance.now() - start),
        timestamp: new Date(),
      }, ...prev].slice(0, 20));
    } finally {
      setIsTesting(false);
    }
  }, [webhooks]);

  const exportAsSQL = useCallback((webhook: WebhookConfig): string => {
    return `-- Webhook: ${webhook.name}\n-- Trigger: ${webhook.triggerEvent} on ${webhook.triggerTable}\n-- Target: ${webhook.targetUrl}\n-- Note: Implement via Supabase Database Webhooks or pg_net extension\n\nCREATE OR REPLACE FUNCTION notify_${webhook.name.replace(/\s+/g, '_').toLowerCase()}()\nRETURNS TRIGGER AS $$\nBEGIN\n  PERFORM net.http_post(\n    url := '${webhook.targetUrl}',\n    headers := '{"Content-Type": "application/json"}'::jsonb,\n    body := jsonb_build_object('event', TG_OP, 'table', TG_TABLE_NAME, 'record', row_to_json(NEW))\n  );\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql;\n\nCREATE TRIGGER ${webhook.name.replace(/\s+/g, '_').toLowerCase()}_trigger\nAFTER ${webhook.triggerEvent === 'ALL' ? 'INSERT OR UPDATE OR DELETE' : webhook.triggerEvent}\nON ${webhook.triggerTable}\nFOR EACH ROW\nEXECUTE FUNCTION notify_${webhook.name.replace(/\s+/g, '_').toLowerCase()}();`;
  }, []);

  return {
    webhooks, testResults, isTesting,
    addWebhook, updateWebhook, removeWebhook, toggleWebhook,
    testWebhook, exportAsSQL,
    activeCount: webhooks.filter(w => w.isActive).length,
  };
}
