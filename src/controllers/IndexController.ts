import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class IndexController {
    public router: Router;
    private userService: UserService;

    constructor() {
        this.router = Router();
        this.userService = new UserService();
        this.routes();
    }

    public routes() {
        this.router.get('/', async (req: Request, res: Response) => {
            const users = await this.userService.getUsers();
            res.json(users);
        });
    }

}
