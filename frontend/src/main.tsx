import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LanguageProvider } from "./components/LanguageProvider";
import { PageError } from "./components/PageError";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ErrorBoundary fallback={<PageError />}>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  </StrictMode>,
);
