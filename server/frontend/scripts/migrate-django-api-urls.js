/**
 * One-time codemod: route all /djangoapp fetch URLs through getApiUrl().
 * Run from server/frontend: node scripts/migrate-django-api-urls.js
 */
const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const UTIL_PATH = path.join(SRC_DIR, "utils", "apiBridge.js");
const SKIP_DIRS = new Set(["node_modules", "build"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (/\.(js|jsx)$/.test(entry.name) && !entry.name.endsWith(".test.jsx")) {
      files.push(full);
    }
  }
  return files;
}

function importPath(fromFile) {
  let rel = path.relative(path.dirname(fromFile), UTIL_PATH).replace(/\\/g, "/");
  if (!rel.startsWith(".")) {
    rel = `./${rel}`;
  }
  return rel.replace(/\.js$/, "");
}

function migrate(content) {
  let next = content;

  next = next.replace(
    /`\$\{window\.location\.origin\}(\/djangoapp\/[^`]+)`/g,
    "getApiUrl(`$1`)",
  );

  next = next.replace(
    /fetch\("(\/djangoapp\/[^"]*)"\)/g,
    'fetch(getApiUrl("$1"))',
  );

  next = next.replace(
    /fetch\("(\/djangoapp\/[^"]*)"\s*,/g,
    'fetch(getApiUrl("$1"),',
  );

  next = next.replace(
    /fetch\(`(\/djangoapp\/[^`]+)`\)/g,
    "fetch(getApiUrl(`$1`))",
  );

  next = next.replace(
    /fetch\(`(\/djangoapp\/[^`]+)`\s*,/g,
    "fetch(getApiUrl(`$1`),",
  );

  return next;
}

function ensureImport(content, fromFile) {
  if (!content.includes("getApiUrl")) {
    return content;
  }
  if (/from\s+["'].*apiBridge["']/.test(content)) {
    return content;
  }

  const importLine = `import { getApiUrl } from "${importPath(fromFile)}";\n`;
  const importMatch = content.match(/^import .+;\n/m);
  if (importMatch) {
    const lastImport = [...content.matchAll(/^import .+;\n/gm)].pop();
    const insertAt = lastImport.index + lastImport[0].length;
    return content.slice(0, insertAt) + importLine + content.slice(insertAt);
  }
  return importLine + content;
}

let changed = 0;
for (const file of walk(SRC_DIR)) {
  if (file.replace(/\\/g, "/").endsWith("utils/apiBridge.js")) {
    continue;
  }

  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("/djangoapp")) {
    continue;
  }

  let updated = migrate(original);
  updated = ensureImport(updated, file);

  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    console.log("updated:", path.relative(SRC_DIR, file));
    changed += 1;
  }
}

console.log(`Done. ${changed} file(s) updated.`);
