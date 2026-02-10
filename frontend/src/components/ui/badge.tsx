import { cn } from "@/lib/utils";

const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: keyof typeof variants;
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}
            {...props}
        >
            {children}
        </span>
    );
}
