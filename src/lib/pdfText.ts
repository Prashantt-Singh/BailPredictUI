import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Vite-recommended worker wiring for pdfjs-dist (module worker).
// This avoids runtime "workerSrc" resolution issues on Windows + Vite.
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export async function extractPdfText(file: File, maxPages = 25): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await getDocument({ data: buf }).promise;

  const pages = Math.min(doc.numPages ?? 0, maxPages);
  const chunks: string[] = [];

  for (let i = 1; i <= pages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items ?? [])
      .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
      .filter(Boolean)
      .join(' ');
    if (pageText.trim()) chunks.push(pageText);
  }

  return chunks.join('\n\n').trim();
}

