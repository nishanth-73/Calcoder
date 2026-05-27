"use client";

import { useMemo, useState } from "react";
import { BarChart3, BookOpen, Clock, FileText, Hash, MessageSquare, Type } from "lucide-react";
import { ToolLayout } from "@/components/layout/ToolLayout";

const RELATED_TOOLS = [
  { name: "Keyword Density Checker", href: "/marketing/keyword-density-checker", desc: "Analyze keyword frequency in your content." },
  { name: "Meta Tag Preview", href: "/marketing/meta-tag-preview", desc: "Preview how your meta tags appear in search results." },
  { name: "SERP Snippet Preview", href: "/marketing/serp-snippet-preview", desc: "Preview Google search result snippets." },
  { name: "CPM Calculator", href: "/marketing/cpm-calculator", desc: "Calculate cost per mille for ad campaigns." },
];

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function countCharsWithSpaces(text: string): number {
  return text.length;
}

function countCharsWithoutSpaces(text: string): number {
  return text.replace(/\s/g, "").length;
}

function countSentences(text: string): number {
  if (!text.trim()) return 0;
  const matches = text.match(/[.!?]+/g);
  if (!matches) return text.trim().length > 0 ? 1 : 0;
  const count = matches.length;
  return Math.max(1, count);
}

function countParagraphs(text: string): number {
  if (!text.trim()) return 0;
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
}

function avgWordLength(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  return totalChars / words.length;
}

function avgSentenceLength(words: number, sentences: number): number {
  if (sentences === 0) return 0;
  return words / sentences;
}

function getReadingTime(wordCount: number): number {
  const wpm = 200;
  return Math.ceil(wordCount / wpm);
}

