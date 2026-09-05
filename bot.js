const http = require("http");
const fs = require("fs");
const path = require("path");
const pino = require("pino");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const {
    responderIA,
    gerarQuizIA,
    gerarVerdadeiroFalsoIA
} = require("./ia");


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const PORT = process.env.PORT || 3000;

const AUTH_DIR = path.join(__dirname, "..", "auth_info_baileys");
const DATA_DIR = path.join(__dirname, "..", "dados");
const PLAYERS_FILE = path.join(DATA_DIR, "jogadores.json");


// =====================================================
// PREPARAR PASTAS
// =====================================================

if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}


// =====================================================
// JOGADORES
// =====================================================

function carregarJogadores() {

    try {

        if (!fs.existsSync(PLAYERS_FILE)) {
            fs.writeFileSync(
                PLAYERS_FILE,
                JSON.stringify({}, null, 2)
            );
        }

        return JSON.parse(
            fs.readFileSync(PLAYERS_FILE, "utf8")
        );

    } catch (erro) {

        console.error(
            "❌ Erro ao carregar jogadores:",
            erro.message
        );

        return {};
    }
}


function salvarJogadores(jogadores) {

    try {

        fs.writeFileSync(
            PLAYERS_FILE,
            JSON.stringify(jogadores, null, 2)
        );

    } catch (erro) {

        console.error(
            "❌ Erro ao salvar jogadores:",
            erro.message
        );
    }
}


const jogadores = carregarJogadores();


// =====================================================
// PERGUNTAS ATIVAS
// =====================================================

const perguntasAtivas = new Map();


// =====================================================
// NORMALIZAR TEXTO
// =====================================================

function normalizar(texto) {

    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

}


// =====================================================
// MENU
// =====================================================

function menu() {

    return `
╭━━━〔 🟢 GUARDA-CHUVA BOT 〕━━━╮

👋 Olá! Sou o Guarda-Chuva Bot.

📚 *INTELIGÊNCIA ARTIFICIAL*
🤖 /ia
🧠 /quiz
⚡ /vfia

🎮 *JOGOS*
🎯 /jogos
🧮 /matematica
❓ /charada
✅ /vf
🔢 /sequencia
🔤 /palavra

🎬 *ENTRETENIMENTO*
🎥 /filme
🌸 /anime
📺 /video

⛏️ *MINECRAFT*
🟩 /mc

👤 *PERFIL*
📊 /perfil
🏆 /ranking

ℹ️ /ajuda

╰━━━━━━━━━━━━━━━━━━━━╯
`;
}


// =====================================================
// IA
// =====================================================

async function comandoIA(sock, jid, texto) {

    const pergunta = texto
        .replace(/^\/ia/i, "")
        .trim();

    if (!pergunta) {

        await sock.sendMessage(jid, {
            text:
                "🤖 *IA Guarda-Chuva*\n\n" +
                "Escreve a tua pergunta depois de /ia.\n\n" +
                "Exemplo:\n" +
                "/ia explica como funciona a gravidade"
        });

        return;
    }

    await sock.sendMessage(jid, {
        text: "🤔 Estou a pensar..."
    });

    try {

        const resposta = await responderIA(pergunta);

        await sock.sendMessage(jid, {
            text:
                "🤖 *GUARDA-CHUVA IA*\n\n" +
                resposta
        });

    } catch (erro) {

        console.error("❌ Erro IA:", erro);

        await sock.sendMessage(jid, {
            text:
                "❌ Não consegui responder agora.\n" +
                "Verifica a configuração da GROQ_API_KEY."
        });
    }
}


// =====================================================
// QUIZ IA
// =====================================================

async function comandoQuiz(sock, jid) {

    await sock.sendMessage(jid, {
        text: "🧠 A preparar uma pergunta..."
    });

    try {

        const quiz = await gerarQuizIA();

        perguntasAtivas.set(jid, {
            tipo: "quiz",
            pergunta: quiz.pergunta,
            resposta: normalizar(quiz.resposta),
            opcoes: quiz.opcoes,
            explicacao: quiz.explicacao,
            id: quiz.id
        });

        const letras = ["A", "B", "C", "D"];

        let texto = `${quiz.pergunta}\n\n`;

        quiz.opcoes.forEach((opcao, i) => {

            texto += `${letras[i]}) ${opcao}\n`;

        });

        texto +=
            "\n💬 Responde com A, B, C ou D.";

        await sock.sendMessage(jid, {
            text
        });

    } catch (erro) {

        console.error("❌ Erro Quiz:", erro);

        await sock.sendMessage(jid, {
            text: "❌ Não consegui gerar o quiz agora."
        });
    }
}


