import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from '../src/App';
import { AppProviders } from '../src/redux/providers';

describe('Taxify client shell', () => {
  test('renders the login experience by default', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(screen.getByRole('heading', { name: /live taxi operations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});
