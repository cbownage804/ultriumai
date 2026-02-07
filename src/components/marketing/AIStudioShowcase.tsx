import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bot, Code2, Zap, Layers, Sparkles, CheckCircle } from "lucide-react";
import aiStudioLogo from "@/assets/ultrium-gpt-logo.png";
import { motion } from "framer-motion";

const features = [
  { icon: Bot, label: "Custom GPT Builder", desc: "No-code AI assistants trained on your data" },
  { icon: Code2, label: "AI App Builder", desc: "Full-stack IDE with live preview & deploy" },
  { icon: Zap, label: "AI Agents", desc: "Autonomous workflows triggered by events" },
  { icon: Layers, label: "22+ Integrations", desc: "Pre-built actions for Slack, security & more" },
];

export const AIStudioShowcase = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px] -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-6">
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              <Sparkles className="h-3 w-3 mr-1" /> Featured Product
            </Badge>
            
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-black p-2 border border-violet-500/20 shadow-lg shadow-violet-500/20">
                <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold">AI Studio™</h2>
                <p className="text-muted-foreground">The Complete AI Platform</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">
              Build custom GPTs, full-stack web apps, and automated AI workflows — all from one platform with enterprise governance and one-click deployment.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{f.label}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-lg shadow-violet-500/20" asChild>
                <Link to="/ai-studio-platform">
                  Explore AI Studio <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="border-violet-500/30 hover:bg-violet-500/10" asChild>
                <Link to="/ai-studio">Try It Free</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Free tier</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> No credit card</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> White-label ready</span>
            </div>
          </div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-card to-card/50 p-6 shadow-2xl shadow-violet-500/10">
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="text-xs text-muted-foreground ml-2">AI Studio Dashboard</span>
              </div>

              {/* Mock dashboard */}
              <div className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "GPTs Active", value: "12" },
                    { label: "Credits Left", value: "8,450" },
                    { label: "Apps Deployed", value: "3" },
                  ].map(s => (
                    <div key={s.label} className="rounded-lg bg-muted/50 p-3 text-center">
                      <div className="text-lg font-bold text-foreground">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Recent Activity</div>
                  {[
                    { action: "GPT deployed", name: "Support Bot v3", time: "2m ago", color: "text-emerald-400" },
                    { action: "App published", name: "Client Dashboard", time: "1h ago", color: "text-cyan-400" },
                    { action: "Agent triggered", name: "Ticket Router", time: "3h ago", color: "text-violet-400" },
                  ].map(a => (
                    <div key={a.name} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.color.replace('text-', 'bg-')}`} />
                        <span className="text-foreground/70">{a.action}:</span>
                        <span className="text-foreground font-medium">{a.name}</span>
                      </div>
                      <span className="text-muted-foreground">{a.time}</span>
                    </div>
                  ))}
                </div>

                {/* CTA in mock */}
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg bg-violet-500/10 border border-violet-500/20 p-2.5 text-center text-xs text-violet-300 font-medium cursor-pointer hover:bg-violet-500/20 transition-colors">
                    + New GPT
                  </div>
                  <div className="flex-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2.5 text-center text-xs text-cyan-300 font-medium cursor-pointer hover:bg-cyan-500/20 transition-colors">
                    + New App
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-3 -right-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
              ✨ AI-Powered
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
