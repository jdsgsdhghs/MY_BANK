import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/operations" element={<div>OPS PAGE</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Login page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders inputs and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText('Adresse e-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('shows error on invalid credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    renderLogin();
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/identifiants invalides/i);
    });
  });

  it('navigates on successful login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ token: 'fake-jwt-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    renderLogin();
    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('OPS PAGE')).toBeInTheDocument();
    });
    expect(localStorage.getItem('mybank_token')).toBe('fake-jwt-token');
  });
});
