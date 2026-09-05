const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');

// Servidor web HTTP para manter o Render ativo 24/7
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).json({ status: "online", service: "Entertainment & Quiz Bot", uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`Servidor HTTP ouvindo na porta ${PORT}`);
});

// Banco de dados em memória para gerenciar pontuações e o estado do quiz dos usuários
const dbUsuarios = {};
const jogoAtivo = {}; // Controla se o usuário está respondendo a um quiz no momento

// Base de dados simulada para o catálogo de entretenimento
const catalogoMidias = {
    filmes: [
        "🎬 *Interestelar* - Sinopse: Um grupo de astronautas viaja através de um buraco de minhoca em busca de um novo lar para a humanidade.",
        "🎬 *A Origem* - Sinopse: Um ladrão que rouba segredos dos sonhos através da invasão dos sonhos recebe a tarefa inversa.",
        "🎬 *Dragon Ball Super: Broly* - Sinopse: Earth enjoys peace, but a new Saiyan named Broly appears."
    ],
    animes: [
        "⛩️ *Demon Slayer (Kimetsu no Yaiba)* - Acompanhe Tanjiro Kamado em busca de uma cura para sua irmã transformada em oni.",
        "⛩️ *Jujutsu Kaisen* - Yuji Itadori entra no mundo das maldições após engolir um dedo amaldiçoado de Ryomen Sukuna.",
        "⛩️ *Attack on Titan* - A humanidade luta pela sobrevivência dentro de muralhas gigantes contra criaturas devoradoras."
    ],
    doramas: [
        "🌸 *Round 6 (Squid Game)* - Pessoas em dificuldades financeiras aceitam um convite enigmático para competir em jogos infantis por um prêmio bilionário.",
        "🌸 *Pretendente Ordinária* - Uma comédia romântica envolvente sobre identidades trocadas no ambiente de trabalho corporativo.",
        "🌸 *Sorriso Real* - Um herdeiro chaebol que não suporta sorrisos falsos cruza o caminho de uma funcionária sempre sorridente."
    ],
    series: [
        "📺 *Breaking Bad* - Um professor de química do ensino médio diagnosticado com câncer de pulmão se volta para o crime.",
        "📺 *Stranger Things* - Um grupo de jovens em Hawkins investiga eventos sobrenaturais e experimentos secretos do governo.",
        "📺 *Peaky Blinders* - A saga de uma família de gângsters na Inglaterra pós-Primeira Guerra Mundial."
    ]
};

// Banco de perguntas dinâmicas divididas por categorias temáticas para o Quiz (A, B, C, D)
const bancoPerguntas = [
    {
        pergunta: "No universo de Dragon Ball, qual é o nome do golpe clássico executado por Goku unindo as mãos em formato de concha?",
        opcoes: { A: "Kamehameha", B: "Garlic Gun", C: "Final Flash", D: "Masenko" },
        resposta: "A"
    },
    {
        pergunta: "Qual é o nome do protagonista em *Demon Slayer* que integra o Corpo de Exterminadores de Oni?",
        opcoes: { A: "Zenitsu Agatsuma", B: "Tanjiro Kamado", C: "Inosuke Hashibira", D: "Muzan Kibutsuji" },
        resposta: "B"
    },
    {
        pergunta: "Na série *Breaking Bad*, qual composto químico o protagonista Walter White produz em alta pureza?",
        opcoes: { A: "Sulfato de Cobre", B: "Metanfetamina", C: "Clorofórmio", D: "Ácido Fluorídrico" },
        resposta: "B"
    },
    {
        pergunta: "Em *A Origem* (Inception), qual objeto o protagonista usa como totem para saber se está em um sonho?",
        opcoes: { A: "Um dado viciado", B: "Um relógio de bolso", C: "Um pião", D: "Uma moeda antiga" },
        resposta: "C"
    },
    {
        pergunta: "Qual o nome da cidade fictícia onde se passa a série *Stranger Things*?",
        opcoes: { A: "Riverdale", B: "Hawkins", C: "Sunnydale", D: "Starcourt" },
        resposta: "B"
    }
];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ["Professional Bot", "Chrome", "10.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Conexão fechada. Reconectando...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('✅ Bot conectado com sucesso e pronto para uso!');
        }
    });

    // Sistema de Código de Pareamento via Logs
    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (!phoneNumber) return console.log('❌ ERRO: Variável PHONE_NUMBER ausente no Render.');

        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumber.trim());
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n========================================`);
                console.log(`🔑 CÓDIGO DE VÍNCULO NO WHATSAPP: ${code}`);
                console.log(`========================================\n`);
            } catch (error) {
                console.log('Erro ao gerar código de pareamento:', error);
            }
        }, 8000);
    }

    // Processador de Comandos e Interações
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const pushName = msg.pushName || "Usuário";
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        const args = text.trim().split(' ');
        const command = args[0].toLowerCase();
        const query = args.slice(1).join(' ').toLowerCase();

        // Se o usuário estiver respondendo a um quiz ativo (A, B, C, D)
        if (jogoAtivo[sender] && ['a', 'b', 'c', 'd'].includes(command)) {
            const quiz = jogoAtivo[sender];
            const respostaUsuario = command.toUpperCase();

            if (!dbUsuarios[sender]) {
                dbUsuarios[sender] = { acertos: 0, erros: 0, pontos: 0 };
            }

            if (respostaUsuario === quiz.respostaCorreta) {
                dbUsuarios[sender].acertos += 1;
                dbUsuarios[sender].pontos += 20;
                await sock.sendMessage(sender, { text: `✅ *Resposta Correta, ${pushName}!* Você ganhou +20 pontos.\n⭐ Total de pontos: ${dbUsuarios[sender].pontos}` });
            } else {
                dbUsuarios[sender].erros += 1;
                await sock.sendMessage(sender, { text: `❌ *Resposta Incorreta!* A alternativa certa era a letra *(${quiz.respostaCorreta})*.` });
            }

            // Remove o estado de jogo ativo para liberar a próxima rodada
            delete jogoAtivo[sender];
            return;
        }

        // 1. Menu Principal
        if (command === '!menu' || command === '!help') {
            const menu = 
`🎬 *CENTRAL DE ENTRETENIMENTO E QUIZ* 🤖

