import type { Metadata } from "next";
import Link from "next/link";
import { toolsRegistry } from "@/data/registry";
import { Calculator, Wallet, BarChart3, Code, Image, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap | Calcoder",
  description: "Complete sitemap of all Calcoder tools and pages. Browse all calculators and utilities by category.",
};

const hubMeta: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  finance: { icon: Wallet, label: "Finance Hub", color: "text-blue-500", bg: "bg-blue-500/10" },
  marketing: { icon: BarChart3, label: "Marketing Hub", color: "text-purple-500", bg: "bg-purple-500/10" },
  developer: { icon: Code, label: "Developer Hub", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  media: { icon: Image, label: "Media & File Tools", color: "text-pink-500", bg: "bg-pink-500/10" },
};

export default function SitemapPage() {
  const categories = ["finance", "marketing", "developer", "media"] as const;

  const grouped = categories.map((cat) => {
    const meta = hubMeta[cat];
    const tools = toolsRegistry.filter((t) => t.category === cat);
    const subCategories = [...new Set(tools.map((t) => t.subCategory))];
    return { ...meta, cat, tools, subCategories };
  });

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
          <Calculator className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Sitemap</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Browse all tools and pages available on Calcoder.
        </p>
      </div>

      <div className="space-y-10">
        {grouped.map((group) => (
          <div key={group.cat} className="glass-panel p-6 sm:p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className={`${group.bg} ${group.color} p-3 rounded-xl`}>
                <group.icon className="w-6 h-6" />
              </div>
              <div>
                <Link href={`/${group.cat}`} className="text-xl font-bold hover:text-primary transition-colors">
                  {group.label}
                </Link>
                <p className="text-sm text-muted-foreground">{group.tools.length} tools</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {group.subCategories.map((sub) => {
                const subTools = group.tools.filter((t) => t.subCategory === sub);
                return (
                  <div key={sub}>
                    <Link
                      href={`/${group.cat}#${sub.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
                      className="text-sm font-semibold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors"
                    >
                      {sub}
                    </Link>
                    <ul className="mt-2 space-y-1">
                      {subTools.map((tool) => (
                        <li key={tool.id}>
                          <Link
                            href={tool.href}
                            className="text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {tool.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Other Pages */}
      <div className="mt-10 glass-panel p-6 sm:p-8 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Other Pages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: "/about", label: "About Us" },
            { href: "/contact", label: "Contact" },
            { href: "/privacy-policy", label: "Privacy Policy" },
            { href: "/terms", label: "Terms of Service" },
          ].map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="flex items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium group-hover:text-primary transition-colors">{page.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Static Pages Summary */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Calcoder currently has <strong>{toolsRegistry.length + 5}</strong> total pages across all hubs and sections.
        </p>
      </div>
    </div>
  );
}
