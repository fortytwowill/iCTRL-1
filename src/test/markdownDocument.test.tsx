import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownDocument } from "@/components/legal/MarkdownDocument";

describe("MarkdownDocument", () => {
  it("renders plain email addresses as mailto links", () => {
    render(
      <MarkdownDocument markdown={"Contact us at contact@capyco.ca for assistance."} />,
    );

    const emailLink = screen.getByRole("link", { name: "contact@capyco.ca" });
    expect(emailLink).toHaveAttribute("href", "mailto:contact@capyco.ca");
  });
});
