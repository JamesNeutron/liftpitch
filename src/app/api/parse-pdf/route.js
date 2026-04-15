import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

// Disable the worker — in a Node.js server context there is no browser Worker
// API, so we run everything in the main thread (the "fake worker" fallback).
GlobalWorkerOptions.workerSrc = "";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    return Response.json({ text: text.trim() });
  } catch (err) {
    console.error("PDF parse error:", err);
    return Response.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
