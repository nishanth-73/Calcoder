import fs from "fs";
import path from "path";
import { toolsRegistry } from "../data/registry";

const createPageTemplate = (tool: any) => {
  const componentName = tool.id.toUpperCase() + "Tool";
  
  return `"use client";

import { useState } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";

export default function ${componentName}() {
  const [value, setValue] = useState("");

  return (
    <ToolLayout
      title="${tool.name}"
      description="${tool.description}"
      category="${tool.category}"
      faqContent={[
        { question: "What is ${tool.name}?", answer: "${tool.description}" },
        { question: "How do I use this tool?", answer: "Simply enter your values in the input fields and the results will automatically calculate." }
      ]}
      explanationContent={
        <div>
          <h2>About the ${tool.name}</h2>
          <p>${tool.description}</p>
          <h3>Formula</h3>
          <p>The calculation is based on industry-standard formulas.</p>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Input Value</label>
            <input 
              type="number" 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              className="w-full p-3 bg-secondary/50 border border-border rounded-lg"
              placeholder="Enter value..."
            />
          </div>
        </div>

        <div className="bg-secondary/30 p-6 rounded-xl flex flex-col justify-center space-y-6 text-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Result</p>
            <p className="text-4xl font-extrabold text-primary">{value || "0"}</p>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
`;
};

async function scaffoldTools() {
  let createdCount = 0;
  
  for (const tool of toolsRegistry) {
    const routeParts = tool.href.split("/").filter(Boolean);
    if (routeParts.length < 2) continue;
    
    const [category, slug] = routeParts;
    const dirPath = path.join(process.cwd(), "app", category, slug);
    const filePath = path.join(dirPath, "page.tsx");

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, createPageTemplate(tool), "utf-8");
      console.log(`Created: ${tool.href}`);
      createdCount++;
    }
  }
  
  console.log(`Scaffolding complete. Created ${createdCount} new tool pages.`);
}

scaffoldTools();
