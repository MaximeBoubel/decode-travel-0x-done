# 0x Done
### Overview
0xDone is an API meant to interact with Telegram messaging requests to initiate payments between 2 entities. 
This application is intended to be used within the travel industry but not limited.

This Telegram bot allows users to send and receive cryptocurrencies via Telegram messages. It integrates with the Camino network and provides a seamless experience for managing crypto transactions.

Features
Crypto Transfer: Users can initiate crypto transfers by sending commands to the bot.

### Getting Started
Clone the Repository:
```
git clone https://github.com/your-username/telegram-crypto-transfer-bot.git
cd decode-travel-0x-done
```

Install Dependencies:
```
npm install
```
Create a Telegram Bot with BotFather: 
- Start a chat with BotFather: BotFather is the official Telegram bot that lets you create and manage bots. Find it by searching for "@BotFather" in the Telegram app.
- Create a new bot: Start a new chat or send the command /newbot.
- Follow the prompts: BotFather will ask you to give your bot a name and a username. The username must end in ‘bot’ (e.g., example_bot).
- Save your token: After completing the setup, BotFather will give you a token. This is the API key that you’ll use to control the bot. Keep it safe and do not share it.

Configure Environment Variables: Create a .env file in the project root and add the following:
TELEGRAM_BOT_TOKEN=

Compile and run the application:
```
tsc
node bin/serve.js
```

### Usage:
Start a chat with your bot on Telegram.
Use commands like /start or /pay to request or send payments.

### Contributing
Contributions are welcome! Feel free to open issues or submit pull requests.

### License
This project is licensed under the MIT License - see the LICENSE file for details.
