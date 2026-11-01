import { ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScannerStepProps {
  step: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  completedValue?: ReactNode;
  children?: ReactNode;
}

export function ScannerStep({
  step,
  title,
  description,
  isActive,
  isCompleted,
  completedValue,
  children,
}: ScannerStepProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 p-4 transition-all",
        isActive && "border-primary bg-primary/5 shadow-lg shadow-primary/10",
        isCompleted && "border-success bg-success/5",
        !isActive && !isCompleted && "border-border bg-card/50 opacity-60"
      )}
    >
      {/* Step Indicator */}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all",
            isActive && "border-primary bg-primary text-primary-foreground",
            isCompleted && "border-success bg-success text-success-foreground",
            !isActive && !isCompleted && "border-muted-foreground text-muted-foreground"
          )}
        >
          {isCompleted ? <Check className="h-5 w-5" /> : step}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-lg",
              isActive && "text-foreground",
              isCompleted && "text-success",
              !isActive && !isCompleted && "text-muted-foreground"
            )}
          >
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Completed Value */}
          {isCompleted && completedValue && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <Check className="h-4 w-4" />
              {completedValue}
            </div>
          )}

          {/* Active Content */}
          {isActive && children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}
