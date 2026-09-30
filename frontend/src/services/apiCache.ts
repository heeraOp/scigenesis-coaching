const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;

const CACHE_TTL = 600_000;

type CacheEntry = {
  timestamp: number;
  data: unknown;
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<Response>>();

function getUrl(input: RequestInfo | URL): string {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function isAppsScriptGet(
  input: RequestInfo | URL,
  init?: RequestInit
): boolean {
  const method = (
    init?.method ||
    (input instanceof Request ? input.method : "GET")
  ).toUpperCase();

  if (method !== "GET" || !API_URL) {
    return false;
  }

  return getUrl(input).startsWith(API_URL);
}

function createJsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function clearApiCache(): void {
  cache.clear();
}

export function installApiCache(): void {
  if (
    typeof window === "undefined" ||
    !window.fetch ||
    !API_URL
  ) {
    return;
  }

  const marker = "__sciApiCacheInstalled";

  const appWindow = window as typeof window & {
    [marker]?: boolean;
  };

  if (appWindow[marker]) {
    return;
  }

  appWindow[marker] = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = getUrl(input);

    const method = (
      init?.method ||
      (input instanceof Request ? input.method : "GET")
    ).toUpperCase();

    /*
     * Teacher actions such as save/publish/archive/update
     * must invalidate previously cached GET responses.
     */
    if (
      method !== "GET" &&
      url.startsWith(API_URL)
    ) {
      clearApiCache();
      return originalFetch(input, init);
    }

    if (!isAppsScriptGet(input, init)) {
      return originalFetch(input, init);
    }

    const now = Date.now();
    const cached = cache.get(url);

    /*
     * Return cached API data immediately when it is fresh.
     * This makes teacher-to-teacher navigation effectively instant.
     */
    if (
      cached &&
      now - cached.timestamp < CACHE_TTL
    ) {
      return createJsonResponse(cached.data);
    }

    /*
     * If another page is already requesting the same endpoint,
     * share that request instead of creating another network call.
     */
    const pending = inFlight.get(url);

    if (pending) {
      const response = await pending;
      return response.clone();
    }

    const request = originalFetch(input, init)
      .then(async (response) => {
        if (!response.ok) {
          return response;
        }

        try {
          const data = await response.clone().json();

          cache.set(url, {
            timestamp: Date.now(),
            data,
          });
        } catch {
          /*
           * Only JSON API responses are cached.
           */
        }

        return response;
      })
      .finally(() => {
        inFlight.delete(url);
      });

    inFlight.set(url, request);

    const response = await request;
    return response.clone();
  };

  console.info(
    "[SCI] API navigation cache enabled."
  );
}