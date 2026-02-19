import { useState, useCallback } from 'react';

export interface GDPRComponent {
  id: string;
  type: 'cookie-banner' | 'privacy-policy' | 'data-export' | 'account-deletion' | 'consent-form';
  name: string;
  code: string;
  generated: boolean;
  lastUpdated: Date;
}

export interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  defaultEnabled: boolean;
}

export function useGDPRCompliance() {
  const [components, setComponents] = useState<GDPRComponent[]>([]);
  const [consentCategories, setConsentCategories] = useState<ConsentCategory[]>([
    { id: 'necessary', name: 'Necessary', description: 'Essential cookies for site functionality', required: true, defaultEnabled: true },
    { id: 'analytics', name: 'Analytics', description: 'Cookies that help us understand usage', required: false, defaultEnabled: false },
    { id: 'marketing', name: 'Marketing', description: 'Cookies for personalized ads', required: false, defaultEnabled: false },
  ]);
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const generateCookieBanner = useCallback((): string => {
    return `export function CookieBanner() {
  const [show, setShow] = useState(!localStorage.getItem('cookie-consent'));
  const [prefs, setPrefs] = useState({ necessary: true, analytics: false, marketing: false });
  if (!show) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t shadow-lg p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <h3 className="font-semibold">Cookie Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">We use cookies to improve your experience.</p>
        <div className="flex gap-4 mt-3">
          ${consentCategories.map(c => `<label className="flex items-center gap-2"><input type="checkbox" ${c.required ? 'checked disabled' : `checked={prefs.${c.id}} onChange={e => setPrefs(p => ({...p, ${c.id}: e.target.checked}))}`} />${c.name}</label>`).join('\n          ')}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => { localStorage.setItem('cookie-consent', JSON.stringify(prefs)); setShow(false); }} className="px-4 py-2 bg-blue-600 text-white rounded">Accept Selected</button>
          <button onClick={() => { const all = { ${consentCategories.map(c => `${c.id}: true`).join(', ')} }; localStorage.setItem('cookie-consent', JSON.stringify(all)); setShow(false); }} className="px-4 py-2 bg-gray-200 rounded">Accept All</button>
        </div>
      </div>
    </div>
  );
}`;
  }, [consentCategories]);

  const generatePrivacyPolicy = useCallback((): string => {
    return `# Privacy Policy

**${companyName || 'Company Name'}**
Last updated: ${new Date().toLocaleDateString()}

## Information We Collect
We collect information you provide directly, including name, email, and usage data.

## How We Use Your Information
- Provide and improve our services
- Send important notifications
- Analyze usage patterns (with consent)

## Your Rights (GDPR)
- **Access**: Request a copy of your data
- **Rectification**: Correct inaccurate data
- **Erasure**: Request deletion of your data
- **Portability**: Export your data
- **Objection**: Object to data processing

## Contact
Email: ${contactEmail || 'privacy@example.com'}

## Cookie Policy
${consentCategories.map(c => `- **${c.name}**: ${c.description}${c.required ? ' (Required)' : ''}`).join('\n')}
`;
  }, [companyName, contactEmail, consentCategories]);

  const generateDataExportEndpoint = useCallback((): string => {
    return `// Edge Function: data-export
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", "")!);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Collect all user data
  const userData = { profile: null, settings: null, activity: null };
  // Add table queries here

  return new Response(JSON.stringify(userData, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=my-data.json" },
  });
});`;
  }, []);

  const generateAccountDeletion = useCallback((): string => {
    return `// Edge Function: account-deletion
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: { user } } = await supabase.auth.getUser(req.headers.get("Authorization")?.replace("Bearer ", "")!);
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Delete user data from all tables
  // await supabase.from('profiles').delete().eq('user_id', user.id);
  // Delete auth user
  await supabase.auth.admin.deleteUser(user.id);

  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});`;
  }, []);

  const generateAll = useCallback(() => {
    const generated: GDPRComponent[] = [
      { id: crypto.randomUUID(), type: 'cookie-banner', name: 'CookieBanner.tsx', code: generateCookieBanner(), generated: true, lastUpdated: new Date() },
      { id: crypto.randomUUID(), type: 'privacy-policy', name: 'privacy-policy.md', code: generatePrivacyPolicy(), generated: true, lastUpdated: new Date() },
      { id: crypto.randomUUID(), type: 'data-export', name: 'data-export/index.ts', code: generateDataExportEndpoint(), generated: true, lastUpdated: new Date() },
      { id: crypto.randomUUID(), type: 'account-deletion', name: 'account-deletion/index.ts', code: generateAccountDeletion(), generated: true, lastUpdated: new Date() },
    ];
    setComponents(generated);
    return generated;
  }, [generateCookieBanner, generatePrivacyPolicy, generateDataExportEndpoint, generateAccountDeletion]);

  return { components, consentCategories, companyName, contactEmail, setCompanyName, setContactEmail, setConsentCategories, generateAll, generateCookieBanner, generatePrivacyPolicy };
}
