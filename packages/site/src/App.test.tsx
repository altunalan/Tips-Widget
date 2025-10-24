import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('@megaeth/widget', () => ({
  fetchRecentTips: vi.fn().mockResolvedValue({ tips: [], nextCursor: undefined }),
}));

describe('App', () => {
  it('renders the demo heading', () => {
    render(<App />);
    expect(screen.getByText(/MegaETH Tips Demo/i)).toBeInTheDocument();
  });
});
