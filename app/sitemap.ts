import { MetadataRoute } from "next";
import { toolsRegistry } from "@/data/registry";

const BASE_URL = "https://calcoder.vercel.app";

function sanitizeUrl(path: string): string | null {
    if (typeof path !== "string") return null;
    const trimmed = path.trim();
    if (trimmed === "") return BASE_URL;
    if (!trimmed.startsWith("/")) return null;
    if (trimmed.includes("undefined") || trimmed.includes("null")) return null;
    if (/[\s<>"']/.test(trimmed)) return null;
    return `${BASE_URL}${trimmed}`;
}

function xmlEscape(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export default function sitemap(): MetadataRoute.Sitemap {
    const seen = new Set<string>();
    const result: MetadataRoute.Sitemap = [];

    const staticPages = [
        "",
        "/finance",
        "/marketing",
        "/developer",
        "/media",
        "/about",
        "/contact",
        "/terms",
        "/privacy-policy",
        "/sitemap",
    ];

    for (const page of staticPages) {
        const url = sanitizeUrl(page);
        if (url && !seen.has(url)) {
            seen.add(url);
            result.push({ url: xmlEscape(url) });
        }
    }

    for (const tool of toolsRegistry) {
        if (!tool.href || typeof tool.href !== "string") continue;
        const url = sanitizeUrl(tool.href);
        if (url && !seen.has(url)) {
            seen.add(url);
            result.push({ url: xmlEscape(url) });
        }
    }

    return result;
}
