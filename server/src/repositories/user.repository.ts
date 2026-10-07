import { UserModel, type User } from '../models/index.js';
import type { HydratedDocument } from 'mongoose';

class UserRepository {
  public async create(data: Partial<User>): Promise<HydratedDocument<User>> {
    return UserModel.create(data);
  }

  public async findById(id: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findOne({ email }).exec();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const user = await UserModel.exists({ email });
    return user !== null;
  }

  public async deleteById(id: string): Promise<HydratedDocument<User> | null> {
    return UserModel.findByIdAndDelete(id).exec();
  }
}

export default UserRepository;