// =====================================================
// VERDADEIRO OU FALSO IA
// =====================================================

async function comandoVFIA(sock, jid) {

    await sock.sendMessage(jid, {
        text: "🤖 A preparar Verdadeiro ou Falso..."
    });

    try {

        const pergunta = await gerarVerdadeiroFalsoIA();

        perguntasAtivas.set(jid, {
            tipo: "vf",
            pergunta: pergunta.pergunta,
            resposta: pergunta.resposta,
            explicacao: pergunta.explicacao,
            id: pergunta.id
        });

        await sock.sendMessage(jid, {
            text:
                `${pergunta.pergunta}\n\n` +
                "🟢 V — Verdadeiro\n" +
                "🔴 F — Falso\n\n" +
                "💬 Responde V ou F."
        });

    } catch (erro) {

        console.error("❌ Erro VF:", erro);

        await sock.sendMessage(jid, {
            text: "❌ Não consegui gerar a pergunta agora."
        });
    }
}


// =====================================================
// VERIFICAR RESPOSTA
// =====================================================

async function verificarResposta(sock, jid, texto) {

    const pergunta = perguntasAtivas.get(jid);

    if (!pergunta) {
        return false;
    }

    const resposta = normalizar(texto);

    if (pergunta.tipo === "quiz") {

        const letras = ["a", "b", "c", "d"];

        if (!letras.includes(resposta)) {
            return false;
        }

        const indice = letras.indexOf(resposta);

        const respostaCorreta =
            normalizar(pergunta.opcoes[indice]);

        const acertou =
            respostaCorreta === pergunta.resposta;

        perguntasAtivas.delete(jid);

        if (acertou) {

            await sock.sendMessage(jid, {
                text:
                    "🎉 *CORRETO!*\n\n" +
                    "🏆 Ganhaste 10 pontos!\n\n" +
                    (pergunta.explicacao
                        ? `💡 ${pergunta.explicacao}`
                        : "")
            });

        } else {

            await sock.sendMessage(jid, {
                text:
                    "❌ *ERRADO!*\n\n" +
                    `✅ Resposta correta: ${pergunta.resposta}\n\n` +
                    (pergunta.explicacao
                        ? `💡 ${pergunta.explicacao}`
                        : "")
            });
        }

        return true;
    }


    if (pergunta.tipo === "vf") {

        if (!["v", "f"].includes(resposta)) {
            return false;
        }

        const acertou =
            resposta.toUpperCase() === pergunta.resposta;

        perguntasAtivas.delete(jid);

        if (acertou) {

            await sock.sendMessage(jid, {
                text:
                    "🎉 *CORRETO!*\n\n" +
                    "🏆 Ganhaste 10 pontos!\n\n" +
                    (pergunta.explicacao
                        ? `💡 ${pergunta.explicacao}`
                        : "")
            });

        } else {

            await sock.sendMessage(jid, {
                text:
                    "❌ *ERRADO!*\n\n" +
                    `✅ Resposta correta: ${pergunta.resposta}\n\n` +
                    (pergunta.explicacao
                        ? `💡 ${pergunta.explicacao}`
                        : "")
            });
        }

        return true;
    }

    return false;
}


// =====================================================
// PROCESSAR MENSAGEM
// =====================================================

