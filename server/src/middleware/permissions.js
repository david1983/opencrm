import Role from '../models/Role.js';
import ConnectedAppAuthorization from '../models/ConnectedAppAuthorization.js';
import ConnectedApp from '../models/ConnectedApp.js';
import { hashToken } from '../utils/tokenUtils.js';

/**
 * Check if user has required permission for a module/action
 * @param {string} module - The module to check
 * @param {string} action - The action to check
 */
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      // Admin role has full access
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user has a role reference
      if (!req.user.roleRef) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. No role assigned.',
        });
      }

      // Populate the role
      const user = await req.user.populate('roleRef');
      const role = user.roleRef;

      if (!role || role.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Invalid role.',
        });
      }

      // Check permissions
      const modulePerms = role.permissions.find(p => p.module === module);

      if (!modulePerms || !modulePerms.actions.includes(action)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required permission: ${module}:${action}`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if connected app has required scope
 * @param {string} scope - The required scope (e.g., 'accounts:read')
 */
export const checkScope = (scope) => {
  return async (req, res, next) => {
    try {
      // For OAuth/API key auth, check granted scopes
      if (req.appAuth && req.appAuth.scopes) {
        if (!req.appAuth.scopes.includes(scope)) {
          return res.status(403).json({
            success: false,
            error: `Access denied. Required scope: ${scope}`,
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check API key authentication
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
      });
    }

    const keyHash = hashToken(apiKey);
    const keyPrefix = apiKey.substring(0, 12);

    // Find the app by prefix
    const app = await ConnectedApp.findOne({
      apiKeyPrefix: keyPrefix,
      isActive: true,
    });

    if (!app) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    // Verify the key hash matches
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(apiKey, app.apiKeyHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    // Find authorization
    const auth = await ConnectedAppAuthorization.findOne({
      connectedApp: app._id,
      isApiKey: true,
    }).populate('user');

    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
      });
    }

    // Attach auth context to request
    req.user = auth.user;
    req.appAuth = {
      app,
      scopes: auth.grantedScopes,
    };

    next();
  } catch (error) {
    next(error);
  }
};