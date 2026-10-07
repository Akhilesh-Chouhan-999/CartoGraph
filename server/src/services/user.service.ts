import { AppError } from '../errors/index.js';
import { UserRepository } from '../repositories/index.js';
import type { SafeUser } from './auth.service.js';

class UserService {
  private readonly users = new UserRepository();

  public async getSafeUser(userId: string): Promise<SafeUser> {
    const user = await this.users.findById(userId);
    if (user === null) throw new AppError('User not found', 404);
    return { id: user._id.toString(), name: user.name, email: user.email };
  }
}

export default UserService;
