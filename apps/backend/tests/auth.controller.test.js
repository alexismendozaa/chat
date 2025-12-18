import { register, login } from '../src/auth/auth.controller.js';
import * as authController from '../src/auth/auth.controller.js';

describe('Auth Controller', () => {
  describe('register', () => {
    it('should be defined', () => {
      expect(authController.register).toBeDefined();
    });
  });

  describe('login', () => {
    it('should be defined', () => {
      expect(authController.login).toBeDefined();
    });
  });
});
