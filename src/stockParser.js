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

export function parseStockState(html) {
  const text = stripHtml(html);

  if (text.includes(WATCH_RULES.unavailableKeyword)) {
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
