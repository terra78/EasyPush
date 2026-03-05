import { WATCH_RULES } from "./config.js";

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parseProductLevelState(text) {
  if (includesAny(text, WATCH_RULES.unavailableKeywords)) {
    return {
      state: "checking",
      reason: `keyword:${WATCH_RULES.unavailableKeyword}`
    };
  }

  if (includesAny(text, WATCH_RULES.fallbackUnavailableKeywords)) {
    return {
      state: "non_checking",
      reason: "fallback:unavailable_keyword_changed"
    };
  }

  if (includesAny(text, WATCH_RULES.fallbackAvailableKeywords)) {
    return {
      state: "non_checking",
      reason: "fallback:available_keyword_detected"
    };
  }

  return {
    state: "non_checking",
    reason: "default:not_checking_keyword_absent"
  };
}

function parseVariantSizeState(html, targetSize) {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  for (const row of rows) {
    const rowText = normalizeText(stripHtml(row));
    if (!rowText.includes(targetSize)) {
      continue;
    }
    if (includesAny(rowText, WATCH_RULES.unavailableKeywords)) {
      return {
        state: "checking",
        reason: `variant:${targetSize}:checking`
      };
    }
    if (
      includesAny(rowText, WATCH_RULES.fallbackAvailableKeywords) ||
      includesAny(rowText, WATCH_RULES.fallbackUnavailableKeywords)
    ) {
      return {
        state: "non_checking",
        reason: `variant:${targetSize}:non_checking`
      };
    }
  }

  const normalizedHtml = normalizeText(html);
  const sizeWindowRegex = new RegExp(`${escapeRegex(targetSize)}[\\s\\S]{0,220}`, "gi");
  const windows = normalizedHtml.match(sizeWindowRegex) ?? [];

  for (const windowText of windows) {
    if (includesAny(windowText, WATCH_RULES.unavailableKeywords)) {
      return {
        state: "checking",
        reason: `variant:${targetSize}:window_checking`
      };
    }
    if (
      includesAny(windowText, WATCH_RULES.fallbackAvailableKeywords) ||
      includesAny(windowText, WATCH_RULES.fallbackUnavailableKeywords)
    ) {
      return {
        state: "non_checking",
        reason: `variant:${targetSize}:window_non_checking`
      };
    }
  }

  // サイズ判定に失敗した場合のみ商品全体判定へフォールバックする。
  const fallback = parseProductLevelState(stripHtml(html));
  return {
    ...fallback,
    reason: `variant:${targetSize}:fallback_${fallback.reason}`
  };
}

export function parseStockState(html, product) {
  const text = stripHtml(html);
  if (product?.watchMode === "variant_size" && product?.targetSize) {
    return parseVariantSizeState(html, product.targetSize);
  }

  return parseProductLevelState(text);
}
