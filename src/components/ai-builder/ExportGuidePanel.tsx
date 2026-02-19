import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Download, Container, Rocket, Github, Globe, Server, Database, Shield, FolderOpen, Zap } from 'lucide-react';

interface ExportGuidePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ExportGuidePanel({ open, onClose }: ExportGuidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[420px] sm:w-[480px] bg-background border-border p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Download className="h-5 w-5 text-primary" />
            Export & Deployment Guide
          </SheetTitle>
          <SheetDescription>
            How to take your project from builder to production
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-6 space-y-8 text-sm">

            {/* Export Modes */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                Export Modes
              </h3>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Full-Stack</Badge>
                    <span className="text-xs text-muted-foreground">Recommended</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete React + Vite project with Supabase client, Stripe helpers, env config, database schema with RLS policies, Docker setup, edge functions, and a comprehensive README.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <Badge variant="outline" className="text-xs">Docker-Ready</Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    React + Vite scaffolding with Dockerfile and nginx config. Good for quick containerized deployments without backend integrations.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3 space-y-1.5">
                  <Badge variant="outline" className="text-xs">Raw ZIP</Badge>
                  <p className="text-muted-foreground leading-relaxed">
                    Just your project source files. No scaffolding, no build tools. Use when you want to integrate into an existing project.
                  </p>
                </div>
              </div>
            </section>

            {/* Full-Stack Export Contents */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">What's in the Full-Stack Export?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Database className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">supabase/schema.sql</strong> — Auto-detected table schemas with RLS policies and triggers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">.env + .env.example</strong> — Pre-filled secrets + documented placeholders for all integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <FolderOpen className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">src/lib/supabase.js</strong> — Ready-to-use Supabase client with env-based config</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">supabase/functions/</strong> — Edge function source code bundled for <code>supabase functions deploy</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <Container className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">Dockerfile + nginx.conf</strong> — Production-ready multi-stage Docker build</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span><strong className="text-foreground">supabase/config.toml</strong> — Supabase CLI config for local development</span>
                </li>
              </ul>
            </section>

            {/* Supabase Setup */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                Supabase Setup
              </h3>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li>Create a project at <strong className="text-foreground">supabase.com/dashboard</strong></li>
                <li>Copy your <strong className="text-foreground">Project URL</strong> and <strong className="text-foreground">anon key</strong> from Settings → API</li>
                <li>Paste them into your <code>.env</code> file</li>
                <li>Open the <strong className="text-foreground">SQL Editor</strong> and run the contents of <code>supabase/schema.sql</code></li>
                <li>Verify tables in the Table Editor</li>
                <li>Configure auth providers in Authentication → Providers if needed</li>
              </ol>
            </section>

            {/* Docker Deployment */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Container className="h-4 w-4 text-blue-400" />
                Docker Deployment
              </h3>
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Build the image</p>
                <p className="text-foreground">docker build -t my-app .</p>
                <p className="text-muted-foreground mt-2"># Run the container</p>
                <p className="text-foreground">docker run -p 8080:80 my-app</p>
                <p className="text-muted-foreground mt-2"># With environment variables</p>
                <p className="text-foreground">docker run -p 8080:80 --env-file .env my-app</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The Dockerfile uses a <strong className="text-foreground">multi-stage build</strong>: Node.js builds the Vite app, then nginx serves the static output. This keeps the final image minimal (~25 MB).
              </p>
            </section>

            {/* Platform Configs */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Server className="h-4 w-4 text-violet-400" />
                Included Platform Configs
              </h3>
              <p className="text-muted-foreground text-xs">
                Full-Stack exports now include ready-to-use configs for all major platforms:
              </p>

              <div className="space-y-2 text-muted-foreground">
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Rocket className="h-3.5 w-3.5 text-primary" /> Vercel
                  </p>
                  <p className="mt-1 text-xs"><code>vercel.json</code> included — push to GitHub, connect to Vercel, and deploy. SPA rewrites are pre-configured.</p>
                  <div className="rounded bg-muted/50 p-2 font-mono text-[11px] mt-1.5">npx vercel --prod</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-emerald-400" /> Netlify
                  </p>
                  <p className="mt-1 text-xs"><code>netlify.toml</code> included — drag & drop the ZIP to Netlify, or connect via Git. Redirects pre-configured for SPA.</p>
                  <div className="rounded bg-muted/50 p-2 font-mono text-[11px] mt-1.5">npx netlify deploy --prod --dir=dist</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Github className="h-3.5 w-3.5" /> GitHub Pages
                  </p>
                  <p className="mt-1 text-xs"><code>.github/workflows/deploy.yml</code> included — push to GitHub and enable Pages in repo Settings. Auto-deploys on push to main.</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Container className="h-3.5 w-3.5 text-blue-400" /> Docker / VPS
                  </p>
                  <p className="mt-1 text-xs"><code>Dockerfile</code> + <code>nginx.conf</code> included — multi-stage build, ~25 MB final image with SPA routing.</p>
                  <div className="rounded bg-muted/50 p-2 font-mono text-[11px] mt-1.5">docker build -t my-app . && docker run -p 8080:80 my-app</div>
                </div>
              </div>
            </section>

            {/* Edge Functions */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400" />
                Edge Functions
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                If your project includes Supabase Edge Functions, they're bundled in <code>supabase/functions/</code>. Deploy them with:
              </p>
              <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
                <p className="text-muted-foreground"># Deploy all functions</p>
                <p className="text-foreground">npx supabase functions deploy</p>
                <p className="text-muted-foreground mt-2"># Deploy a specific function</p>
                <p className="text-foreground">npx supabase functions deploy my-function</p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Set secrets for edge functions via <code>npx supabase secrets set MY_KEY=value</code>.
              </p>
            </section>

            {/* GitHub Integration */}
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Integration
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Use <strong className="text-foreground">Push to GitHub</strong> to create a repo with your project files. From there you can set up CI/CD with any hosting provider, collaborate with a team, or continue development locally.
              </p>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
