import { beforeEach, describe, expect, it } from "vitest";
import {
  TERMS_DOCUMENT_TITLE,
  getFallbackTermsStatus,
  isLocalTermsFallbackEnabled,
  normalizeLegalDocument,
  normalizeTermsStatus,
  recordLocalTermsAcceptance,
} from "@/lib/legalTerms";

describe("legalTerms", () => {
  beforeEach(() => {
    let storage: Record<string, string> = {};

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          storage = {};
        },
      },
    });
  });

  it("uses the bundled fallback terms when no remote document is available", () => {
    const status = normalizeTermsStatus(null);

    expect(status.source).toBe("fallback");
    expect(status.document?.title).toBe(TERMS_DOCUMENT_TITLE);
    expect(status.needsAcceptance).toBe(true);
  });

  it("treats a matching local acceptance as accepted for the bundled fallback document", () => {
    const initialStatus = getFallbackTermsStatus();
    const document = initialStatus.document;

    expect(document).not.toBeNull();
    expect(initialStatus.needsAcceptance).toBe(true);

    recordLocalTermsAcceptance({
      documentKey: document!.documentKey,
      version: document!.version,
    });

    const acceptedStatus = getFallbackTermsStatus();

    expect(acceptedStatus.acceptedAt).toBeTruthy();
    expect(acceptedStatus.needsAcceptance).toBe(false);
  });

  it("enables local fallback during tests only", () => {
    expect(isLocalTermsFallbackEnabled()).toBe(true);
  });

  it("rebrands remote platform terms documents to Terms and Conditions", () => {
    const document = normalizeLegalDocument({
      id: "doc-1",
      document_key: "platform_terms",
      version: "2026-03-08",
      title: "InventoryCTRL Platform Terms and Risk Disclosure",
      body_markdown: "# InventoryCTRL Platform Terms and Risk Disclosure",
      summary_bullets: [],
      effective_at: "2026-03-08T00:00:00.000Z",
    });

    expect(document?.title).toBe(TERMS_DOCUMENT_TITLE);
  });
});

