import { describe, expect, it } from "vitest";
import { buildPublicAppUrl, resolvePublicAppUrl } from "@/lib/authUrls";

describe("authUrls", () => {
  it("defaults to the canonical production URL when no override is provided", () => {
    expect(
      resolvePublicAppUrl({
        configuredUrl: null,
        currentOrigin: "https://www.ictrl.app",
        currentHostname: "www.ictrl.app",
      }),
    ).toBe("https://ictrl.app");
  });

  it("uses the current localhost origin during local development", () => {
    expect(
      resolvePublicAppUrl({
        configuredUrl: "",
        currentOrigin: "http://localhost:5173",
        currentHostname: "localhost",
      }),
    ).toBe("http://localhost:5173");
  });

  it("normalizes configured URLs before building auth redirects", () => {
    expect(
      buildPublicAppUrl("/login", {
        configuredUrl: "https://ictrl.app/",
        currentOrigin: "https://www.ictrl.app/",
        currentHostname: "www.ictrl.app",
      }),
    ).toBe("https://ictrl.app/login");
  });
});
