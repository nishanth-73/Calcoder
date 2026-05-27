import Link from "next/link";
import { Calculator } from "lucide-react";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const footerSections = [
  {
    title: "Finance Hub",
    href: "/finance",
    links: [
      { label: "Investment Calculators", href: "/finance#investment-calculators" },
      { label: "Tax Calculators", href: "/finance#tax-calculators" },
      { label: "Crypto Calculators", href: "/finance#crypto-calculators" },
      { label: "Business & ROI Calculators", href: "/finance#business-calculators" },
    ],
  },
  {
    title: "Marketing Hub",
    href: "/marketing",
    links: [
      { label: "Social Media Tools", href: "/marketing#social-media-tools" },
      { label: "Ad & Revenue Tools", href: "/marketing#ad-revenue-tools" },
      { label: "SaaS Metrics Tools", href: "/marketing#saas-metrics-tools" },
      { label: "SEO Tools", href: "/marketing#seo-tools" },
    ],
  },
  {
    title: "Developer Hub",
    href: "/developer",
    links: [
      { label: "Formatters", href: "/developer#formatters" },
      { label: "Converters", href: "/developer#converters" },
      { label: "Generators", href: "/developer#generators" },
      { label: "Testing Tools", href: "/developer#testing-tools" },
    ],
  },
  {
    title: "Media & File Tools",
    href: "/media",
    links: [
      { label: "PDF Tools", href: "/media#pdf-tools" },
      { label: "Image Tools", href: "/media#image-tools" },
      { label: "File Conversion Tools", href: "/media#file-conversion-tools" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="bg-primary text-primary-foreground p-1 rounded-lg">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight">Calcoder</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              A comprehensive suite of scalable micro-tools and calculators for finance, marketing, and developers.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <Link
                href={section.href}
                className="inline-block font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {section.title}
              </Link>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Calcoder. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/sitemap" className="hover:text-primary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
