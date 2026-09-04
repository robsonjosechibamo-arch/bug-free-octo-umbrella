const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");
const path = require("path");

const {
    responderIA,
    gerarQuizIA,
    gerarVerdadeiroFalsoIA
} = require("./ia");

const PORT = process.env.PORT || 3000;

const AUTH_DIR = path.join(
    __dirname,
    "..",
    "auth_info_baileys"
);

const DATA_DIR = path.join(
    __dirname,
    "..",
    "dados"
);

const PLAYERS_FILE = path.join(
    DATA_DIR,
    "jogadores.json"
);

fs.mkdirSync(AUTH_DIR, {
    recursive: true
});

fs.mkdirSync(DATA_DIR, {
    recursive: true
});

let jogadores = {};

if (fs.existsSync(PLAYERS_FILE)) {
    try {
        jogadores = JSON.parse(
            fs.readFileSync(
                PLAYERS_FILE,
                "utf8"
            )
        ) || {};
    } catch {
        jogadores = {};
    }
}

function salvarJogadores() {
    fs.writeFileSync(
        PLAYERS_FILE,
        JSON.stringify(
            jogadores,
            null,
            2
        )
    );
}

function obterJogador(jid, nome) {

    if (!jogadores[jid]) {

        jogadores[jid] = {
            id: jid,
            nome: nome || "Jogador",
            pontos: 0,
            partidas: 0,
            acertos: 0,
            erros: 0,
            sequencia: 0,
            melhorSequencia: 0
        };

        salvarJogadores();
    }

    return jogadores[jid];
}

const perguntasAtivas = new Map();

