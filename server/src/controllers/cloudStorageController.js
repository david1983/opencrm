import CloudStorageCredential from '../models/CloudStorageCredential.js';
import ProviderFactory from '../services/cloud-storage/ProviderFactory.js';

// Get all configured cloud storage for org
export const getCloudStorageSettings = async (req, res, next) => {
  try {
    const credentials = await CloudStorageCredential.find({
      organization: req.user.organization,
    }).select('-credentials').populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: credentials,
    });
  } catch (error) {
    next(error);
  }
};

// Configure Google Drive
export const configureGoogleDrive = async (req, res, next) => {
  try {
    const { clientId, clientSecret, refreshToken } = req.body;

    if (!clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'clientId, clientSecret, and refreshToken are required',
      });
    }

    // Test the credentials
    const provider = ProviderFactory.getProvider('google', {
      clientId,
      clientSecret,
      refreshToken,
    });

    try {
      await provider.testConnection();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid credentials: ${error.message}`,
      });
    }

    // Upsert credential
    const credential = await CloudStorageCredential.findOneAndUpdate(
      { organization: req.user.organization, provider: 'google' },
      {
        provider: 'google',
        organization: req.user.organization,
        createdBy: req.user.id,
        credentials: { clientId, clientSecret, refreshToken },
        status: 'active',
        lastError: null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: credential._id,
        provider: credential.provider,
        status: credential.status,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Configure Dropbox
export const configureDropbox = async (req, res, next) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'accessToken is required',
      });
    }

    // Test the credentials
    const provider = ProviderFactory.getProvider('dropbox', { accessToken });

    try {
      await provider.testConnection();
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: `Invalid credentials: ${error.message}`,
      });
    }

    // Upsert credential
    const credential = await CloudStorageCredential.findOneAndUpdate(
      { organization: req.user.organization, provider: 'dropbox' },
      {
        provider: 'dropbox',
        organization: req.user.organization,
        createdBy: req.user.id,
        credentials: { accessToken },
        status: 'active',
        lastError: null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        _id: credential._id,
        provider: credential.provider,
        status: credential.status,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Remove a provider
export const removeCloudStorage = async (req, res, next) => {
  try {
    const { provider } = req.params;

    if (!ProviderFactory.isValidProvider(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider',
      });
    }

    const result = await CloudStorageCredential.findOneAndDelete({
      organization: req.user.organization,
      provider,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Provider configuration not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// Test provider connection
export const testCloudStorage = async (req, res, next) => {
  try {
    const { provider } = req.params;

    const credential = await CloudStorageCredential.findOne({
      organization: req.user.organization,
      provider,
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'Provider not configured',
      });
    }

    const providerInstance = ProviderFactory.getProvider(
      provider,
      credential.credentials
    );

    await providerInstance.testConnection();
    credential.lastUsed = new Date();
    credential.status = 'active';
    await credential.save();

    res.status(200).json({
      success: true,
      data: { status: 'connected' },
    });
  } catch (error) {
    // Update status on failure
    await CloudStorageCredential.findOneAndUpdate(
      { organization: req.user.organization, provider: req.params.provider },
      { status: 'error', lastError: error.message }
    );

    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};