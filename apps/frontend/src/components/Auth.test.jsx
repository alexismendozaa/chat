import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';

jest.mock('../auth.js', () => ({
  login: jest.fn(() => Promise.resolve('token-123')),
  register: jest.fn(() => Promise.resolve(true)),
}));

import Auth from './Auth';
import { login, register } from '../auth.js';

describe('Auth component', () => {
  beforeAll(() => {
    window.alert = jest.fn();
  });

  it('calls login and onLogin', async () => {
    const onLogin = jest.fn();
    render(<Auth onLogin={onLogin} />);

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'secret' } });
    const loginButtons = screen.getAllByText('Login');
    fireEvent.click(loginButtons[1]);

    await screen.findByText('Login');

    expect(login).toHaveBeenCalledWith('user', 'secret');
    expect(onLogin).toHaveBeenCalledWith('token-123', 'user');
  });

  it('switches to register tab and calls register', async () => {
    const onLogin = jest.fn();
    render(<Auth onLogin={onLogin} />);

    const registerTabs = screen.getAllByText('Register');
    fireEvent.click(registerTabs[0]);
    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'newpass123' } });
    const registerButtons = screen.getAllByText('Register');
    fireEvent.click(registerButtons[registerButtons.length - 1]);

    await screen.findByText('Register');

    expect(register).toHaveBeenCalledWith('newuser', 'newpass123');
  });
});
