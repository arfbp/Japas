import { cn } from "@/lib/utils";

interface StoreStatusProps {
  isOpen?: boolean;
  className?: string;
}

export function StoreStatus({ isOpen = true, className }: StoreStatusProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border uppercase tracking-wider",
        isOpen
          ? "bg-green-50/80 border-green-200/50 text-green-700"
          : "bg-red-50/80 border-red-200/50 text-red-700",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            isOpen ? "bg-green-500" : "bg-red-500"
          )}
        ></span>
      </span>
      {isOpen ? "Toko Buka Hari Ini" : "Toko Tutup"}
    </div>
  );
}
