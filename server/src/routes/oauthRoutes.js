import express from 'express';
import { authorize, consent, token } from '../controllers/oauthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Authorization flow (requires user login)
router.get('/authorize', protect, authorize);
router.post('/authorize/consent', protect, consent);

// Token endpoint (public, uses client credentials)
router.post('/token', token);

export default router;