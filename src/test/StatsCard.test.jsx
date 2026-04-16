import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BarChartIcon from '@mui/icons-material/BarChart';
import { StatsCard } from '../components/StatsCard';

describe('StatsCard', () => {
  it('renders the label', () => {
    render(<StatsCard label="Avg Sentiment" value={72} icon={BarChartIcon} />);
    // text-transform: uppercase is CSS-only; the DOM node contains the original string
    expect(screen.getByText('Avg Sentiment')).toBeInTheDocument();
  });

  it('renders a string value directly (no count-up)', () => {
    render(<StatsCard label="Rating" value="★★★★☆" />);
    expect(screen.getByText('★★★★☆')).toBeInTheDocument();
  });

  it('renders trend up indicator when trend is positive', () => {
    render(<StatsCard label="Score" value={80} icon={BarChartIcon} trend={{ positive: true, value: 5 }} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('renders trend down indicator when trend is negative', () => {
    render(<StatsCard label="Score" value={40} icon={BarChartIcon} trend={{ positive: false, value: -3 }} />);
    expect(screen.getByText('-3%')).toBeInTheDocument();
  });

  it('does not render trend section when trend prop is absent', () => {
    render(<StatsCard label="Score" value={60} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
