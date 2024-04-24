import TelegramBot from 'node-telegram-bot-api';

export class TelegramService {
    private bot: TelegramBot;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error("Telegram bot token is not provided in the environment variables.");
        }
        this.bot = new TelegramBot(token, { polling: true });
        this.initializeMessageHandling();
    }

    start() {
        this.bot.on('message', (msg) => {
            // Your bot logic here
        });
        console.log('Telegram bot started');
    }

    private initializeMessageHandling(): void {
        this.bot.on('message', (msg) => {
            if (msg.text?.toLowerCase() === '/start') {
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "Create wallet", callback_data: 'create_wallet' }],
                            [{ text: "Pay", callback_data: 'pay' }],
                            [{text: "Request Payment", callback_data: 'request_payment' }],
                        ]
                    }
                };
                this.bot.sendMessage(msg.chat.id, "Choose an option:", options);
            }
        });

    // createWallet(): void {
    //     this.bot.on('wallet', (msg) => {
    //         const telegram_id = msg.from.id
    //         // look up in our db has a wallet
    //         // if not create a wallet
    //
    //     }
    // }

    // You can add more methods to handle different bot functionalities
}
