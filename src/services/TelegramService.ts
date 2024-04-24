import TelegramBot from 'node-telegram-bot-api';
import {ethers, HDNodeWallet, Wallet} from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import {ObjectId} from 'mongodb';
import {Contract} from "../models/Contract";

// It's assumed that the ENCRYPTION_KEY is stored in environment variables and is 32 bytes (256 bits).
// The key must be in hexadecimal format.
const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY!;  // Non-null assertion or handle it properly in production
const IV_LENGTH: number = 16;  // For AES-256-CBC, IV is always 16 bytes
const tokenAddress = "0x5564f96aabf78ff96a1715a6a474281901fae853";

const abi = [
    {
        "inputs" : [ ],
        "stateMutability" : "nonpayable",
        "type" : "constructor"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "spender",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "allowance",
                "type" : "uint256"
            },
            {
                "internalType" : "uint256",
                "name" : "needed",
                "type" : "uint256"
            }
        ],
        "name" : "ERC20InsufficientAllowance",
        "type" : "error"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "sender",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "balance",
                "type" : "uint256"
            },
            {
                "internalType" : "uint256",
                "name" : "needed",
                "type" : "uint256"
            }
        ],
        "name" : "ERC20InsufficientBalance",
        "type" : "error"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "approver",
                "type" : "address"
            }
        ],
        "name" : "ERC20InvalidApprover",
        "type" : "error"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "receiver",
                "type" : "address"
            }
        ],
        "name" : "ERC20InvalidReceiver",
        "type" : "error"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "sender",
                "type" : "address"
            }
        ],
        "name" : "ERC20InvalidSender",
        "type" : "error"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "spender",
                "type" : "address"
            }
        ],
        "name" : "ERC20InvalidSpender",
        "type" : "error"
    },
    {
        "anonymous" : false,
        "inputs" : [
            {
                "indexed" : true,
                "internalType" : "address",
                "name" : "owner",
                "type" : "address"
            },
            {
                "indexed" : true,
                "internalType" : "address",
                "name" : "spender",
                "type" : "address"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "Approval",
        "type" : "event"
    },
    {
        "anonymous" : false,
        "inputs" : [
            {
                "indexed" : true,
                "internalType" : "address",
                "name" : "from",
                "type" : "address"
            },
            {
                "indexed" : true,
                "internalType" : "address",
                "name" : "to",
                "type" : "address"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "Transfer",
        "type" : "event"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "owner",
                "type" : "address"
            },
            {
                "internalType" : "address",
                "name" : "spender",
                "type" : "address"
            }
        ],
        "name" : "allowance",
        "outputs" : [
            {
                "internalType" : "uint256",
                "name" : "",
                "type" : "uint256"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "spender",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "approve",
        "outputs" : [
            {
                "internalType" : "bool",
                "name" : "",
                "type" : "bool"
            }
        ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "account",
                "type" : "address"
            }
        ],
        "name" : "balanceOf",
        "outputs" : [
            {
                "internalType" : "uint256",
                "name" : "",
                "type" : "uint256"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "burn",
        "outputs" : [ ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "account",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "burnFrom",
        "outputs" : [ ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "decimals",
        "outputs" : [
            {
                "internalType" : "uint8",
                "name" : "",
                "type" : "uint8"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "name",
        "outputs" : [
            {
                "internalType" : "string",
                "name" : "",
                "type" : "string"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "symbol",
        "outputs" : [
            {
                "internalType" : "string",
                "name" : "",
                "type" : "string"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "totalSupply",
        "outputs" : [
            {
                "internalType" : "uint256",
                "name" : "",
                "type" : "uint256"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "to",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "transfer",
        "outputs" : [
            {
                "internalType" : "bool",
                "name" : "",
                "type" : "bool"
            }
        ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "from",
                "type" : "address"
            },
            {
                "internalType" : "address",
                "name" : "to",
                "type" : "address"
            },
            {
                "internalType" : "uint256",
                "name" : "value",
                "type" : "uint256"
            }
        ],
        "name" : "transferFrom",
        "outputs" : [
            {
                "internalType" : "bool",
                "name" : "",
                "type" : "bool"
            }
        ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    }
];
import {User} from "../models/User";


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
        this.bot.on('message', async (msg) => {
            let command = msg.text.split(' ');
         if (command.length > 1) {
             command = "pay";
         }

            if (msg.text?.startsWith( '/start')) {
                const userExists = await User.findOne({telegram_id: msg.from.id});
                let wallet;
                if (!userExists) {
                    wallet = await this.createWallet(msg.from);
                } else {
                    wallet = await this.connectWallet(msg.from);
                }

                let options;
                if (command === 'pay') {
                    options = {
                        caption: `Hello, welcome to 0xDone.\nYou will be paid out 10 USDT for your tour. Your wallet address: \`${wallet.address}\``,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{text: "Confirm", callback_data: 'getPaid'}],
                                [{text: "Cancel", callback_data: 'cancel'}]
                            ]
                        }
                    };

                } else {
                    options = {
                        caption: `Hello, welcome to 0xDone.\nYour wallet address: \`${wallet.address}\``,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{text: "Pay", callback_data: 'pay'}],
                                [{text: "Request Payment", callback_data: 'request_payment'}],
                            ]
                        }
                    };
                }
                // The path or URL of the image you want to send
                const photo = 'https://ibb.co/HdcHSMT';

                this.bot.sendPhoto(msg.chat.id, photo, options);
            } else if (msg.text?.toLowerCase() === '/pay') {
                const userExists = await User.findOne({telegram_id: msg.from.id});
                let wallet;
                if (!userExists) {
                    wallet = await this.createWallet(msg.from);
                } else {
                    wallet = await this.connectWallet(msg.from);
                }
                // The path or URL of the image you want to send
                const photo = 'https://ibb.co/HdcHSMT';

                this.bot.sendPhoto(msg.chat.id, photo, options);
            } else if (msg.text?.toLowerCase() === '/getPaid') {
                const userExists = await User.findOne({telegram_id: msg.from.id});
                let wallet;
                if (!userExists) {
                    wallet = await this.createWallet(msg.from);
                } else {
                    wallet = await this.connectWallet(msg.from);
                }
                const options = {
                    caption: `Hello, welcome to 0xDone.\nYour wallet address: \`${wallet.address}\``,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{text: "Confirm", callback_data: 'getPaid'}],
                        ]
                    }
                };
                await this.pay(10, wallet.address);




                // The path or URL of the image you want to send
                const photo = 'https://ibb.co/HdcHSMT';

                this.bot.sendPhoto(msg.chat.id, photo, options);
            }
        });

    }

    // set password
    // encrypt the private key
    async setPassword() {

    }
    // 2 options: user inputs amount and recipient or user scans qr code
    async pay(amount, recipient) {

        let tokenContract = new ethers.Contract("0x5564f96aabf78ff96a1715a6a474281901fae853", JSON.stringify(abi));

        // Set an allowance
        let transaction = await tokenContract.approve(sender, amount);
        let receipt = await transaction.wait();        // before transfer, give me the transaction amount
        // check if wallet balance is enough for min transaction fee
        const provider = new JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');
        await this.fundWallet(sender);

    }

    // generates qr code with prefilled amount and recipietn
    requestPayment() {

    }

    async createWallet(from) {
        let wallet;
        let provider;
        try {
            provider = new JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');
             wallet = Wallet.createRandom();
        } catch(e) {
            console.error("Failed to create a wallet:", e);
        }

        let user = new User();
        user.telegram_id = from.id;
        user.username = from.username;
        user.address = wallet.address;
        user.pkey = wallet.privateKey;  // Assuming you have an encryption function as discussed
        user.save();
        return wallet.connect(provider);
    }

    async connectWallet(from) {
        const user = await User.findOne({telegram_id: from.id});
        // @ts-ignore
        if (!user.address || !user.pkey) {
            throw new Error("User wallet information is missing.");
        }
        // Connect the wallet using the private key
        const url = 'https://columbus.camino.network/ext/bc/C/rpc';
        // @ts-ignore
        const privateKey = user.pkey;
        const provider = new JsonRpcProvider(url);

        // Connect to the existing wallet using the private key and the provider
        const existingWallet = new Wallet(privateKey, provider);
        //const wallet = new Wallet(process.env.PRIVATE_KEY!);

        return existingWallet;
    }
    // faucet
    async fundWallet(recipient) {
        const url = 'https://columbus.camino.network/ext/bc/C/rpc';
        const privateKey = process.env.DEV_WALLET_PKEY;
        const provider = new JsonRpcProvider(url);

        // Connect to the existing wallet using the private key and the provider
        // @ts-ignore
        const existingWallet = new Wallet(privateKey, provider);
        const transaction = {
            from: recipient,
            value: ethers.utils.parseEther("0.001")
        }
        const txResponse = await existingWallet.sendTransaction(transaction);
        const txReceipt = await txResponse.wait();
        console.log('Transaction hash:', txReceipt.transactionHash);
    }



}
