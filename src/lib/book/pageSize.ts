// Standard print page sizes at 96dpi screen resolution
// Physical → screen: 1mm = 3.7795px

export type PageSizeId = 'a4' | 'a5' | 'us-letter' | 'us-trade' | 'b5' | 'pocket';

export interface PageSize {
  id: PageSizeId;
  label: string;
  description: string;
  // Screen dimensions (px at 96dpi)
  widthPx: number;
  heightPx: number;
  // Print margins (px)
  marginTopPx: number;
  marginBottomPx: number;
  marginOuterPx: number;
  marginInnerPx: number;
  // Typography
  bodyFontSize: number;   // px
  lineHeight: number;     // unitless
  chapterTitleSize: number;
  coverTitleSize: number;
  // Print @page CSS
  cssWidth: string;
  cssHeight: string;
  cssMargin: string;
}

export const PAGE_SIZES: Record<PageSizeId, PageSize> = {
  a4: {
    id: 'a4',
    label: 'A4',
    description: '210 × 297 mm — International standard',
    widthPx: 794,   // 210mm
    heightPx: 1123, // 297mm
    marginTopPx: 96,
    marginBottomPx: 96,
    marginOuterPx: 85,
    marginInnerPx: 96,
    bodyFontSize: 11.5,
    lineHeight: 1.75,
    chapterTitleSize: 28,
    coverTitleSize: 42,
    cssWidth: '210mm',
    cssHeight: '297mm',
    cssMargin: '25mm 22mm 25mm 25mm',
  },
  a5: {
    id: 'a5',
    label: 'A5',
    description: '148 × 210 mm — Popular book size',
    widthPx: 559,   // 148mm
    heightPx: 794,  // 210mm
    marginTopPx: 64,
    marginBottomPx: 64,
    marginOuterPx: 56,
    marginInnerPx: 64,
    bodyFontSize: 10,
    lineHeight: 1.7,
    chapterTitleSize: 22,
    coverTitleSize: 32,
    cssWidth: '148mm',
    cssHeight: '210mm',
    cssMargin: '17mm 15mm 17mm 17mm',
  },
  'us-letter': {
    id: 'us-letter',
    label: 'US Letter',
    description: '8.5 × 11 in — North American standard',
    widthPx: 816,   // 8.5in
    heightPx: 1056, // 11in
    marginTopPx: 96,
    marginBottomPx: 96,
    marginOuterPx: 85,
    marginInnerPx: 96,
    bodyFontSize: 12,
    lineHeight: 1.75,
    chapterTitleSize: 28,
    coverTitleSize: 44,
    cssWidth: '8.5in',
    cssHeight: '11in',
    cssMargin: '1in 0.9in 1in 1in',
  },
  'us-trade': {
    id: 'us-trade',
    label: 'US Trade',
    description: '6 × 9 in — Standard novel size',
    widthPx: 576,   // 6in
    heightPx: 864,  // 9in
    marginTopPx: 72,
    marginBottomPx: 72,
    marginOuterPx: 62,
    marginInnerPx: 72,
    bodyFontSize: 11,
    lineHeight: 1.72,
    chapterTitleSize: 24,
    coverTitleSize: 36,
    cssWidth: '6in',
    cssHeight: '9in',
    cssMargin: '0.75in 0.65in 0.75in 0.75in',
  },
  b5: {
    id: 'b5',
    label: 'B5',
    description: '176 × 250 mm — Academic & textbooks',
    widthPx: 665,   // 176mm
    heightPx: 945,  // 250mm
    marginTopPx: 80,
    marginBottomPx: 80,
    marginOuterPx: 70,
    marginInnerPx: 80,
    bodyFontSize: 11,
    lineHeight: 1.72,
    chapterTitleSize: 26,
    coverTitleSize: 38,
    cssWidth: '176mm',
    cssHeight: '250mm',
    cssMargin: '21mm 18mm 21mm 21mm',
  },
  pocket: {
    id: 'pocket',
    label: 'Pocket',
    description: '4.25 × 6.87 in — Mass market paperback',
    widthPx: 408,
    heightPx: 660,
    marginTopPx: 52,
    marginBottomPx: 52,
    marginOuterPx: 44,
    marginInnerPx: 52,
    bodyFontSize: 9.5,
    lineHeight: 1.65,
    chapterTitleSize: 18,
    coverTitleSize: 26,
    cssWidth: '4.25in',
    cssHeight: '6.87in',
    cssMargin: '0.55in 0.46in 0.55in 0.55in',
  },
};

export const DEFAULT_PAGE_SIZE: PageSizeId = 'a5';
