import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PremiumCard } from "./PremiumCard";

// Chart color schemes
const chartColors = {
  cyan: ["#06b6d4", "#0891b2", "#0e7490"],
  purple: ["#a855f7", "#9333ea", "#7e22ce"],
  green: ["#22c55e", "#16a34a", "#15803d"],
  orange: ["#f97316", "#ea580c", "#c2410c"],
  red: ["#ef4444", "#dc2626", "#b91c1c"],
  blue: ["#3b82f6", "#2563eb", "#1d4ed8"],
  gradient: ["#06b6d4", "#8b5cf6", "#ec4899"],
};

const severityColors = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  info: "#3b82f6",
};

// Custom tooltip for dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-white/70 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Trend Area Chart
interface TrendChartProps {
  data: { date: string; value: number; [key: string]: any }[];
  dataKey?: string;
  color?: keyof typeof chartColors;
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  gradient?: boolean;
  className?: string;
}

export const TrendAreaChart = ({
  data,
  dataKey = "value",
  color = "cyan",
  height = 200,
  showGrid = true,
  showAxis = true,
  gradient = true,
  className,
}: TrendChartProps) => {
  const colors = chartColors[color];
  const gradientId = `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          {gradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />}
          {showAxis && (
            <>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={colors[0]}
            strokeWidth={2}
            fill={gradient ? `url(#${gradientId})` : colors[0]}
            fillOpacity={gradient ? 1 : 0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Multi-line Comparison Chart
interface MultiLineChartProps {
  data: any[];
  lines: { key: string; color: string; name: string }[];
  height?: number;
  className?: string;
}

export const MultiLineChart = ({ data, lines, height = 250, className }: MultiLineChartProps) => {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "10px" }}
            formatter={(value) => <span className="text-white/70 text-xs">{value}</span>}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={false}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Bar Chart for Comparisons
interface ComparisonBarChartProps {
  data: { name: string; value: number; [key: string]: any }[];
  color?: keyof typeof chartColors;
  horizontal?: boolean;
  height?: number;
  className?: string;
}

export const ComparisonBarChart = ({
  data,
  color = "cyan",
  horizontal = false,
  height = 200,
  className,
}: ComparisonBarChartProps) => {
  const colors = chartColors[color];
  const gradientId = `bar-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 5, right: 5, left: horizontal ? 80 : 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }} axisLine={false} tickLine={false} />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Donut/Pie Chart for Distribution
interface DistributionChartProps {
  data: { name: string; value: number; color?: string }[];
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export const DistributionChart = ({
  data,
  innerRadius = 50,
  outerRadius = 80,
  height = 200,
  showLabels = true,
  className,
}: DistributionChartProps) => {
  const defaultColors = Object.values(severityColors);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : undefined}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// KPI Widget with Sparkline
interface KPIWidgetProps {
  title: string;
  value: string | number;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  sparklineData?: number[];
  color?: keyof typeof chartColors;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export const KPIWidget = ({
  title,
  value,
  trend,
  sparklineData,
  color = "cyan",
  icon,
  subtitle,
  className,
}: KPIWidgetProps) => {
  const colors = chartColors[color];

  return (
    <PremiumCard variant="glass" hoverEffect="glow" className={cn("relative overflow-hidden", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-1 z-10">
          <p className="text-xs font-medium text-white/60 uppercase tracking-wider">{title}</p>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
              {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
              {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
              {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
              {trend.value}%
            </div>
          )}
        </div>
        {icon && <div className="text-white/30">{icon}</div>}
      </div>

      {/* Mini sparkline in background */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((v, i) => ({ i, v }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`sparkline-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={colors[0]} fill={`url(#sparkline-${title})`} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </PremiumCard>
  );
};

// Progress Ring for Goals/Targets
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ProgressRing = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "#06b6d4",
  label,
  sublabel,
  className,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold text-white"
          >
            {Math.round(percentage)}%
          </motion.span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-white mt-2">{label}</p>}
      {sublabel && <p className="text-xs text-white/50">{sublabel}</p>}
    </div>
  );
};
