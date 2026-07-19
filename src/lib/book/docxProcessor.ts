import mammoth from "mammoth";

export type Chapter = { title: string; html: string };
export type Book = { title: string; author: string; chapters: Chapter[] };

export async function processDocx(buffer: ArrayBuffer): Promise<Book> {
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1.book-title:fresh",
        "p[style-name='Subtitle'] => p.book-subtitle:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Verse'] => div.verse:fresh",
        "p[style-name='Translator Note'] => p.translator-note:fresh",
      ],
    },
  );

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  // Detect book title / author from styled Title/Subtitle nodes
  let title = "";
  let author = "";
  const titleEl = root.querySelector("h1.book-title");
  if (titleEl) {
    title = titleEl.textContent?.trim() || "";
    titleEl.remove();
  }
  const subEl = root.querySelector("p.book-subtitle");
  if (subEl) {
    author = subEl.textContent?.trim() || "";
    subEl.remove();
  }

  // Split into chapters by h1
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  let preChapterHtml = "";

  const nodes = Array.from(root.children);
  for (const node of nodes) {
    if (node.tagName === "H1") {
      if (current) {
        chapters.push(current);
      } else if (preChapterHtml.trim()) {
        // Content before first H1: add as unnamed intro chapter
        // Use first non-empty text as auto-title, fallback to "Introduction"
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = preChapterHtml;
        const firstText = tempDiv.textContent?.trim().split(/\s+/).slice(0, 4).join(" ") || "Introduction";
        chapters.push({ title: firstText, html: preChapterHtml });
        preChapterHtml = "";
      }
      current = { title: node.textContent?.trim() || "Chapter", html: "" };
    } else {
      if (current) {
        current.html += node.outerHTML;
      } else {
        preChapterHtml += node.outerHTML;
      }
    }
  }
  if (current) chapters.push(current);

  // If still no chapters, treat entire doc as one chapter
  if (chapters.length === 0) {
    chapters.push({ title: "Chapter 1", html: root.innerHTML });
  }

  // Title fallback: first chapter heading, then filename (set by caller)
  if (!title && chapters[0]) {
    title = chapters[0].title;
  }
  if (!title) title = "Untitled Book";

  return { title, author, chapters };
}
