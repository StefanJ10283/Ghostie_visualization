import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScoreGauge } from '../components/ScoreGauge';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ScoreGauge', () => {
  it('renders 0 initially before the animation delay fires', () => {
    render(<ScoreGauge score={75} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('shows the score after the animation delay', async () => {
    render(<ScoreGauge score={75} />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('renders the label when showLabel is true', () => {
    render(<ScoreGauge score={60} label="Overall Score" showLabel />);
    expect(screen.getByText('Overall Score')).toBeInTheDocument();
  });

  it('does not render the label when showLabel is false', () => {
    render(<ScoreGauge score={60} label="Overall Score" showLabel={false} />);
    expect(screen.queryByText('Overall Score')).not.toBeInTheDocument();
  });

  it('shows "Positive" label for scores >= 57.5', async () => {
    render(<ScoreGauge score={70} showLabel />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Positive')).toBeInTheDocument();
  });

  it('shows "Neutral" label for scores between 42.5 and 57.4', async () => {
    render(<ScoreGauge score={50} showLabel />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('shows "Negative" label for scores below 42.5', async () => {
    render(<ScoreGauge score={30} showLabel />);
    await act(async () => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Negative')).toBeInTheDocument();
  });

  it('renders "out of 100" sub-label', () => {
    render(<ScoreGauge score={50} />);
    expect(screen.getByText('out of 100')).toBeInTheDocument();
  });
});
