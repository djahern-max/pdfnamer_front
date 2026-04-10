import { render, screen } from '@testing-library/react';
import App from './App';

test('renders PDF Auto-Namer', () => {
  render(<App />);
  const heading = screen.getByText(/PDF Auto-Namer/i);
  expect(heading).toBeInTheDocument();
});