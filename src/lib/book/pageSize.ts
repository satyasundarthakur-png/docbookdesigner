// Standard print page sizes — dimensions from professional book publishing specs
// Screen: 96dpi → 1pt = 1.333px, 1pc = 16px, 1in = 96px, 1mm = 3.7795px

export type PageSizeId = 'a4' | 'a5' | 'us-letter' | 'us-trade' | 'b5' | 'pocket';

export interface PageSize {
  id: PageSizeId;
  label: string;
  description: string;
  // Physical
  widthPx: number;
  heightPx: number;
  // Margins (px) — inner/outer asymmetric for binding gutter
  marginTopPx: number;
  marginBottomPx: number;
  marginInnerPx: number;   // spine side (right on even, left on odd)
  marginOuterPx: number;   // foredge side
  // Typography — from Krantz/professional book class specs
  bodyFontSizePt: number;  // pt
  bodyFontSizePx: number;  // px (pt × 1.333)
  leadingPt: number;       // pt — body leading
  leadingPx: number;       // px
  chapterNumPt: number;    // pt — "Chapter N" label
  chapterTitlePt: number;  // pt — chapter heading (Krantz: 18/20)
  chapterTitlePx: number;
  sectionTitlePt: number;  // pt — h2 (Krantz: 12/14)
  sectionTitlePx: number;
  subSectionPt: number;    // pt — h3 (Krantz: 11/13)
  coverTitlePt: number;
  coverTitlePx: number;
  coverAuthorPt: number;
  coverAuthorPx: number;
  // Print @page CSS
  cssWidth: string;
  cssHeight: string;
  cssMargin: string;        // top right bottom left
}

// Helper: pt to px (at 96dpi: 1pt = 96/72 px = 1.3333px)
const pt = (n: number) => Math.round(n * 1.3333);

