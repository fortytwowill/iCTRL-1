export type LoginMode = "signin" | "signup";

type LocationLike = {
  pathname?: string;
  search?: string;
  hash?: string;
};

const APP_ORIGIN = "https://inventoryctrl.local";

export function getSafeInternalPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  const url = new URL(path, APP_ORIGIN);
  if (url.origin !== APP_ORIGIN || url.pathname === "/login") {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function getSafePathFromLocation(locationLike: LocationLike | null | undefined): string | null {
  if (!locationLike) return null;
  const { pathname, search, hash } = locationLike;
  if (!pathname) return null;
  return getSafeInternalPath(`${pathname}${search ?? ""}${hash ?? ""}`);
}

export function buildLoginHref({
  mode,
  next,
}: {
  mode?: LoginMode;
  next?: string | null;
}): string {
  const params = new URLSearchParams();
  if (mode && mode !== "signin") {
    params.set("mode", mode);
  }
  const safeNext = getSafeInternalPath(next);
  if (safeNext) {
    params.set("next", safeNext);
  }
  const qs = params.toString();
  return `/login${qs ? `?${qs}` : ""}`;
}

export function getLoginMode(value: string | null | undefined): LoginMode {
  return value === "signup" ? "signup" : "signin";
}