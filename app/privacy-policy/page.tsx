import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Calcoder",
  description: "Calcoder privacy policy. Learn how we handle your data, cookies, and local storage.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-3xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: May 2026</p>
      </div>

      <div className="glass-panel p-8 sm:p-10 rounded-2xl prose prose-slate max-w-none">
        <h2>Introduction</h2>
        <p>
          Calcoder (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy. This Privacy Policy explains 
          how we collect, use, and protect your information when you use our website and tools.
        </p>

        <h2>Information We Collect</h2>
        <h3>No Account System</h3>
        <p>
          Calcoder does not have a user account or login system. We do not collect names, email addresses, 
          or passwords through account registration.
        </p>

        <h3>Local Storage</h3>
        <p>
          We use browser <strong>localStorage</strong> to store your preferences, including:
        </p>
        <ul>
          <li>Saved/bookmarked tools for quick access</li>
          <li>Recent search history</li>
        </ul>
        <p>
          This data stays on your device and is never sent to our servers. You can clear it anytime 
          through your browser settings.
        </p>

        <h3>File Uploads</h3>
        <p>
          When you use our Media &amp; File Tools (PDF converters, image editors, etc.), files are processed 
          entirely in your browser using client-side JavaScript. Your files are <strong>not uploaded</strong> 
          to our servers. They stay on your device until you download the result or close the page.
        </p>

        <h2>Cookies and Analytics</h2>
        <p>
          We may use cookies and similar tracking technologies to improve your experience.
        </p>
        <h3>Google AdSense</h3>
        <p>
          We use Google AdSense to display advertisements. AdSense uses cookies to serve relevant ads 
          based on your browsing history. Google&apos;s use of tracking is governed by their own 
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary"> Privacy Policy</a>.
        </p>
        <h3>Analytics</h3>
        <p>
          We may collect anonymous usage data (page views, tool usage) to help us improve the website. 
          This data cannot be used to identify you personally.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          We use the following third-party services:
        </p>
        <ul>
          <li><strong>Google AdSense</strong> - for advertising</li>
          <li><strong>Vercel</strong> - for website hosting</li>
        </ul>
        <p>
          These services have their own privacy policies governing data handling.
        </p>

        <h2>Data Sharing</h2>
        <p>
          We do <strong>not</strong> sell, trade, or share your personal information with third parties 
          for their marketing purposes. We only share data with the service providers listed above 
          as necessary to operate the website.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect personal 
          information from children.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page 
          with an updated date.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy, please <a href="/contact" className="text-primary">contact us</a>.
        </p>
      </div>
    </div>
  );
}
