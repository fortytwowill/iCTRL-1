import { describe, expect, it } from "vitest";
import { TERMS_DOCUMENT_KEY, TERMS_DOCUMENT_TITLE } from "@/lib/legalTerms";

describe("legalTerms", () => {
  it("exports the correct document key", () => {
    expect(TERMS_DOCUMENT_KEY).toBe("platform_terms");
  });

  it("exports the correct document title", () => {
    expect(TERMS_DOCUMENT_TITLE).toBe("Terms and Conditions");
  });
});