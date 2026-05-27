"use client";

import { useState, useMemo } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check } from "lucide-react";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
  "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
  "et", "dolore", "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam",
  "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut",
  "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
  "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse",
  "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur",
  "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa",
  "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum",
  "fusce", "dapibus", "tellus", "ac", "cursus", "commodo", "tortor",
  "mauris", "condimentum", "nibh", "ut", "fermentum", "massa", "justo",
  "sit", "amet", "risus", "nullam", "quis", "ante", "et", "ultrices",
  "posuere", "cubilia", "curae", "donec", "vel", "mauris", "pretium",
  "ultricies", "nisi", "nullam", "ac", "tortor", "vitae", "purus",
  "faucibus", "ornare", "suspendisse", "potenti", "vivamus", "arcu",
  "felis", "bibendum", "ut", "tristique", "et", "mattis", "id", "massa",
  "cras", "semper", "auctor", "neque", "vitae", "tempus", "quam",
  "pellentesque", "nec", "nam", "aliquam", "sem", "et", "tortor",
  "consequat", "id", "porta", "nibh", "venenatis", "cras", "sed", "felis",
  "eget", "velit", "aliquet", "sagittis", "id", "consectetur", "purus",
  "ut", "faucibus", "pulvinar", "elementum", "integer", "enim", "neque",
  "volutpat", "ac", "tincidunt", "vitae", "semper", "quis", "lectus",
  "nulla", "at", "volutpat", "diam", "ut", "venenatis", "tellus", "in",
  "metus", "vulputate", "eu", "scelerisque", "felis", "imperdiet",
  "proin", "fermentum", "leo", "vel", "orci", "porta", "non", "pulvinar",
  "neque", "laoreet", "suspendisse", "interdum", "consectetur", "libero",
  "id", "faucibus", "nisl", "tincidunt", "eget", "nullam", "non", "nisi",
  "est", "sit", "amet", "facilisis", "magna", "etiam", "tempor", "orci",
  "eu", "lobortis", "elementum", "nibh", "tellus", "molestie", "nunc",
  "non", "blandit", "massa", "enim", "nec", "dui", "nunc", "mattis",
  "enim", "ut", "tellus", "elementum", "sagittis", "vitae", "et", "leo",
  "arcu", "risus", "quis", "varius", "quam", "quisque", "id", "diam",
  "vel", "quam", "elementum", "pulvinar", "etiam", "non", "quam", "lacus",
  "suspendisse", "faucibus", "interdum", "posuere", "lorem", "ipsum",
  "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "duis",
  "tristique", "sollicitudin", "nibh", "sit", "amet", "commodo", "nulla",
  "facilisi", "nullam", "vehicula", "ipsum", "a", "arcu", "cursus",
  "vitae", "congue", "mauris", "rhoncus", "aenean", "vel", "elit",
  "scelerisque", "mauris", "pellentesque", "pulvinar", "pellentesque",
  "habitant", "morbi", "tristique", "senectus", "et", "netus", "et",
  "malesuada", "fames", "ac", "turpis", "egestas", "maecenas", "pharetra",
  "convallis", "posuere", "morbi", "leo", "urna", "molestie", "at",
  "elementum", "eu", "facilisis", "sed", "odio", "morbi", "quis", "commodo",
  "odio", "aenean", "sed", "adipiscing", "diam", "donec", "adipiscing",
  "tristique", "risus", "nec", "feugiat", "in", "fermentum", "posuere",
  "urna", "nec", "tincidunt", "praesent", "semper", "feugiat", "nibh",
  "sed", "pulvinar", "proin", "gravida", "hendrerit", "lectus", "a",
];

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateParagraph(
  wordCount: number,
  startWithLorem: boolean,
  isFirst: boolean
): string {
  const words: string[] = [];
  const available = [...LOREM_WORDS];

  if (isFirst && startWithLorem) {
    words.push(
      ..."Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua"
        .split(" ")
        .slice(0, Math.min(15, wordCount))
    );
  }

  while (words.length < wordCount) {
    const word = available[Math.floor(Math.random() * available.length)];
    if (words.length === 0 || word !== words[words.length - 1]) {
      words.push(word);
    }
  }

  let text = words.join(" ");
  text = capitalize(text);
  if (!text.endsWith(".")) text += ".";
  return text;
}

