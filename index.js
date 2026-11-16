const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

// Banco de perguntas do Quiz
const perguntas = [
  {
    pergunta: "Qual é a linguagem de programação mais popular para criar bots de automação e IA?",
    opcoes: ["A) Java", "B) Python", "C) C#", "D) Ruby"],
    resposta: "b"
  },
  {
    pergunta: "Em qual país fica situada a cidade de Maputo?",
    opcoes: ["A) Brasil", "B) Portugal", "C) Moçambique", "D) Angola"],
    resposta: "c"
  },
  {
    pergunta: "Quantos bits formam 1 Byte?",
    opcoes: ["A) 4", "B) 8", "C) 16", "D) 32"],
    resposta: "b"
  }
];

// Estado global para controlar se já há um quiz rolando nos grupos
const jogosAtivos = {};

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    // Se o bot ainda não estiver conectado/registrado, gera o código automaticamente usando o número abaixo
    if (!sock.authState.creds.registered) {
        // ⚠️ COLOQUE O SEU NÚMERO AQUI COM O CÓDIGO DO PAÍS (Ex: Moçambique = 258, seguido do seu número)
        const phoneNumber = "258853961088"; // <-- SUBSTITUA PELO SEU NÚMERO REAL
        
        console.log(`\n🔄 A solicitar código de emparelhamento para o número: ${phoneNumber}...\n`);
        
        // Pequeno atraso para garantir que a conexão iniciou
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n========================================`);
                console.log(`🔑 O SEU CÓDIGO DE EMPARELHAMENTO É: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.error("Erro ao gerar o código:", error);
            }
        }, 4000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) {
                iniciarBot();
            }
        } else if (connection === 'open') {
            console.log('🤖 Bot de Quiz do WhatsApp conectado com sucesso!');
        }
    });

    // Ouvindo mensagens recebidas
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const remoteJid = m.key.remoteJid; // ID do chat (grupo ou privado)
        const isGroup = remoteJid.endsWith('@g.us');
        
        // Pega o texto da mensagem
        const mensagemTexto = m.message.conversation || 
                              m.message.extendedTextMessage?.text || '';
        const textoLimpo = mensagemTexto.trim().toLowerCase();

        // Comando para iniciar o Quiz: "!quiz"
        if (textoLimpo === '!quiz') {
            if (!isGroup) {
                await sock.sendMessage(remoteJid, { text: "⚠️ Este comando de quiz só funciona dentro de grupos do WhatsApp!" });
                return;
            }

            if (jogosAtivos[remoteJid]) {
                await sock.sendMessage(remoteJid, { text: "⚠️ Já existe uma rodada de quiz rolando neste grupo! Responda à pergunta atual." });
                return;
            }

            // Sorteia uma pergunta
            const qIndex = Math.floor(Math.random() * perguntas.length);
            const qSelecionada = perguntas[qIndex];

            // Define o estado do jogo para este grupo
            jogosAtivos[remoteJid] = {
                respostaCorreta: qSelecionada.resposta,
                respondido: false
            };

            // Monta o texto da pergunta
            let textoEnvio = `🎮 *DESAFIO DE QUIZ NO GRUPO* 🎮\n\n`;
            textoEnvio += `${qSelecionada.pergunta}\n\n`;
            qSelecionada.opcoes.forEach(opt => {
                textoEnvio += `${opt}\n`;
            });
            textoEnvio += `\n⏱️ *Responda com a letra correspondente (A, B, C ou D) aqui no grupo!*`;

            await sock.sendMessage(remoteJid, { text: textoEnvio });
            return;
        }

        // Verifica se há um jogo ativo e se a resposta é válida
        if (jogosAtivos[remoteJid] && !jogosAtivos[remoteJid].respondido) {
            if (['a', 'b', 'c', 'd'].includes(textoLimpo)) {
                const jogo = jogosAtivos[remoteJid];
                const senderName = m.pushName || "Participante";
                const participantJid = m.key.participant;

                if (textoLimpo === jogo.respostaCorreta) {
                    jogo.respondido = true;
                    delete jogosAtivos[remoteJid]; // Encerra o jogo atual

                    await sock.sendMessage(remoteJid, { 
                        text: `🎉 Parabéns, @${participantJid.split('@')[0]} (${senderName})! Você acertou em cheio a resposta correta (${textoLimpo.toUpperCase()})! 🏆`,
                        mentions: [participantJid]
                    });
                }
            }
        }
    });
}

iniciarBot();
