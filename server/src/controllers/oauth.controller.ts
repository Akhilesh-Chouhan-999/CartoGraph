import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';

import { OAuthConfig } from '../config/index.js';
import { AppError } from '../errors/index.js';
import {
  oauthClientStateSchema,
  oauthExchangeSchema,
  oauthLinkSchema,
  oauthProviderSchema,
} from '../schemas/index.js';
import OAuthService from '../services/oauth.service.js';

/**
 * Handles provider sign-in, one-time exchange, and account linking requests.
 */
class OAuthController {
  private readonly oauth: OAuthService;
  private readonly config = new OAuthConfig();

  constructor(redis: Redis) {
    this.oauth = new OAuthService(redis);
  }

  public providers: RequestHandler = (_req, res) => {
    res.json({ success: true, data: this.oauth.getProviderStatus() });
  };

  public start: RequestHandler = async (req, res) => {
    const provider = oauthProviderSchema.parse(req.params.provider);
    const clientState = oauthClientStateSchema.parse(req.query.client_state);
    res.redirect(302, await this.oauth.start(provider, clientState));
  };

  public startLink: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401);
    const provider = oauthProviderSchema.parse(req.params.provider);
    const body = oauthLinkSchema.parse(req.body);
    res.json({
      success: true,
      data: { authorizationUrl: await this.oauth.start(provider, body.clientState, userId) },
    });
  };

  public callback: RequestHandler = async (req, res) => {
    const provider = oauthProviderSchema.parse(req.params.provider);
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const stateDetails = state ? await this.oauth.getStateDetails(state) : undefined;
    try {
      if (!code || !state) throw new AppError('OAuth callback is missing required values', 400);
      const result = await this.oauth.complete(provider, code, state);
      if (result.intent === 'link') {
        res.redirect(
          302,
          `${this.config.clientUrl}/settings?oauth=linked&provider=${encodeURIComponent(provider)}&client_state=${encodeURIComponent(result.clientState)}`,
        );
        return;
      }
      res.redirect(
        302,
        `${this.config.clientUrl}/auth/callback?code=${encodeURIComponent(result.code)}&client_state=${encodeURIComponent(result.clientState)}`,
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes('existing account')
          ? 'account_conflict'
          : error instanceof Error && error.message.includes('verified email')
            ? 'verified_email_required'
            : 'oauth_failed';
      const target = stateDetails?.intent === 'link' ? '/settings' : '/auth/callback';
      const callbackState = stateDetails?.clientState
        ? `&client_state=${encodeURIComponent(stateDetails.clientState)}`
        : '';
      res.redirect(302, `${this.config.clientUrl}${target}?oauth_error=${message}${callbackState}`);
    }
  };

  public exchange: RequestHandler = async (req, res) => {
    const body = oauthExchangeSchema.parse(req.body);
    res.json({
      success: true,
      data: await this.oauth.exchange(body.code, body.clientState),
    });
  };

  public linkedAccounts: RequestHandler = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) throw new AppError('Authentication required', 401);
    res.json({ success: true, data: await this.oauth.getLinkedProviders(userId) });
  };
}

export default OAuthController;
