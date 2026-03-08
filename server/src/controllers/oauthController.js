import crypto from 'crypto';
import ConnectedApp from '../models/ConnectedApp.js';
import ConnectedAppAuthorization from '../models/ConnectedAppAuthorization.js';
import AuthCode from '../models/AuthCode.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifySecret,
} from '../utils/tokenUtils.js';

// Show authorization page
export const authorize = async (req, res, next) => {
  try {
    const { client_id, redirect_uri, response_type, scope } = req.query;

    // Validate client
    const app = await ConnectedApp.findOne({
      clientId: client_id,
      isActive: true,
    });

    if (!app) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client_id',
      });
    }

    // Validate redirect_uri
    if (!app.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid redirect_uri',
      });
    }

    // Parse requested scopes
    const requestedScopes = scope ? scope.split(' ') : [];
    const availableScopes = app.scopes;

    res.status(200).json({
      success: true,
      data: {
        app: {
          name: app.name,
          description: app.description,
          logo: app.logo,
        },
        scopes: requestedScopes.filter(s => availableScopes.includes(s)),
        redirect_uri,
        response_type,
        client_id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Handle user consent
export const consent = async (req, res, next) => {
  try {
    const { client_id, scopes, allow } = req.body;

    const app = await ConnectedApp.findOne({
      clientId: client_id,
      isActive: true,
    });

    if (!app) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client_id',
      });
    }

    if (!allow) {
      return res.status(400).json({
        success: false,
        error: 'Access denied by user',
      });
    }

    // Generate authorization code
    const code = crypto.randomBytes(32).toString('hex');

    await AuthCode.create({
      code,
      clientId: client_id,
      userId: req.user._id,
      organizationId: req.user.organization,
      appId: app._id,
      scopes,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    res.status(200).json({
      success: true,
      data: { code },
    });
  } catch (error) {
    next(error);
  }
};

// Exchange code for tokens
export const token = async (req, res, next) => {
  try {
    const { grant_type, code, refresh_token, client_id, client_secret } = req.body;

    const app = await ConnectedApp.findOne({
      clientId: client_id,
      isActive: true,
    }).select('+clientSecretHash');

    if (!app) {
      return res.status(400).json({
        success: false,
        error: 'Invalid client_id',
      });
    }

    // Verify client secret
    const validSecret = await verifySecret(client_secret, app.clientSecretHash);
    if (!validSecret) {
      return res.status(401).json({
        success: false,
        error: 'Invalid client_secret',
      });
    }

    if (grant_type === 'authorization_code') {
      const authCode = await AuthCode.findOne({ code });

      if (!authCode || authCode.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired authorization code',
        });
      }

      if (authCode.clientId !== client_id) {
        return res.status(400).json({
          success: false,
          error: 'Client ID mismatch',
        });
      }

      // Delete used code (one-time use)
      await AuthCode.deleteOne({ code });

      // Create or update authorization
      const accessToken = generateAccessToken({
        userId: authCode.userId.toString(),
        orgId: authCode.organizationId.toString(),
        appId: app._id.toString(),
        scopes: authCode.scopes,
      });

      const refreshTokenValue = generateRefreshToken();
      const refreshTokenHash = hashToken(refreshTokenValue);

      await ConnectedAppAuthorization.findOneAndUpdate(
        {
          user: authCode.userId,
          connectedApp: app._id,
        },
        {
          user: authCode.userId,
          connectedApp: app._id,
          organization: authCode.organizationId,
          accessTokenHash: hashToken(accessToken),
          refreshTokenHash,
          grantedScopes: authCode.scopes,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour
        },
        { upsert: true, new: true }
      );

      res.status(200).json({
        access_token: accessToken,
        refresh_token: refreshTokenValue,
        token_type: 'Bearer',
        expires_in: 3600,
      });

    } else if (grant_type === 'refresh_token') {
      const auth = await ConnectedAppAuthorization.findOne({
        connectedApp: app._id,
        refreshTokenHash: hashToken(refresh_token),
      });

      if (!auth || auth.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired refresh token',
        });
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: auth.user.toString(),
        orgId: auth.organization.toString(),
        appId: app._id.toString(),
        scopes: auth.grantedScopes,
      });

      const newRefreshToken = generateRefreshToken();

      auth.accessTokenHash = hashToken(newAccessToken);
      auth.refreshTokenHash = hashToken(newRefreshToken);
      auth.expiresAt = new Date(Date.now() + 3600000);
      await auth.save();

      res.status(200).json({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 3600,
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported grant_type',
      });
    }
  } catch (error) {
    next(error);
  }
};