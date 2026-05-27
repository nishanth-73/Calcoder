"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Calculator, Bookmark } from "lucide-react";
import { SavedDrawer } from "./SavedDrawer";
import { useBookmarks } from "@/lib/useBookmarks";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const { count, isLoaded, hasNew, markSeen } = useBookmarks();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo */}
            <div className="flex items-center shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="font-bold text-xl tracking-tight">Calcoder</span>
              </Link>
            </div>

            {/* Center: Hub Links (desktop only) */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/finance" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Finance</Link>
              <Link href="/marketing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Marketing</Link>
              <Link href="/developer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Developer</Link>
              <Link href="/media" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Media</Link>
            </div>

            {/* Right: Saved + Mobile Menu */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={() => {
                  markSeen();
                  setSavedOpen(true);
                }}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-muted-foreground hover:text-primary"
                aria-label="Saved tools"
              >
                <Bookmark className="w-5 h-5" fill={count > 0 ? "currentColor" : "none"} />
                {isLoaded && count > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                    hasNew
                      ? "bg-destructive text-destructive-foreground scale-110"
                      : "bg-primary text-primary-foreground scale-100"
                  }`}>
                    {count > 9 ? "9+" : count}
                  </span>
                )}
                {hasNew && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full animate-ping" />
                )}
              </button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2 text-foreground rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link href="/finance" onClick={() => setIsOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors">Finance Hub</Link>
              <Link href="/marketing" onClick={() => setIsOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors">Marketing Hub</Link>
              <Link href="/developer" onClick={() => setIsOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors">Developer Hub</Link>
              <Link href="/media" onClick={() => setIsOpen(false)} className="block text-sm font-medium hover:text-primary transition-colors">Media & File Tools</Link>
              <div className="border-t border-border pt-3 mt-3">
                <Link href="/about" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About</Link>
                <Link href="/contact" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contact</Link>
              </div>
            </div>
          </div>
        )}
      </nav>
      <SavedDrawer open={savedOpen} onClose={() => setSavedOpen(false)} />
    </>
  );
}
