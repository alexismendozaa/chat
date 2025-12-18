describe('auth helpers', () => {
  let login;
  let register;

  beforeAll(async () => {
    globalThis.__APP_BACKEND_URL = 'http://localhost:4000';
    ({ login, register } = await import('./auth.js'));
  });

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('login returns token on success', async () => {
    const token = 't-123';
    globalThis.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ token }) });

    const result = await login('user', 'pass');
    expect(result).toBe(token);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('register throws on error', async () => {
    globalThis.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'bad' }) });
    await expect(register('u', 'p'))
      .rejects.toThrow('bad');
  });
});
