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
      ],
    },
  );

  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  // Detect book title / author from first title-like nodes
  let title = "Untitled Book";
  let author = "";
  const titleEl = root.querySelector("h1.book-title");
  if (titleEl) {
    title = titleEl.textContent?.trim() || title;
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
  const nodes = Array.from(root.children);
  for (const node of nodes) {
    if (node.tagName === "H1") {
      if (current) chapters.push(current);
      current = { title: node.textContent?.trim() || "Chapter", html: "" };
    } else {
      if (!current) current = { title: "Prologue", html: "" };
      current.html += node.outerHTML;
    }
  }
  if (current) chapters.push(current);

  if (chapters.length === 0) {
    chapters.push({ title: "Chapter 1", html: root.innerHTML });
  }

  // Fallback title from first h1
  if (title === "Untitled Book" && chapters[0]) {
    title = chapters[0].title;
  }

  return { title, author, chapters };
}