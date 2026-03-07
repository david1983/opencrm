import express from 'express';
import passport from 'passport';
import { register, login, logout, getMe, oauthCallback } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerRules, loginRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  oauthCallback
);

// GitHub OAuth
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${process.env.CLIENT_URL}/login` }),
  oauthCallback
);

export default router;