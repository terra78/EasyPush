import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(projectRoot, "mock-pages", "live-mirror");

const TARGETS = [
  {
    key: "variant",
    sourceUrl: "https://sr-nekokiosk.com/products/202603170028"
  },
  {
    key: "product",
    sourceUrl: "https://sr-nekokiosk.com/products/202603170040"
  }
];

const assetMap = new Map();

function toAbsoluteUrl(rawUrl, baseUrl) {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("data:") || rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:")) {
    return null;
  }
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function inferAssetExt(contentType, urlPathname) {
  const ext = path.extname(urlPathname || "");
  if (ext) return ext;
  if (!contentType) return ".bin";
  if (contentType.includes("text/css")) return ".css";
  if (contentType.includes("javascript")) return ".js";
  if (contentType.includes("image/png")) return ".png";
  if (contentType.includes("image/jpeg")) return ".jpg";
  if (contentType.includes("image/webp")) return ".webp";
  if (contentType.includes("image/svg+xml")) return ".svg";
  return ".bin";
}

async function downloadAsset(absoluteUrl) {
  if (assetMap.has(absoluteUrl)) {
    return assetMap.get(absoluteUrl);
  }

  const response = await fetch(absoluteUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; stock-watch-local-mirror/1.0)"
    }
  });
  if (!response.ok) {
    throw new Error(`Asset download failed: ${absoluteUrl} ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "";
  const parsed = new URL(absoluteUrl);
  const ext = inferAssetExt(contentType, parsed.pathname);
  const hash = createHash("sha1").update(absoluteUrl).digest("hex").slice(0, 12);
  const fileName = `${hash}${ext}`;
  const localPath = path.join(outputRoot, "assets", fileName);

  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, bytes);

  const relative = `./assets/${fileName}`;
  assetMap.set(absoluteUrl, relative);
  return relative;
}

async function mirrorOne(target) {
  const response = await fetch(target.sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; stock-watch-local-mirror/1.0)"
    }
  });
  if (!response.ok) {
    throw new Error(`Page download failed: ${target.sourceUrl} ${response.status}`);
  }

  let html = await response.text();

  // href/src属性のURLを収集
  const urlRegex = /(href|src)=["']([^"']+)["']/gi;
  const foundUrls = new Set();
  for (const match of html.matchAll(urlRegex)) {
    const absolute = toAbsoluteUrl(match[2], target.sourceUrl);
    if (!absolute) continue;
    const absUrl = new URL(absolute);
    if (absUrl.origin !== "https://sr-nekokiosk.com") continue;
    foundUrls.add(absolute);
  }

  const replacements = [];
  for (const absoluteUrl of foundUrls) {
    try {
      const localAssetPath = await downloadAsset(absoluteUrl);
      replacements.push({ absoluteUrl, localAssetPath });
    } catch (error) {
      console.warn(`[warn] skip asset ${absoluteUrl}: ${error.message}`);
    }
  }

  for (const { absoluteUrl, localAssetPath } of replacements) {
    const escaped = absoluteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp(escaped, "g"), localAssetPath);
  }

  // 相対URLも絶対URLに正規化してから置換
  html = html.replace(urlRegex, (whole, attr, rawUrl) => {
    const absolute = toAbsoluteUrl(rawUrl, target.sourceUrl);
    if (!absolute) return whole;
    const mapped = assetMap.get(absolute);
    if (!mapped) return `${attr}="${absolute}"`;
    return `${attr}="${mapped}"`;
  });

  const baseTag = `<base href="${target.sourceUrl}">`;
  if (html.includes("<head>")) {
    html = html.replace("<head>", `<head>\n  ${baseTag}`);
  }

  const outputChecking = path.join(outputRoot, `${target.key}-checking.html`);
  const outputAvailable = path.join(outputRoot, `${target.key}-available.html`);

  await mkdir(outputRoot, { recursive: true });
  await writeFile(outputChecking, html, "utf8");

  // テスト用に在庫文言のみ置換したバリエーションを生成
  const availableHtml = html
    .replace(/在庫確認中/g, "在庫あり")
    .replace(/Checking stock/g, "in stock");
  await writeFile(outputAvailable, availableHtml, "utf8");

  console.log(`[ok] ${target.key} -> ${outputChecking}`);
  console.log(`[ok] ${target.key} -> ${outputAvailable}`);
}

async function main() {
  for (const target of TARGETS) {
    await mirrorOne(target);
  }

  const readme = path.join(outputRoot, "README.txt");
  const message = [
    "Local mirror pages generated.",
    "",
    "Serve command:",
    "python3 -m http.server 4173 --directory mock-pages/live-mirror",
    "",
    "Use URLs:",
    "- http://127.0.0.1:4173/variant-checking.html",
    "- http://127.0.0.1:4173/variant-available.html",
    "- http://127.0.0.1:4173/product-checking.html",
    "- http://127.0.0.1:4173/product-available.html"
  ].join("\n");
  await writeFile(readme, message, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
