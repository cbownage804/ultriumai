import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Shield } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: ReactNode;
  status?: ReactNode;
  className?: string;
}

export const HeroSection = ({
  title,
  subtitle,
  icon: Icon = Shield,
  children,
  status,
  className,
}: HeroSectionProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-500/20",
        "bg-gradient-to-br from-black via-cyan-950/10 to-purple-950/10",
        className
      )}
    >
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl"
        />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Animated icon container */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl blur-md opacity-50" />
              <div className="relative p-3 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl">
                <Icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-white"
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm md:text-base text-white/60"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {status}
            </motion.div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

// Status indicator component for Hero
interface StatusIndicatorProps {
  online: number;
  total: number;
  label?: string;
}

export const StatusIndicator = ({ online, total, label = "Devices" }: StatusIndicatorProps) => {
  const percentage = total > 0 ? Math.round((online / total) * 100) : 0;
  
  return (
    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border border-cyan-500/20 rounded-xl px-4 py-2">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-500/30 rounded-full blur-sm"
        />
        <div className={cn(
          "relative w-3 h-3 rounded-full",
          online > 0 ? "bg-green-500" : "bg-red-500"
        )} />
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          {online} / {total} <span className="text-white/60 font-normal">{label}</span>
        </p>
        <p className="text-xs text-white/50">{percentage}% Online</p>
      </div>
    </div>
  );
};
