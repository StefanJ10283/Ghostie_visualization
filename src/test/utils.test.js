import { describe, it, expect } from 'vitest';

// Pure utility: linear regression used in HistoryPage
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return values.slice();
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return values.map((_, x) => Math.round((slope * x + intercept) * 10) / 10);
}

describe('linearRegression', () => {
  it('returns the same single value for a one-element array', () => {
    expect(linearRegression([42])).toEqual([42]);
  });

  it('returns a perfectly fitted line for linear data', () => {
    // y = 2x + 1 → [1, 3, 5, 7]
    const result = linearRegression([1, 3, 5, 7]);
    expect(result).toEqual([1, 3, 5, 7]);
  });

  it('returns a flat line for constant data', () => {
    const result = linearRegression([50, 50, 50, 50]);
    expect(result).toEqual([50, 50, 50, 50]);
  });

  it('produces the correct length output', () => {
    const input = [10, 20, 15, 30, 25];
    expect(linearRegression(input)).toHaveLength(input.length);
  });

  it('handles a descending series', () => {
    const result = linearRegression([100, 80, 60, 40]);
    // Slope should be negative — last value < first value
    expect(result[result.length - 1]).toBeLessThan(result[0]);
  });
});

// Pure utility: source label mapping used across multiple pages
function sourceLabel(s) {
  if (s === 'google_maps_reviews') return 'Review';
  if (s === 'newsapi') return 'News';
  if (s === 'reddit') return 'Reddit';
  return s || '—';
}

describe('sourceLabel', () => {
  it('maps google_maps_reviews → Review', () => {
    expect(sourceLabel('google_maps_reviews')).toBe('Review');
  });

  it('maps newsapi → News', () => {
    expect(sourceLabel('newsapi')).toBe('News');
  });

  it('maps reddit → Reddit', () => {
    expect(sourceLabel('reddit')).toBe('Reddit');
  });

  it('returns the raw value for unknown sources', () => {
    expect(sourceLabel('twitter')).toBe('twitter');
  });

  it('returns — for empty/falsy source', () => {
    expect(sourceLabel('')).toBe('—');
    expect(sourceLabel(null)).toBe('—');
    expect(sourceLabel(undefined)).toBe('—');
  });
});
