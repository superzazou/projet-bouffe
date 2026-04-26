"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/planning", label: "Planning" },
  { href: "/recipes", label: "Recettes" },
];

function NavLinks({ currentPath, onClick }: { currentPath: string; onClick?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = currentPath.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-stone-100 text-stone-900"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-stone-200 bg-white fixed top-0 left-0 h-full">
        <div className="px-4 py-5 border-b border-stone-200">
          <span className="text-base font-semibold tracking-tight text-stone-900">Projet Bouffe</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          <NavLinks currentPath={pathname} />
        </nav>
        <div className="p-3 border-t border-stone-200">
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors text-left"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-52 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 sticky top-0 z-20">
          <span className="text-base font-semibold tracking-tight text-stone-900">Projet Bouffe</span>
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-stone-500 hover:bg-stone-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4.5" x2="16" y2="4.5" />
              <line x1="2" y1="9" x2="16" y2="9" />
              <line x1="2" y1="13.5" x2="16" y2="13.5" />
            </svg>
          </button>
        </header>

        {/* Drawer mobile */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="relative w-64 bg-white h-full flex flex-col shadow-xl">
              <div className="flex items-center justify-between px-4 py-5 border-b border-stone-200">
                <span className="text-base font-semibold tracking-tight text-stone-900">Projet Bouffe</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-md p-1 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="2" y1="2" x2="14" y2="14" />
                    <line x1="14" y1="2" x2="2" y2="14" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-3 flex-1">
                <NavLinks currentPath={pathname} onClick={() => setDrawerOpen(false)} />
              </nav>
              <div className="p-3 border-t border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors text-left"
                >
                  Déconnexion
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
