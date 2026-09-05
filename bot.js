const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state
    });

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

    sock.ev.on('creds.update', saveCreds);

    // Se não estiver registrado, solicita o código após um breve momento de estabilização
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        
        if (!phoneNumber) {
            console.log('❌ ERRO: A variável de ambiente PHONE_NUMBER não foi configurada no Render!');
            return;
        }

        // Aguarda a conexão abrir o canal com o WhatsApp antes de pedir o código
        setTimeout(async () => {
            try {
                console.log(`Solicitando código de pareamento para o número: ${phoneNumber}...`);
                let code = await sock.requestPairingCode(phoneNumber.trim());
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n========================================`);
                console.log(`👉 SEU CÓDIGO DE VÍNCULO: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log('Erro ao gerar o código de pareamento:', error);
            }
        }, 5000); // Aumentado para 5 segundos para garantir estabilidade
    }

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text && text.toLowerCase() === 'ping') {
            await sock.sendMessage(sender, { text: 'Pong! 🤖 O bot no Render está ativo.' });
        }
    });
}

startBot();
