// Local PDF viewer (pdfjs-dist) — the standalone replacement for the
// artifact SDK's PdfViewer. Same props the Book page uses: a signed PDF
// URL, an initial page, Bangla labels, and prev/next navigation. Pages
// render to canvas; there is no download/print control in this viewer,
// and the reader page itself blocks copying (data-protect) and floats
// the reader's name/number watermark over every page.
//
// The page-turn controls live in a real <nav> element on purpose:
// the Book reader drives page turns by pressing this viewer's own
// prev/next buttons (stage.querySelector("nav")), so the element
// type is part of the contract — do not change it back to a div.

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfViewerLabels {
  loading: string;
  loadError: string;
  pageError: string;
  previousPage: string;
  nextPage: string;
  pageIndicator: (page: number, total: number) => string;
  navigationAriaLabel: string;
  pageAriaLabel: (page: number, total: number) => string;
}

export function PdfViewer({
  src,
  initialPage = 1,
  ariaLabel,
  labels,
  className,
}: {
  src: string;
  initialPage?: number;
  ariaLabel?: string;
  labels: PdfViewerLabels;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "page-error"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const task = pdfjsLib.getDocument({ url: src });
    task.promise
      .then((doc) => {
        if (cancelled) {
          void doc.destroy();
          return;
        }
        docRef.current = doc;
        setTotal(doc.numPages);
        setPage((p) => Math.min(Math.max(1, p), doc.numPages));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      void task.destroy();
      docRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    if (status !== "ready" || !docRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    docRef.current
      .getPage(page)
      .then((pdfPage) => {
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale: 1.5 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        pdfPage.render({ canvas, viewport }).promise.catch(() => {
          if (!cancelled) setStatus("page-error");
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("page-error");
      });
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  const canPrev = page > 1;
  const canNext = total > 0 && page < total;

  return (
    <div className={className} aria-label={ariaLabel}>
      <nav
        className="sticky top-0 z-10 mb-3 flex items-center justify-center gap-3 rounded-full bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-soft)]"
        aria-label={labels.navigationAriaLabel}
      >
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={!canPrev || status !== "ready"}
          aria-label={labels.previousPage}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--text)] disabled:opacity-40"
        >
          ←
        </button>
        <span className="min-w-24 text-center text-sm font-bold">
          {total > 0 ? labels.pageIndicator(page, total) : labels.loading}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={!canNext || status !== "ready"}
          aria-label={labels.nextPage}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-alt)] text-[var(--text)] disabled:opacity-40"
        >
          →
        </button>
      </nav>
      {status === "loading" && (
        <p className="py-16 text-center text-[var(--dim)]">{labels.loading}</p>
      )}
      {status === "error" && (
        <p className="py-16 text-center text-[var(--danger)]">
          {labels.loadError}
        </p>
      )}
      {status === "page-error" && (
        <p className="py-16 text-center text-[var(--danger)]">
          {labels.pageError}
        </p>
      )}
      <canvas
        ref={canvasRef}
        aria-label={
          total > 0 ? labels.pageAriaLabel(page, total) : undefined
        }
        className="mx-auto block h-auto w-full rounded-lg bg-white shadow-[var(--shadow-soft)]"
        style={{ display: status === "ready" ? undefined : "none" }}
      />
    </div>
  );
}
