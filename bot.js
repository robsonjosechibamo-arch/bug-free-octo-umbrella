const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const {
    gerarSoma,
    gerarSubtracao,
    gerarMultiplicacao,
    gerarDivisao,
    gerarPorcentagem,
    gerarPotencia,
    gerarEquacao,
    gerarSequencia,
    gerarCharada,
    gerarVerdadeiroFalso,
    gerarQuiz,
    gerarAdivinhePalavra,
    gerarParOuImpar,
    gerarMaiorMenor,
    gerarConversao,
    embaralhar
} = require("./gerador");

const { gerarAddon, MINECRAFT_VERSION } = require("./minecraft");
/* =========================================================
   CONFIGURAÇÃO
========================================================= */

// =====================================================
// 🔑 COLOQUE O TOKEN DO SEU BOT AQUI
// =====================================================

const TOKEN = "8914048357:AAHOjj5fQhSDDy5NWeJBD33BQNW20N5OCMM";

// =====================================================
// NÃO ALTERE ABAIXO
// =====================================================

if (!TOKEN || TOKEN === "COLE_SEU_TOKEN_AQUI") {
    console.error("❌ Coloque o token do Telegram na variável TOKEN.");
    process.exit(1);
}
const bot = new TelegramBot(
    TOKEN,
    {
        polling: true
    }
);


/* =========================================================
   DIRETÓRIOS
========================================================= */

const DATA_DIR =
    path.join(__dirname, "dados");

const PLAYERS_FILE =
    path.join(
        DATA_DIR,
        "jogadores.json"
    );

const MINECRAFT_DIR =
    path.join(
        __dirname,
        "minecraft"
    );


if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(
        DATA_DIR,
        {
            recursive: true
        }
    );
}


if (!fs.existsSync(MINECRAFT_DIR)) {
    fs.mkdirSync(
        MINECRAFT_DIR,
        {
            recursive: true
        }
    );
}


/* =========================================================
   JOGADORES
========================================================= */

let jogadores = {};

try {

    if (
        fs.existsSync(
            PLAYERS_FILE
        )
    ) {

        jogadores =
            JSON.parse(
                fs.readFileSync(
                    PLAYERS_FILE,
                    "utf8"
                )
            ) || {};
    }

} catch {

    jogadores = {};

}


function salvarJogadores() {

    fs.writeFileSync(
        PLAYERS_FILE,
        JSON.stringify(
            jogadores,
            null,
            2
        ),
        "utf8"
    );
}


function obterJogador(msg) {

    const id =
        String(msg.from.id);

    if (!jogadores[id]) {

        jogadores[id] = {

            id,

            nome:
                msg.from.first_name ||
                "Jogador",

            username:
                msg.from.username ||
                "",

            pontos: 0,

            partidas: 0,

            acertos: 0,

            erros: 0,

            sequencia: 0,

            melhorSequencia: 0
        };

        salvarJogadores();
    }

    return jogadores[id];
}


/* =========================================================
   PERGUNTAS ATIVAS
========================================================= */

const perguntasAtivas =
    new Map();


/* =========================================================
   NORMALIZAÇÃO DE RESPOSTAS
========================================================= */

