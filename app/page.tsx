"use client";

import Link from "next/link";
import { ArrowRight, Wallet, Code, BarChart3, Search, Clock, Bookmark, Image } from "lucide-react";
import { toolsRegistry } from "@/data/registry";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const resultClickRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("calcoder_recent_searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (toolId: string) => {
    const updated = [toolId, ...recentSearches.filter(id => id !== toolId)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("calcoder_recent_searches", JSON.stringify(updated));
  };

  const filteredTools = toolsRegistry.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentTools = recentSearches.map(id => toolsRegistry.find(t => t.id === id)).filter(Boolean);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative isolate px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8">
            The Ultimate Hub for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Calculators & Tools</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            A comprehensive suite of production-ready micro-tools for finance, marketing analytics, and developer utilities. Fast, scalable, and completely free.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for any tool (e.g. 'SIP Calculator' or 'JSON Formatter')"
              className="w-full pl-14 pr-4 py-4 text-lg bg-white border border-border rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!resultClickRef.current) {
                    setShowDropdown(false);
                  }
                  resultClickRef.current = false;
                }, 200);
              }}
            />

            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white border border-border rounded-xl shadow-xl z-[100] max-h-96 overflow-y-auto text-left">
                {searchQuery ? (
                  filteredTools.length > 0 ? (
                    <ul className="py-2">
                      {filteredTools.map(tool => (
                        <li key={tool.id}>
                          <Link
                            href={tool.href}
                            onClick={() => saveRecentSearch(tool.id)}
                            onPointerDown={() => { resultClickRef.current = true; }}
                            className="flex flex-col px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold text-primary">{tool.name}</span>
                            <span className="text-sm text-muted-foreground">{tool.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No tools found matching "{searchQuery}"</div>
                  )
                ) : (
                  recentTools.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Recent Searches
                      </div>
                      <ul>
                        {recentTools.map((tool: any) => (
                          <li key={tool.id}>
                            <Link
                              href={tool.href}
                              onPointerDown={() => { resultClickRef.current = true; }}
                              className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                            >
                              <Search className="w-4 h-4 mr-3 text-muted-foreground" />
                              <span className="font-medium">{tool.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Category Hubs */}
      <section className="py-20 bg-white border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Explore Our Hubs</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Finance */}
            <Link href="/finance" className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-blue-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Finance Hub</h3>
              <p className="text-muted-foreground mb-6">
                Calculate SIP returns, EMIs, compound interest, ROI, and inflation metrics with precision.
              </p>
              <div className="flex items-center text-primary font-medium">
                Explore Finance Tools <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Marketing */}
            <Link href="/marketing" className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Marketing Hub</h3>
              <p className="text-muted-foreground mb-6">
                Analyze AdSense revenue, CPM, engagement rates, CAC, and lifetime value easily.
              </p>
              <div className="flex items-center text-primary font-medium">
                Explore Marketing Tools <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Developer */}
            <Link href="/developer" className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 transition-transform">
                <Code className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Developer Hub</h3>
              <p className="text-muted-foreground mb-6">
                Format JSON, test Regex, convert base64, generate passwords, and minify code instantly.
              </p>
              <div className="flex items-center text-primary font-medium">
                Explore Developer Tools <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Media & File */}
            <Link href="/media" className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-transform duration-300">
              <div className="bg-pink-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-pink-500 group-hover:scale-110 transition-transform">
                <Image className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Media & File Tools</h3>
              <p className="text-muted-foreground mb-6">
                Convert, compress, and edit PDFs, images, and files with fast browser-based tools.
              </p>
              <div className="flex items-center text-primary font-medium">
                Explore Media Tools <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Tools */}
      <section className="py-20 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Popular Tools</h2>
              <p className="text-muted-foreground">Most frequently used calculators and utilities.</p>
            </div>
            <Link href="/finance" className="hidden sm:flex items-center text-primary font-medium hover:underline">
              View all tools <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {toolsRegistry.slice(0, 8).map(tool => (
              <Link key={tool.id} href={tool.href} className="p-6 rounded-xl border border-border bg-white shadow-sm hover:border-primary/50 hover:shadow-md transition-all group">
                <div className="flex justify-between">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
