import { promises as fs } from "node:fs";
import path from "node:path";
import markdownLinkCheckModule from "markdown-link-check";

const markdownLinkCheck =
  markdownLinkCheckModule.default ?? markdownLinkCheckModule;

const repoRoot = process.cwd();
const docsDir = path.join(repoRoot, "docs");
const failures = [];

const options = {
  timeout: "15s",
  ignorePatterns: [
    { pattern: "^mailto:" },
    { pattern: "^https?://<.*>$" },
    { pattern: "^http://localhost(:\\d+)?/.*$" },
    { pattern: "^http://127\\.0\\.0\\.1(:\\d+)?/.*$" },
    { pattern: "^/.*$" }, // Ignore internal paths (e.g., /terms, /privacy)
  ],
};

async function collectMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkFile(filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      const content = await fs.readFile(filePath, "utf8");
      markdownLinkCheck(content, { ...options, baseFilePath: filePath }, (err, results) => {
        if (err) {
          reject(err);
          return;
        }

        for (const result of results) {
          if (result.status === "dead") {
            failures.push({
              filePath,
              link: result.link,
              statusCode: result.statusCode,
            });
          }
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  const targets = [path.join(repoRoot, "README.md"), ...(await collectMarkdownFiles(docsDir))];

  for (const filePath of targets) {
    await checkFile(filePath);
  }

  if (failures.length > 0) {
    console.error("Dead links found:");
    for (const failure of failures) {
      console.error(`- ${path.relative(repoRoot, failure.filePath)} -> ${failure.link} (${failure.statusCode ?? "unknown"})`);
    }
    process.exit(1);
  }

  console.log(`Checked links in ${targets.length} markdown files. No dead links found.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
