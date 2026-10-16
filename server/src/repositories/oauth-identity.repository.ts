import { OAuthIdentityModel, type OAuthProvider } from '../models/index.js';
import type { Types } from 'mongoose';

/**
 * Provides database operations for OAuth identity records.
 */
class OAuthIdentityRepository {
  public findByProviderIdentity(provider: OAuthProvider, providerUserId: string) {
    return OAuthIdentityModel.findOne({ provider, providerUserId }).exec();
  }

  public findByUserId(userId: string) {
    return OAuthIdentityModel.find({ userId }).sort({ provider: 1 }).lean().exec();
  }

  public async create(input: {
    userId: string | Types.ObjectId;
    provider: OAuthProvider;
    providerUserId: string;
    email: string;
  }) {
    return OAuthIdentityModel.create(input);
  }

  public deleteForUser(provider: OAuthProvider, userId: string) {
    return OAuthIdentityModel.findOneAndDelete({ provider, userId }).exec();
  }
}

export default OAuthIdentityRepository;
