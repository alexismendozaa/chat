import React from 'react';
import { render } from '@testing-library/react';

// Mock modules
jest.mock('./components/Auth', () => {
  return function MockAuth() {
    return <div>Auth Component</div>;
  };
});

jest.mock('./components/Chat', () => {
  return function MockChat() {
    return <div>Chat Component</div>;
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Import after mocking
import App from '../src/App';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should initialize state', () => {
    render(<App />);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

