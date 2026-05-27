import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Wallet, Code, BarChart3, Image, Zap, Globe, Smartphone, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Calcoder",
  description: "Calcoder is a free suite of online calculators and tools for finance, marketing, development, and media. No signup required.",
};

const features = [
  { icon: Zap, title: "Lightning Fast", description: "All tools run directly in your browser. No waiting, no server delays." },
  { icon: Globe, title: "100% Free", description: "Every tool is completely free to use. No hidden charges, no subscriptions." },
  { icon: Smartphone, title: "Mobile Friendly", description: "Responsive design works perfectly on phones, tablets, and desktops." },
  { icon: Calculator, title: "No Signup Needed", description: "Start using any tool instantly. No account creation required." },
];

const categories = [
  { href: "/finance", icon: Wallet, label: "Finance Hub", color: "text-blue-500", bg: "bg-blue-500/10", tools: 29 },
  { href: "/marketing", icon: BarChart3, label: "Marketing Hub", color: "text-purple-500", bg: "bg-purple-500/10", tools: 15 },
  { href: "/developer", icon: Code, label: "Developer Hub", color: "text-emerald-500", bg: "bg-emerald-500/10", tools: 22 },
  { href: "/media", icon: Image, label: "Media & File Tools", color: "text-pink-500", bg: "bg-pink-500/10", tools: 24 },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
          <Calculator className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">About Calcoder</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A free suite of practical online tools and calculators built for students, creators, developers, and everyday users.
        </p>
      </div>

      {/* Mission */}
      <div className="glass-panel p-8 sm:p-10 rounded-2xl mb-12">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Calcoder was created to make everyday calculations and file conversions simple, fast, and accessible to everyone. 
          We believe powerful tools should not require signups, subscriptions, or complex software installations.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          From financial planning to developer utilities, marketing analytics to media file conversions, 
          Calcoder provides a growing collection of lightweight tools that work entirely in your browser.
        </p>
      </div>

      {/* Features */}
      <h2 className="text-2xl font-bold text-center mb-8">Why Calcoder?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        {features.map((feature) => (
          <div key={feature.title} className="glass-panel p-6 rounded-xl">
            <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-4">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Categories */}
      <h2 className="text-2xl font-bold text-center mb-8">Explore Our Tools</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
        {categories.map((cat) => (
          <Link key={cat.label} href={cat.href} className="glass-panel p-6 rounded-xl group hover:-translate-y-1 transition-all duration-300">
            <div className={`${cat.bg} ${cat.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
              <cat.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{cat.label}</h3>
            <p className="text-sm text-muted-foreground">{cat.tools} free tools available</p>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center bg-primary/5 border border-primary/10 rounded-2xl p-10">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-muted-foreground mb-6">No signup required. Pick a tool and start using it instantly.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">
          Browse All Tools <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
