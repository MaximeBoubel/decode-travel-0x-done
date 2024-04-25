import TelegramBot from 'node-telegram-bot-api';
import {BigNumber, ethers, HDNodeWallet, Wallet} from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import {ObjectId} from 'mongodb';
import {Contract} from "../models/Contract";
import {User} from "../models/User";
// import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';


const ENCRYPTION_KEY: string = process.env.ENCRYPTION_KEY!;
const IV_LENGTH: number = 16;  // For AES-256-CBC, IV is always 16 bytes

// usdt contract address and abi
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
                    const username = msg.from.username ? msg.from.username : '';
                    options = {
                        caption: `Hey there \`${msg.from.username}\` 👋\nThanks for being with us for unforgettable adventures. Please confirm and you will receive 10 $USDT from 0xDone \nYour wallet address: \`${wallet.address}\` \n`,
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

                // welcome image
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
            }
        });

        this.bot.on('callback_query', async (callbackQuery) => {
            const { message, data } = callbackQuery;
            // Acknowledge the callback first
            this.bot.answerCallbackQuery(callbackQuery.id);

            switch (data) {
                case 'getPaid':
                    // Handle the 'getPaid' action
                    await this.handleGetPaid(message);
                    break;
                case 'cancel':
                    // Handle cancellation
                    this.bot.sendMessage(message.chat.id, "Operation cancelled.");
                    break;
            }
        });
    }

    async handleGetPaid(message) {
        const user = await User.findOne({telegram_id: message.chat.id});
        if (!user.last_message) {
            user.last_message = message.message_id;
            user.save();
        }
        else if (user.last_message.toString() === message.message_id.toString()) {
            this.bot.sendMessage(message.chat.id, "You have already requested this payment.");
        }
        const res = await this.claimPaymentDemo(10, user.address);
        const txHash = res.receipt.transactionHash;
        const balance = res.balance.toString();

        if (res) {
            this.bot.sendMessage(message.chat.id,
                `Payment received\nView on blockexplorer [CaminoScan](https://columbus.caminoscan.com/tx/${txHash})\nYour new balance:${balance} USDT`,
                { parse_mode: 'MarkdownV2' }
            );
        } else {
            this.bot.sendMessage(message.chat.id, "Payment failed.");
        }
    }

    async claimPaymentDemo(amount, recipient) {
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

            // Execute ERC20 token transfer
            const _amount = BigNumber.from(amount).mul(BigNumber.from(10).pow(18));
            let approve = await tokenContract.approve(devWallet.address, _amount.toString();
            let receipt = await approve.wait();        // before transfer, give me the transaction amount
            const txToken = await tokenContract.transfer(recipient, _amount.toString());
            const txTokenReceipt = await txToken.wait();
            console.log('Transaction hash:', txTokenReceipt.transactionHash);

            const recipientTokenBalance = await tokenContract.balanceOf(recipient);
            console.log(`Sender balance: ${ethers.utils.formatEther(recipientTokenBalance)} tokens`);

           // const formattedAmount = ethers.utils.formatEther(recipientTokenBalance).toString(); // Assumes token has 18 decimal places
            const formattedAmount = parseInt(ethers.utils.formatEther(recipientTokenBalance));

            return {receipt: txTokenReceipt, balance: formattedAmount.toString()};

        } catch (e) {
            console.log(e);
        }

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
        const res = await this.transactionPay(10, process.env.DEV_WALLET_ADDRESS, user);
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
    // to encrypt the private key
    async setPassword() {

    }

    // 2 options: user inputs amount and recipient or user scans qr code
    // async transactionPay(amount, recipient, sender) {
    //     try {
    //         const provider = new JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');
    //         // recipient
    //         const privateKey = process.env.DEV_WALLET_PKEY;  // Make sure this is securely stored and not exposed
    //         const recipientWallet = new ethers.Wallet(privateKey, provider);
    //
    //         // sender wallet
    //         // @ts-ignore
    //         const senderPrivateKey = sender.pkey; // Make sure this is securely stored and not exposed, decrypt
    //         const senderWallet = new ethers.Wallet(senderPrivateKey, provider);
    //
    //         let tokenContract = new ethers.Contract("0x5564f96aabf78ff96a1715a6a474281901fae853", JSON.stringify(abi), senderWallet);
    //
    //         const amountToSend = BigNumber.from(10).mul(BigNumber.from(10).pow(18));
    //         // Execute ERC20 token transfer
    //         let approve = await tokenContract.approve(senderWallet.address, amountToSend.toString());
    //         let receipt = await approve.wait();
    //         const txToken = await tokenContract.transfer(recipient, amountToSend.toString();
    //         const txTokenReceipt = await txToken.wait();
    //         console.log('Transaction hash:', txTokenReceipt.transactionHash);
    //
    //         const senderBalance = await tokenContract.balanceOf(senderWallet.address);
    //         console.log(`Sender balance: ${ethers.utils.formatEther(senderBalance)} tokens`);
    //         const formattedAmount = ethers.utils.parseUnits(senderBalance.toString(), 'wei'); // Assumes token has 18 decimal places
    //         return {receipt: txTokenReceipt, balance: formattedAmount};
    //
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    async transactionPay(amount: number, recipient: string, sender: any) {
        try {
            const provider = new ethers.providers.JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');

            // Initializing the sender wallet
            const senderPrivateKey = sender.pkey; // Ensure this private key is securely stored and handled
            const senderWallet = new ethers.Wallet(senderPrivateKey, provider);

            // Define the token contract with the ABI and contract address
            const tokenContract = new ethers.Contract(
                "0x5564f96aabf78ff96a1715a6a474281901fae853",
                abi,  // Make sure 'abi' is correctly imported or defined in your scope
                senderWallet
            );

            // Calculate the amount to send accounting for decimal places
            const decimals = await tokenContract.decimals(); // Dynamically fetch the token's decimals
            const amountToSend = BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals));

            // Approve the transfer from the sender's wallet
            let approve = await tokenContract.approve(recipient, amountToSend.toString());
            await approve.wait();

            // Execute the token transfer
            const txToken = await tokenContract.transfer(recipient, amountToSend.toString());
            const txTokenReceipt = await txToken.wait();
            console.log('Transaction hash:', txTokenReceipt.transactionHash);

            // Fetch and log the sender's balance post-transfer
            const senderBalance = await tokenContract.balanceOf(senderWallet.address);
            console.log(`Sender balance: ${ethers.utils.formatUnits(senderBalance, decimals)} tokens`);

            return {
                receipt: txTokenReceipt,
                balance: ethers.utils.formatUnits(senderBalance, decimals)
            };
        } catch (e) {
            console.error(e);
            throw e; // Re-throw the error to handle it in the calling function or indicate a failure
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
            const existingWallet = new Wallet(privateKey, provider);
            return existingWallet;
        }

        const user = await User.findOne({telegram_id: from.id});
        if (!user.address || !user.pkey) {
            throw new Error("User wallet information is missing.");
        }
        // Connect the wallet using the private key
        const url = 'https://columbus.camino.network/ext/bc/C/rpc';
        const privateKey = user.pkey; // encrypt with passphrase (user input)
        const provider = new JsonRpcProvider(url);

        // Connect to the existing wallet using the private key and the provider
        const existingWallet = new Wallet(privateKey, provider);
        return existingWallet;
    }

    async pay(amount: number, recipient: string, sender: { pkey: string }) {
        try {
            const provider = new ethers.providers.JsonRpcProvider('https://columbus.camino.network/ext/bc/C/rpc');

            const wallet = new ethers.Wallet(sender.pkey, provider);

            // Prepare the transaction details
            const transaction = {
                from: wallet.address,  // 'from' field is typically not needed as the wallet knows its address
                to: recipient,
                value: ethers.utils.parseEther(amount.toString())  // Convert the amount to the smallest unit
            };

            // Send the transaction
            const txResponse = await wallet.sendTransaction(transaction);
            const txReceipt = await txResponse.wait();

            // Logging the transaction hash
            console.log('Transaction hash:', txReceipt.transactionHash);

            // Return the transaction receipt
            return txReceipt;
        } catch (error) {
            console.error('Failed to send transaction:', error);
            throw error;  // Rethrow or handle the error appropriately
        }
    }

    async requestPayment(amount: number, recipient: string, sender: { pkey: string }) {
        try {
            const paymentId = Date.now().toString();

            const provider = new ethers.providers.JsonRpcProvider('https://your.network/rpc');

            // Create a wallet for the sender
            const senderWallet = new ethers.Wallet(sender.pkey, provider);

            // Generate a message to sign
            const message = `Please sign this message to confirm the payment request of ${amount} units to ${recipient}. Payment ID: ${paymentId}`;

            // Request a signature from the sender
            const signature = await senderWallet.signMessage(message);

            // Generate QR code for the paymentId, which can be scanned for further processing
            const qrCodeUrl = await QRCode.toDataURL(paymentId);

            console.log('Payment ID:', paymentId);
            console.log('Signature:', signature);
            console.log('QR Code URL:', qrCodeUrl);

            return {
                paymentId,
                signature,
                qrCodeUrl
            };
        } catch (error) {
            console.error('Failed to process payment request:', error);
            throw error;
        }
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

    /**** encryption and decryption functions ****/
     encrypt(privateKey, passphrase) {
        const encrypted = CryptoJS.AES.encrypt(privateKey, passphrase).toString();
        return encrypted;
    }

    // Function to decrypt the private key
     decrypt(encryptedPrivateKey, passphrase) {
        const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, passphrase);
        const originalPrivateKey = bytes.toString(CryptoJS.enc.Utf8);
        return originalPrivateKey;
    }

}
