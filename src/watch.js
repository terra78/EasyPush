import { PRODUCTS, WATCH_RULES } from "./config.js";
import { notifyLine, notifyResendFallback } from "./notifier.js";
import { parseStockState } from "./stockParser.js";
import {
  fetchActiveLineRecipients,
  fetchStatuses,
  upsertStatuses
} from "./supabaseStore.js";

const REQUEST_TIMEOUT_MS = 15_000;

function nowIso() {
  return new Date().toISOString();
}

function getProductsFromEnv() {
  const raw = process.env.PRODUCTS_JSON;
  if (!raw) {
    return PRODUCTS;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("PRODUCTS_JSON must be a non-empty array.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`Invalid PRODUCTS_JSON: ${error.message}`);
  }
}

function getConsecutiveThreshold() {
  const raw = process.env.CONSECUTIVE_NON_CHECKING_THRESHOLD;
  if (!raw) {
    return WATCH_RULES.consecutiveNonCheckingThreshold;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("CONSECUTIVE_NON_CHECKING_THRESHOLD must be integer >= 1.");
  }
  return parsed;
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; stock-watch-bot/1.0; +https://github.com/)"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildNotification(changedItems) {
  const isTest = process.env.FORCE_TEST_NOTIFICATION === "true";
  const lines = [
    isTest ? "【テスト通知】在庫監視の疎通確認" : "【在庫変化検知】",
    "",
    isTest
      ? "これはテスト通知です。実際の在庫変化ではありません。"
      : "「在庫確認中」以外へ変化した可能性があります。",
    "",
    isTest ? "検知結果（テスト）:" : "検知結果:",
    ""
  ];

  for (const item of changedItems) {
    lines.push(`- ${item.name}`);
    if (item.url) {
      lines.push(`  URL: ${item.url}`);
    }
    lines.push(`  判定: ${item.reason}`);
    lines.push("");
  }

  lines.push(`検知時刻: ${nowIso()}`);
  return lines.join("\n");
}

function toSnapshot(html) {
  return html.slice(0, 1000);
}

async function run() {
  const forceTest = process.env.FORCE_TEST_NOTIFICATION === "true";
  const products = getProductsFromEnv();
  const threshold = getConsecutiveThreshold();
  const prevMap = await fetchStatuses(products.map((p) => p.url));
  const changedForNotification = [];
  const upsertRows = [];

  for (const product of products) {
    const previous = prevMap.get(product.url);
    const checkedAt = nowIso();

    try {
      const html = await fetchHtml(product.url);
      const parsed = parseStockState(html, product);

      const prevState = previous?.last_seen_state ?? null;
      const prevCount = previous?.stable_non_checking_count ?? 0;
      const prevNotified = previous?.notified_available ?? false;

      const nextCount =
        parsed.state === "non_checking"
          ? prevState === "non_checking"
            ? prevCount + 1
            : 1
          : 0;

      const shouldNotify =
        parsed.state === "non_checking" &&
        nextCount >= threshold &&
        !prevNotified;

      if (shouldNotify) {
        changedForNotification.push({
          name: product.name,
          url: product.url,
          reason: parsed.reason
        });
      }

      upsertRows.push({
        url: product.url,
        product_name: product.name,
        last_seen_state: parsed.state,
        stable_non_checking_count: nextCount,
        notified_available: shouldNotify
          ? true
          : parsed.state === "checking"
            ? false
            : prevNotified,
        last_reason: parsed.reason,
        last_snapshot: toSnapshot(html),
        last_checked_at: checkedAt,
        last_changed_at: prevState !== parsed.state ? checkedAt : previous?.last_changed_at ?? null,
        error_count: parsed.state === "checking" || parsed.state === "non_checking"
          ? 0
          : (previous?.error_count ?? 0)
      });
    } catch (error) {
      upsertRows.push({
        url: product.url,
        product_name: product.name,
        last_seen_state: previous?.last_seen_state ?? "error",
        stable_non_checking_count: previous?.stable_non_checking_count ?? 0,
        notified_available: previous?.notified_available ?? false,
        last_reason: `error:${error.message}`,
        last_snapshot: previous?.last_snapshot ?? null,
        last_checked_at: checkedAt,
        last_changed_at: previous?.last_changed_at ?? null,
        error_count: (previous?.error_count ?? 0) + 1
      });
    }
  }

  await upsertStatuses(upsertRows);

  if (changedForNotification.length === 0 && !forceTest) {
    console.log("No state change detected.");
    return;
  }

  if (changedForNotification.length === 0 && forceTest) {
    changedForNotification.push({
      name: "テスト通知（検知商品なし）",
      reason: "forced:test_notification"
    });
  }

  const message = buildNotification(changedForNotification);
  const subject = "【在庫変化検知】販売ページの状態が変化";
  const recipients = await fetchActiveLineRecipients();

  let lineError = null;
  try {
    const lineResult = await notifyLine(message, recipients);
    if (lineResult.successCount === 0) {
      throw new Error(`No LINE recipient succeeded. details=${lineResult.failures.join(" | ")}`);
    }
    if (lineResult.failureCount > 0) {
      console.error(`Partial LINE failure: ${lineResult.failures.join(" | ")}`);
    }
    console.log(`LINE notification sent to ${lineResult.successCount} recipients.`);
  } catch (error) {
    lineError = error;
    console.error(`LINE notify error: ${error.message}`);
  }

  if (lineError) {
    try {
      const sent = await notifyResendFallback(subject, message);
      if (sent) {
        console.log("Resend fallback notification sent.");
      } else {
        throw lineError;
      }
    } catch (fallbackError) {
      throw new Error(
        `Notification failed. line=${lineError.message}; fallback=${fallbackError.message}`
      );
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