function normalizar(texto) {

    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[!?.,;:()[\]{}"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function iniciarBot() {

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(
        AUTH_DIR
    );

    let version;

    try {

        const resultado =
            await fetchLatestBaileysVersion();

        version = resultado.version;

        console.log(
            "📱 Versão WhatsApp:",
            version
        );

    } catch (erro) {

        console.log(
            "⚠️ Não foi possível obter a versão mais recente."
        );
    }

    const sock = makeWASocket({

        auth: state,

        version,

        logger: pino({
            level: "silent"
        }),

        printQRInTerminal: false,

        browser: [
            "Guarda-Chuva Bot",
            "Chrome",
            "1.0.0"
        ]
    });

    sock.ev.on(
        "creds.update",
        saveCreds
    );

    sock.ev.on(
        "connection.update",
        async update => {

            const {
                connection,
                lastDisconnect
            } = update;

            if (
                connection === "open"
            ) {

                console.log(
                    "================================="
                );

                console.log(
                    "🤖 GUARDA-CHUVA BOT ONLINE"
                );

                console.log(
                    "📱 WhatsApp conectado"
                );

                console.log(
                    "================================="
                );
            }

            if (
                connection === "close"
            ) {

                const codigo =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;

                const deveReconectar =
                    codigo !==
                    DisconnectReason.loggedOut;

                console.log(
                    "❌ Conexão encerrada."
                );

                if (
                    deveReconectar
                ) {

                    console.log(
                        "🔄 Reconectando..."
                    );

                    iniciarBot();

                } else {

                    console.log(
                        "🚪 Sessão encerrada."
                    );
                }
            }
        }
    );

    sock.ev.on(
        "messages.upsert",
        async ({ messages }) => {

            const msg =
                messages[0];

            if (!msg) return;

            if (msg.key.fromMe)
                return;

            if (
                !msg.message
            )
                return;

            const jid =
                msg.key.remoteJid;

            if (
                !jid ||
                jid === "status@broadcast"
            )
                return;

            const texto =
                msg.message
                    ?.conversation ||
                msg.message
                    ?.extendedTextMessage
                    ?.text ||
                "";

            if (!texto.trim())
                return;

            const nome =
                msg.pushName ||
                "Jogador";

            console.log(
                `📩 ${nome}: ${texto}`
            );

            await processarMensagem(
                sock,
                jid,
                texto.trim(),
                nome
            );
        }
    );
}

async function enviar(
    sock,
    jid,
    texto
) {

    await sock.sendMessage(
        jid,
        {
            text: texto
        }
    );
}

function menu() {

    return (
        "🎮 *GUARDA-CHUVA BOT*\n\n" +

        "🤖 IA\n" +
        "• /ia <pergunta>\n" +

        "\n🎮 JOGOS\n" +
        "• /quiz\n" +
        "• /vfia\n" +

        "\n📊 PERFIL\n" +
        "• /perfil\n" +
        "• /ranking\n" +

        "\n🎬 CONTEÚDO\n" +
        "• /filme <nome>\n" +
        "• /anime <nome>\n" +
        "• /video <nome>\n" +

        "\n⛏️ MINECRAFT\n" +
        "• /mc <descrição>\n" +

        "\nℹ️ /ajuda"
    );
}

async function comandoIA(
    sock,
    jid,
    pergunta
) {

    if (!pergunta) {

        await enviar(
            sock,
            jid,
            "🤖 Escreve uma pergunta.\n\n" +
            "Exemplo:\n" +
            "/ia Quem é Goku?"
        );

        return;
    }

    await enviar(
        sock,
        jid,
        "🤖 Estou a pensar..."
    );

    try {

        const resposta =
            await responderIA(
                pergunta
            );

        await enviar(
            sock,
            jid,
            "🤖 *IA DO GUARDA-CHUVA*\n\n" +
            resposta
        );

    } catch (erro) {

        console.error(
            "❌ IA:",
            erro.message
        );

        await enviar(
            sock,
            jid,
            "❌ Não consegui responder agora.\n\n" +
            "Verifica a GROQ_API_KEY no Render."
        );
    }
}

async function comandoQuiz(
    sock,
    jid
) {

    try {

        await enviar(
            sock,
            jid,
            "🧠 A IA está a criar o quiz..."
        );

        const pergunta =
            await gerarQuizIA();

        perguntasAtivas.set(
            jid,
            pergunta
        );

        let texto =
            pergunta.pergunta +
            "\n\n";

        pergunta.opcoes.forEach(
            (opcao, i) => {

                texto +=
                    `${String.fromCharCode(65 + i)}) ${opcao}\n`;
            }
        );

        texto +=
            "\n✍️ Responde com A, B, C ou D.\n" +
            "🏆 Vale 10 pontos.";

        await enviar(
            sock,
            jid,
            texto
        );

    } catch (erro) {

        console.error(
            "❌ Quiz:",
            erro.message
        );

        await enviar(
            sock,
            jid,
            "❌ Não consegui gerar o quiz."
        );
    }
}

async function comandoVFIA(
    sock,
    jid
) {

    try {

        await enviar(
            sock,
            jid,
            "🤖 A IA está a criar uma afirmação..."
        );

        const pergunta =
            await gerarVerdadeiroFalsoIA();

        perguntasAtivas.set(
            jid,
            pergunta
        );

        await enviar(
            sock,
            jid,

            pergunta.pergunta +

            "\n\n" +

            "A) ✅ Verdadeiro\n" +
            "B) ❌ Falso\n\n" +

            "✍️ Responde A ou B.\n" +
            "🏆 Vale 10 pontos."
        );

    } catch (erro) {

        console.error(
            "❌ VF IA:",
            erro.message
        );

        await enviar(
            sock,
            jid,
            "❌ Não consegui criar o desafio."
        );
    }
}

async function verificarResposta(
    sock,
    jid,
    texto,
    nome
) {

    const pergunta =
        perguntasAtivas.get(jid);

    if (!pergunta)
        return false;

    const jogador =
        obterJogador(
            jid,
            nome
        );

    let resposta =
        normalizar(texto);

    if (
        pergunta.opcoes &&
        pergunta.opcoes.length
    ) {

        const letras = [
            "a",
            "b",
            "c",
            "d"
        ];

        const indice =
            letras.indexOf(
                resposta
            );

        if (
            indice >= 0 &&
            pergunta.opcoes[indice]
        ) {

            resposta =
                normalizar(
                    pergunta.opcoes[indice]
                );
        }
    }

    let correta =
        normalizar(
            pergunta.resposta
        );

    if (
        correta === "v" ||
        correta === "f"
    ) {

        if (
            resposta === "a" ||
            resposta === "verdadeiro"
        ) {
            resposta = "v";
        }

        if (
            resposta === "b" ||
            resposta === "falso"
        ) {
            resposta = "f";
        }
    }

    jogador.partidas++;

    if (
        resposta === correta
    ) {

        jogador.acertos++;
        jogador.pontos += 10;
        jogador.sequencia++;

        if (
            jogador.sequencia >
            jogador.melhorSequencia
        ) {

            jogador.melhorSequencia =
                jogador.sequencia;
        }

        salvarJogadores();

        await enviar(
            sock,
            jid,

            "🎉 *CORRETO!*\n\n" +
            "✅ Muito bem!\n" +
            "⭐ +10 pontos\n\n" +
            `🏆 Pontos: ${jogador.pontos}\n` +
            `🔥 Sequência: ${jogador.sequencia}`
        );

    } else {

        jogador.erros++;
        jogador.sequencia = 0;

        salvarJogadores();

        await enviar(
            sock,
            jid,

            "❌ *ERRADO!*\n\n" +
            `✅ Resposta correta: ${pergunta.resposta}\n\n` +
            `🏆 Pontos: ${jogador.pontos}`
        );
    }

    perguntasAtivas.delete(jid);

    return true;
}

async function processarMensagem(
    sock,
    jid,
    texto,
    nome
) {

    const partes =
        texto.split(/\s+/);

    const comando =
        partes[0]
            .toLowerCase();

    const argumento =
        partes
            .slice(1)
            .join(" ")
            .trim();

    if (
        await verificarResposta(
            sock,
            jid,
            texto,
            nome
        )
    ) {
        return;
    }

    if (
        comando === "/start" ||
        comando === "/menu"
    ) {

        await enviar(
            sock,
            jid,
            menu()
        );

        return;
    }

    if (
        comando === "/ajuda"
    ) {

        await enviar(
            sock,
            jid,
            menu()
        );

        return;
    }

    if (
        comando === "/ia"
    ) {

        await comandoIA(
            sock,
            jid,
            argumento
        );

        return;
    }

    if (
        comando === "/quiz"
    ) {

        await comandoQuiz(
            sock,
            jid
        );

        return;
    }

    if (
        comando === "/vfia"
    ) {

        await comandoVFIA(
            sock,
            jid
        );

        return;
    }

    if (
        comando === "/perfil"
    ) {

        const jogador =
            obterJogador(
                jid,
                nome
            );

        const taxa =
            jogador.partidas
                ? Math.round(
                    jogador.acertos /
                    jogador.partidas *
                    100
                )
                : 0;

        await enviar(
            sock,
            jid,

            "📊 *MEU PERFIL*\n\n" +
            `👤 ${jogador.nome}\n` +
            `⭐ Pontos: ${jogador.pontos}\n` +
            `🎮 Partidas: ${jogador.partidas}\n` +
            `✅ Acertos: ${jogador.acertos}\n` +
            `❌ Erros: ${jogador.erros}\n` +
            `🎯 Aproveitamento: ${taxa}%\n` +
            `🔥 Melhor sequência: ${jogador.melhorSequencia}`
        );

        return;
    }

    if (
        comando === "/ranking"
    ) {

        const lista =
            Object.values(jogadores)
                .sort(
                    (a, b) =>
                        b.pontos -
                        a.pontos
                )
                .slice(0, 10);

        if (!lista.length) {

            await enviar(
                sock,
                jid,
                "🏆 Ainda não existem jogadores."
            );

            return;
        }

        const textoRanking =
            lista
                .map(
                    (j, i) =>
                        `${i + 1}. ${j.nome} — ⭐ ${j.pontos}`
                )
                .join("\n");

        await enviar(
            sock,
            jid,

            "🏆 *RANKING*\n\n" +
            textoRanking
        );

        return;
    }

    if (
        comando === "/filme"
    ) {

        await enviar(
            sock,
            jid,

            "🎬 O sistema de filmes será adicionado na próxima etapa.\n\n" +
            `Pesquisa: ${argumento || "nenhuma"}`
        );

        return;
    }

    if (
        comando === "/anime"
    ) {

        await enviar(
            sock,
            jid,

            "🍥 O sistema de anime será adicionado na próxima etapa.\n\n" +
            `Pesquisa: ${argumento || "nenhuma"}`
        );

        return;
    }

    if (
        comando === "/video"
    ) {

        await enviar(
            sock,
            jid,

            "📺 O sistema de vídeos será adicionado na próxima etapa.\n\n" +
            `Pesquisa: ${argumento || "nenhuma"}`
        );

        return;
    }

    if (
        comando === "/mc"
    ) {

        await enviar(
            sock,
            jid,

            "⛏️ O gerador Minecraft será conectado na próxima etapa.\n\n" +
            `Descrição: ${argumento || "nenhuma"}`
        );

        return;
    }
}

iniciarBot()
    .catch(
        erro => {

            console.error(
                "❌ Erro fatal:",
                erro
            );

            process.exit(1);
        }
    );
