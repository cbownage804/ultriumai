import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon, Inbox } from "lucide-react";

export interface EmptyStateProps {
  /** Icon to display - can be a LucideIcon component or ReactNode */
  icon?: LucideIcon | React.ReactNode;
  /** Main title text */
  title: string;
  /** Description text below the title */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable empty state component with icon, title, description, and optional CTAs.
 * Use this for tables, lists, and dashboards when no data is available.
 */
export function EmptyState({
  icon: IconProp,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md"
}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      container: "py-6",
      iconWrapper: "h-10 w-10",
      iconSize: "h-5 w-5",
      title: "text-sm font-medium",
      description: "text-xs",
    },
    md: {
      container: "py-12",
      iconWrapper: "h-14 w-14",
      iconSize: "h-7 w-7",
      title: "text-lg font-semibold",
      description: "text-sm",
    },
    lg: {
      container: "py-16",
      iconWrapper: "h-20 w-20",
      iconSize: "h-10 w-10",
      title: "text-xl font-bold",
      description: "text-base",
    },
  };

  const styles = sizeStyles[size];

  // Render the icon
  const renderIcon = () => {
    if (!IconProp) {
      return <Inbox className={cn(styles.iconSize, "text-muted-foreground")} />;
    }
    
    // Check if it's a Lucide icon component
    if (typeof IconProp === "function") {
      const LucideIconComponent = IconProp as LucideIcon;
      return <LucideIconComponent className={cn(styles.iconSize, "text-muted-foreground")} />;
    }
    
    // It's a ReactNode
    return IconProp;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted mb-4",
          styles.iconWrapper
        )}
      >
        {renderIcon()}
      </div>
      
      <h3 className={cn(styles.title, "text-foreground mb-1")}>{title}</h3>
      
      {description && (
        <p className={cn(styles.description, "text-muted-foreground max-w-sm mb-4")}>
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-2">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
