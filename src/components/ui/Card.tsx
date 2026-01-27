import { cn } from "@/lib/utils";

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: keyof typeof paddings;
}

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white shadow-md border border-gray-100",
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
