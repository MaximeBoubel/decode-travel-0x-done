// src/MainApp.ts
import express, { Express } from 'express';
import mongoose from 'mongoose';
import { IndexController } from './controllers/IndexController';
import { UserController } from './controllers/UserController'; // Import the UserController
// import { TelegramController } from './controllers/TelegramController'; // Import the TelegramController
import dotenv from 'dotenv';
import {TelegramService} from "./services/TelegramService";

dotenv.config();
export class MainApp {
    private app: Express;
    private indexController: IndexController;
    private userController: UserController; // Add a property for UserController
    // private telegramController: TelegramController; // Add a property for TelegramController

    constructor() {
        this.app = express();
        this.setMongoConfig();
        this.indexController = new IndexController();
        this.userController = new UserController(); // Instantiate UserController
      //  this.telegramController = new TelegramController(); // Instantiate TelegramController

        try {
            const telegramService = new TelegramService();
            telegramService.start();  // This method includes the bot initialization and starts listening to messages
            console.log("All services started successfully.");
        } catch (error) {
            console.error("Failed to start services:", error);
        }
        this.routes();
    }

    private setMongoConfig() {
        mongoose.Promise = global.Promise;
        const uri =process.env.MONGO_URI;

        mongoose.connect(uri, {}).then(() => {
            console.log('Database connected');
        });
    }

    private routes(): void {
        this.app.use('/', this.indexController.router);
        this.app.use('/users', this.userController.router); // Use the UserController routes
        // this.app.use('/bot', this.telegramController.router); // Use the TelegramController routes
    }

    public getApp(): Express {
        return this.app;
    }
}
