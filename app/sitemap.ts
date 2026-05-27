import { MetadataRoute } from "next";
import { toolsRegistry } from "@/data/registry";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://calcoder.vercel.app";

    const toolPages = toolsRegistry.map((tool) => ({
        url: `${baseUrl}${tool.href}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },

        {
            url: `${baseUrl}/finance`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },

        {
            url: `${baseUrl}/marketing`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },

        {
            url: `${baseUrl}/developer`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },

        {
            url: `${baseUrl}/media`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },

        ...toolPages,
    ];
}