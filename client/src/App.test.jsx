import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockProducts = [
  { id: 1, name: 'Apple', price: 1.5, category: 'fruit', stock: 10 },
  { id: 2, name: 'Banana', price: 0.8, category: 'fruit', stock: 0 },
];

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/products')) {
      return Promise.resolve({ json: () => Promise.resolve(mockProducts) });
    }
    if (url.includes('/api/cart') && !url.includes('POST')) {
      return Promise.resolve({ json: () => Promise.resolve([]) });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
});

describe('App', () => {
  it('renders ShopSmart title', async () => {
    render(<App />);
    expect(screen.getByText(/ShopSmart/i)).toBeInTheDocument();
  });

  it('displays products fetched from API', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });
  });

  it('shows "Out of stock" for zero-stock items', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Out of stock')).toBeInTheDocument();
    });
  });

  it('filters products by search input', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Apple'));
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'App' } });
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('opens cart sidebar when cart button clicked', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Cart/i));
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });
});
