"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Newspaper,
  FlaskConical,
  BookCheck,
  FileText,
  Mic,
  Volume2,
  AudioWaveform,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Vendors", href: "/vendors", icon: Building2 },
  {
    name: "Benchmarks",
    icon: BarChart3,
    children: [
      { name: "STT", href: "/benchmarks/stt", icon: Mic },
      { name: "TTS", href: "/benchmarks/tts", icon: Volume2 },
      { name: "V2V", href: "/benchmarks/v2v", icon: AudioWaveform },
    ],
  },
  { name: "News Intelligence", href: "/news", icon: Newspaper },
  { name: "Evaluate", href: "/evaluate", icon: FlaskConical },
  { name: "Standards", href: "/standards", icon: BookCheck },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* NICE Branding */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-sm">
          N
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">NICE MP CoE</p>
          <p className="text-xs text-gray-500">Media Processing</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some((child) =>
              pathname.startsWith(child.href)
            );
            return (
              <div key={item.name}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-500",
                    isGroupActive && "text-gray-700"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </div>
                <div className="ml-4 mt-1 space-y-1 border-l border-gray-100 pl-3">
                  {item.children.map((child) => {
                    const active = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <child.icon className="h-3.5 w-3.5" />
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-400">v0.1.0 · CoE Platform</p>
      </div>
    </aside>
  );
}
