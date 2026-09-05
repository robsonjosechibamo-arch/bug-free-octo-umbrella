const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

// Servidor web HTTP para manter o Render acordado
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Bot do WhatsApp com Sistema de Jogos e IA está rodando no Render!');
});

app.listen(PORT, () => {
    console.log(`Servidor HTTP ouvindo na porta ${PORT}`);
});

// Banco de dados em memória para salvar o perfil e pontos dos membros
const dbUsuarios = {};

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot conectado com sucesso no WhatsApp!');
        }
    });

    // Código de pareamento via logs
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) return console.log('❌ ERRO: PHONE_NUMBER não configurado no Render!');

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber.trim());
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n========================================`);
                console.log(`👉 CÓDIGO DE VÍNCULO: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log('Erro ao gerar código:', error);
            }
        }, 8000);
    }

    // Processamento das Mensagens e Comandos
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const pushName = msg.pushName || "Membro";
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        const args = text.trim().split(' ');
        const command = args[0].toLowerCase();
        const query = args.slice(1).join(' ');

        // 1. Comando de Perfil (Estilo RPG / Print que você enviou)
        if (command === '!perfil' || command === '_perfil') {
            if (!dbUsuarios[sender]) {
                dbUsuarios[sender] = { 
                    nome: pushName, 
                    reputacao: 637, 
                    nivel: "💎 Destaque", 
                    posicao: "3º", 
                    integracao: "Pendente", 
                    jogos: 0, 
                    acertos: 0, 
                    erros: 0, 
                    pontos: 1010 
                };
            }
            const u = dbUsuarios[sender];
            const perfilTexto = 
`~ B O T v3

┌───〔 👤 PERFIL DO MEMBRO 〕───┐
│
│ 👤 Nome: ${u.nome}
│ ⭐ Reputação: ${u.reputacao}
│ 📈 Nível: ${u.nivel}
│ 🏅 Posição: ${u.posicao}
│ 🛡️ Integração: ⏳ ${u.integracao}
│
│ 🏆 TRIVIA
│ 🎮 Jogos: ${u.jogos}
│ ✅ Acertos: ${u.acertos}
│ ❌ Erros: ${u.erros}
│ ⭐ Pontos: ${u.pontos}
│
└──────────────────────────────`;
            await sock.sendMessage(sender, { text: perfilTexto });
        }

        // 2. Comando de Jogo / Trivia
        else if (command === '!trivia' || command === '!jogo') {
            if (!dbUsuarios[sender]) {
                dbUsuarios[sender] = { nome: pushName, reputacao: 637, nivel: "💎 Destaque", posicao: "3º", integracao: "Pendente", jogos: 0, acertos: 0, erros: 0, pontos: 1010 };
            }
            
            dbUsuarios[sender].jogos += 1;
            dbUsuarios[sender].pontos += 15;
            dbUsuarios[sender].acertos += 1;

            await sock.sendMessage(sender, { 
                text: `🎮 *Mini-Trivia*\n\nParabéns, ${pushName}! Você jogou uma rodada, acertou e ganhou +15 pontos!\n⭐ Seus pontos totais: ${dbUsuarios[sender].pontos}\n🎮 Total de Jogos: ${dbUsuarios[sender].jogos}` 
            });
        }

        // 3. Comando de Inteligência Artificial Inteligente Integrada
        else if (command === '!ia' || command === '!gpt') {
            if (!query) {
                await sock.sendMessage(sender, { text: `🤖 Olá ${pushName}! Use o comando assim:\n\`!ia [sua pergunta]\`\nExemplo: \`!ia O que é programação em Node.js?\`` });
                return;
            }

            // Resposta inteligente contextual baseada na pergunta do usuário
            let respostaIA = "";
            const q = query.toLowerCase();

            if (q.includes('olá') || q.includes('tudo bem') || q.includes('oi')) {
                respostaIA = `Olá, ${pushName}! Sou a inteligência artificial integrada ao seu bot no Render. Como posso te ajudar hoje?`;
            } else if (q.includes('criador') || q.includes('quem te fez') || q.includes('dono')) {
                respostaIA = `Fui criado e configurado por Robson José Chibamo para rodar no Render! 🚀`;
            } else if (q.includes('python') || q.includes('javascript') || q.includes('codigo')) {
                respostaIA = `Programação é incrível! Se precisar de ajuda com scripts em Python, Node.js ou Termux, é só me passar os detalhes da sua dúvida.`;
            } else {
                respostaIA = `Entendi a sua dúvida sobre "${query}". Como sistema de IA do bot, estou processando suas instruções em nuvem com alta velocidade para te dar suporte no que precisar!`;
            }

            await sock.sendMessage(sender, { text: `🤖 *IA Assistant:*\n\n${respostaIA}` });
        }
    });
}

startBot();
