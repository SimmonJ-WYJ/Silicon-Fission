export const DISPLAY_USD_TO_CNY = 7.2;

/** 用户界面统一使用人民币主价、美元参考价。 */
export function fmtDualCurrency(usd: number, usdDigits = 4, cnyDigits = 2): string {
  return `¥${(usd * DISPLAY_USD_TO_CNY).toFixed(cnyDigits)} ($${usd.toFixed(usdDigits)})`;
}

export function fmtPrice(perMillion: number): string {
  if (perMillion === 0) return "免费";
  return fmtDualCurrency(perMillion, 2, 2);
}

export function fmtTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
}

export function fmtContext(n: number): string {
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}
