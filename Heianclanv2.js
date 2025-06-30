const { WAConnection, MessageType } = require('@adiwajshing/baileys');
const fs = require('fs');

const config = require('./config.json');
const prefix = config.botPrefix || '!';
const pairedFile = config.pairedFile || 'paired.json';

let pairedNumbers = {};
if (fs.existsSync(pairedFile)) {
    pairedNumbers = JSON.parse(fs.readFileSync(pairedFile));
}

const conn = new WAConnection();

function savePairs() {
    fs.writeFileSync(pairedFile, JSON.stringify(pairedNumbers, null, 2));
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

let pendingPairings = {};

async function startBot() {
    conn.on('open', () => console.log('Bot connected'));

    conn.on('chat-update', async (chatUpdate) => {
        if (!chatUpdate.hasNewMessage) return;
        const message = chatUpdate.messages.all()[0];
        if (!message.message) return;

        const messageType = Object.keys(message.message)[0];
        const sender = message.key.remoteJid;
        if (sender.endsWith('@g.us')) return;

        const msgText = (message.message.conversation || message.message[messageType].text || '').trim();
        if (!msgText.startsWith(prefix)) return;

        const commandBody = msgText.slice(prefix.length).trim();
        const args = commandBody.split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'pair') {
            if (pairedNumbers[sender]) {
                return conn.sendMessage(sender, 'Your device is already paired!', MessageType.text);
            }
            if (pendingPairings[sender]) {
                return conn.sendMessage(sender, 'Enter the verification code sent to you.', MessageType.text);
            }
            if (args.length === 0) {
                return conn.sendMessage(sender, 'Send your phone number.\nExample: !pair 2348012345678', MessageType.text);
            }
            const phone = args[0];
            const otp = generateOTP();
            pendingPairings[sender] = { phone, otp };
            return conn.sendMessage(sender, `Verification code to ${phone} is: *${otp}*\nReply with !verify <code>`, MessageType.text);
        }

        if (command === 'verify') {
            if (!pendingPairings[sender]) {
                return conn.sendMessage(sender, 'No pending pairing. Use !pair <number> to start.', MessageType.text);
            }
            const userOtp = args[0];
            const expectedOtp = pendingPairings[sender].otp;
            if (userOtp === expectedOtp) {
                pairedNumbers[sender] = pendingPairings[sender].phone;
                savePairs();
                delete pendingPairings[sender];
                return conn.sendMessage(sender, 'Paired successfully! Use commands now.', MessageType.text);
            } else {
                return conn.sendMessage(sender, 'Incorrect code. Try again.', MessageType.text);
            }
        }

        if (!pairedNumbers[sender]) {
            return conn.sendMessage(sender, 'Pair first using !pair <number>.', MessageType.text);
        }

        const responses = {
            bug: 'Bug command activated!',
            invinciblebug: 'Invincible bug activated!',
            spamcall: 'Spam call initiated!',
            stickerbug: 'Sticker bug triggered!',
            virus: 'Simulated virus deployed!',
            safe: 'Safe mode activated!',
            help: 'Commands:\n!pair <number>\n!verify <code>\n!bug\n!invinciblebug\n!spamcall\n!
