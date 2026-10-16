import { AppError } from '../errors/index.js';
import type { OAuthProvider } from '../models/index.js';
import { OAuthIdentityRepository, UserRepository } from '../repositories/index.js';

export interface OAuthProfile {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

/**
 * Creates OAuth-only accounts and links provider identities to CartoGraph users.
 */
class OAuthAccountService {
  private readonly users = new UserRepository();
  private readonly identities = new OAuthIdentityRepository();

  public async signIn(provider: OAuthProvider, profile: OAuthProfile): Promise<string> {
    this.validateProfile(profile);
    const linked = await this.identities.findByProviderIdentity(provider, profile.providerUserId);
    if (linked !== null) return linked.userId.toString();

    const email = profile.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing !== null) throw this.existingAccountError();

    let user;
    try {
      user = await this.users.create({
        name: profile.name.trim() || email.split('@')[0] || 'CartoGraph user',
        email,
      });
    } catch (error) {
      if (await this.users.existsByEmail(email)) throw this.existingAccountError();
      throw error;
    }
    try {
      await this.identities.create({
        userId: user.id,
        provider,
        providerUserId: profile.providerUserId,
        email,
      });
      return user.id;
    } catch (error) {
      const racedIdentity = await this.identities.findByProviderIdentity(
        provider,
        profile.providerUserId,
      );
      if (racedIdentity !== null) return racedIdentity.userId.toString();
      await this.users.deleteById(user.id);
      throw error;
    }
  }

  public async link(userId: string, provider: OAuthProvider, profile: OAuthProfile): Promise<void> {
    this.validateProfile(profile);
    const linked = await this.identities.findByProviderIdentity(provider, profile.providerUserId);
    if (linked !== null) {
      if (linked.userId.toString() !== userId) {
        throw new AppError('This provider identity is linked to another CartoGraph account', 409);
      }
      return;
    }
    try {
      await this.identities.create({
        userId,
        provider,
        providerUserId: profile.providerUserId,
        email: profile.email.trim().toLowerCase(),
      });
    } catch {
      throw new AppError('This provider is already linked to a CartoGraph account', 409);
    }
  }

  public async getLinkedProviders(userId: string): Promise<OAuthProvider[]> {
    const identities = await this.identities.findByUserId(userId);
    return identities.map((identity) => identity.provider as OAuthProvider);
  }

  private validateProfile(profile: OAuthProfile): void {
    if (!profile.providerUserId || !profile.email || !profile.emailVerified) {
      throw new AppError('The provider must return a verified email address', 400);
    }
  }

  private existingAccountError(): AppError {
    return new AppError(
      'Sign in to your existing account and link this provider from Settings',
      409,
    );
  }
}

export default OAuthAccountService;
