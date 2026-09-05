const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // Simula um navegador padrão para evitar bloqueios
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado com sucesso no WhatsApp!');
        }
    });

    // Se não estiver registrado, solicita o código assim que o canal WebSocket estiver pronto
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        
        if (!phoneNumber) {
            console.log('❌ ERRO: A variável de ambiente PHONE_NUMBER não foi configurada!');
            return;
        }

        // Aguarda 8 segundos para garantir que o socket estabeleceu comunicação
        setTimeout(async () => {
            try {
                console.log(`Solicitando código de pareamento para: ${phoneNumber}`);
                let code = await sock.requestPairingCode(phoneNumber.trim());
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n========================================`);
                console.log(`👉 CÓDIGO DE VÍNCULO: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log('Erro ao gerar o código:', error);
            }
        }, 8000);
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text && text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong! 🤖 Bot ativo.' });
        }
    });
}

startBot();
