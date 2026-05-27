"use client";

import { useState, useEffect, useCallback } from "react";
import { ToolLayout } from "@/components/layout/ToolLayout";
import { Copy, Check, RotateCcw } from "lucide-react";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const PREDEFINED = [
  { name: "Red", hex: "#FF0000" },
  { name: "Crimson", hex: "#DC143C" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Yellow", hex: "#FFFF00" },
  { name: "Lime", hex: "#00FF00" },
  { name: "Green", hex: "#008000" },
  { name: "Teal", hex: "#008080" },
  { name: "Cyan", hex: "#00FFFF" },
  { name: "Deep Sky Blue", hex: "#00BFFF" },
  { name: "Dodger Blue", hex: "#1E90FF" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Navy", hex: "#000080" },
  { name: "Indigo", hex: "#4B0082" },
  { name: "Purple", hex: "#800080" },
  { name: "Magenta", hex: "#FF00FF" },
  { name: "Hot Pink", hex: "#FF69B4" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Tomato", hex: "#FF6347" },
  { name: "Salmon", hex: "#FA8072" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Brown", hex: "#A52A2A" },
  { name: "Maroon", hex: "#800000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gray", hex: "#808080" },
  { name: "Black", hex: "#000000" },
  { name: "Dark Slate Gray", hex: "#2F4F4F" },
  { name: "Slate Gray", hex: "#708090" },
];

function hexToRgb(hex: string): Rgb | null {
  const cleaned = hex.replace(/^#/, "").trim();
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleaned)) return null;
  let full = cleaned;
  if (full.length === 3) {
    full = full
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const diff = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    if (max === rr) h = ((gg - bb) / diff + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / diff + 2) / 6;
    else h = ((rr - gg) / diff + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const hh = ((h % 360) + 360) % 360 / 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;

  if (ss === 0) {
    const v = Math.round(ll * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;

  return {
    r: Math.round(hue2rgb(p, q, hh + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hh) * 255),
    b: Math.round(hue2rgb(p, q, hh - 1 / 3) * 255),
  };
}

function rgbToCss(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function hslToCss(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function isValidRgbValue(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n >= 0 && n <= 255;
}

function isValidHslH(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n >= 0 && n <= 360;
}

function isValidHslSl(v: string): boolean {
  const n = parseInt(v, 10);
  return !isNaN(n) && n >= 0 && n <= 100;
}

interface CopiedState {
  hex: boolean;
  rgb: boolean;
  hsl: boolean;
}

export default function ColorPicker() {
  const [hex, setHex] = useState("#FF5500");
  const [rgb, setRgb] = useState<Rgb>({ r: 255, g: 85, b: 0 });
  const [hsl, setHsl] = useState<Hsl>({ h: 20, s: 100, l: 50 });
  const [colorPicker, setColorPicker] = useState("#ff5500");
  const [history, setHistory] = useState<string[]>(["#FF5500"]);
  const [copied, setCopied] = useState<CopiedState>({
    hex: false,
    rgb: false,
    hsl: false,
  });
  const [hexInput, setHexInput] = useState("#FF5500");

  const syncFromHex = useCallback((h: string) => {
    const rgbVal = hexToRgb(h);
    if (rgbVal) {
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setRgb(rgbVal);
      setHsl(hslVal);
      const upper = h.toUpperCase();
      setHex(upper);
      setHexInput(upper);
      setColorPicker(upper);
    }
  }, []);

  useEffect(() => {
    syncFromHex(hex);
  }, []);

  const hexInputHandler = (val: string) => {
    setHexInput(val);
    if (val.length >= 4) {
      const rgbVal = hexToRgb(val);
      if (rgbVal) {
        const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
        setRgb(rgbVal);
        setHsl(hslVal);
        const upper = val.toUpperCase();
        setHex(upper);
        setColorPicker(upper);
        addToHistory(upper);
      }
    }
  };

  const rgbInputHandler = (channel: keyof Rgb, strVal: string) => {
    if (strVal === "") return;
    const n = parseInt(strVal, 10);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(255, n));
    const newRgb = { ...rgb, [channel]: clamped };
    setRgb(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHex(newHex);
    setHexInput(newHex);
    setHsl(newHsl);
    setColorPicker(newHex.toLowerCase());
    addToHistory(newHex);
  };

  const hslInputHandler = (
    channel: keyof Hsl,
    strVal: string,
    max: number
  ) => {
    if (strVal === "") return;
    const n = parseInt(strVal, 10);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(max, n));
    const newHsl = { ...hsl, [channel]: clamped };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setRgb(newRgb);
    setHex(newHex);
    setHexInput(newHex);
    setColorPicker(newHex.toLowerCase());
    addToHistory(newHex);
  };

  const addToHistory = (color: string) => {
    setHistory((prev) => {
      const filtered = prev.filter(
        (c) => c.toLowerCase() !== color.toLowerCase()
      );
      return [color, ...filtered].slice(0, 10);
    });
  };

  const pickFromPalette = (color: string) => {
    setHexInput(color);
    const rgbVal = hexToRgb(color);
    if (rgbVal) {
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setRgb(rgbVal);
      setHsl(hslVal);
      setHex(color);
      setColorPicker(color.toLowerCase());
      addToHistory(color);
    }
  };

  const handleColorPickerChange = (val: string) => {
    setColorPicker(val);
    setHexInput(val.toUpperCase());
    const rgbVal = hexToRgb(val);
    if (rgbVal) {
      const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
      setRgb(rgbVal);
      setHsl(hslVal);
      setHex(val.toUpperCase());
      addToHistory(val.toUpperCase());
    }
  };

  const copyFormat = (
    format: "hex" | "rgb" | "hsl",
    text: string
  ) => {
    navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [format]: true }));
    setTimeout(
      () => setCopied((prev) => ({ ...prev, [format]: false })),
      2000
    );
  };

  const resetColor = () => {
    const h = "#FF5500";
    setHexInput(h);
    setHex(h);
    setColorPicker("ff5500");
    const rgbVal = hexToRgb(h);
    if (rgbVal) {
      setRgb(rgbVal);
      setHsl(rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b));
    }
    setHistory(["#FF5500"]);
  };

  const hexRgb = hexToRgb(hex);
  const luminance = hexRgb
    ? (0.299 * hexRgb.r + 0.587 * hexRgb.g + 0.114 * hexRgb.b) / 255
    : 0.5;
  const whiteContrast = luminance < 0.5 ? "pass" : "fail";
  const blackContrast = luminance >= 0.5 ? "pass" : "fail";

  return (
    <ToolLayout
      title="Color Picker"
      description="Pick, convert, and preview colors in HEX, RGB, and HSL formats."
      category="developer"
      faqContent={[
        {
          question: "What is RGB color?",
          answer:
            "RGB (Red, Green, Blue) is an additive color model where colors are created by combining red, green, and blue light at varying intensities (0-255 each).",
        },
        {
          question: "What is HSL color?",
          answer:
            "HSL (Hue, Saturation, Lightness) represents colors by hue (0-360°), saturation (0-100%), and lightness (0-100%), making it more intuitive for humans to work with.",
        },
        {
          question: "How do I convert hex to RGB?",
          answer:
            "Split the 6-digit hex into three 2-digit pairs, convert each from hexadecimal to decimal (0-255), and you have RGB values.",
        },
        {
          question: "What are web safe colors?",
          answer:
            "Web safe colors are the 216 colors that display consistently across different browsers and operating systems, using hex values of 00, 33, 66, 99, CC, and FF.",
        },
        {
          question: "How do I ensure color contrast?",
          answer:
            "Use the contrast checker in this tool. WCAG AA requires a contrast ratio of 4.5:1 for normal text and 3:1 for large text.",
        },
        {
          question: "What is the difference between RGB and HSL?",
          answer:
            "RGB specifies color by light intensity of three channels. HSL specifies by hue (color type), saturation (purity), and lightness (brightness), which aligns with human perception.",
        },
        {
          question: "How do I pick colors for my website?",
          answer:
            "Start with a primary color, then use complementary or analogous colors for harmony. Tools like this help you explore and test color combinations.",
        },
        {
          question: "What is a color palette?",
          answer:
            "A color palette is a set of colors chosen to work together in a design. This tool provides common web colors as a starting point.",
        },
        {
          question: "How do I use color in CSS?",
          answer:
            "CSS supports hex (#ff0000), rgb (rgb(255, 0, 0)), hsl (hsl(0, 100%, 50%)), and named colors. Use the output from this tool directly in your stylesheets.",
        },
        {
          question: "What is the best format for web colors?",
          answer:
            "Hex is most common in CSS. RGB is useful when you need opacity (rgba). HSL is great for programmatic color manipulation.",
        },
      ]}
      explanationContent={
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">About Color Picker</h2>
          <section>
            <h3 className="text-xl font-semibold mb-2">Understanding the RGB Color Model</h3>
            <p>RGB is an additive color model where red, green, and blue light combine to create colors. Each channel ranges from 0 (none) to 255 (full intensity), yielding over 16 million possible colors.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Understanding the HSL Color Model</h3>
            <p>HSL describes colors by hue (the color type on a 360° wheel), saturation (color purity), and lightness (brightness). It's more intuitive for humans to reason about.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Hexadecimal Color Notation</h3>
            <p>Hex colors use six hexadecimal digits (or three for shorthand): #RRGGBB. Each pair represents the red, green, and blue channels in base-16 (00 to FF).</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">How Color Conversion Works</h3>
            <p>Converting between color spaces involves mathematical formulas. Hex to RGB splits pairs and converts. RGB to HSL involves finding the dominant channel and calculating saturation and lightness.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Web Safe Colors</h3>
            <p>Web safe colors use only hex values 00, 33, 66, 99, CC, and FF for each channel. While modern displays support millions of colors, these remain useful for consistent rendering.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Color Contrast and Accessibility</h3>
            <p>Good color contrast ensures text is readable. WCAG guidelines recommend a minimum contrast ratio of 4.5:1 for normal text. This tool includes a quick contrast check.</p>
          </section>
          <section>
            <h3 className="text-xl font-semibold mb-2">Color Theory Basics</h3>
            <p>Complementary colors (opposite on the wheel) create contrast. Analogous colors (adjacent) create harmony. Triadic colors (evenly spaced) create vibrant palettes.</p>
          </section>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-6">
          {/* Color Preview */}
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-xl border-2 border-border shadow-sm shrink-0"
              style={{ backgroundColor: hex }}
            />
            <input
              type="color"
              value={colorPicker}
              onChange={(e) => handleColorPickerChange(e.target.value)}
              className="w-16 h-16 rounded-lg cursor-pointer border border-border"
            />
            <button
              onClick={resetColor}
              className="flex items-center text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </button>
          </div>

          {/* Hex */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">HEX</label>
              <button
                onClick={() => copyFormat("hex", hex)}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                {copied.hex ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied.hex ? "Copied!" : "Copy"}
              </button>
            </div>
            <input
              type="text"
              value={hexInput}
              onChange={(e) => hexInputHandler(e.target.value)}
              placeholder="#FF0000"
              className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          {/* RGB */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">RGB</label>
              <button
                onClick={() => copyFormat("rgb", rgbToCss(rgb.r, rgb.g, rgb.b))}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                {copied.rgb ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied.rgb ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex gap-3">
              {(["r", "g", "b"] as (keyof Rgb)[]).map((ch) => (
                <div key={ch} className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1 uppercase">
                    {ch}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb[ch]}
                    onChange={(e) => rgbInputHandler(ch, e.target.value)}
                    className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HSL */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">HSL</label>
              <button
                onClick={() => copyFormat("hsl", hslToCss(hsl.h, hsl.s, hsl.l))}
                className="flex items-center text-xs text-muted-foreground hover:text-foreground"
              >
                {copied.hsl ? (
                  <Check className="w-3 h-3 mr-1" />
                ) : (
                  <Copy className="w-3 h-3 mr-1" />
                )}
                {copied.hsl ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex gap-3">
              <div className="flex-[2]">
                <label className="text-xs text-muted-foreground block mb-1">
                  H (0-360)
                </label>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={hsl.h}
                  onChange={(e) => hslInputHandler("h", e.target.value, 360)}
                  className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">
                  S (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.s}
                  onChange={(e) => hslInputHandler("s", e.target.value, 100)}
                  className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">
                  L (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={hsl.l}
                  onChange={(e) => hslInputHandler("l", e.target.value, 100)}
                  className="w-full p-3 font-mono text-sm bg-white border border-border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Predefined Palette */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Color Palette
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PREDEFINED.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => pickFromPalette(c.hex)}
                  className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform shrink-0 relative group"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                    {c.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview & History */}
        <div className="space-y-6">
          {/* Large Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preview</label>
            <div
              className="w-full h-32 rounded-xl border-2 border-border shadow-inner flex items-center justify-center"
              style={{ backgroundColor: hex }}
            >
              <span
                className="text-2xl font-bold drop-shadow-md"
                style={{
                  color:
                    luminance > 0.5 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)",
                }}
              >
                {hex}
              </span>
            </div>
          </div>

          {/* Contrast Checker */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Contrast Checker
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-4 rounded-lg border border-border text-center"
                style={{ backgroundColor: hex, color: "#FFFFFF" }}
              >
                <p className="text-lg font-bold">
                  {whiteContrast === "pass" ? "✓" : "✗"}
                </p>
                <p className="text-xs opacity-80">White Text</p>
              </div>
              <div
                className="p-4 rounded-lg border border-border text-center"
                style={{ backgroundColor: hex, color: "#000000" }}
              >
                <p className="text-lg font-bold">
                  {blackContrast === "pass" ? "✓" : "✗"}
                </p>
                <p className="text-xs opacity-80">Black Text</p>
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              CSS Values
            </label>
            <div className="space-y-2">
              <div
                className="flex justify-between items-center p-3 bg-muted/30 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => copyFormat("hex", hex)}
              >
                <code className="text-sm font-mono">{hex}</code>
                <span className="text-xs text-muted-foreground">
                  {copied.hex ? "Copied!" : "Click to copy"}
                </span>
              </div>
              <div
                className="flex justify-between items-center p-3 bg-muted/30 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() =>
                  copyFormat("rgb", rgbToCss(rgb.r, rgb.g, rgb.b))
                }
              >
                <code className="text-sm font-mono">
                  {rgbToCss(rgb.r, rgb.g, rgb.b)}
                </code>
                <span className="text-xs text-muted-foreground">
                  {copied.rgb ? "Copied!" : "Click to copy"}
                </span>
              </div>
              <div
                className="flex justify-between items-center p-3 bg-muted/30 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() =>
                  copyFormat("hsl", hslToCss(hsl.h, hsl.s, hsl.l))
                }
              >
                <code className="text-sm font-mono">
                  {hslToCss(hsl.h, hsl.s, hsl.l)}
                </code>
                <span className="text-xs text-muted-foreground">
                  {copied.hsl ? "Copied!" : "Click to copy"}
                </span>
              </div>
            </div>
          </div>

          {/* Color History */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Color History
            </label>
            <div className="flex flex-wrap gap-2">
              {history.map((c, i) => (
                <button
                  key={`${c}-${i}`}
                  onClick={() => pickFromPalette(c)}
                  className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