function normalizar(texto) {

    return String(texto)

        .toLowerCase()

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        .replace(
            /[!?.,;:()[\]{}"'`]/g,
            ""
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}


/* =========================================================
   TECLADO PRINCIPAL
========================================================= */

function menuPrincipal() {

    return {

        keyboard: [

            [
                "🎮 Jogos",
                "🧮 Matemática"
            ],

            [
                "🧩 Charada",
                "🌍 Quiz"
            ],

            [
                "🔢 Sequência",
                "✅ Verdadeiro/Falso"
            ],

            [
                "🔤 Palavra",
                "⛏️ Minecraft"
            ],

            [
                "📊 Meu perfil",
                "🏆 Ranking"
            ],

            [
                "ℹ️ Ajuda"
            ]

        ],

        resize_keyboard: true
    };
}


/* =========================================================
   MENU DE JOGOS
========================================================= */

function menuJogos() {

    return {

        keyboard: [

            [
                "➕ Soma",
                "➖ Subtração"
            ],

            [
                "✖️ Multiplicação",
                "➗ Divisão"
            ],

            [
                "📊 Porcentagem",
                "🔢 Potência"
            ],

            [
                "🧠 Equação",
                "🔢 Sequência"
            ],

            [
                "🧩 Charada",
                "🌍 Quiz"
            ],

            [
                "✅ Verdadeiro/Falso",
                "🔤 Palavra"
            ],

            [
                "🔢 Par/Ímpar",
                "🎯 Maior/Menor"
            ],

            [
                "📏 Conversão",
                "⚡ Desafio"
            ],

            [
                "⬅️ Menu"
            ]

        ],

        resize_keyboard: true
    };
}


/* =========================================================
   ENVIAR DESAFIO
========================================================= */

function enviarDesafio(
    msg,
    tipo
) {

    const chatId =
        msg.chat.id;

    try {

        let pergunta;

        switch (tipo) {

            case "soma":
                pergunta =
                    gerarSoma();
                break;

            case "subtracao":
                pergunta =
                    gerarSubtracao();
                break;

            case "multiplicacao":
                pergunta =
                    gerarMultiplicacao();
                break;

            case "divisao":
                pergunta =
                    gerarDivisao();
                break;

            case "porcentagem":
                pergunta =
                    gerarPorcentagem();
                break;

            case "potencia":
                pergunta =
                    gerarPotencia();
                break;

            case "equacao":
                pergunta =
                    gerarEquacao();
                break;

            case "sequencia":
                pergunta =
                    gerarSequencia();
                break;

            case "charada":
                pergunta =
                    gerarCharada();
                break;

            case "vf":
                pergunta =
                    gerarVerdadeiroFalso();
                break;

            case "quiz":
                pergunta =
                    gerarQuiz();
                break;

            case "palavra":
                pergunta =
                    gerarAdivinhePalavra();
                break;

            case "parimpar":
                pergunta =
                    gerarParOuImpar();
                break;

            case "maior":
                pergunta =
                    gerarMaiorMenor();
                break;

            case "conversao":
                pergunta =
                    gerarConversao();
                break;

            default:

                pergunta =
                    gerarSoma();
        }


        perguntasAtivas.set(
            chatId,
            pergunta
        );


        let texto =
            pergunta.pergunta;


        if (
            pergunta.opcoes &&
            pergunta.opcoes.length
        ) {

            texto +=
                "\n\n" +
                pergunta.opcoes
                    .map(
                        (opcao, indice) => {

                            const letra =
                                String.fromCharCode(
                                    65 + indice
                                );

                            return `${letra}) ${opcao}`;
                        }
                    )
                    .join("\n");

            texto +=
                "\n\n💡 Responde com A, B, C ou D.";
        }


        texto +=
            "\n\n🏆 Vale 10 pontos.";


        bot.sendMessage(
            chatId,
            texto,
            {
                reply_markup:
                    menuJogos()
            }
        );

    } catch (erro) {

        console.error(
            "Erro ao gerar desafio:",
            erro
        );

        bot.sendMessage(
            chatId,
            "⚠️ Não consegui criar um desafio novo agora. Tenta novamente."
        );
    }
}


/* =========================================================
   VERIFICAR RESPOSTA
========================================================= */

function verificarResposta(
    msg
) {

    const chatId =
        msg.chat.id;

    const pergunta =
        perguntasAtivas.get(
            chatId
        );

    if (!pergunta) {

        return false;
    }


    const jogador =
        obterJogador(msg);

    let respostaUsuario =
        normalizar(
            msg.text
        );

    let respostaCorreta =
        normalizar(
            pergunta.resposta
        );


    /*
      Para perguntas A/B/C/D
    */

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
                respostaUsuario
            );

        if (indice >= 0) {

            respostaUsuario =
                normalizar(
                    pergunta.opcoes[
                        indice
                    ]
                );
        }
    }


    const acertou =
        respostaUsuario ===
        respostaCorreta;


    jogador.partidas++;


    if (acertou) {

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


        let bonus = 0;


        /*
          Bónus por sequência
        */

        if (
            jogador.sequencia >= 5
        ) {

            bonus = 10;

            jogador.pontos +=
                bonus;
        }


        salvarJogadores();


        let mensagem =
            "🎉 *CORRETO!*\n\n" +
            "✅ Resposta certa!\n" +
            "⭐ +10 pontos";


        if (bonus) {

            mensagem +=
                `\n🔥 Bónus de sequência: +${bonus}`;
        }


        mensagem +=
            `\n\n🏆 Pontos: ${jogador.pontos}` +
            `\n🔥 Sequência: ${jogador.sequencia}`;


        bot.sendMessage(
            chatId,
            mensagem,
            {
                parse_mode:
                    "Markdown",
                reply_markup:
                    menuJogos()
            }
        );

    } else {

        jogador.erros++;

        jogador.sequencia = 0;

        salvarJogadores();


        bot.sendMessage(

            chatId,

            "❌ *Resposta errada!*\n\n" +
            `✅ Resposta correta: ${pergunta.resposta}\n\n` +
            `🏆 Pontos: ${jogador.pontos}`,

            {
                parse_mode:
                    "Markdown",
                reply_markup:
                    menuJogos()
            }
        );
    }


    perguntasAtivas.delete(
        chatId
    );


    return true;
}


