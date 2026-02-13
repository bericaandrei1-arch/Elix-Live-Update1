import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App smoke', () => {
  it('renders home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
  });

  it('renders search route with query', () => {
    render(
      <MemoryRouter initialEntries={['/search?q=test']}>
        <App />
      </MemoryRouter>
    );
  });

  it('renders legal route', () => {
    render(
      <MemoryRouter initialEntries={['/legal']}>
        <App />
      </MemoryRouter>
    );
  });
});

