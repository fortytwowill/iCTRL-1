const DEFAULT_PUBLIC_APP_URL = "https://ictrl.app";

const LOCAL_DEVELOPMENT_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]);

type ResolvePublicAppUrlOptions = {
  configuredUrl?: string | null;
  currentOrigin?: string | null;
  currentHostname?: string | null;
};

function normalizeBaseUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(url.trim());

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }

    parsedUrl.hash = "";
    parsedUrl.search = "";

    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "");
    return `${parsedUrl.origin}${normalizedPath === "/" ? "" : normalizedPath}`;
  } catch {
    return null;
  }
}

function isLocalDevelopmentHostname(hostname: string | null | undefined): boolean {
  return Boolean(hostname && LOCAL_DEVELOPMENT_HOSTNAMES.has(hostname));
}

export function resolvePublicAppUrl({
  configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL,
  currentOrigin = typeof window !== "undefined" ? window.location.origin : null,
  currentHostname = typeof window !== "undefined" ? window.location.hostname : null,
}: ResolvePublicAppUrlOptions = {}): string {
  const normalizedConfiguredUrl = normalizeBaseUrl(configuredUrl);
  if (normalizedConfiguredUrl) {
    return normalizedConfiguredUrl;
  }

  if (isLocalDevelopmentHostname(currentHostname)) {
    return normalizeBaseUrl(currentOrigin) ?? DEFAULT_PUBLIC_APP_URL;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function buildPublicAppUrl(
  path: string,
  options?: ResolvePublicAppUrlOptions,
): string {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, `${resolvePublicAppUrl(options)}/`).toString();
}

export function getAuthCallbackType(hash: string | null | undefined): string | null {
  if (!hash) {
    return null;
  }

  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
  const hashType = hashParams.get("type");
  return hashType?.trim() || null;
}