/* =========================================================
   START
========================================================= */

bot.onText(
    /^\/start$/,
    (msg) => {

        obterJogador(msg);

        bot.sendMessage(

            msg.chat.id,

            `🎮 *GUARDA-CHUVA BOT*

Bem-vindo!

Aqui podes jogar vários jogos,
resolver problemas de matemática,
responder charadas e quizzes.

Também estamos a preparar o
gerador de addons Minecraft Bedrock.

👇 Escolhe uma opção:`,

            {
                parse_mode:
                    "Markdown",

                reply_markup:
                    menuPrincipal()
            }
        );
    }
);


/* =========================================================
   AJUDA
========================================================= */

bot.onText(
    /^\/ajuda$/,
    (msg) => {

        bot.sendMessage(

            msg.chat.id,

            `ℹ️ *COMANDOS*

/start
/jogos
/matematica
/quiz
/charada
/vf
/sequencia
/palavra
/perfil
/ranking

⛏️ Minecraft:
/mc descrição do addon

Exemplo:

/mc Cria um alienígena de fogo chamado Heatblast, vermelho, que pode voar e lançar bolas de fogo.`,

            {
                parse_mode:
                    "Markdown",
                reply_markup:
                    menuPrincipal()
            }
        );
    }
);


/* =========================================================
   JOGOS
========================================================= */

bot.onText(
    /^\/jogos$/,
    (msg) => {

        bot.sendMessage(
            msg.chat.id,
            "🎮 Escolhe um jogo:",
            {
                reply_markup:
                    menuJogos()
            }
        );
    }
);


bot.onText(
    /^\/matematica$/,
    (msg) => {

        enviarDesafio(
            msg,
            "soma"
        );
    }
);


bot.onText(
    /^\/quiz$/,
    (msg) => {

        enviarDesafio(
            msg,
            "quiz"
        );
    }
);


bot.onText(
    /^\/charada$/,
    (msg) => {

        enviarDesafio(
            msg,
            "charada"
        );
    }
);


bot.onText(
    /^\/vf$/,
    (msg) => {

        enviarDesafio(
            msg,
            "vf"
        );
    }
);


bot.onText(
    /^\/sequencia$/,
    (msg) => {

        enviarDesafio(
            msg,
            "sequencia"
        );
    }
);


bot.onText(
    /^\/palavra$/,
    (msg) => {

        enviarDesafio(
            msg,
            "palavra"
        );
    }
);


/* =========================================================
   PERFIL
========================================================= */

bot.onText(
    /^\/perfil$/,
    (msg) => {

        const jogador =
            obterJogador(msg);

        const taxa =
            jogador.partidas
                ? Math.round(
                    jogador.acertos /
                    jogador.partidas *
                    100
                )
                : 0;


        bot.sendMessage(

            msg.chat.id,

            `📊 *MEU PERFIL*

👤 ${jogador.nome}

⭐ Pontos: ${jogador.pontos}

🎮 Partidas: ${jogador.partidas}

✅ Acertos: ${jogador.acertos}

❌ Erros: ${jogador.erros}

🎯 Aproveitamento: ${taxa}%

🔥 Melhor sequência: ${jogador.melhorSequencia}`,

            {
                parse_mode:
                    "Markdown"
            }
        );
    }
);