export default function LoremIpsumGenerator() {
  const [paragraphs, setParagraphs] = useState(4);
  const [wordsPerParagraph, setWordsPerParagraph] = useState(50);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < paragraphs; i++) {
      const p = generateParagraph(wordsPerParagraph, startWithLorem, i === 0);
      result.push(includeHtml ? `<p>${p}</p>` : p);
    }
    return result.join(includeHtml ? "\n" : "\n\n");
  }, [paragraphs, wordsPerParagraph, startWithLorem, includeHtml]);

  const wordCount = useMemo(
    () => (text ? text.replace(/<[^>]*>/g, "").split(/\s+/).length : 0),
    [text]
  );
  const charCount = useMemo(
    () => (text ? text.replace(/<[^>]*>/g, "").length : 0),
    [text]
  );

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available
    }
  };

  return (
    <ToolLayout
      title="Lorem Ipsum Generator"
      description="Generate placeholder text for mockups, wireframes, and design prototypes. Customizable paragraph count and word length."
      category="developer"
      faqContent={[
        {
          question: "What is Lorem Ipsum?",
          answer:
            "Lorem Ipsum is dummy text derived from a scrambled Latin passage by Cicero circa 45 BC. It has been the standard placeholder text in the printing industry since the 1500s.",
        },
        {
          question: "Why use placeholder text?",
          answer:
            "Placeholder text allows designers and developers to focus on layout and typography without being distracted by meaningful content. It provides a realistic text block shape and length.",
        },
        {
          question: "Can I generate text with HTML tags?",
          answer:
            "Yes. Enable the 'Include HTML tags' option to wrap each paragraph in <p> tags, making it ready to copy directly into your HTML or JSX code.",
        },
        {
          question: "What does 'Start with Lorem ipsum' do?",
          answer:
            "When enabled, the first paragraph begins with the classic 'Lorem ipsum dolor sit amet...' opening. When disabled, all paragraphs start with randomized text.",
        },
        {
          question: "How many words per paragraph should I use?",
          answer:
            "The typical paragraph has 50-100 words. For realistic layouts, 50-70 words per paragraph is standard. For longer content blocks, 80-100 words works well.",
        },
        {
          question: "Is Lorem Ipsum real Latin?",
          answer:
            "The original text is a scrambled version of Cicero's 'de Finibus Bonorum et Malorum' from 45 BC. The standard passage used today contains alterations and additions not found in the original.",
        },
        {
          question: "Can I use this for production content?",
          answer:
            "Lorem Ipsum is intended for placeholder use only. Always replace it with real, meaningful content before publishing or launching your project.",
        },
        {
          question: "How is the text generated?",
          answer:
            "The generator uses a large dictionary of Latin-sounding words and randomly combines them to create readable placeholder text. Each generation produces unique output.",
        },
        {
          question: "What is the maximum number of paragraphs?",
          answer:
            "The generator supports up to 50 paragraphs with up to 100 words each, giving you a maximum of 5,000 words of placeholder text.",
        },
        {
          question: "Why does the text look like Latin but isn't?",
          answer:
            "The generator uses words derived from standard Lorem Ipsum text. While many words are based on real Latin, the combinations are random and do not form coherent sentences.",
        },
      ]}
      explanationContent={
        <div className="prose prose-slate max-w-none space-y-6">
          <h2>What is Lorem Ipsum?</h2>
          <p>
            Lorem Ipsum is the standard dummy text used in the printing,
            typesetting, and design industries. It has been the industry
            standard since the 1500s when an unknown printer scrambled a type
            specimen book to create a type specimen book.
          </p>

          <h3>History of Lorem Ipsum</h3>
          <p>
            The standard Lorem Ipsum passage is derived from Cicero&apos;s &quot;de
            Finibus Bonorum et Malorum&quot; (The Extremes of Good and Evil),
            written in 45 BC. The passage was discovered by Richard
            McClintock, a Latin professor at Hampden-Sydney College, who
            traced the text to its classical origins.
          </p>

          <h3>Why Placeholder Text Matters</h3>
          <p>
            During design and development, using placeholder text helps
            stakeholders focus on visual elements rather than content. It
            provides realistic text blocks that demonstrate how the final
            content will look, without the distraction of readable copy.
          </p>

          <h3>Generating Realistic Text Blocks</h3>
          <p>
            The Lorem Ipsum Generator creates natural-looking text blocks by
            combining words from a large dictionary of Latin-sounding terms.
            The generator uses random selection with basic grammar rules to
            produce text that reads naturally.
          </p>

          <h3>Customization Options</h3>
          <ul>
            <li>
              <strong>Paragraphs:</strong> Control the number of paragraphs
              from 1 to 50
            </li>
            <li>
              <strong>Words Per Paragraph:</strong> Set the length of each
              paragraph from 50 to 100 words
            </li>
            <li>
              <strong>Start with Lorem Ipsum:</strong> Begin the first
              paragraph with the classic opening phrase
            </li>
            <li>
              <strong>HTML Tags:</strong> Wrap each paragraph in &lt;p&gt;
              tags for direct use in HTML
            </li>
          </ul>

          <h3>Use Cases for Lorem Ipsum</h3>
          <ul>
            <li>
              <strong>Web Design Mockups:</strong> Fill content areas in
              wireframes and prototypes
            </li>
            <li>
              <strong>Print Layout Design:</strong> Test typography and layout
              in brochures, magazines, and books
            </li>
            <li>
              <strong>UI/UX Prototyping:</strong> Demonstrate text placement
              in app and website interfaces
            </li>
            <li>
              <strong>Template Development:</strong> Create realistic content
              blocks in CMS and email templates
            </li>
            <li>
              <strong>Typography Testing:</strong> Evaluate font families,
              sizes, and line spacing
            </li>
          </ul>

          <h3>Best Practices</h3>
          <p>
            While Lorem Ipsum is useful for design phases, always replace it
            with real content before launch. Consider the content length -
            Lorem Ipsum often contains more words than the actual content
            that will be used, which can lead to layout issues if not adjusted
            later.
          </p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="lorem-paragraphs"
            >
              Paragraphs
            </label>
            <input
              id="lorem-paragraphs"
              type="number"
              min={1}
              max={50}
              value={paragraphs}
              onChange={(e) =>
                setParagraphs(
                  Math.min(50, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-20 p-2 bg-white border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="lorem-words"
            >
              Words / Paragraph
            </label>
            <input
              id="lorem-words"
              type="number"
              min={10}
              max={100}
              value={wordsPerParagraph}
              onChange={(e) =>
                setWordsPerParagraph(
                  Math.min(100, Math.max(10, parseInt(e.target.value) || 10))
                )
              }
              className="w-24 p-2 bg-white border border-border rounded-lg text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="rounded"
            />
            Start with &ldquo;Lorem ipsum&rdquo;
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={includeHtml}
              onChange={(e) => setIncludeHtml(e.target.checked)}
              className="rounded"
            />
            Include HTML tags
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground space-x-4">
            <span>Words: {wordCount}</span>
            <span>Characters: {charCount}</span>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!text}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <textarea
          value={text}
          readOnly
          placeholder="Generated text will appear here..."
          className="w-full h-64 p-4 font-mono text-sm bg-white border border-border rounded-lg outline-none resize-y"
          spellCheck={false}
        />
      </div>
    </ToolLayout>
  );
}
