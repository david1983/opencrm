import express from 'express';
import { authorize, consent, token } from '../controllers/oauthController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @openapi
 * /oauth/authorize:
 *   get:
 *     summary: OAuth authorization endpoint
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth client ID
 *       - in: query
 *         name: redirect_uri
 *         required: true
 *         schema:
 *           type: string
 *           format: uri
 *         description: Redirect URI after authorization
 *       - in: query
 *         name: response_type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [code]
 *         description: Response type (must be 'code')
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *         description: Requested scopes (space-separated)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *     responses:
 *       302:
 *         description: Redirect to consent screen or callback URL
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/authorize', protect, authorize);

/**
 * @openapi
 * /oauth/authorize/consent:
 *   post:
 *     summary: OAuth consent endpoint
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client_id
 *               - redirect_uri
 *             properties:
 *               client_id:
 *                 type: string
 *                 description: OAuth client ID
 *               redirect_uri:
 *                 type: string
 *                 format: uri
 *                 description: Redirect URI
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Approved scopes
 *               approve:
 *                 type: boolean
 *                 description: Whether the user approved the consent
 *     responses:
 *       302:
 *         description: Redirect to callback URL with authorization code
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/authorize/consent', protect, consent);

/**
 * @openapi
 * /oauth/token:
 *   post:
 *     summary: Exchange authorization code for access token
 *     tags: [OAuth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *               - client_id
 *               - client_secret
 *               - code
 *               - redirect_uri
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [authorization_code]
 *                 description: Grant type (must be 'authorization_code')
 *               client_id:
 *                 type: string
 *                 description: OAuth client ID
 *               client_secret:
 *                 type: string
 *                 description: OAuth client secret
 *               code:
 *                 type: string
 *                 description: Authorization code received from consent
 *               redirect_uri:
 *                 type: string
 *                 format: uri
 *                 description: Must match the redirect URI from authorization request
 *     responses:
 *       200:
 *         description: Token response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthTokenResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         description: Invalid client credentials
 */
router.post('/token', token);

export default router;