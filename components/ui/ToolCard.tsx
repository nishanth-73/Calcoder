"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { SaveButton } from "./SaveButton";

export function ToolCard({ tool }: { tool: any }) {
  // @ts-ignore
  const IconComponent = Icons[tool.icon] || Icons.Code;

  return (
    <Link href={tool.href} className="group relative glass-panel p-6 rounded-2xl flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
          <IconComponent className="w-6 h-6" />
        </div>
        <SaveButton toolId={tool.id} toolName={tool.name} />
      </div>
      <div className="flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2">{tool.description}</p>
      </div>
    </Link>
  );
}
