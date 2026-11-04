import { cn } from "@/lib/utils";

export function ShimmerButton({
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "relative overflow-hidden px-6 py-3 rounded-3xl font-medium",
        "bg-cyan-800 text-primary-foreground",
        "hover:shadow-lg transition-shadow duration-300",
        "group",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div
        className={cn(
          "absolute inset-0 -translate-x-full",
          "bg-linear-to-r from-transparent via-white/30 to-transparent",
          "group-hover:translate-x-full transition-transform duration-700"
        )}
      />
    </button>
  );
}
