"use client";

import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, BarChart3, CheckCircle2, FileText, Hash, Search, Type } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

const RELATED_TOOLS = [
  { name: "Meta Tag Preview Tool", href: "/marketing/meta-tag-preview", desc: "Preview how meta tags appear in search results." },
  { name: "SERP Snippet Preview", href: "/marketing/serp-snippet-preview", desc: "Preview Google search result snippets." },
  { name: "Word Counter", href: "/marketing/word-counter", desc: "Count words, characters, and sentences." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
];

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function getKeywordFrequency(text: string, keyword: string): number {
  if (!keyword.trim() || !text.trim()) return 0;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function getKeywordOccurrences(text: string, keyword: string): number[] {
  if (!keyword.trim() || !text.trim()) return [];
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const positions: number[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    positions.push(match.index);
  }
  return positions;
}

function getPhraseDensity(text: string, wordCount: number): { twoWord: string; threeWord: string } {
  if (wordCount < 2) return { twoWord: "0%", threeWord: "0%" };
  const words = text.trim().split(/\s+/);
  const twoWordMap = new Map<string, number>();
  const threeWordMap = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const two = (words[i] + " " + words[i + 1]).toLowerCase();
    twoWordMap.set(two, (twoWordMap.get(two) || 0) + 1);
    if (i < words.length - 2) {
      const three = (words[i] + " " + words[i + 1] + " " + words[i + 2]).toLowerCase();
      threeWordMap.set(three, (threeWordMap.get(three) || 0) + 1);
    }
  }
  const maxTwo = Math.max(...twoWordMap.values(), 0);
  const maxThree = Math.max(...threeWordMap.values(), 0);
  return {
    twoWord: wordCount > 0 ? ((maxTwo * 2) / wordCount * 100).toFixed(2) + "%" : "0%",
    threeWord: wordCount > 0 ? ((maxThree * 3) / wordCount * 100).toFixed(2) + "%" : "0%",
  };
}

function getDensityScore(density: number): { label: string; color: string; icon: React.ReactNode } {
  if (density === 0) return { label: "No Keyword", color: "text-gray-500", icon: <AlertCircle className="w-4 h-4" /> };
  if (density < 0.5) return { label: "Very Low", color: "text-yellow-500", icon: <AlertTriangle className="w-4 h-4" /> };
  if (density < 1) return { label: "Low", color: "text-yellow-600", icon: <AlertTriangle className="w-4 h-4" /> };
  if (density <= 3) return { label: "Optimal", color: "text-green-600", icon: <CheckCircle2 className="w-4 h-4" /> };
  if (density <= 5) return { label: "High", color: "text-orange-500", icon: <AlertTriangle className="w-4 h-4" /> };
  return { label: "Too High (Stuffing)", color: "text-red-600", icon: <AlertCircle className="w-4 h-4" /> };
}

function getTopKeywords(text: string, limit: number = 10): { word: string; count: number }[] {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return [];
  const words = trimmed.split(/\s+/).filter((w) => w.length > 2);
  const map = new Map<string, number>();
  for (const w of words) {
    map.set(w, (map.get(w) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function KeywordDensityChecker() {
  const [content, setContent] = useState("");
  const [keyword, setKeyword] = useState("");

  const wordCount = useMemo(() => getWordCount(content), [content]);
  const keywordFrequency = useMemo(() => getKeywordFrequency(content, keyword), [content, keyword]);
  const keywordLengthInWords = useMemo(() => keyword.trim() ? keyword.trim().split(/\s+/).length : 0, [keyword]);
  const density = useMemo(() => {
    if (wordCount === 0 || keywordFrequency === 0) return 0;
    return (keywordFrequency * keywordLengthInWords / wordCount) * 100;
  }, [wordCount, keywordFrequency, keywordLengthInWords]);
  const score = useMemo(() => getDensityScore(density), [density]);
  const occurrences = useMemo(() => getKeywordOccurrences(content, keyword), [content, keyword]);
  const phraseDensity = useMemo(() => getPhraseDensity(content, wordCount), [content, wordCount]);
  const topKeywords = useMemo(() => getTopKeywords(content), [content]);

  return (
    <ToolLayout
      title="Keyword Density Checker"
      description="Analyze keyword density and frequency in your content. Improve SEO by understanding keyword usage."
      category="marketing"
      faqContent={[
        {
          question: "What is keyword density?",
          answer: "Keyword density is the percentage of times a keyword appears in your content compared to the total word count. It is calculated as (Number of keyword occurrences × keyword word length ÷ total word count) × 100. Search engines use keyword density as one of many signals to determine what your content is about, but it is no longer a primary ranking factor.",
        },
        {
          question: "What is the optimal keyword density for SEO?",
          answer: "The recommended keyword density is between 1% and 3%. Below 1% makes it hard for search engines to understand your topic focus. Above 3% may appear as keyword stuffing. However, modern SEO prioritizes natural language and topical relevance over exact density percentages. Focus on writing comprehensive content that naturally incorporates your target keyword and related terms.",
        },
        {
          question: "Does keyword density still matter for Google rankings?",
          answer: "Keyword density is less important than it was a decade ago. Google's algorithms now use natural language processing, semantic analysis, and entity recognition to understand content. While keyword usage still matters as a relevance signal, over-optimizing for a specific density percentage can hurt readability. Focus on natural keyword placement in titles, headings, and throughout the body.",
        },
        {
          question: "What is keyword stuffing?",
          answer: "Keyword stuffing is the practice of loading a webpage with keywords in an attempt to manipulate search rankings. Examples include repeating the same phrase unnaturally, adding irrelevant keywords, or hiding keywords in invisible text. Google penalizes keyword stuffing as a violation of its Webmaster Guidelines. A keyword density above 5% typically indicates stuffing.",
        },
        {
          question: "What are LSI keywords?",
          answer: "LSI (Latent Semantic Indexing) keywords are conceptually related terms that search engines use to understand content context. For example, a page about 'apple' could be about fruit or technology - LSI keywords like 'orchard', 'recipe', or 'iPhone' help clarify meaning. Modern SEO involves using semantic and related keywords throughout your content rather than repeating the same phrase.",
        },
        {
          question: "How often should I use my target keyword?",
          answer: "Aim to use your primary keyword 2-4 times in a 1000-word article: once in the title, once in an H1 or H2 heading, once in the first paragraph, and once naturally in the body. Use related keywords and synonyms 3-5 additional times. For shorter content (300-500 words), 1-2 uses of the primary keyword are sufficient.",
        },
        {
          question: "Should I check keyword density for every page?",
          answer: "Yes, especially for pillar pages and cornerstone content that you want to rank highly. Checking keyword density helps ensure your content is properly focused without over-optimizing. For blog posts and news articles, natural writing usually produces appropriate keyword density without manual checking.",
        },
        {
          question: "What is the difference between keyword frequency and density?",
          answer: "Keyword frequency is simply the raw count of how many times a keyword appears in your text. Keyword density expresses that frequency as a percentage of the total word count. For example, if a 2-word keyword appears 5 times in a 500-word article, the frequency is 5 and the density is (5 × 2 ÷ 500) × 100 = 2%.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Keyword Density Checker?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A <strong>Keyword Density Checker</strong> analyzes how frequently a specific keyword or phrase
              appears in your content relative to the total word count. By entering your text and target keyword,
              you get an instant analysis showing the density percentage, frequency count, and whether your usage
              is optimal for SEO.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Formula Used</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
              <p><strong>Keyword Density (%) = (Keyword Frequency × Keyword Word Length ÷ Total Word Count) × 100</strong></p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Example Calculation</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Scenario: A 500-word article about &ldquo;digital marketing tips&rdquo; uses that phrase 4 times.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Keyword: &ldquo;digital marketing tips&rdquo; (3 words)</li>
                <li>Frequency: 4 occurrences</li>
                <li>Density = (4 × 3 ÷ 500) × 100 = 2.4%</li>
                <li><strong>Result: Optimal - within the 1-3% recommended range.</strong></li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Benefits of Monitoring Keyword Density</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Avoid keyword stuffing:</strong> Keep your content natural and penalty-free.</li>
              <li><strong>Improve topical focus:</strong> Ensure your content clearly targets the right keywords.</li>
              <li><strong>Better readability:</strong> Natural keyword usage leads to better user experience.</li>
              <li><strong>Competitive analysis:</strong> Compare your keyword density against top-ranking pages.</li>
              <li><strong>Content optimization:</strong> Fine-tune existing content for better search visibility.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for Natural Keyword Usage</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li>Use keywords in your title, meta description, and first paragraph naturally.</li>
              <li>Include related keywords and synonyms (LSI keywords) throughout the content.</li>
              <li>Write for humans first - if it sounds awkward when read aloud, rewrite it.</li>
              <li>Use keywords in headings (H2, H3) where they fit naturally.</li>
              <li>Consider the search intent behind the keyword - informational, navigational, or transactional.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Common Mistakes to Avoid</h3>
            <ul className="list-disc pl-5 text-sm leading-relaxed text-muted-foreground space-y-1">
              <li><strong>Keyword stuffing:</strong> Repeating the same phrase excessively harms readability and rankings.</li>
              <li><strong>Ignoring context:</strong> Keywords must fit naturally within sentences and paragraphs.</li>
              <li><strong>Over-optimizing:</strong> Trying to hit an exact density percentage rather than writing naturally.</li>
              <li><strong>Neglecting related terms:</strong> Only using one keyword variant limits topical relevance.</li>
              <li><strong>Forgetting user intent:</strong> A page optimized for the wrong intent will not convert regardless of density.</li>
            </ul>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Your Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your content here..."
              className="w-full h-52 px-4 py-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">{wordCount} words, {content.length} characters</p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
              <Search className="w-4 h-4 text-primary" />
              Target Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter target keyword..."
              className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {topKeywords.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Top Keywords (excluding short words)
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {topKeywords.map(({ word, count }) => (
                  <div key={word} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                    <span className="text-foreground">{word}</span>
                    <span className="text-muted-foreground">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Type className="w-3 h-3 text-primary" />
                Word Count
              </p>
              <p className="text-2xl font-bold">{wordCount}</p>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                <Hash className="w-3 h-3 text-primary" />
                Frequency
              </p>
              <p className="text-2xl font-bold">{keywordFrequency}</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-1">
              <BarChart3 className="w-4 h-4 text-primary" />
              Keyword Density
            </p>
            <p className="text-4xl font-extrabold text-primary">{density.toFixed(2)}%</p>
            <div className={`flex items-center justify-center gap-1 mt-2 text-sm font-medium ${score.color}`}>
              {score.icon}
              {score.label}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Phrase Density Analysis
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">2-3 Word Phrase Density</span>
                <span className="font-medium">{phraseDensity.twoWord}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">3-4 Word Phrase Density</span>
                <span className="font-medium">{phraseDensity.threeWord}</span>
              </div>
            </div>
          </div>

          {keyword && occurrences.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Keyword Occurrences ({occurrences.length} total)
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {occurrences.slice(0, 20).map((pos, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground">Occurrence #{i + 1}</span>
                    <span className="font-mono text-xs">Position {pos}</span>
                  </div>
                ))}
                {occurrences.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    ...and {occurrences.length - 20} more occurrences
                  </p>
                )}
              </div>
            </div>
          )}

          {!keyword && (
            <div className="bg-muted/50 border border-dashed border-border rounded-xl p-6 text-center">
              <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Enter a target keyword above to see density analysis.</p>
            </div>
          )}
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