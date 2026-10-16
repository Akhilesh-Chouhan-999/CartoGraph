import { Schema, model, type InferSchemaType, Types } from 'mongoose';

export const oauthProviders = ['google', 'github', 'gitlab'] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

const oauthIdentitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: oauthProviders,
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

oauthIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
oauthIdentitySchema.index({ userId: 1, provider: 1 }, { unique: true });

export type OAuthIdentity = InferSchemaType<typeof oauthIdentitySchema> & {
  userId: Types.ObjectId;
};

const OAuthIdentityModel = model<OAuthIdentity>('OAuthIdentity', oauthIdentitySchema);

export default OAuthIdentityModel;
