import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Chat from './Chat';

const handlers = {};
const emitMock = jest.fn();
const mockSocket = {
  on: (event, cb) => { handlers[event] = cb; },
  off: jest.fn(),
  emit: emitMock,
  close: jest.fn(),
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

jest.mock('../lib/upload.js', () => ({
  uploadImage: jest.fn(() => Promise.resolve('http://img/test.png')),
}));

describe('Chat component', () => {
  beforeEach(() => {
    emitMock.mockClear();
    Object.keys(handlers).forEach((k) => delete handlers[k]);
    // jsdom no-op for scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('connects and joins default room', async () => {
    render(<Chat token="abc" username="alex" onLogout={jest.fn()} />);
    // simulate socket connect inside act
    if (handlers.connect) {
      await act(async () => {
        handlers.connect();
      });
    }

    await waitFor(() => expect(emitMock).toHaveBeenCalledWith('joinRoom', { roomId: 'general' }));
  });

  it('sends a text message', async () => {
    render(<Chat token="abc" username="alex" onLogout={jest.fn()} />);
    if (handlers.connect) {
      await act(async () => {
        handlers.connect();
      });
    }

    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'hola' } });
    fireEvent.click(screen.getByText('Enviar'));

    await waitFor(() => expect(emitMock).toHaveBeenCalledWith('message', expect.objectContaining({ text: 'hola' })));
  });
});