/* =========================================================
   RANKING
========================================================= */

bot.onText(
    /^\/ranking$/,
    (msg) => {

        const lista =
            Object.values(
                jogadores
            )
                .sort(
                    (a, b) =>
                        b.pontos -
                        a.pontos
                )
                .slice(
                    0,
                    10
                );


        if (!lista.length) {

            bot.sendMessage(
                msg.chat.id,
                "🏆 Ainda não existem jogadores."
            );

            return;
        }


        const texto =
            lista
                .map(
                    (jogador, indice) => {

                        return (
                            `${indice + 1}. ` +
                            `${jogador.nome} — ` +
                            `⭐ ${jogador.pontos}`
                        );
                    }
                )
                .join("\n");


        bot.sendMessage(

            msg.chat.id,

            `🏆 *RANKING*

${texto}`,

            {
                parse_mode:
                    "Markdown"
            }
        );
    }
);


/* =========================================================
   COMANDO MINECRAFT
========================================================= */

/*
  Por enquanto o /mc guarda a descrição do projeto.

  Na próxima etapa vamos transformar essa descrição em:

  - manifest.json
  - Behavior Pack
  - Resource Pack
  - entidades
  - itens
  - blocos
  - receitas
  - funções
  - scripts
  - texturas/estrutura necessária
  - ZIP
  - .mcaddon

  A versão alvo será configurável.
*/


/* =========================================================
   GERADOR MINECRAFT BEDROCK
========================================================= */

bot.onText(
    /^\/mc(?:\s+([\s\S]+))?$/,
    async (msg, match) => {

        const chatId = msg.chat.id;

        const descricao =
            match && match[1]
                ? match[1].trim()
                : "";

        if (!descricao) {

            await bot.sendMessage(
                chatId,
                `⛏️ *GERADOR MINECRAFT BEDROCK*

Escreve o que queres criar.

Exemplo:

/mc cria um dragão vermelho que voa, tem 100 de vida e lança fogo

🎮 Também podes pedir:

• mobs
• entidades
• itens
• armas
• blocos
• receitas
• addons completos

🎯 Versão-alvo:
Minecraft Bedrock ${MINECRAFT_VERSION}`,
                {
                    parse_mode: "Markdown"
                }
            );

            return;
        }

        const mensagem =
            await bot.sendMessage(
                chatId,
                "⛏️ A criar o addon...\n\n" +
                "🧠 Analisando descrição...\n" +
                "📦 Preparando Behavior Pack...\n" +
                "🎨 Preparando Resource Pack..."
            );

        try {

            const resultado =
                await gerarAddon(
                    descricao
                );

            await bot.editMessageText(

                "✅ *ADDON CRIADO!*\n\n" +

                `📦 Nome: ${resultado.nome}\n` +

                `🎮 Minecraft: ${resultado.versao}\n\n` +

                "📤 Enviando o arquivo...",

                {
                    chat_id: chatId,
                    message_id:
                        mensagem.message_id,

                    parse_mode: "Markdown"
                }
            );

            await bot.sendDocument(

                chatId,

                resultado.arquivo,

                {
                    caption:
                        `⛏️ ${resultado.nome}\n\n` +
                        `Minecraft Bedrock ${resultado.versao}\n\n` +
                        "✅ Addon gerado pelo Guarda-Chuva Bot."
                }

            );

        } catch (erro) {

            console.error(
                "Erro no gerador Minecraft:",
                erro
            );

            await bot.sendMessage(

                chatId,

                "❌ Não foi possível gerar o addon.\n\n" +
                `Erro: ${erro.message}\n\n` +
                "Verifica se a plataforma onde o bot está hospedado possui o comando ZIP instalado."
            );
        }
    }
);

/* =========================================================
   BOTÕES DO MENU
========================================================= */

