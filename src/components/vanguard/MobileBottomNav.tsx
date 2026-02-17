import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Shield, Ticket, Monitor, Bell, 
  MoreHorizontal, X, Search, BookOpen, BarChart3,
  Settings, Target, Sparkles, ClipboardCheck
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getVanguardBasePath } from '@/utils/subdomain';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomNav() {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();
  const basePath = getVanguardBasePath();

  const primaryItems = [
    { title: 'Dashboard', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
    { title: 'Tickets', path: `${basePath}/tickets`, icon: Ticket },
    { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
    { title: 'More', path: '', icon: MoreHorizontal, isMore: true },
  ];

  const moreItems = [
    { title: 'Security', path: `${basePath}/soc`, icon: Shield },
    { title: 'Pentest', path: `${basePath}/pentest`, icon: Target },
    { title: 'Reports', path: `${basePath}/reports`, icon: BarChart3 },
    { title: 'Atlas', path: `${basePath}/atlas`, icon: BookOpen },
    { title: 'Cortex AI', path: `${basePath}/cortex`, icon: Sparkles },
    { title: 'Comply', path: `${basePath}/comply`, icon: ClipboardCheck },
    { title: 'RMM', path: `${basePath}/rmm`, icon: Monitor },
    { title: 'Settings', path: `${basePath}/admin`, icon: Settings },
  ];

  const isActive = (path: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isMoreActive = moreItems.some(item => isActive(item.path));

  return (
    <>
      {/* More panel overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[59] md:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+3.5rem)] left-0 right-0 z-[60] md:hidden"
            >
              <div className="mx-3 mb-2 bg-[#0a0f14] border border-cyan-500/20 rounded-2xl p-4 shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">More Modules</h3>
                  <button
                    onClick={() => setShowMore(false)}
                    className="h-7 w-7 rounded-full bg-white/5 flex items-center justify-center text-slate-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {moreItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all min-h-[4rem]",
                        isActive(item.path)
                          ? "bg-cyan-500/15 text-cyan-400"
                          : "text-slate-400 hover:bg-white/5 active:bg-white/10"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium leading-tight text-center">{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[58] md:hidden bg-black/95 backdrop-blur-xl border-t border-cyan-500/20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-14 px-1">
          {primaryItems.map((item) => {
            if (item.isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setShowMore(!showMore)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[3rem] transition-colors",
                    showMore || isMoreActive
                      ? "text-cyan-400"
                      : "text-slate-500 active:text-slate-300"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.title}</span>
                </button>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[3rem] transition-colors",
                  isActive(item.path)
                    ? "text-cyan-400"
                    : "text-slate-500 active:text-slate-300"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive(item.path) && "drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                )} />
                <span className="text-[10px] font-medium">{item.title}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
