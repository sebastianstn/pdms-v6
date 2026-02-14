import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border-2 border-sky-300/90 bg-[var(--card-bg)] shadow-md ring-2 ring-sky-200/70 transition-colors dark:border-sky-700/80 dark:ring-sky-800/60",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-6 pb-0", className)} {...props}>
            {children}
        </div>
    );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("p-6", className)} {...props}>
            {children}
        </div>
    );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3 className={cn("font-semibold text-slate-900", className)} {...props}>
            {children}
        </h3>
    );
}
