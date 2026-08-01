import test from "node:test";
import assert from "node:assert/strict";
import {
  formatUseTime,
  LOG_TYPE_ALL,
  LOG_TYPE_CONSUME,
  logTypeLabel,
  logTypeOptions,
  parseLogQuery,
  parseTimestampParam,
  quotaToUsd,
  tokensPerSecond,
  toNewApiLogPath,
  toNewApiLogStatPath,
  toNewApiSelfLogPath,
  toNewApiSelfLogStatPath,
} from "./logs.ts";

function query(qs: string) {
  return parseLogQuery(new URLSearchParams(qs));
}

test("defaults to no filters and page one", () => {
  const parsed = query("");
  assert.equal(parsed.type, LOG_TYPE_ALL);
  assert.equal(parsed.username, "");
  assert.equal(parsed.channel, 0);
  assert.equal(parsed.startTimestamp, 0);
  assert.equal(parsed.endTimestamp, 0);
  assert.equal(parsed.page, 1);
  assert.equal(parsed.pageSize, 20);
});

test("keeps known log types and drops unknown ones", () => {
  assert.equal(query("type=2").type, LOG_TYPE_CONSUME);
  assert.equal(query("type=5").type, 5);
  assert.equal(query("type=99").type, LOG_TYPE_ALL);
  assert.equal(query("type=abc").type, LOG_TYPE_ALL);
  // 0 已经代表「全部」,原样收敛即可
  assert.equal(query("type=0").type, LOG_TYPE_ALL);
});

test("clamps the page size and rejects nonsense paging", () => {
  assert.equal(query("pageSize=500").pageSize, 100);
  assert.equal(query("pageSize=0").pageSize, 20);
  assert.equal(query("pageSize=-5").pageSize, 20);
  assert.equal(query("page=0").page, 1);
  assert.equal(query("page=3").page, 3);
});

test("trims and caps free-text filters", () => {
  const parsed = query(`username=${"a".repeat(200)}&modelName=%20gpt-4o%20`);
  assert.equal(parsed.username.length, 64);
  assert.equal(parsed.modelName, "gpt-4o");
});

test("accepts unix seconds and datetime strings for the range", () => {
  assert.equal(parseTimestampParam("1700000000"), 1700000000);
  assert.equal(parseTimestampParam("2024-01-01T00:00:00Z"), 1704067200);
  assert.equal(parseTimestampParam(""), 0);
  assert.equal(parseTimestampParam(null), 0);
  assert.equal(parseTimestampParam("not-a-date"), 0);
  assert.equal(parseTimestampParam("0"), 0);
});

test("drops the upper bound when the range is inverted", () => {
  const parsed = query("start=1700000000&end=1600000000");
  assert.equal(parsed.startTimestamp, 1700000000);
  assert.equal(parsed.endTimestamp, 0);
});

test("keeps a valid range intact", () => {
  const parsed = query("start=1600000000&end=1700000000");
  assert.equal(parsed.startTimestamp, 1600000000);
  assert.equal(parsed.endTimestamp, 1700000000);
});

test("omits zero-valued filters from the upstream path", () => {
  const path = toNewApiLogPath(query(""));
  assert.equal(path, "/api/log/?p=1&page_size=20");
});

test("maps filters onto new-api's snake_case query params", () => {
  const path = toNewApiLogPath(
    query("type=2&username=alice&tokenName=key1&modelName=gpt-4o&channel=7&start=100&end=200&page=2&pageSize=50"),
  );
  const params = new URLSearchParams(path.split("?")[1]);
  assert.equal(params.get("type"), "2");
  assert.equal(params.get("username"), "alice");
  assert.equal(params.get("token_name"), "key1");
  assert.equal(params.get("model_name"), "gpt-4o");
  assert.equal(params.get("channel"), "7");
  assert.equal(params.get("start_timestamp"), "100");
  assert.equal(params.get("end_timestamp"), "200");
  assert.equal(params.get("p"), "2");
  assert.equal(params.get("page_size"), "50");
});

test("stat path shares the filters but never paginates", () => {
  const path = toNewApiLogStatPath(query("type=2&username=alice&page=3&pageSize=50"));
  const params = new URLSearchParams(path.split("?")[1]);
  assert.equal(params.get("type"), "2");
  assert.equal(params.get("username"), "alice");
  assert.equal(params.get("p"), null);
  assert.equal(params.get("page_size"), null);
});

test("stat path has no query string when nothing is filtered", () => {
  assert.equal(toNewApiLogStatPath(query("")), "/api/log/stat");
});

test("self log paths use user-scoped New API endpoints", () => {
  const list = toNewApiSelfLogPath(query("username=other&channel=4&modelName=gpt-5.6-sol"));
  assert.match(list, /^\/api\/log\/self\?/);
  assert.equal(list.includes("username"), false);
  assert.equal(list.includes("channel"), false);
  assert.equal(toNewApiSelfLogStatPath(query("username=other")), "/api/log/self/stat");
});

test("converts quota to usd with new-api's 500000-per-dollar unit", () => {
  assert.equal(quotaToUsd(500_000), 1);
  assert.equal(quotaToUsd(250_000), 0.5);
  assert.equal(quotaToUsd(0), 0);
  assert.equal(quotaToUsd(Number.NaN), 0);
});

test("labels log types and falls back for unknown values", () => {
  assert.equal(logTypeLabel(1), "充值");
  assert.equal(logTypeLabel(2), "消费");
  assert.equal(logTypeLabel(5), "错误");
  assert.equal(logTypeLabel(42), "未知");
});

test("log type options lead with an all-types entry", () => {
  const options = logTypeOptions();
  assert.equal(options[0].value, "");
  assert.equal(options.length, 6);
  assert.deepEqual(
    options.map((o) => o.value),
    ["", "1", "2", "3", "4", "5"],
  );
});

test("formats elapsed seconds", () => {
  assert.equal(formatUseTime(0), "-");
  assert.equal(formatUseTime(-3), "-");
  assert.equal(formatUseTime(9), "9s");
  assert.equal(formatUseTime(59), "59s");
  assert.equal(formatUseTime(60), "1m0s");
  assert.equal(formatUseTime(135), "2m15s");
});

test("computes output speed and gives up on unusable inputs", () => {
  assert.equal(tokensPerSecond(120, 4), 30);
  assert.equal(tokensPerSecond(100, 3), 33.3);
  assert.equal(tokensPerSecond(0, 5), null);
  assert.equal(tokensPerSecond(100, 0), null);
});
