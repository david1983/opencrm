import GoogleDriveProvider from './GoogleDriveProvider.js';
import DropboxProvider from './DropboxProvider.js';

class ProviderFactory {
  static providers = {
    google: GoogleDriveProvider,
    dropbox: DropboxProvider,
  };

  static getProvider(providerName, credentials) {
    const ProviderClass = this.providers[providerName];

    if (!ProviderClass) {
      throw new Error(`Unknown cloud storage provider: ${providerName}`);
    }

    return new ProviderClass(credentials);
  }

  static getSupportedProviders() {
    return Object.keys(this.providers);
  }

  static isValidProvider(providerName) {
    return providerName in this.providers;
  }
}

export default ProviderFactory;