"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, FileText, Globe, Monitor, Search, Smartphone, Type } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

const RELATED_TOOLS = [
  { name: "Meta Tag Preview", href: "/marketing/meta-tag-preview", desc: "Preview how your meta tags appear in search results." },
  { name: "Keyword Density Checker", href: "/marketing/keyword-density-checker", desc: "Analyze keyword frequency in your content." },
  { name: "Word Counter", href: "/marketing/word-counter", desc: "Count words, characters, and sentences." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
];

function truncateToPixelWidth(text: string, maxPixels: number): string {
  if (!text) return text;
  const charWidth = 8.5;
  if (text.length * charWidth <= maxPixels) return text;
  let result = "";
  for (const ch of text) {
    if ((result.length + 1) * charWidth > maxPixels - 15) break;
    result += ch;
  }
  return result + "…";
}

function getPixelWidth(text: string): number {
  return text.length * 8.5;
}

function getTitlePixelEstimate(title: string): { width: number; status: "good" | "warning" | "bad"; label: string; maxWidth: number } {
  const maxWidth = 600;
  const width = getPixelWidth(title);
  if (width <= maxWidth) return { width, status: "good", label: "Fits in snippet", maxWidth };
  return { width, status: "bad", label: "May be truncated", maxWidth };
}

function getDescPixelEstimate(desc: string): { width: number; status: "good" | "bad"; label: string } {
  if (!desc) return { width: 0, status: "good", label: "Empty" };
  const lines = Math.ceil(desc.length / 80);
  if (desc.length <= 160) return { width: desc.length * 8.5, status: "good", label: "Fits" };
  return { width: 320 * 8.5, status: "bad", label: "May be truncated" };
}

function getSeoTips(title: string, description: string, url: string): string[] {
  const tips: string[] = [];
  if (!title) tips.push("Add a page title - it's essential for SEO and click-through rates.");
  else if (title.length < 30) tips.push("Consider making your title more descriptive (aim for 50-60 characters).");
  else if (title.length > 60) tips.push("Your title is long and may be truncated in search results.");
  else tips.push("Your title length looks good!");

  if (!description) tips.push("Add a meta description - it helps improve click-through rates.");
  else if (description.length < 80) tips.push("Your description is short. Expand it to 150-160 characters for better visibility.");
  else if (description.length > 160) tips.push("Your description exceeds 160 characters and may be truncated.");
  else tips.push("Your description length is optimal.");

  if (!url) tips.push("Add a URL slug for a complete preview.");
  else if (url.length > 60) tips.push("Consider shortening your URL slug - shorter URLs tend to perform better in search.");

  return tips;
}

export default function SerpSnippetPreview() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [siteName, setSiteName] = useState("");

  const displayUrl = useMemo(() => {
    const base = siteName || "example";
    if (!url) return `${base}.com › page`;
    const clean = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${base}.com › ${clean}`;
  }, [url, siteName]);

  const displayTitle = useMemo(() => {
    if (!title) return "Page Title - Optimize Your Meta Title for Better SEO";
    return title;
  }, [title]);

  const displayDescription = useMemo(() => {
    if (!description) {
      return "This is your meta description that appears below the title in Google search results. Write a compelling description that encourages users to click through to your website.";
    }
    return description;
  }, [description]);

  const titlePixel = useMemo(() => getTitlePixelEstimate(title), [title]);
  const descPixel = useMemo(() => getDescPixelEstimate(description), [description]);
  const tips = useMemo(() => getSeoTips(title, description, url), [title, description, url]);

  const mobileDescription = useMemo(() => {
    if (!description) return displayDescription;
    return description.length > 120 ? description.slice(0, 120) + "…" : description;
  }, [description, displayDescription]);

  return (
    <ToolLayout
      title="SERP Snippet Preview"
      description="Preview how your website appears in Google search results. Optimize your title, URL, and description for better click-through rates."
      category="marketing"
      faqContent={[
        {
          question: "What is a SERP snippet?",
          answer: "A SERP (Search Engine Results Page) snippet is the preview of your webpage that appears in Google search results. It typically includes a blue clickable title, a green URL, and a black meta description. Optimizing your snippet is crucial for attracting clicks from search users. Google may also display rich snippets with star ratings, prices, or images for certain types of content.",
        },
        {
          question: "How does Google determine which snippet to show?",
          answer: "Google generates search snippets primarily from your page's title tag and meta description. If those tags are missing or poorly written, Google may auto-generate a snippet by extracting relevant text from your page content. Google also considers the user's search query - it may bold matching terms in your snippet and can rewrite your title or description if it determines alternative text is more relevant.",
        },
        {
          question: "What is the ideal title length for Google snippets?",
          answer: "Google displays approximately 600 pixels of title text, which translates to roughly 55-60 characters for most fonts. Titles longer than this are truncated with an ellipsis. To maximize visibility, keep your title between 50-60 characters, front-load important keywords, and place your brand name at the end after a pipe or dash separator.",
        },
        {
          question: "What is the ideal description length for Google snippets?",
          answer: "Meta descriptions can display up to 160 characters in Google search results, though the actual pixel width limit is about 920 pixels. Descriptions longer than 160 characters are typically truncated. Some search results may show shorter descriptions depending on the query and device. Mobile results often show shorter previews than desktop results.",
        },
        {
          question: "What are rich snippets?",
          answer: "Rich snippets are enhanced search results that display additional information beyond the standard title, URL, and description. Examples include star ratings for reviews, pricing information for products, recipe cooking times, event dates, and FAQ accordions. Rich snippets are generated using structured data markup (Schema.org) added to your HTML. Pages with rich snippets often have higher click-through rates.",
        },
        {
          question: "How does mobile SERP display differ from desktop?",
          answer: "Mobile SERP snippets typically show fewer characters due to smaller screens. Titles may be truncated at around 55-58 characters on mobile, and descriptions may be limited to 100-120 characters. Mobile results also feature larger text and touch-friendly spacing. With Google's mobile-first indexing, optimizing for mobile SERP display is essential.",
        },
        {
          question: "Can I preview how my snippet looks before publishing?",
          answer: "Yes, this SERP Snippet Preview tool lets you see exactly how your page will appear in both desktop and mobile search results. By entering your title, description, URL, and site name, you get an instant realistic preview. You can tweak your tags until they display perfectly, ensuring you make a great first impression on search users.",
        },
        {
          question: "What is a featured snippet?",
          answer: "A featured snippet is a special search result that appears at the top of Google's organic results in a featured box. It typically contains a summarized answer extracted from a webpage, often with a link to the source. Featured snippets can take the form of paragraphs, lists, tables, or videos. Optimizing your content to answer specific questions clearly increases your chances of earning a featured snippet.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a SERP Snippet Preview Tool?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A <strong>SERP Snippet Preview Tool</strong> lets you see exactly how your webpage will look in
              Google search results before you publish. By entering your title, meta description, URL, and site
              name, you can preview both desktop and mobile displays, check character counts, estimate pixel
              widths, and receive optimization tips to improve your click-through rates.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Title Optimization</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Front-load keywords:</strong> Place your most important keywords at the beginning of the title.</li>
              <li><strong>Stay within 55-60 characters</strong> to avoid truncation in search results.</li>
              <li><strong>Include your brand name</strong> at the end using a pipe | or dash - separator.</li>
              <li><strong>Write a unique title per page:</strong> Duplicate titles confuse search engines and users.</li>
              <li><strong>Match search intent:</strong> Ensure your title aligns with what users are searching for.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description Optimization</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Keep it 150-160 characters</strong> for full display without truncation.</li>
              <li><strong>Include a call-to-action:</strong> "Learn more," "Shop now," or "Read our complete guide."</li>
              <li><strong>Use your target keyword naturally</strong> - Google bolds matching terms in results.</li>
              <li><strong>Differentiate from competitors:</strong> Highlight unique value propositions.</li>
              <li><strong>Avoid quotation marks</strong> unless necessary - Google may truncate at the quote.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Mobile vs Desktop Display</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Google displays search snippets differently on mobile and desktop devices. Mobile SERPs typically
              show shorter titles and descriptions due to smaller screen widths. With Google's mobile-first
              indexing, your mobile snippet is more important than ever. Always preview both versions to ensure
              your content displays effectively across all devices.
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
                Page Title
              </span>
              <span className={`text-xs font-mono ${title.length > 60 ? "text-red-500" : title.length > 0 ? "text-green-600" : "text-gray-400"}`}>{title.length} chars</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your page title..."
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-sm font-medium mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Meta Description
              </span>
              <span className={`text-xs font-mono ${description.length > 160 ? "text-red-500" : description.length > 0 ? "text-green-600" : "text-gray-400"}`}>{description.length} chars</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter your meta description..."
              className="w-full h-24 px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 text-primary" />
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="page-slug"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Eye className="w-4 h-4 text-primary" />
              Site Name (optional)
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="MyBrand"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Optimization Tips
            </p>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              Desktop Preview
            </p>
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-green-700 font-medium truncate">{displayUrl}</p>
              <p className="text-blue-800 text-lg font-medium leading-tight mt-0.5 hover:underline cursor-pointer truncate">
                {displayTitle}
              </p>
              <p className="text-sm text-gray-600 leading-snug mt-1">
                {displayDescription}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Title pixel width</span>
                <span className={titlePixel.status === "good" ? "text-green-600" : "text-red-500"}>
                  {Math.round(titlePixel.width)}px / {titlePixel.maxWidth}px
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Description length</span>
                <span className={descPixel.status === "good" ? "text-green-600" : "text-red-500"}>
                  {description.length} / 160 chars
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Mobile Preview
            </p>
            <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm max-w-xs mx-auto">
              <p className="text-xs text-green-700 font-medium truncate">{displayUrl}</p>
              <p className="text-blue-800 text-sm font-medium leading-tight mt-0.5 hover:underline cursor-pointer truncate">
                {truncateToPixelWidth(displayTitle, 450)}
              </p>
              <p className="text-sm text-gray-600 leading-snug mt-1">
                {mobileDescription}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Mobile titles typically display ~55-58 characters before truncation
            </p>
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