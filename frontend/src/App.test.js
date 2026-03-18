import { render, screen } from '@testing-library/react';
import App from './App';

// Mock fetch to avoid real API calls during tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ streams: [], mixes: [], users: [], pagination: { total: 0 } }),
  })
);

test('renders the Tracks-N-Stacks homepage with navigation', async () => {
  render(<App />);
  // Check the brand name appears in the nav
  const brandElements = await screen.findAllByText(/Tracks-N-Stacks/i);
  expect(brandElements.length).toBeGreaterThan(0);
});

test('renders the Live navigation link', async () => {
  render(<App />);
  const liveLinks = await screen.findAllByText(/Live/i);
  expect(liveLinks.length).toBeGreaterThan(0);
});
