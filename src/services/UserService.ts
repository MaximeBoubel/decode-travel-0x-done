// src/services/UserService.ts
import { User } from '../models/User';

export class UserService {
    public async getUsers() {
        return User.find();
    }

    public async getUserById(id: string) {
        return User.findById(id);
    }

    public async createUser(data: any) {
        return User.create(data);
    }
}
