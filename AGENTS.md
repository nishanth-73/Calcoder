<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Summary

## Goal
Production-harden all calculators and developer/media tools across the website with real functionality, proper file handling, rich SEO, and mobile optimization.

## Constraints & Preferences
- Do NOT redesign the website — keep the same UI system and layout structure
- Every calculator must support BOTH direct text input AND slider adjustment, synced instantly via `useNumericField` hook
- Currency selector with 11 currencies (USD, INR, EUR, GBP, AED, CAD, AUD, JPY, SGD, SAR, CHF) for all monetary calculators
- Percentage `%` must be outside the input field to prevent text overlap
- Handle edge cases: NaN, empty states, zero values, extremely large values, unicode, malformed data, decimals
- Polished results: gradient hero card, metric grid, breakdown table + pie chart merged into ONE card (not separate cards)
- Rich SEO: formula, benchmarks table, tips, FAQs (10 questions), 7 explanation sections, related tools (8 per tool)
- Developer tools: monospace textareas, dual-pane input|output layout, copy/clear/download buttons, real-time processing with 300ms debounce, syntax highlighting where viable
- Media tools: files must actually convert (not just rename MIME type), downloads must open correctly, proper Blob/MIME/extension handling, client-side processing only, drag-and-drop upload
- Performance: `useMemo` for calculations, `useCallback` for handlers, 300ms debounce for live processing, cleanup of object URLs/blobs, avoid unnecessary re-renders
- Mobile: numeric keyboard, touch-friendly sliders, stacked layouts, responsive charts, horizontal scrolling for code outputs
- Accessibility: aria attributes on sliders, keyboard support, focus states, labels, screen reader support
- Prevent: crashes, UI freezing, parsing failures, broken downloads, infinite loops, hydration issues

## Progress
### Done
- Created `lib/useNumericField.ts` hook: dual string+number state, display preserved during typing, parsed on blur, slider sync via setValue
- Migrated **29 finance calculators** to `useNumericField`
- Built **Engagement Rate Calculator** (607 lines): 7 fields, color-coded ER badge, donut chart, 10 FAQ, full SEO
- Built **6 marketing calculators** from templates: YouTube Money, Instagram Reach, TikTok Earnings, CTR, ROAS, Churn Rate — all with typing-first layout, currency selector, charts, 8+ FAQ, related tools
- Built **4 SEO tools** from templates: Keyword Density Checker (323 lines), Meta Tag Preview (288 lines), SERP Snippet Preview (302 lines), Word Counter (258 lines)
- Upgraded **8 marketing calculators** (CPM, AdSense, CPC, CAC, LTV, MRR, ARR, Burn Rate) with 11-currency system, donut pie charts, `useNumericField` migration, typing-first layout
- **All 15 marketing calculators now have 10 FAQ, gradient hero cards, and consistent metric grids**
- Merged separate breakdown+pie chart cards into one combined card in AdSense and Engagement Rate calculators
- Rebuilt ALL **22 developer tools** from 50-line placeholder templates to 300-500+ line production tools with dual-pane layout, monospace textareas, copy/clear/download, 300ms debounced processing, 8-10 FAQ, 7 SEO sections, 8 related tools
- Rebuilt ALL **9 PDF tools** with real libraries: JPG→PDF (jspdf), PDF→JPG (pdfjs-dist + canvas + jszip), PDF Compressor (pdf-lib), Merge PDF (pdf-lib), Split PDF (pdf-lib + jszip), PDF→Word (pdfjs-dist + jszip docx builder), Word→PDF (jszip + jspdf), Rotate PDF (pdf-lib), Unlock PDF (pdf-lib)
  - Fixed SSR issue: `pdfjs-dist` dynamically imported inside `processFile` to avoid `DOMMatrix is not defined` during prerendering
- Rebuilt ALL **10 image tools** with Canvas API: Image Compressor, Resize Image (x2), Crop Image, PNG→JPG (white fill for transparency), JPG→PNG, WebP Converter (bidirectional, SSR-safe), Image to Base64, Background Remover (chroma key pixel manipulation), Watermark Image (canvas text overlay)
  - Fixed SSR issue: `HTMLCanvasElement` check moved to `useEffect` to avoid prerendering crash
- Rebuilt ALL **5 file conversion tools**: MP4→MP3 (Web Audio API + WAV PCM encoding), Text→PDF (jspdf), CSV→Excel (xlsx/SheetJS), ZIP Extractor (jszip with file listing UI), File Size Converter (pure utility)
- Installed libraries: `jspdf`, `pdf-lib`, `xlsx`, `jszip`, `@types/jszip`, `pdfjs-dist`, `@types/qrcode`
- Build confirmed passing: `✓ Compiled`, `✓ TypeScript`, `✓ 108 pages`

### Blocked
- (none)

## Key Decisions
- `useNumericField` hook stores both `value` (number) and `displayValue` (raw string) — display preserves intermediate states like `"."`, `"10."`, `""` during typing; parsed number updates on blur
- All marketing calculators use consistent `grid-cols-1 xl:grid-cols-2 gap-8` breakpoint
- Currency system duplicated per calculator file rather than shared import: keeps each self-contained
- All pie charts use donut style with 3–4 colored segments, w-32 h-32, innerRadius=30 outerRadius=50 for consistency
- All developer tools use `grid-cols-1 lg:grid-cols-2 gap-6` dual-pane layout with monospace textareas (h-72 to h-96)
- Media tools use the shared `MediaTool` component from `@/components/ui/MediaTool` for upload/drag-drop/progress/download UI; each tool provides its own `processFile` callback with REAL conversion logic
- All media processing is client-side only — files never leave the device
- pdfjs-dist imported dynamically inside `processFile` callbacks to prevent SSR crashes (DOMMatrix, HTMLCanvasElement not defined in Node.js)
- For hard client-side conversions (PDF→Word, Word→PDF, MP4→MP3), use available libraries or practical alternatives

## Critical Context
- ESLint config does not do full TypeScript type-checking — only catches syntactic/unused-var issues; type errors require `next build`
- The `MediaTool` component (216 lines at `components/ui/MediaTool.tsx`) handles upload, drag-drop, progress bar, preview, error display, and download
- Recharts `width(-1)` warnings are pre-existing and harmless
- The `cn()` utility from `@/lib/utils` is used for conditional className merging (clsx/twMerge equivalent)
