import { UserModel, type User } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

/**
 * Provides database operations for user records.
 */
class UserRepository {
  /**
   * Creates a user record from the validated input.
   * @param data - The data to persist or process.
   */
  public async create(data: Partial<User>): Promise<HydratedDocument<User>> {
    return UserModel.create(data);
  }

  /**
   * Finds a user record by its identifier.
   * @param id - The record identifier.
   */
  public async findById(id: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findById(id).exec();
  }

  /**
   * Finds a user account by its normalized email address.
   * @param email - The user email address.
   */
  public async findByEmail(email: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({ email }).exec();
  }

  /**
   * Checks whether a user account already uses the supplied email.
   * @param email - The user email address.
   */
  public async existsByEmail(email: string): Promise<boolean> {
    const user = await UserModel.exists({ email });
    return user !== null;
  }

  /**
   * Deletes a user record by its identifier.
   * @param id - The record identifier.
   */
  public async deleteById(id: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findByIdAndDelete(id).exec();
  }
}

export default UserRepository;