function getSpeakingTime(wordCount: number): number {
  const wpm = 150;
  return Math.ceil(wordCount / wpm);
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ icon, label, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
      <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function WordCounter() {
  const [text, setText] = useState("");

  const wordCount = useMemo(() => countWords(text), [text]);
  const charWithSpaces = useMemo(() => countCharsWithSpaces(text), [text]);
  const charWithoutSpaces = useMemo(() => countCharsWithoutSpaces(text), [text]);
  const sentenceCount = useMemo(() => countSentences(text), [text]);
  const paragraphCount = useMemo(() => countParagraphs(text), [text]);
  const avWordLen = useMemo(() => avgWordLength(text), [text]);
  const avSentenceLen = useMemo(() => avgSentenceLength(wordCount, sentenceCount), [wordCount, sentenceCount]);
  const readingTime = useMemo(() => getReadingTime(wordCount), [wordCount]);
  const speakingTime = useMemo(() => getSpeakingTime(wordCount), [wordCount]);
  const topKeywords = useMemo(() => getTopKeywords(text), [text]);

  return (
    <ToolLayout
      title="Word Counter"
      description="Count words, characters, sentences, and paragraphs in your text. Free online word counter for writers, students, and SEO professionals."
      category="marketing"
      faqContent={[
        {
          question: "What is a word counter tool?",
          answer: "A word counter tool analyzes text to provide detailed statistics including word count, character count, sentence count, paragraph count, reading time, and keyword frequency. It is essential for writers, students, SEO professionals, and content creators who need to meet specific length requirements or analyze their writing patterns.",
        },
        {
          question: "Why does word count matter for SEO?",
          answer: "Word count matters for SEO because studies show that comprehensive, in-depth content tends to rank higher in search results. The average first-page Google result contains around 1,400-2,000 words. However, quality matters more than quantity - a well-written 800-word article can outperform a poorly written 2,000-word article. Focus on thoroughly covering the topic.",
        },
        {
          question: "What is the ideal blog post length for SEO?",
          answer: "The ideal blog post length varies by topic and competition. For most topics, 1,500-2,500 words provides sufficient depth to comprehensively cover the subject. List posts and how-to guides work well at 1,500-2,000 words. Pillar pages and definitive guides should be 3,000-5,000+ words. Shorter posts (300-600 words) work for news and quick updates.",
        },
        {
          question: "What is average reading speed?",
          answer: "The average adult reads at approximately 200-250 words per minute (wpm) for non-technical content. Technical or complex content may be read at 100-150 wpm. Our tool uses 200 wpm for reading time estimates. For speaking time, we use 150 wpm, which aligns with average conversation and presentation pacing.",
        },
        {
          question: "How long should a blog post be?",
          answer: "The ideal blog post length depends on your goals. For SEO and organic traffic, 1,500-2,500 words is recommended. For email newsletters and social media, 300-500 words works best. For thought leadership and authoritative content, 2,000-4,000 words is appropriate. Regardless of length, ensure every paragraph adds value - avoid fluff and padding.",
        },
        {
          question: "What are character limits for meta tags?",
          answer: "Google recommends meta titles under 60 characters and meta descriptions under 160 characters. Twitter posts are limited to 280 characters. Facebook posts display approximately 250-300 characters before truncation. Meta descriptions for YouTube are limited to 160 characters. Knowing character counts helps you optimize content for each platform.",
        },
        {
          question: "How does sentence length affect readability?",
          answer: "Average sentence length significantly impacts readability. Sentences averaging 15-20 words are considered easy to read. Sentences over 25 words become difficult to follow. The best SEO content mixes short and medium-length sentences for a natural rhythm. Use your average sentence length as a guide - if it exceeds 25 words, consider breaking up longer sentences.",
        },
        {
          question: "Why track character count with and without spaces?",
          answer: "Character count with spaces matters for meta descriptions, SMS messages, and social media posts where every character counts. Character count without spaces is typically used for content analysis and comparing text density. Both metrics are useful - meta descriptions have strict limits, while writing analysis often focuses on words and sentences.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">What is a Word Counter?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A <strong>Word Counter</strong> is a free online tool that provides detailed statistics about your
              text content. Beyond simply counting words, it analyzes characters (with and without spaces),
              sentences, paragraphs, average word and sentence lengths, estimated reading and speaking times,
              and top keyword frequencies. It is an essential tool for writers, SEO professionals, students,
              and anyone who creates content for the web.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Why Word Count Matters for SEO</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Search engines tend to favor comprehensive content that thoroughly covers a topic. Multiple studies
              have shown that the average first-page Google result contains approximately 1,400-2,000 words.
              Longer content often attracts more backlinks, earns higher engagement, and signals topical
              authority to search engines. However, word count alone does not determine rankings - content
              quality, relevance, structure, and user engagement are equally important.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Ideal Content Lengths by Type</h3>
            <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Blog posts:</strong> 1,500-2,500 words for SEO; 300-500 words for newsletters</li>
                <li><strong>Pillar pages and guides:</strong> 3,000-5,000+ words for in-depth coverage</li>
                <li><strong>Product descriptions:</strong> 150-300 words per product</li>
                <li><strong>Meta descriptions:</strong> 150-160 characters</li>
                <li><strong>Social media posts:</strong> 50-200 characters for maximum engagement</li>
                <li><strong>Video scripts:</strong> 150 words per minute of video</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Reading Time and User Engagement</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Displaying estimated reading time on your blog posts can increase user engagement by setting
              clear expectations. The average web user reads at about 200 words per minute. Content that takes
              5-10 minutes to read (1,000-2,000 words) tends to have the best engagement metrics. However,
              always prioritize user needs - some topics are best covered in 500 words while others require
              5,000 words.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-8">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
            <FileText className="w-4 h-4 text-primary" />
            Your Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type your text here to analyze..."
            className="w-full h-48 px-4 py-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {wordCount} words, {charWithSpaces} characters
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard icon={<Type className="w-3 h-3 text-primary" />} label="Words" value={wordCount.toLocaleString()} />
          <StatCard icon={<Hash className="w-3 h-3 text-primary" />} label="Chars (w/ spaces)" value={charWithSpaces.toLocaleString()} />
          <StatCard icon={<Hash className="w-3 h-3 text-primary" />} label="Chars (no spaces)" value={charWithoutSpaces.toLocaleString()} />
          <StatCard icon={<MessageSquare className="w-3 h-3 text-primary" />} label="Sentences" value={sentenceCount.toLocaleString()} />
          <StatCard icon={<FileText className="w-3 h-3 text-primary" />} label="Paragraphs" value={paragraphCount.toLocaleString()} />
          <StatCard icon={<BarChart3 className="w-3 h-3 text-primary" />} label="Avg Word Length" value={avWordLen.toFixed(1)} subtitle="characters" />
          <StatCard icon={<BookOpen className="w-3 h-3 text-primary" />} label="Avg Sentence" value={avSentenceLen.toFixed(1)} subtitle="words" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-primary" />
              Reading Time
            </p>
            <p className="text-2xl font-bold">{readingTime} min</p>
            <p className="text-xs text-muted-foreground mt-0.5">at 200 wpm</p>
          </div>
          <div className="bg-white border border-border rounded-xl p-4 flex flex-col">
            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-primary" />
              Speaking Time
            </p>
            <p className="text-2xl font-bold">{speakingTime} min</p>
            <p className="text-xs text-muted-foreground mt-0.5">at 150 wpm</p>
          </div>
        </div>

        {topKeywords.length > 0 && (
          <div className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
              <BarChart3 className="w-3 h-3 text-primary" />
              Top Keywords (excluding short words)
            </p>
            <div className="space-y-1.5">
              {topKeywords.map(({ word, count }, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-border/30 last:border-0">
                  <span className="text-foreground">{word}</span>
                  <span className="text-muted-foreground">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
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