import TelegramBot from 'node-telegram-bot-api';
import {BigNumber, ethers, HDNodeWallet, Wallet} from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import {ObjectId} from 'mongodb';
import {Contract} from "../models/Contract";

const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY!;
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

const dvPay = [
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "_tokenAddress",
                "type" : "address"
            },
            {
                "internalType" : "string",
                "name" : "__name",
                "type" : "string"
            },
            {
                "internalType" : "string",
                "name" : "__symbol",
                "type" : "string"
            },
            {
                "internalType" : "address",
                "name" : "_factory",
                "type" : "address"
            },
            {
                "internalType" : "address",
                "name" : "_owner",
                "type" : "address"
            }
        ],
        "stateMutability" : "nonpayable",
        "type" : "constructor"
    },
    {
        "anonymous" : false,
        "inputs" : [
            {
                "indexed" : false,
                "internalType" : "address",
                "name" : "payer",
                "type" : "address"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "amount",
                "type" : "uint256"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "paymentId",
                "type" : "uint256"
            }
        ],
        "name" : "payment",
        "type" : "event"
    },
    {
        "anonymous" : false,
        "inputs" : [
            {
                "indexed" : false,
                "internalType" : "address",
                "name" : "payer",
                "type" : "address"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "amount",
                "type" : "uint256"
            },
            {
                "indexed" : false,
                "internalType" : "uint256",
                "name" : "paymentId",
                "type" : "uint256"
            }
        ],
        "name" : "request",
        "type" : "event"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "signer",
                "type" : "address"
            }
        ],
        "name" : "addSigner",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "detach",
        "outputs" : [ ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "getRoyalty",
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
        "inputs" : [ ],
        "name" : "getSigners",
        "outputs" : [
            {
                "internalType" : "address[]",
                "name" : "",
                "type" : "address[]"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "uint256",
                "name" : "paymentId",
                "type" : "uint256"
            },
            {
                "internalType" : "uint256",
                "name" : "amount",
                "type" : "uint256"
            }
        ],
        "name" : "instantPay",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "_address",
                "type" : "address"
            }
        ],
        "name" : "isSigner",
        "outputs" : [
            {
                "internalType" : "bool",
                "name" : "",
                "type" : "bool"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "owner",
        "outputs" : [
            {
                "internalType" : "address",
                "name" : "",
                "type" : "address"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "uint256",
                "name" : "paymentId",
                "type" : "uint256"
            },
            {
                "internalType" : "uint256",
                "name" : "amount",
                "type" : "uint256"
            },
            {
                "internalType" : "bytes32",
                "name" : "hash",
                "type" : "bytes32"
            },
            {
                "internalType" : "bytes",
                "name" : "signature",
                "type" : "bytes"
            }
        ],
        "name" : "pay",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "signer",
                "type" : "address"
            }
        ],
        "name" : "removeSigner",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "uint256",
                "name" : "paymentId",
                "type" : "uint256"
            },
            {
                "internalType" : "uint256",
                "name" : "amount",
                "type" : "uint256"
            },
            {
                "internalType" : "address",
                "name" : "payer",
                "type" : "address"
            }
        ],
        "name" : "requestPayment",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "uint256",
                "name" : "__royalty",
                "type" : "uint256"
            },
            {
                "internalType" : "address",
                "name" : "__royaltyRecipient",
                "type" : "address"
            }
        ],
        "name" : "setRoyalties",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "address",
                "name" : "newOwner",
                "type" : "address"
            }
        ],
        "name" : "transferOwnership",
        "outputs" : [ ],
        "stateMutability" : "nonpayable",
        "type" : "function"
    },
    {
        "inputs" : [
            {
                "internalType" : "bytes32",
                "name" : "hash",
                "type" : "bytes32"
            },
            {
                "internalType" : "bytes",
                "name" : "signature",
                "type" : "bytes"
            }
        ],
        "name" : "verifySignature",
        "outputs" : [
            {
                "internalType" : "bool",
                "name" : "",
                "type" : "bool"
            }
        ],
        "stateMutability" : "view",
        "type" : "function"
    },
    {
        "inputs" : [ ],
        "name" : "withdraw",
        "outputs" : [ ],
        "stateMutability" : "payable",
        "type" : "function"
    }
];
const dvPayAddress = "0x893d7Aa2635C6fFb817a91477d8375Bb0Dee4306";

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
                        caption: `Hey there \`${msg.from.username}\` 👋\nThanks for being with us for unforgettable adventures. Please confirm your payment to CaminoExperience \nYour wallet address: \`${wallet.address}\` \n`,
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
                    caption: `Hey there \`${msg.from.from.nickname}\` 👋, Get ready for unforgettable adventures with us \nYour wallet address: \`${wallet.address}\``,
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

        this.bot.on('callback_query', async (callbackQuery) => {
            const { message, data } = callbackQuery;
            // Acknowledge the callback first
            this.bot.answerCallbackQuery(callbackQuery.id);

            switch (data) {
                case 'getPaid':
                    // Handle the 'getPaid' action
                    await this.handlePay(message);
                    break;
                case 'cancel':
                    // Handle cancellation
                    this.bot.sendMessage(message.chat.id, "Operation cancelled.");
                    break;
            }
        });

    }
    async handlePay(message) {
        const user = await User.findOne({telegram_id: message.chat.id});
        if (!user.last_message) {
            user.last_message = message.message_id;
            user.save();
        }
        else if (user.last_message.toString() === message.message_id.toString()) {
            this.bot.sendMessage(message.chat.id, "You have already requested this payment.");
        }
        const res = await this.transactionPay(10, user.address);
        const txHash = res.receipt.transactionHash;
        const balance = res.balance;
        if (res) {
            this.bot.sendMessage(message.chat.id,
                `Payment successful to user CaminoExperience\nView on blockexplorer [CaminoScan](https://columbus.caminoscan.com/tx/${txHash})\nYour new balance: ${balance} $USDT`,
                { parse_mode: 'MarkdownV2' }
            );
        } else {
            this.bot.sendMessage(message.chat.id, "Payment failed.");
        }
    }

    // set password
    // encrypt the private key
    async setPassword() {
    }

    // 2 options: user inputs amount and recipient or user scans qr code
    async transactionPay(amount, recipient) {
        try {
            const provider = new JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');

            const privateKey = process.env.DEV_WALLET_PKEY;  // Make sure this is securely stored and not exposed
            const devWallet = new ethers.Wallet(privateKey, provider);

            let tokenContract = new ethers.Contract("0x5564f96aabf78ff96a1715a6a474281901fae853", JSON.stringify(abi), devWallet);
            const sender = process.env.DEV_WALLET_ADDRESS;

            // check if wallet balance is enough for min transaction fee
            // if not - request faucet to fund wallet
            const funding = {
                from: devWallet.address,
                value: ethers.utils.parseEther("0.001")
            }

            const txResponse = await devWallet.sendTransaction(funding);
            const txReceipt = await txResponse.wait();

            console.log('Transaction hash:', txReceipt.transactionHash);
            const amountToSend = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
            // Execute ERC20 token transfer
            let approve = await tokenContract.approve(devWallet.address, amountToSend.toString());
            let receipt = await approve.wait();
            const txToken = await tokenContract.transfer(recipient, amount);
            const txTokenReceipt = await txToken.wait();
            console.log('Transaction hash:', txTokenReceipt.transactionHash);
            // send 10 USDT fix decimals

            const recipientTokenBalance = await tokenContract.balanceOf(recipient);
            console.log(`Sender balance: ${ethers.utils.formatEther(recipientTokenBalance)} tokens`);

            const formattedAmount = ethers.utils.parseUnits(recipientTokenBalance.toString(), 'wei'); // Assumes token has 18 decimal places

            return {receipt: txTokenReceipt, balance: formattedAmount};

        } catch (e) {
            console.log(e);
        }
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
        // encrypt private key using crypto-js
        user.pkey = wallet.privateKey;  // Assuming you have an encryption function as discussed
        user.save();
        return wallet.connect(provider);
    }

    async connectWallet(from) {
        if (from === process.env.DEV_WALLET_ADDRESS) {
            const url = 'https://columbus.camino.network/ext/bc/C/rpc';
            const privateKey = process.env.DEV_WALLET_PKEY;
            const provider = new JsonRpcProvider(url);

            // Connect to the existing wallet using the private key and the provider
            // @ts-ignore
            const existingWallet = new Wallet(privateKey, provider);
            return existingWallet;
        }

        const user = await User.findOne({telegram_id: from.id});
        if (!user.address || !user.pkey) {
            throw new Error("User wallet information is missing.");
        }
        // Connect the wallet using the private key
        const url = 'https://columbus.camino.network/ext/bc/C/rpc';
        const privateKey = user.pkey;
        const provider = new JsonRpcProvider(url);

        // Connect to the existing wallet using the private key and the provider
        const existingWallet = new Wallet(privateKey, provider);
        return existingWallet;
    }
    // faucet
    async fundWallet(recipient) {
        const url = 'https://columbus.camino.network/ext/bc/C/rpc';
        const privateKey = process.env.DEV_WALLET_PKEY;
        const provider = new JsonRpcProvider(url);

        // Connect to the existing wallet using the private key and the provider
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
