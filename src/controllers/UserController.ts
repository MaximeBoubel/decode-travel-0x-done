// src/controllers/UserController.ts
import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
    public router: Router;
    private userService: UserService;

    constructor() {
        this.router = Router();
        this.userService = new UserService();
        this.routes();
    }

    public routes() {
        // Example route for getting all users
        this.router.get('/users', async (req: Request, res: Response) => {
            const users = await this.userService.getUsers();
            res.json(users);
        });

        // Add more routes as needed
    }
}
