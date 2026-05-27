import React from "react";
import Link from "next/link";
import { AdPlaceholder } from "./AdPlaceholder";
import { ChevronRight, Calculator } from "lucide-react";
import { toolsRegistry } from "@/data/registry";
import { SaveButton } from "@/components/ui/SaveButton";

function getToolId(title: string, category: string) {
  const exact = toolsRegistry.find(
    (t) => t.name === title && t.category === category
  );
  if (exact) return exact.id;
  const fuzzy = toolsRegistry.find(
    (t) => title.toLowerCase().includes(t.name.toLowerCase()) && t.category === category
  );
  return fuzzy?.id || "";
}

export function ToolLayout({
  title,
  description,
  category,
  children,
  explanationContent,
  faqContent,
  relatedTools: relatedToolsProp,
}: {
  title: string;
  description: string;
  category: "finance" | "marketing" | "developer" | "media";
  children: React.ReactNode;
  explanationContent?: React.ReactNode;
  faqContent?: { question: string; answer: string }[];
  relatedTools?: { name?: string; title?: string; href: string; desc: string }[];
}) {
  const relatedTools = relatedToolsProp || toolsRegistry
    .filter((t) => t.category === category && t.name !== title)
    .slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-muted-foreground mb-8">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li>
            <Link href={`/${category}`} className="hover:text-primary transition-colors capitalize">
              {category}
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li className="text-foreground font-medium">{title}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          <SaveButton toolId={getToolId(title, category)} toolName={title} />
        </div>
        <p className="text-lg text-muted-foreground">{description}</p>
      </div>

      {/* Top Ad */}
      <div className="mb-12">
        <AdPlaceholder type="leaderboard" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calculator/Tool Core — order-1 on mobile, order-0 on desktop (sits next to sidebar) */}
        <section className="lg:col-span-8 glass-panel p-6 sm:p-8 rounded-2xl shadow-sm">
          {children}
        </section>

        {/* Mobile only: Ad + Related Tools + Ad (renders between calculator and explanation on mobile) */}
        <div className="space-y-8 lg:hidden">
          <AdPlaceholder type="rectangle" />
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              Related Tools
            </h3>
            <div className="space-y-0.5">
              {relatedTools.slice(0, 6).map((tool) => (
                <Link
                  key={(tool as any).id || tool.href}
                  href={tool.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/40 transition-colors group"
                >
                  <Calculator className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium group-hover:text-primary transition-colors leading-tight">
                    {tool.name || (tool as any).title || ""}
                  </span>
                </Link>
              ))}
            </div>
          </div>
          <AdPlaceholder type="rectangle" />
        </div>

        {/* Sidebar (desktop only) — placed next to calculator via lg:order-1 */}
        <aside className="lg:col-span-4 space-y-8 hidden lg:block lg:order-1">
          <div className="sticky top-24 space-y-8">
            <AdPlaceholder type="rectangle" />

            {/* Related Tools */}
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Related Tools
              </h3>
              <div className="space-y-0.5">
                {relatedTools.slice(0, 6).map((tool) => (
                  <Link
                    key={(tool as any).id || tool.href}
                    href={tool.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-accent/40 transition-colors group"
                  >
                    <Calculator className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors leading-tight">
                      {tool.name || (tool as any).title || ""}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            
            <AdPlaceholder type="rectangle" />
          </div>
        </aside>

        {/* Inline Ad + Explanation + FAQ — desktop row 2 (below calculator + sidebar) */}
        <div className="lg:col-span-8 space-y-12 lg:order-2">
          {/* Inline Ad */}
          <div className="my-8 hidden sm:block">
            <AdPlaceholder type="leaderboard" />
          </div>

          {/* Explanation / Content Blocks */}
          {explanationContent && (
            <section className="glass-panel p-6 sm:p-8 rounded-2xl">
              <div className="prose prose-slate max-w-none">
                {explanationContent}
              </div>
            </section>
          )}

          {/* FAQ Accordion */}
          {faqContent && faqContent.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqContent.map((faq, index) => (
                  <div key={index} className="glass-panel p-6 rounded-xl">
                    <h3 className="font-semibold text-lg mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
