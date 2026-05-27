"use client";

import { useState, FormEvent } from "react";
import { Mail, MessageSquare, Clock, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-2xl">
        <div className="glass-panel p-10 rounded-2xl text-center">
          <div className="bg-green-100 text-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Message Sent!</h1>
          <p className="text-muted-foreground mb-2">Thank you for reaching out. We typically respond within 24 hours.</p>
          <p className="text-sm text-muted-foreground mb-6">We will get back to you at <strong>{email}</strong>.</p>
          <button
            onClick={() => { setSubmitted(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
            className="text-primary font-medium hover:underline"
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-4xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 text-primary rounded-full mb-6">
          <Mail className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Contact Us</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Have a question, suggestion, or feedback? We would love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Form */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1.5">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1.5">Subject</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full p-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select a subject</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Advertising">Advertising</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                id="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full p-3 bg-white border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                placeholder="How can we help you?"
              />
            </div>
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4" /> Send Message</>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl">
            <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold mb-2">Response Time</h3>
            <p className="text-sm text-muted-foreground">
              We aim to respond to all inquiries within <strong>24 hours</strong> on business days.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <div className="bg-primary/10 text-primary p-3 rounded-xl w-fit mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold mb-2">Before You Ask</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Most tools have a built-in FAQ section at the bottom of their page.</li>
              <li>Check the tool description and explanation sections for usage details.</li>
              <li>All tools work client-side; no files are uploaded to our servers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
