import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
    private bot: TelegramBot;

    constructor(token: string) {
        this.bot = new TelegramBot(token, { polling: true });
        this.initializeMessageHandling();
    }

    start() {
        this.bot.on('message', (msg) => {
            // Your bot logic here
        });
        console.log('Telegram bot started');
    }
    initializeMessageHandling(): void {
        this.bot.on('message', (msg) => {
            const chatId = msg.chat.id;
            const response = `Hello, ${msg.from?.first_name}!`;
            this.bot.sendMessage(chatId, response);
        });
    }

    // You can add more methods to handle different bot functionalities
}
