"use client";

import { toolsRegistry } from "@/data/registry";
import { BarChart3 } from "lucide-react";
import { ToolCard } from "@/components/ui/ToolCard";

export default function MarketingHub() {
  const marketingTools = toolsRegistry.filter(t => t.category === "marketing");
  
  // Group tools by subcategory
  const toolsBySubCategory = marketingTools.reduce((acc, tool) => {
    if (!acc[tool.subCategory]) {
      acc[tool.subCategory] = [];
    }
    acc[tool.subCategory].push(tool);
    return acc;
  }, {} as Record<string, typeof marketingTools>);

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 text-purple-500 rounded-full mb-6">
          <BarChart3 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Marketing Hub</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Analyze AdSense revenue, engagement rates, customer acquisition costs, and more.
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
