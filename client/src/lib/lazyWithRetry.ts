import { lazy } from "react";

export function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: any) => {
      const isChunkError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Loading chunk") ||
        error?.message?.includes("Loading CSS chunk") ||
        error?.name === "ChunkLoadError";

      if (isChunkError) {
        const reloadKey = "chunk_reload_" + window.location.pathname;
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
          return new Promise(() => {});
        }
      }

      throw error;
    })
  );
}
