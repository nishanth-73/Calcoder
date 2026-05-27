"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Globe, Hash, Layout, Search, Type } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

const RELATED_TOOLS = [
  { name: "SERP Snippet Preview", href: "/marketing/serp-snippet-preview", desc: "Preview Google search result snippets." },
  { name: "Keyword Density Checker", href: "/marketing/keyword-density-checker", desc: "Analyze keyword frequency in your content." },
  { name: "Word Counter", href: "/marketing/word-counter", desc: "Count words, characters, and sentences." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
];

function getLengthIndicator(length: number, max: number): { color: string; label: string; barColor: string } {
  const ratio = length / max;
  if (length === 0) return { color: "text-gray-400", label: "Empty", barColor: "bg-gray-200" };
  if (ratio <= 0.8) return { color: "text-green-600", label: "Good", barColor: "bg-green-500" };
  if (ratio <= 1) return { color: "text-yellow-600", label: "Near Limit", barColor: "bg-yellow-500" };
  return { color: "text-red-600", label: "Too Long", barColor: "bg-red-500" };
}

function getSeoScore(title: string, description: string, url: string): { score: number; label: string; color: string; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  if (!title) { score -= 25; issues.push("Missing meta title"); }
  else if (title.length < 10) { score -= 10; issues.push("Title is too short"); }
  else if (title.length > 60) { score -= 10; issues.push("Title exceeds 60 characters"); }
  else if (title.length > 30) { score -= 0; } else { score -= 5; issues.push("Title could be more descriptive"); }

  if (!description) { score -= 25; issues.push("Missing meta description"); }
  else if (description.length < 50) { score -= 10; issues.push("Description is too short"); }
  else if (description.length > 160) { score -= 10; issues.push("Description exceeds 160 characters"); }

  if (!url) { score -= 10; issues.push("Missing URL slug"); }

  const label = score >= 80 ? "Good" : score >= 50 ? "Needs Work" : "Poor";
  const color = score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  return { score: Math.max(0, score), label, color, issues };
}

export default function MetaTagPreview() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const titleIndicator = useMemo(() => getLengthIndicator(title.length, 60), [title]);
  const descIndicator = useMemo(() => getLengthIndicator(description.length, 160), [description]);
  const seoScore = useMemo(() => getSeoScore(title, description, url), [title, description, url]);

  const displayUrl = useMemo(() => {
    if (!url) return "https://www.example.com/page";
    const clean = url.startsWith("http") ? url : `https://${url}`;
    try {
      const parsed = new URL(clean);
      return parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "/page");
    } catch {
      return url;
    }
  }, [url]);

  const displayTitle = useMemo(() => {
    if (!title) return "Page Title - Your Descriptive Title Here";
    return title;
  }, [title]);

  const displayDescription = useMemo(() => {
    if (!description) return "This is your meta description. It appears in search results under the title and URL. Aim for 150-160 characters that compel users to click through to your page.";
    return description;
  }, [description]);

  return (
    <ToolLayout
      title="Meta Tag Preview"
      description="Preview how your page will appear in Google search results. Generate and test meta titles and descriptions."
      category="marketing"
      faqContent={[
        {
          question: "What are meta tags?",
          answer: "Meta tags are HTML elements that provide structured metadata about a webpage. They are placed in the <head> section of a page and are not visible to users browsing the page. The most important meta tags for SEO are the meta title (<title> tag), meta description, and Open Graph tags. Meta tags help search engines understand what your page is about and how it should appear in search results.",
        },
        {
          question: "What is the ideal meta title length?",
          answer: "The ideal meta title length is 50-60 characters. Google typically displays the first 50-60 characters of a title tag in search results. Titles under 50 characters may be too short to be descriptive, while titles over 60 characters get truncated with an ellipsis (...). Keep your primary keyword near the beginning of the title and include your brand name when appropriate.",
        },
        {
          question: "What is the ideal meta description length?",
          answer: "The ideal meta description length is 150-160 characters. Descriptions within this range are fully displayed in search results without truncation. While meta descriptions are not a direct ranking factor, they significantly impact click-through rates (CTR). A well-written description that includes relevant keywords and a compelling call-to-action can improve your organic CTR by 5-10%.",
        },
        {
          question: "Do meta tags affect SEO rankings?",
          answer: "Meta tags have varying impacts on SEO. The title tag is a strong ranking signal - Google uses it to understand page relevance. Meta descriptions do not directly influence rankings, but they affect CTR which can indirectly impact performance. Other meta tags like robots, canonical, and viewport tags serve technical SEO purposes. Open Graph and Twitter Card tags improve social sharing appearance.",
        },
        {
          question: "What are Open Graph tags?",
          answer: "Open Graph (OG) tags are meta tags that control how your content appears when shared on social media platforms like Facebook, LinkedIn, and Twitter. The key OG tags are og:title, og:description, og:image, and og:url. These tags ensure your shared links display a proper title, description, and thumbnail image rather than just a bare URL.",
        },
        {
          question: "Should I include keywords in my meta description?",
          answer: "Yes, including relevant keywords in your meta description is beneficial. While keywords in descriptions do not directly improve rankings, they are bolded by Google when they match the user's search query. This visual emphasis makes your listing stand out, potentially increasing click-through rates. Always write for humans first - naturally incorporate keywords within a compelling description.",
        },
        {
          question: "What happens if my meta title is too long?",
          answer: "If your meta title exceeds approximately 60 characters (or ~600 pixels width), Google truncates it with an ellipsis. This can result in an incomplete or confusing title that reduces click-through rates. For example, '10 Amazing Tips for Growing Your Online Business Success' becomes '10 Amazing Tips for Growing Your Online...'. Keep titles concise and front-load important keywords.",
        },
        {
          question: "Can Google rewrite my meta tags?",
          answer: "Yes, Google may rewrite your meta title or description if it determines that your provided tags are not relevant to the user's search query or if your tags are poorly written. Google's algorithm attempts to generate a more relevant snippet from your page content. To avoid rewriting, ensure your meta tags accurately describe your page content and match search intent.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Meta Tag Preview Tool?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A <strong>Meta Tag Preview Tool</strong> helps you write and test your meta title, description, and URL
              before publishing. It shows a live preview of how your page will appear in Google search results,
              along with character counts, length indicators, and an SEO score to help you optimize for better
              click-through rates.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Title Tag Best Practices</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Keep it 50-60 characters</strong> to avoid truncation in search results.</li>
              <li><strong>Front-load your primary keyword</strong> - place it near the beginning.</li>
              <li><strong>Include your brand name</strong> at the end separated by a pipe (|) or dash (-).</li>
              <li><strong>Write unique titles</strong> for every page - avoid duplicate titles across your site.</li>
              <li><strong>Match search intent</strong> - use language that reflects what users are searching for.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Meta Description Best Practices</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Aim for 150-160 characters</strong> for full display in search results.</li>
              <li><strong>Include a call-to-action</strong> like "Learn more," "Get started," or "Read our guide."</li>
              <li><strong>Incorporate your target keyword</strong> naturally - it will be bolded in results.</li>
              <li><strong>Summarize the page value</strong> - what will the user find by clicking through?</li>
              <li><strong>Avoid duplicate descriptions</strong> across your site pages.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Why Previewing Matters</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your search snippet is the first impression users have of your website. A well-crafted snippet
              can significantly improve your click-through rate. Previewing ensures your title and description
              display properly without truncation, contain relevant keywords, and present a compelling reason
              for users to visit your page. With featured snippets, knowledge panels, and rich results becoming
              more common, optimizing your meta tags is an essential part of any SEO strategy.
            </p>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1.5">
                <Type className="w-4 h-4 text-primary" />
                Page Title / Meta Title
              </span>
              <span className={`text-xs font-mono ${titleIndicator.color}`}>{title.length}/60</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your meta title..."
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${titleIndicator.barColor}`}
                style={{ width: `${Math.min((title.length / 60) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{titleIndicator.label}</p>
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Meta Description
              </span>
              <span className={`text-xs font-mono ${descIndicator.color}`}>{description.length}/160</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your meta description..."
              className="w-full h-24 px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
            <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${descIndicator.barColor}`}
                style={{ width: `${Math.min((description.length / 160) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{descIndicator.label}</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              URL / Slug
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com/page"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1">
              <Search className="w-3 h-3" />
              Google SERP Preview
            </p>
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
              <p className="text-xs text-green-700 font-medium truncate">{displayUrl}</p>
              <p className="text-blue-800 text-base font-medium leading-tight mt-0.5 truncate hover:underline cursor-pointer">
                {displayTitle}
              </p>
              <p className="text-sm text-gray-600 leading-snug mt-1 line-clamp-2">
                {displayDescription}
              </p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Hash className="w-3 h-3" />
                SEO Score
              </p>
              <span className={`text-sm font-bold ${seoScore.color}`}>{seoScore.score}/100 - {seoScore.label}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${seoScore.score >= 80 ? "bg-green-500" : seoScore.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ width: `${seoScore.score}%` }}
              />
            </div>
            {seoScore.issues.length > 0 && (
              <ul className="mt-3 space-y-1">
                {seoScore.issues.map((issue, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-yellow-600">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
            {seoScore.issues.length === 0 && title && (
              <p className="flex items-center gap-1.5 text-xs text-green-600 mt-3">
                <CheckCircle2 className="w-3 h-3" />
                All checks passed
              </p>
            )}
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <Layout className="w-3 h-3" />
              Character Analysis
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Title Length</span>
                <span className={`font-medium ${titleIndicator.color}`}>{title.length} chars</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Description Length</span>
                <span className={`font-medium ${descIndicator.color}`}>{description.length} chars</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Total Characters</span>
                <span className="font-medium">{title.length + description.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6">Related Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RELATED_TOOLS.map((tool) => (
            <a
              key={tool.name}
              href={tool.href}
              className="block bg-white border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{tool.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </ToolLayout>
  );
}