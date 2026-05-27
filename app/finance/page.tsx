"use client";

import { toolsRegistry } from "@/data/registry";
import { Wallet } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";

export default function FinanceHub() {
  const financeTools = toolsRegistry.filter(t => t.category === "finance");
  
  // Group tools by subcategory
  const toolsBySubCategory = financeTools.reduce((acc, tool) => {
    if (!acc[tool.subCategory]) {
      acc[tool.subCategory] = [];
    }
    acc[tool.subCategory].push(tool);
    return acc;
  }, {} as Record<string, typeof financeTools>);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-blue-500/10 text-blue-500 rounded-full mb-6">
          <Wallet className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Finance Hub</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Calculate your returns, loans, interest, and inflation impact instantly with our precise financial tools.
        </p>
      </div>

      <div className="space-y-16 max-w-6xl mx-auto">
        {Object.entries(toolsBySubCategory).map(([subCategory, tools]) => (
          <div key={subCategory}>
            <h2 id={subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')} className="text-2xl font-bold mb-6 pb-2 border-b border-border">{subCategory}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
