import { Fragment, useMemo, type ReactNode } from "react";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "horizontal-rule" };

type InlineToken =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "emphasis"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string };

const EMAIL_PATTERN = /(^|[\s(])([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?=$|[\s),.;:!?])/gi;

function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];
  let listType: "unordered-list" | "ordered-list" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" ").trim(),
    });
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }

    blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "horizontal-rule" });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const unorderedItem = trimmed.match(/^-\s+(.*)$/);
    if (unorderedItem) {
      flushParagraph();
      if (listType && listType !== "unordered-list") {
        flushList();
      }
      listType = "unordered-list";
      listItems.push(unorderedItem[1].trim());
      continue;
    }

    const orderedItem = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedItem) {
      flushParagraph();
      if (listType && listType !== "ordered-list") {
        flushList();
      }
      listType = "ordered-list";
      listItems.push(orderedItem[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

function normalizeHref(rawHref: string): string {
  const trimmedHref = rawHref.trim();
  if (!trimmedHref) {
    return "#";
  }

  if (
    trimmedHref.startsWith("/") ||
    trimmedHref.startsWith("http://") ||
    trimmedHref.startsWith("https://") ||
    trimmedHref.startsWith("mailto:")
  ) {
    return trimmedHref;
  }

  if (trimmedHref.includes("@")) {
    return `mailto:${trimmedHref}`;
  }

  return trimmedHref;
}

function parseInlineMarkdown(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const inlinePattern = /(\*\*.+?\*\*|\*[^*].+?\*|`.+?`|\[[^\]]+\]\([^)]+\)|<[^>\s]+>)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const matchedText = match[0];
    const startIndex = match.index ?? 0;

    if (startIndex > lastIndex) {
      tokens.push({
        type: "text",
        text: text.slice(lastIndex, startIndex),
      });
    }

    if (matchedText.startsWith("**") && matchedText.endsWith("**")) {
      tokens.push({
        type: "strong",
        text: matchedText.slice(2, -2),
      });
    } else if (matchedText.startsWith("*") && matchedText.endsWith("*")) {
      tokens.push({
        type: "emphasis",
        text: matchedText.slice(1, -1),
      });
    } else if (matchedText.startsWith("`") && matchedText.endsWith("`")) {
      tokens.push({
        type: "code",
        text: matchedText.slice(1, -1),
      });
    } else if (matchedText.startsWith("[")) {
      const linkMatch = matchedText.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        tokens.push({
          type: "link",
          text: linkMatch[1],
          href: normalizeHref(linkMatch[2]),
        });
      } else {
        tokens.push({ type: "text", text: matchedText });
      }
    } else if (matchedText.startsWith("<") && matchedText.endsWith(">")) {
      const href = matchedText.slice(1, -1);
      tokens.push({
        type: "link",
        text: href,
        href: normalizeHref(href),
      });
    } else {
      tokens.push({ type: "text", text: matchedText });
    }

    lastIndex = startIndex + matchedText.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  const normalizedTokens = tokens.length ? tokens : [{ type: "text", text }];

  return normalizedTokens.flatMap((token) => {
    if (token.type !== "text") {
      return [token];
    }

    const splitTokens: InlineToken[] = [];
    let lastEmailIndex = 0;

    for (const match of token.text.matchAll(EMAIL_PATTERN)) {
      const [matchedText, prefix, email] = match;
      const startIndex = match.index ?? 0;
      const emailOffset = startIndex + prefix.length;

      if (emailOffset > lastEmailIndex) {
        splitTokens.push({
          type: "text",
          text: token.text.slice(lastEmailIndex, emailOffset),
        });
      }

      splitTokens.push({
        type: "link",
        text: email,
        href: normalizeHref(email),
      });

      lastEmailIndex = startIndex + matchedText.length;
    }

    if (lastEmailIndex < token.text.length) {
      splitTokens.push({
        type: "text",
        text: token.text.slice(lastEmailIndex),
      });
    }

    return splitTokens.length ? splitTokens : [token];
  });
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return parseInlineMarkdown(text).map((token, index) => {
    if (token.type === "strong") {
      return <strong key={index} className="font-semibold text-foreground">{token.text}</strong>;
    }

    if (token.type === "emphasis") {
      return <em key={index} className="italic">{token.text}</em>;
    }

    if (token.type === "code") {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
        >
          {token.text}
        </code>
      );
    }

    if (token.type === "link") {
      const isExternal = token.href.startsWith("http://") || token.href.startsWith("https://") || token.href.startsWith("mailto:");
      return (
        <a
          key={index}
          href={token.href}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
        >
          {token.text}
        </a>
      );
    }

    return <Fragment key={index}>{token.text}</Fragment>;
  });
}

export function MarkdownDocument({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);

  return (
    <div className="space-y-5 text-sm leading-7 text-foreground/90">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h1 key={index} className="text-2xl font-semibold text-foreground">
                {block.text}
              </h1>
            );
          }

          if (block.level === 2) {
            return (
              <h2 key={index} className="pt-2 text-xl font-semibold text-foreground">
                {block.text}
              </h2>
            );
          }

          return (
            <h3 key={index} className="text-base font-semibold uppercase tracking-wide text-foreground/80">
              {block.text}
            </h3>
          );
        }

        if (block.type === "unordered-list") {
          return (
            <ul key={index} className="ml-5 list-disc space-y-2 text-muted-foreground">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={index} className="ml-5 list-decimal space-y-2 text-muted-foreground">
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "horizontal-rule") {
          return <hr key={index} className="border-border/70" />;
        }

        return (
          <p key={index} className="text-muted-foreground">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