Olá, *${pushName}*! Escolha uma das opções abaixo enviando o comando correspondente:

🍿 *Catálogo de Mídias:*
• \`!filmes\` - Lista filmes disponíveis.
• \`!animes\` - Lista animes em alta.
• \`!doramas\` - Lista doramas populares.
• \`!series\` - Lista séries recomendadas.

🎮 *Jogos de Perguntas (Trivia A, B, C, D):*
• \`!quiz\` - Inicia uma pergunta interativa gerada pelo sistema.
• \`!perfil\` - Mostra suas estatísticas e pontuação nos jogos.`;

            await sock.sendMessage(sender, { text: menu });
        }

        // 2. Comandos de Catálogo (Filmes, Animes, Doramas, Séries)
        else if (command === '!filmes') {
            await sock.sendMessage(sender, { text: `🍿 *Catálogo de Filmes:*\n\n` + catalogoMidias.filmes.join('\n\n') });
        }
        else if (command === '!animes') {
            await sock.sendMessage(sender, { text: `⛩️ *Catálogo de Animes:*\n\n` + catalogoMidias.animes.join('\n\n') });
        }
        else if (command === '!doramas') {
            await sock.sendMessage(sender, { text: `🌸 *Catálogo de Doramas:*\n\n` + catalogoMidias.doramas.join('\n\n') });
        }
        else if (command === '!series') {
            await sock.sendMessage(sender, { text: `📺 *Catálogo de Séries:*\n\n` + catalogoMidias.series.join('\n\n') });
        }

        // 3. Sistema de Quiz Dinâmico com Opções A, B, C, D
        else if (command === '!quiz' || command === '!jogo') {
            // Seleciona uma pergunta aleatória do banco para evitar repetições imediatas
            const randomIndex = Math.floor(Math.random() * bancoPerguntas.length);
            const q = bancoPerguntas[randomIndex];

            // Salva o estado do quiz para este usuário
            jogoAtivo[sender] = {
                respostaCorreta: q.resposta
            };

            const textoQuiz = 
`🎮 *DESAFIO TRIVIA - MÚLTIPLA ESCOLHA* 🎮

❓ *Pergunta:* ${q.pergunta}

A) ${q.opcoes.A}
B) ${q.opcoes.B}
C) ${q.opcoes.C}
D) ${q.opcoes.D}

👉 *Responda enviando apenas a letra correspondente (A, B, C ou D).*`;

            await sock.sendMessage(sender, { text: textoQuiz });
        }

        // 4. Perfil do Jogador
        else if (command === '!perfil') {
            if (!dbUsuarios[sender]) {
                dbUsuarios[sender] = { acertos: 0, erros: 0, pontos: 0 };
            }
            const u = dbUsuarios[sender];
            const perfilTexto = 
`👤 *PERFIL DO JOGADOR - ${pushName}*

📊 *Estatísticas de Jogo:*
• ✅ Acertos: ${u.acertos}
• ❌ Erros: ${u.erros}
• ⭐ Pontuação Total: ${u.pontos} pontos`;

            await sock.sendMessage(sender, { text: perfilTexto });
        }
    });
}

startBot();
