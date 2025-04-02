import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "primary" | "secondary" | "accent" | "default";
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  action,
  variant = "default",
}: DashboardCardProps) {
  const variantStyles = {
    primary: "bg-[#1976D2]/10 border-l-4 border-[#1976D2]",
    secondary: "bg-[#4CAF50]/10 border-l-4 border-[#4CAF50]",
    accent: "bg-[#FF5722]/10 border-l-4 border-[#FF5722]",
    default: "bg-white",
  };

  const variantTitleColors = {
    primary: "text-[#1976D2]",
    secondary: "text-[#4CAF50]",
    accent: "text-[#FF5722]",
    default: "text-[#2C3E50]",
  };

  const variantButtonStyles = {
    primary: "bg-[#1976D2] hover:bg-[#1976D2]/90",
    secondary: "bg-[#4CAF50] hover:bg-[#4CAF50]/90",
    accent: "bg-[#FF5722] hover:bg-[#FF5722]/90",
    default: "bg-[#1976D2] hover:bg-[#1976D2]/90",
  };

  return (
    <div
      className={cn(
        "card p-6 rounded-md shadow-sm transition-transform hover:translate-y-[-2px] hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <h3
        className={cn(
          "font-medium mb-1 font-['Inter']",
          variantTitleColors[variant]
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[#2C3E50]/70 mb-4 font-['Source Sans Pro']">
          {description}
        </p>
      )}
      
      {children}
      
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            variantButtonStyles[variant],
            "text-white px-4 py-2 rounded-md text-sm font-medium transition-colors mt-4"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ContentCard({
  title,
  subtitle,
  children,
  className,
  action,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div
      className={cn(
        "card p-6 bg-white rounded-md shadow-sm",
        className
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-[#2C3E50] font-['Inter']">
          {title}
        </h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[#1976D2] hover:text-[#1976D2]/80 text-sm font-medium"
          >
            {action.label}
          </button>
        )}
      </div>

      {subtitle && (
        <p className="text-sm text-[#2C3E50]/70 mb-4">{subtitle}</p>
      )}

      {children}
    </div>
  );
}