export const PAGE_SIZES: Record<PageSizeId, PageSize> = {

  // ── A5 ── 148×210mm — most popular novel/trade size outside US
  // Margins: top 20mm, bottom 25mm, inner 20mm, outer 15mm
  a5: {
    id: 'a5', label: 'A5', description: '148 × 210 mm · Popular book size',
    widthPx: 559, heightPx: 794,
    marginTopPx: 76, marginBottomPx: 94, marginInnerPx: 76, marginOuterPx: 57,
    bodyFontSizePt: 10.5, bodyFontSizePx: pt(10.5),
    leadingPt: 14, leadingPx: pt(14),
    chapterNumPt: 8, chapterTitlePt: 16, chapterTitlePx: pt(16),
    sectionTitlePt: 11, sectionTitlePx: pt(11),
    subSectionPt: 10,
    coverTitlePt: 28, coverTitlePx: pt(28),
    coverAuthorPt: 14, coverAuthorPx: pt(14),
    cssWidth: '148mm', cssHeight: '210mm',
    cssMargin: '20mm 15mm 25mm 20mm',
  },

  // ── A4 ── 210×297mm — international document/academic standard
  // Margins: top 25mm, bottom 30mm, inner 25mm, outer 20mm
  a4: {
    id: 'a4', label: 'A4', description: '210 × 297 mm · International standard',
    widthPx: 794, heightPx: 1123,
    marginTopPx: 94, marginBottomPx: 113, marginInnerPx: 94, marginOuterPx: 76,
    bodyFontSizePt: 11, bodyFontSizePx: pt(11),
    leadingPt: 15, leadingPx: pt(15),
    chapterNumPt: 9, chapterTitlePt: 18, chapterTitlePx: pt(18),
    sectionTitlePt: 12, sectionTitlePx: pt(12),
    subSectionPt: 11,
    coverTitlePt: 36, coverTitlePx: pt(36),
    coverAuthorPt: 16, coverAuthorPx: pt(16),
    cssWidth: '210mm', cssHeight: '297mm',
    cssMargin: '25mm 20mm 30mm 25mm',
  },

  // ── US Letter ── 8.5×11in — North American documents
  // Margins: top 1in, bottom 1in, inner 1.25in, outer 1in
  'us-letter': {
    id: 'us-letter', label: 'US Letter', description: '8.5 × 11 in · North American standard',
    widthPx: 816, heightPx: 1056,
    marginTopPx: 96, marginBottomPx: 96, marginInnerPx: 120, marginOuterPx: 96,
    bodyFontSizePt: 12, bodyFontSizePx: pt(12),
    leadingPt: 16, leadingPx: pt(16),
    chapterNumPt: 10, chapterTitlePt: 20, chapterTitlePx: pt(20),
    sectionTitlePt: 13, sectionTitlePx: pt(13),
    subSectionPt: 12,
    coverTitlePt: 40, coverTitlePx: pt(40),
    coverAuthorPt: 18, coverAuthorPx: pt(18),
    cssWidth: '8.5in', cssHeight: '11in',
    cssMargin: '1in 1in 1in 1.25in',
  },

  // ── US Trade 6×9 ── Professional novel standard (Krantz class spec)
  // Exact from krantz.cls: textwidth=28pc, textheight=45pc
  // oddsidemargin=1.1875in, body 12pt/14pt, chapter title 18/20pt
  'us-trade': {
    id: 'us-trade', label: 'US Trade', description: '6 × 9 in · Standard novel (Krantz spec)',
    widthPx: 576, heightPx: 864,
    // inner=1.1875in=114px, outer = 576-114-448=14 → approx 0.75in outer, inner 1.25in
    marginTopPx: 96, marginBottomPx: 96, marginInnerPx: 114, marginOuterPx: 72,
    // Krantz body: 12pt / 14pt leading
    bodyFontSizePt: 12, bodyFontSizePx: pt(12),
    leadingPt: 14, leadingPx: pt(14),
    // Krantz: ChapNumFont 24/24, ChapTitleFont 18/20, SectionHeadFont 12/14
    chapterNumPt: 24, chapterTitlePt: 18, chapterTitlePx: pt(18),
    sectionTitlePt: 12, sectionTitlePx: pt(12),
    subSectionPt: 11,
    coverTitlePt: 32, coverTitlePx: pt(32),
    coverAuthorPt: 14, coverAuthorPx: pt(14),
    cssWidth: '6in', cssHeight: '9in',
    cssMargin: '1in 0.75in 1in 1.1875in',
  },

  // ── B5 ── 176×250mm — academic textbooks and journals
  // Margins: top 22mm, bottom 28mm, inner 22mm, outer 17mm
  b5: {
    id: 'b5', label: 'B5', description: '176 × 250 mm · Academic & textbooks',
    widthPx: 665, heightPx: 945,
    marginTopPx: 83, marginBottomPx: 106, marginInnerPx: 83, marginOuterPx: 64,
    bodyFontSizePt: 11, bodyFontSizePx: pt(11),
    leadingPt: 15, leadingPx: pt(15),
    chapterNumPt: 9, chapterTitlePt: 18, chapterTitlePx: pt(18),
    sectionTitlePt: 12, sectionTitlePx: pt(12),
    subSectionPt: 11,
    coverTitlePt: 30, coverTitlePx: pt(30),
    coverAuthorPt: 14, coverAuthorPx: pt(14),
    cssWidth: '176mm', cssHeight: '250mm',
    cssMargin: '22mm 17mm 28mm 22mm',
  },

  // ── Pocket ── 4.25×6.87in — mass market paperback
  // Tight margins: top 0.5in, bottom 0.6in, inner 0.55in, outer 0.4in
  pocket: {
    id: 'pocket', label: 'Pocket', description: '4.25 × 6.87 in · Mass market paperback',
    widthPx: 408, heightPx: 660,
    marginTopPx: 48, marginBottomPx: 58, marginInnerPx: 53, marginOuterPx: 38,
    bodyFontSizePt: 9.5, bodyFontSizePx: pt(9.5),
    leadingPt: 13, leadingPx: pt(13),
    chapterNumPt: 8, chapterTitlePt: 14, chapterTitlePx: pt(14),
    sectionTitlePt: 10, sectionTitlePx: pt(10),
    subSectionPt: 9.5,
    coverTitlePt: 22, coverTitlePx: pt(22),
    coverAuthorPt: 11, coverAuthorPx: pt(11),
    cssWidth: '4.25in', cssHeight: '6.87in',
    cssMargin: '0.5in 0.4in 0.6in 0.55in',
  },
};

export const DEFAULT_PAGE_SIZE: PageSizeId = 'a5';
