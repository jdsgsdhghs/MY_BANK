import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Probe() {
  const { token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login('abc')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('starts with no token, can login & logout', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByTestId('token').textContent).toBe('none');

    act(() => {
      screen.getByText('login').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('abc');
    expect(localStorage.getItem('mybank_token')).toBe('abc');

    act(() => {
      screen.getByText('logout').click();
    });
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(localStorage.getItem('mybank_token')).toBeNull();
  });
});
