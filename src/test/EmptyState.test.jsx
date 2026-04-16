import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StarIcon from '@mui/icons-material/Star';
import { EmptyState } from '../components/EmptyState';

describe('EmptyState', () => {
  it('renders the title and message', () => {
    render(<EmptyState icon={StarIcon} title="Nothing here" message="Add something to get started." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something to get started.')).toBeInTheDocument();
  });

  it('renders without a message prop', () => {
    render(<EmptyState icon={StarIcon} title="Empty" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});
