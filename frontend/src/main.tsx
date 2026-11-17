import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";

// One shared react-query client for the whole app (every page invalidates
// its queries through it after mutations).
const queryClient = new QueryClient();

const rootEl = document.querySelector<HTMLElement>("[data-generated-space-root]");
if (!rootEl) {
  throw new Error("missing generated space root element");
}

// Keep `<QueryClientProvider client={queryClient}>` wrapping the app, and
// keep BOTH the `hatch-space-root` class AND the `data-hatch-space-root`
// attribute on the outer div (mobile safe-area insets / viewport sizing
// select on them — dropping either breaks layout silently).
createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="hatch-space-root" data-hatch-space-root>
        <App />
      </div>
    </QueryClientProvider>
  </StrictMode>,
);