async function processarMensagem(sock, msg) {

    if (!msg.message) {
        return;
    }

    if (msg.key.fromMe) {
        return;
    }

    const jid = msg.key.remoteJid;

    if (!jid) {
        return;
    }

    const texto =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

    if (!texto.trim()) {
        return;
    }

    console.log(`📩 ${jid}: ${texto}`);

    // Primeiro verifica se existe pergunta ativa
    if (await verificarResposta(sock, jid, texto)) {
        return;
    }

    const comando = normalizar(texto);


    // =================================================
    // MENU
    // =================================================

    if (
        comando === "/start" ||
        comando === "/menu"
    ) {

        await sock.sendMessage(jid, {
            text: menu()
        });

        return;
    }


    // =================================================
    // AJUDA
    // =================================================

    if (comando === "/ajuda") {

        await sock.sendMessage(jid, {
            text:
                "ℹ️ *AJUDA GUARDA-CHUVA BOT*\n\n" +
                "Usa /menu para ver todos os comandos.\n\n" +
                "🤖 /ia pergunta\n" +
                "🧠 /quiz\n" +
                "⚡ /vfia\n\n" +
                "Exemplo:\n" +
                "/ia qual é a capital de Moçambique?"
        });

        return;
    }


    // =================================================
    // IA
    // =================================================

    if (comando.startsWith("/ia")) {

        await comandoIA(sock, jid, texto);

        return;
    }


    // =================================================
    // QUIZ
    // =================================================

    if (comando === "/quiz") {

        await comandoQuiz(sock, jid);

        return;
    }


    // =================================================
    // VERDADEIRO/FALSO
    // =================================================

    if (
        comando === "/vfia" ||
        comando === "/vfai"
    ) {

        await comandoVFIA(sock, jid);

        return;
    }


    // =================================================
    // JOGOS
    // =================================================

    if (comando === "/jogos") {

        await sock.sendMessage(jid, {
            text:
                "🎮 *JOGOS DISPONÍVEIS*\n\n" +
                "🧠 /quiz\n" +
                "⚡ /vfia\n" +
                "🧮 /matematica\n" +
                "❓ /charada\n" +
                "✅ /vf\n" +
                "🔢 /sequencia\n" +
                "🔤 /palavra"
        });

        return;
    }


    // =================================================
    // FILMES
    // =================================================

    if (comando === "/filme") {

        await sock.sendMessage(jid, {
            text:
                "🎬 *FILMES*\n\n" +
                "O sistema de filmes será adicionado na próxima versão."
        });

        return;
    }


    // =================================================
    // ANIME
    // =================================================

    if (comando === "/anime") {

        await sock.sendMessage(jid, {
            text:
                "🌸 *ANIME*\n\n" +
                "O sistema de anime será adicionado na próxima versão."
        });

        return;
    }


    // =================================================
    // VÍDEOS
    // =================================================

    if (comando === "/video") {

        await sock.sendMessage(jid, {
            text:
                "📺 *VÍDEOS*\n\n" +
                "O sistema de vídeos será adicionado na próxima versão."
        });

        return;
    }


    // =================================================
    // MINECRAFT
    // =================================================

    if (comando === "/mc") {

        await sock.sendMessage(jid, {
            text:
                "⛏️ *MINECRAFT*\n\n" +
                "O módulo Minecraft será adicionado aqui."
        });

        return;
    }


    // =================================================
    // PERFIL
    // =================================================

    if (comando === "/perfil") {

        if (!jogadores[jid]) {

            jogadores[jid] = {
                pontos: 0,
                jogos: 0
            };

            salvarJogadores(jogadores);
        }

        const jogador = jogadores[jid];

        await sock.sendMessage(jid, {
            text:
                "👤 *TEU PERFIL*\n\n" +
                `🏆 Pontos: ${jogador.pontos || 0}\n` +
                `🎮 Jogos: ${jogador.jogos || 0}`
        });

        return;
    }


    // =================================================
    // RANKING
    // =================================================

    if (comando === "/ranking") {

        const ranking = Object.entries(jogadores)
            .sort(
                (a, b) =>
                    (b[1].pontos || 0) -
                    (a[1].pontos || 0)
            )
            .slice(0, 10);

        if (!ranking.length) {

            await sock.sendMessage(jid, {
                text: "🏆 Ainda não existem jogadores no ranking."
            });

            return;
        }

        let textoRanking =
            "🏆 *RANKING GUARDA-CHUVA*\n\n";

        ranking.forEach((item, index) => {

            const numero = index + 1;
            const dados = item[1];

            textoRanking +=
                `${numero}. 🏆 ${dados.pontos || 0} pontos\n`;
        });

        await sock.sendMessage(jid, {
            text: textoRanking
        });

        return;
    }


    // =================================================
    // COMANDO DESCONHECIDO
    // =================================================

    if (texto.startsWith("/")) {

        await sock.sendMessage(jid, {
            text:
                "❓ Comando não encontrado.\n\n" +
                "Usa /menu para ver os comandos."
        });

    }
}


// =====================================================
// WHATSAPP
// =====================================================

async function iniciarBot() {

    console.log("🚀 Iniciando Guarda-Chuva Bot...");

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);


    let versao;

    try {

        const resultado =
            await fetchLatestBaileysVersion();

        versao = resultado.version;

        console.log(
            "📱 WhatsApp Web:",
            versao.join(".")
        );

    } catch (erro) {

        console.log(
            "⚠️ Não foi possível obter a versão mais recente."
        );
    }


    const sock = makeWASocket({

        auth: state,

        version: versao,

        logger: pino({
            level: "silent"
        }),

        printQRInTerminal: false,

        browser: [
            "Guarda-Chuva Bot",
            "Chrome",
            "1.0.0"
        ],

        generateHighQualityLinkPreview: true
    });


    // =================================================
    // SALVAR AUTENTICAÇÃO
    // =================================================

    sock.ev.on(
        "creds.update",
        saveCreds
    );



