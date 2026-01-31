import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, forwardRef } from "react";

interface PremiumCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  variant?: "default" | "glass" | "gradient" | "glow";
  hoverEffect?: "lift" | "glow" | "scale" | "none";
  glowColor?: "cyan" | "purple" | "green" | "orange" | "red";
  className?: string;
}

const glowColorMap = {
  cyan: "hover:shadow-[0_0_30px_hsl(187_85%_53%/0.3)]",
  purple: "hover:shadow-[0_0_30px_hsl(262_83%_58%/0.3)]",
  green: "hover:shadow-[0_0_30px_hsl(142_76%_36%/0.3)]",
  orange: "hover:shadow-[0_0_30px_hsl(25_95%_55%/0.3)]",
  red: "hover:shadow-[0_0_30px_hsl(0_84%_60%/0.3)]",
};

const variantStyles = {
  default: "bg-black/80 border border-cyan-500/20",
  glass: "bg-black/40 backdrop-blur-xl border border-white/10",
  gradient: "bg-gradient-to-br from-black/90 via-cyan-950/20 to-purple-950/20 border border-cyan-500/30",
  glow: "bg-black/80 border border-cyan-500/30 shadow-[0_0_15px_hsl(187_85%_53%/0.15)]",
};

const hoverStyles = {
  lift: "hover:-translate-y-1 hover:shadow-xl",
  glow: "",
  scale: "hover:scale-[1.02]",
  none: "",
};

export const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, variant = "default", hoverEffect = "lift", glowColor = "cyan", className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "rounded-xl p-4 transition-all duration-300",
          variantStyles[variant],
          hoverStyles[hoverEffect],
          hoverEffect === "glow" && glowColorMap[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

// Premium Stat Card with animated value
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  color?: "cyan" | "purple" | "green" | "orange" | "red" | "yellow";
  className?: string;
}

const colorStyles = {
  cyan: {
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    trendUp: "text-cyan-400",
  },
  purple: {
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    trendUp: "text-purple-400",
  },
  green: {
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    trendUp: "text-green-400",
  },
  orange: {
    iconBg: "bg-orange-500/20",
    iconColor: "text-orange-400",
    trendUp: "text-orange-400",
  },
  red: {
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    trendUp: "text-red-400",
  },
  yellow: {
    iconBg: "bg-yellow-500/20",
    iconColor: "text-yellow-400",
    trendUp: "text-yellow-400",
  },
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "cyan",
  className,
}: StatCardProps) => {
  const colors = colorStyles[color];

  return (
    <PremiumCard variant="glass" hoverEffect="glow" glowColor={color === "yellow" ? "cyan" : color} className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-white"
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs font-medium", {
              "text-green-400": trend.direction === "up",
              "text-red-400": trend.direction === "down",
              "text-white/50": trend.direction === "neutral",
            })}>
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.value}%
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl", colors.iconBg)}>
          <Icon className={cn("h-5 w-5", colors.iconColor)} />
        </div>
      </div>
    </PremiumCard>
  );
};

// Module Card with gradient accent
interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  onClick?: () => void;
  badge?: string;
  className?: string;
}

export const ModuleCard = ({
  title,
  description,
  icon: Icon,
  gradient,
  onClick,
  badge,
  className,
}: ModuleCardProps) => {
  return (
    <PremiumCard
      variant="gradient"
      hoverEffect="lift"
      className={cn("cursor-pointer group relative overflow-hidden", className)}
      onClick={onClick}
    >
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-green-500 text-white rounded-full"
        >
          {badge}
        </motion.span>
      )}
      
      <div className="relative z-10">
        <div className={cn("inline-flex p-3 rounded-xl bg-gradient-to-br mb-3", gradient)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        
        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-white/60 line-clamp-2">{description}</p>
      </div>
      
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </PremiumCard>
  );
};

// Section Header with gradient text
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeader = ({ title, subtitle, badge, action, className }: SectionHeaderProps) => {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-3">
        <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  );
};
