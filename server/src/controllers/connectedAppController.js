import ConnectedApp from '../models/ConnectedApp.js';
import {
  generateClientId,
  generateClientSecret,
  generateApiKey,
  hashSecret,
  getApiKeyPrefix,
} from '../utils/tokenUtils.js';

// Get all connected apps
export const getConnectedApps = async (req, res, next) => {
  try {
    const apps = await ConnectedApp.find({ organization: req.user.organization })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: apps,
    });
  } catch (error) {
    next(error);
  }
};

// Get single connected app
export const getConnectedApp = async (req, res, next) => {
  try {
    const app = await ConnectedApp.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('createdBy', 'name email');

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Connected app not found',
      });
    }

    res.status(200).json({
      success: true,
      data: app,
    });
  } catch (error) {
    next(error);
  }
};

// Create connected app
export const createConnectedApp = async (req, res, next) => {
  try {
    const { name, description, authType, redirectUris, scopes, rateLimit } = req.body;

    const appData = {
      name,
      description,
      authType,
      scopes: scopes || [],
      rateLimit: rateLimit || 1000,
      organization: req.user.organization,
      createdBy: req.user._id,
    };

    let response = { ...appData };

    if (authType === 'oauth') {
      appData.clientId = generateClientId();
      const clientSecret = generateClientSecret();
      appData.clientSecretHash = await hashSecret(clientSecret);
      appData.redirectUris = redirectUris || [];

      response.clientId = appData.clientId;
      response.clientSecret = clientSecret; // Only shown once
    } else if (authType === 'apikey') {
      const apiKey = generateApiKey();
      appData.apiKeyHash = await hashSecret(apiKey);
      appData.apiKeyPrefix = getApiKeyPrefix(apiKey);

      response.apiKey = apiKey; // Only shown once
      response.apiKeyPrefix = appData.apiKeyPrefix;
    }

    const app = await ConnectedApp.create(appData);

    res.status(201).json({
      success: true,
      data: {
        ...app.toObject(),
        ...(authType === 'oauth' ? { clientSecret: response.clientSecret } : {}),
        ...(authType === 'apikey' ? { apiKey: response.apiKey } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update connected app
export const updateConnectedApp = async (req, res, next) => {
  try {
    const { name, description, redirectUris, scopes, rateLimit, isActive } = req.body;

    const app = await ConnectedApp.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Connected app not found',
      });
    }

    const updated = await ConnectedApp.findByIdAndUpdate(
      req.params.id,
      { name, description, redirectUris, scopes, rateLimit, isActive },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Delete (deactivate) connected app
export const deleteConnectedApp = async (req, res, next) => {
  try {
    const app = await ConnectedApp.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Connected app not found',
      });
    }

    app.isActive = false;
    await app.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// Regenerate client secret
export const regenerateSecret = async (req, res, next) => {
  try {
    const app = await ConnectedApp.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Connected app not found',
      });
    }

    if (app.authType !== 'oauth') {
      return res.status(400).json({
        success: false,
        error: 'Can only regenerate secret for OAuth apps',
      });
    }

    const clientSecret = generateClientSecret();
    app.clientSecretHash = await hashSecret(clientSecret);
    await app.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Regenerate API key
export const regenerateApiKey = async (req, res, next) => {
  try {
    const app = await ConnectedApp.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Connected app not found',
      });
    }

    if (app.authType !== 'apikey') {
      return res.status(400).json({
        success: false,
        error: 'Can only regenerate key for API key apps',
      });
    }

    const apiKey = generateApiKey();
    app.apiKeyHash = await hashSecret(apiKey);
    app.apiKeyPrefix = getApiKeyPrefix(apiKey);
    await app.save();

    res.status(200).json({
      success: true,
      data: {
        apiKey,
        apiKeyPrefix: app.apiKeyPrefix,
      },
    });
  } catch (error) {
    next(error);
  }
};