// =================================================
// PAREAMENTO WHATSAPP
// =================================================

let codigoSolicitado = false;

sock.ev.on(
    "connection.update",
    async (update) => {

        const {
            connection,
            lastDisconnect
        } = update;

        console.log(
            "🔌 Estado da conexão:",
            connection
        );

        // =========================================
        // SOLICITAR CÓDIGO DE PAREAMENTO
        // =========================================

        if (
            connection === "connecting" &&
            !state.creds.registered &&
            !codigoSolicitado
        ) {

            codigoSolicitado = true;

            const numero =
                process.env.WA_NUMBER;

            if (!numero) {

                console.error(
                    "❌ WA_NUMBER não configurada no Render."
                );

                codigoSolicitado = false;

                return;
            }

            try {

                console.log(
                    "⏳ Aguardando conexão do WhatsApp..."
                );

                // IMPORTANTE:
                // esperar o socket estabilizar
                await new Promise(
                    resolve => setTimeout(resolve, 3000)
                );

                const codigo =
                    await sock.requestPairingCode(
                        numero.replace(/\D/g, "")
                    );

                console.log("");
                console.log(
                    "===================================="
                );
                console.log(
                    "📱 CÓDIGO DE PAREAMENTO"
                );
                console.log(
                    "===================================="
                );
                console.log(codigo);
                console.log(
                    "===================================="
                );
                console.log(
                    "📲 No WhatsApp:"
                );
                console.log(
                    "Dispositivos conectados → Conectar dispositivo"
                );
                console.log(
                    "===================================="
                );
                console.log("");

            } catch (erro) {

                console.error(
                    "❌ Erro ao gerar código de pareamento:",
                    erro?.message || erro
                );

                codigoSolicitado = false;
            }
        }

        // =========================================
        // CONECTADO
        // =========================================

        if (connection === "open") {

            console.log("");
            console.log(
                "🟢 WHATSAPP CONECTADO!"
            );
            console.log("");
        }

        // =========================================
        // DESCONECTADO
        // =========================================

        if (connection === "close") {

            const statusCode =
                lastDisconnect
                    ?.error
                    ?.output
                    ?.statusCode;

            console.log(
                "🔴 WhatsApp desconectado.",
                statusCode
            );

            if (
                statusCode !==
                DisconnectReason.loggedOut
            ) {

                console.log(
                    "🔄 Tentando reconectar em 5 segundos..."
                );

                setTimeout(() => {

                    iniciarBot().catch(
                        console.error
                    );

                }, 5000);

            } else {

                console.log(
                    "🚪 Sessão encerrada."
                );

                console.log(
                    "É necessário parear novamente."
                );
            }
        }
    }
);


    // =================================================
    // CONEXÃO
    // =================================================

    sock.ev.on(
        "connection.update",
        ({ connection, lastDisconnect }) => {

            console.log(
                "🔌 Estado da conexão:",
                connection
            );


            if (connection === "open") {

                console.log("");
                console.log(
                    "===================================="
                );
                console.log(
                    "🟢 WHATSAPP CONECTADO!"
                );
                console.log(
                    "===================================="
                );
                console.log("");

            }


            if (connection === "close") {

                const codigo =
                    lastDisconnect?.error?.output
                        ?.statusCode;

                console.log(
                    "🔴 WhatsApp desconectado.",
                    codigo
                );


                if (
                    codigo !== DisconnectReason.loggedOut
                ) {

                    console.log(
                        "🔄 Tentando reconectar..."
                    );

                    setTimeout(() => {

                        iniciarBot().catch(
                            console.error
                        );

                    }, 5000);

                } else {

                    console.log(
                        "🚪 Sessão encerrada. É necessário parear novamente."
                    );
                }
            }
        }
    );


    // =================================================
    // MENSAGENS
    // =================================================

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {

            for (const msg of messages) {

                try {

                    await processarMensagem(
                        sock,
                        msg
                    );

                } catch (erro) {

                    console.error(
                        "❌ Erro ao processar mensagem:",
                        erro
                    );
                }
            }
        }
    );
}


// =====================================================
// SERVIDOR HTTP PARA O RENDER
// =====================================================

http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type":
            "text/plain; charset=utf-8"
    });

    res.end(
        "🟢 Guarda-Chuva Bot está online!"
    );

}).listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Servidor HTTP ativo na porta ${PORT}`
        );

    }
);


// =====================================================
// INICIAR
// =====================================================

iniciarBot().catch(erro => {

    console.error(
        "❌ Erro ao iniciar o bot:",
        erro
    );

});
