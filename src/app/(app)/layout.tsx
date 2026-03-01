"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Hide bottom nav on onboarding
  const isOnboarding = pathname?.startsWith("/onboarding");

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Main content */}
      <main className={cn("flex-1", !isOnboarding && "pb-20")}>
        {children}
      </main>

      {/* Bottom navigation - hidden during onboarding */}
      {!isOnboarding && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-around py-2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-xs transition-colors",
                    isActive
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isActive && "text-gray-900"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn(isActive && "font-medium")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Safe area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}