bot.on(
    "message",
    (msg) => {

        if (!msg.text) {
            return;
        }


        const texto =
            msg.text.trim();


        /*
          Não tratar comandos aqui.
        */

        if (
            texto.startsWith("/")
        ) {

            return;
        }


        const tipos = {

            "➕ Soma":
                "soma",

            "➖ Subtração":
                "subtracao",

            "✖️ Multiplicação":
                "multiplicacao",

            "➗ Divisão":
                "divisao",

            "📊 Porcentagem":
                "porcentagem",

            "🔢 Potência":
                "potencia",

            "🧠 Equação":
                "equacao",

            "🔢 Sequência":
                "sequencia",

            "🧩 Charada":
                "charada",

            "🌍 Quiz":
                "quiz",

            "✅ Verdadeiro/Falso":
                "vf",

            "🔤 Palavra":
                "palavra",

            "🔢 Par/Ímpar":
                "parimpar",

            "🎯 Maior/Menor":
                "maior",

            "📏 Conversão":
                "conversao"
        };


        if (tipos[texto]) {

            enviarDesafio(
                msg,
                tipos[texto]
            );

            return;
        }


        if (
            texto ===
            "🎮 Jogos"
        ) {

            bot.sendMessage(

                msg.chat.id,

                "🎮 Escolhe o tipo de jogo:",

                {
                    reply_markup:
                        menuJogos()
                }
            );

            return;
        }


        if (
            texto ===
            "⬅️ Menu"
        ) {

            bot.sendMessage(

                msg.chat.id,

                "🏠 Menu principal:",

                {
                    reply_markup:
                        menuPrincipal()
                }
            );

            return;
        }


        if (
            texto ===
            "📊 Meu perfil"
        ) {

            const jogador =
                obterJogador(msg);

            const taxa =
                jogador.partidas
                    ? Math.round(
                        jogador.acertos /
                        jogador.partidas *
                        100
                    )
                    : 0;


            bot.sendMessage(

                msg.chat.id,

                `📊 *PERFIL*

⭐ ${jogador.pontos} pontos
🎮 ${jogador.partidas} partidas
✅ ${jogador.acertos} acertos
❌ ${jogador.erros} erros
🎯 ${taxa}% de acerto
🔥 Melhor sequência: ${jogador.melhorSequencia}`,

                {
                    parse_mode:
                        "Markdown"
                }
            );

            return;
        }


        if (
            texto ===
            "🏆 Ranking"
        ) {

            const lista =
                Object.values(
                    jogadores
                )
                    .sort(
                        (a, b) =>
                            b.pontos -
                            a.pontos
                    )
                    .slice(
                        0,
                        10
                    );


            if (!lista.length) {

                bot.sendMessage(
                    msg.chat.id,
                    "🏆 Ainda não existem jogadores."
                );

                return;
            }


            const ranking =
                lista
                    .map(
                        (j, i) =>
                            `${i + 1}. ${j.nome} — ⭐ ${j.pontos}`
                    )
                    .join("\n");


            bot.sendMessage(

                msg.chat.id,

                `🏆 *RANKING*\n\n${ranking}`,

                {
                    parse_mode:
                        "Markdown"
                }
            );

            return;
        }


        if (
            texto ===
            "⛏️ Minecraft"
        ) {

            bot.sendMessage(

                msg.chat.id,

                `⛏️ *GERADOR MINECRAFT*

Escreve:

/mc + descrição

Exemplo:

/mc Cria um mob dragão azul que voa, tem 100 de vida e lança fogo.`,

                {
                    parse_mode:
                        "Markdown"
                }
            );

            return;
        }


        if (
            texto ===
            "ℹ️ Ajuda"
        ) {

            bot.sendMessage(

                msg.chat.id,

                "ℹ️ Usa /ajuda para ver todos os comandos."
            );

            return;
        }


        /*
          Se houver pergunta ativa,
          tratar mensagem como resposta.
        */

        if (
            perguntasAtivas.has(
                msg.chat.id
            )
        ) {

            verificarResposta(
                msg
            );
        }

    }
);


/* =========================================================
   ERROS
========================================================= */

bot.on(
    "polling_error",
    (erro) => {

        console.error(
            "❌ Telegram polling:",
            erro.message
        );
    }
);


console.log(
    "🎮 Guarda-Chuva Bot iniciado!"
);
