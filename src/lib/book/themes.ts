export type Theme = {
  id: string;
  name: string;
  fontBody: string;
  fontDisplay: string;
  pageBg: string;
  pageColor: string;
  accent: string;
  chapterStyle: "serif-classic" | "modern-bold" | "minimal" | "vintage" | "romance" | "ayurvedic";
};

export const THEMES: Record<string, Theme> = {
  classic: {
    id: "classic",
    name: "Classic Novel",
    fontBody: '"Lora", Georgia, serif',
    fontDisplay: '"Playfair Display", Georgia, serif',
    pageBg: "#f6f1e7",
    pageColor: "#1c1a17",
    accent: "#8a5a2b",
    chapterStyle: "serif-classic",
  },
  modern: {
    id: "modern",
    name: "Modern Press",
    fontBody: '"Inter", system-ui, sans-serif',
    fontDisplay: '"Space Grotesk", system-ui, sans-serif',
    pageBg: "#ffffff",
    pageColor: "#0b0b0b",
    accent: "#111111",
    chapterStyle: "modern-bold",
  },
  minimal: {
    id: "minimal",
    name: "Minimal White",
    fontBody: '"Source Serif 4", Georgia, serif',
    fontDisplay: '"Source Serif 4", Georgia, serif',
    pageBg: "#fafafa",
    pageColor: "#222222",
    accent: "#666666",
    chapterStyle: "minimal",
  },
  vintage: {
    id: "vintage",
    name: "Vintage Paper",
    fontBody: '"EB Garamond", Georgia, serif',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    pageBg: "#efe6d2",
    pageColor: "#2b1e10",
    accent: "#7b3f00",
    chapterStyle: "vintage",
  },
  romance: {
    id: "romance",
    name: "Romance",
    fontBody: '"Cormorant Garamond", Georgia, serif',
    fontDisplay: '"Great Vibes", cursive',
    pageBg: "#fdf4f1",
    pageColor: "#2a1620",
    accent: "#b23a6b",
    chapterStyle: "romance",
  },
  ayurvedic: {
    id: "ayurvedic",
    name: "Ayurvedic Manuscript",
    fontBody: '"EB Garamond", Georgia, serif',
    fontDisplay: '"Cormorant Garamond", Georgia, serif',
    pageBg: "#f4ead7",
    pageColor: "#1a1410",
    accent: "#8b4513",
    chapterStyle: "ayurvedic",
  },
};

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Playfair+Display:wght@700;900&family=Inter:wght@400;600;800&family=Space+Grotesk:wght@600;800&family=Source+Serif+4:wght@400;700&family=EB+Garamond:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Great+Vibes&display=swap";
