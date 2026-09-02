const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
const http = require("http");
const {
    responderIA,
    gerarQuizIA,
    gerarVerdadeiroFalsoIA
} = require("./ia");
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
    gerarDesafio
} = require("./gerador");

const {
    gerarAddon,
    MINECRAFT_VERSION
} = require("./minecraft");


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

/* =========================================================
   🔑 TOKEN DO BOT TELEGRAM
========================================================= */

// COLOCA O TOKEN DO TEU BOT ENTRE AS ASPAS:
const TOKEN = "8914048357:AAHOjj5fQhSDDy5NWeJBD33BQNW20N5OCMM";


if (
    !TOKEN ||
    TOKEN === "COLE_AQUI_O_TOKEN_DO_TELEGRAM"
) {

    console.error(
        "❌ Coloca o token do Telegram na variável TOKEN."
    );

    process.exit(1);
}


if (!TOKEN) {

    console.error(
        "❌ TOKEN DO TELEGRAM NÃO CONFIGURADO."
    );

    console.error(
        "Configure TELEGRAM_TOKEN nas variáveis de ambiente do Render."
    );

    process.exit(1);
}


const bot =
    new TelegramBot(
        TOKEN,
        {
            polling: true
        }
    );


/* =========================================================
   PORTA HTTP PARA O RENDER
========================================================= */

const PORT =
    process.env.PORT ||
    3000;


/* =========================================================
   DIRETÓRIOS
========================================================= */

const DATA_DIR =
    path.join(
        __dirname,
        "dados"
    );


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

} catch (erro) {

    console.error(
        "⚠️ Erro ao carregar jogadores:",
        erro.message
    );

    jogadores = {};
}


function salvarJogadores() {

    try {

        fs.writeFileSync(

            PLAYERS_FILE,

            JSON.stringify(
                jogadores,
                null,
                2
            ),

            "utf8"
        );

    } catch (erro) {

        console.error(
            "❌ Erro ao salvar jogadores:",
            erro.message
        );
    }
}


function obterJogador(msg) {

    const id =
        String(
            msg.from.id
        );


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
   NORMALIZAÇÃO
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
   MENU PRINCIPAL
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
   🎯 ENVIAR DESAFIO
   COM OPÇÕES EM BOTÕES
========================================================= */

async function enviarDesafio(msg, tipo) {

    const chatId = msg.chat.id;

    try {

        let pergunta;

        switch (tipo) {

            case "soma":
                pergunta = await gerarSoma();
                break;

            case "subtracao":
                pergunta = await gerarSubtracao();
                break;

            case "multiplicacao":
                pergunta = await gerarMultiplicacao();
                break;

            case "divisao":
                pergunta = await gerarDivisao();
                break;

            case "porcentagem":
                pergunta = await gerarPorcentagem();
                break;

            case "potencia":
                pergunta = await gerarPotencia();
                break;

            case "equacao":
                pergunta = await gerarEquacao();
                break;

            case "sequencia":
                pergunta = await gerarSequencia();
                break;

            case "charada":
                pergunta = await gerarCharada();
                break;

            case "vf":
                pergunta = await gerarVerdadeiroFalso();
                break;

            case "quiz":
                pergunta = await gerarQuiz();
                break;

            case "palavra":
                pergunta = await gerarAdivinhePalavra();
                break;

            case "parimpar":
                pergunta = await gerarParOuImpar();
                break;

            case "maior":
                pergunta = await gerarMaiorMenor();
                break;

            case "conversao":
                pergunta = await gerarConversao();
                break;

            case "desafio":
                pergunta = await gerarDesafio();
                break;

            default:
                pergunta = await gerarDesafio();
                break;
        }

        /* =================================================
           VERIFICAR RESULTADO
        ================================================= */

        if (
            !pergunta ||
            typeof pergunta !== "object" ||
            !pergunta.pergunta
        ) {

            throw new Error(
                "O gerador não devolveu uma pergunta válida."
            );
        }

        console.log(
            "🎯 Desafio gerado:",
            JSON.stringify(
                pergunta,
                null,
                2
            )
        );

        /* =================================================
           GUARDAR PERGUNTA ATIVA
        ================================================= */

        perguntasAtivas.set(
            chatId,
            pergunta
        );

        let texto =
            String(
                pergunta.pergunta
            );

        /* =================================================
           CRIAR BOTÕES
        ================================================= */

        let teclado = null;

        if (
            Array.isArray(pergunta.opcoes) &&
            pergunta.opcoes.length > 0
        ) {

            teclado = [];

            pergunta.opcoes.forEach(
                (opcao, indice) => {

                    const letra =
                        String.fromCharCode(
                            65 + indice
                        );

                    teclado.push([
                        {
                            text:
                                `${letra}) ${String(opcao)}`,

                            callback_data:
                                `quiz_resposta:${chatId}:${indice}`
                        }
                    ]);
                }
            );

            texto +=
                "\n\n👇 *Escolhe uma resposta:*";

        } else {

            texto +=
                "\n\n✍️ Envia a tua resposta.";
        }

        texto +=
            "\n\n🏆 Vale 10 pontos.";

        /* =================================================
           ENVIAR PARA TELEGRAM
        ================================================= */

        await bot.sendMessage(
            chatId,
            texto,
            {
                parse_mode: "Markdown",

                reply_markup:
                    teclado
                        ? {
                            inline_keyboard:
                                teclado
                        }
                        : menuJogos()
            }
        );

        console.log(
            `✅ Desafio enviado para o chat ${chatId}`
        );

    } catch (erro) {

        console.error(
            "❌ ERRO AO GERAR/ENVIAR DESAFIO:",
            erro
        );

        perguntasAtivas.delete(
            chatId
        );

        try {

            await bot.sendMessage(
                chatId,

                "⚠️ Não consegui criar um desafio novo agora.\n\n" +
                `🔎 Erro: ${erro.message}`,

                {
                    reply_markup:
                        menuJogos()
                }
            );

        } catch (erroTelegram) {

            console.error(
                "❌ Erro ao enviar mensagem de erro:",
                erroTelegram.message
            );
        }
    }
}

        /* =================================================
           GUARDAR PERGUNTA ATIVA
        ================================================= */

        perguntasAtivas.set(
            chatId,
            pergunta
        );

        let texto =
            pergunta.pergunta;

        /* =================================================
           CRIAR BOTÕES DAS OPÇÕES
        ================================================= */

        let teclado = null;

        if (
            Array.isArray(pergunta.opcoes) &&
            pergunta.opcoes.length > 0
        ) {

            teclado = [];

            pergunta.opcoes.forEach(
                (opcao, indice) => {

                    const letra =
                        String.fromCharCode(
                            65 + indice
                        );

                    teclado.push([
                        {
                            text:
                                `${letra}) ${opcao}`,

                            callback_data:
                                `quiz_resposta:${chatId}:${indice}`
                        }
                    ]);
                }
            );

            texto +=
                "\n\n👇 *Escolhe uma resposta:*";

        } else {

            texto +=
                "\n\n✍️ Envia a tua resposta.";
        }

        texto +=
            "\n\n🏆 Vale 10 pontos.";

        /* =================================================
           ENVIAR PERGUNTA
        ================================================= */

        try {
    await bot.sendMessage(
        chatId,
        texto,
        {
            parse_mode: "Markdown",
            reply_markup:
                teclado
                    ? {
                        inline_keyboard:
                            teclado
                    }
                    : menuJogos()
        }
    );

} catch (erro) {
    console.error("❌ Erro ao gerar desafio:", erro);

    try {
        await bot.sendMessage(
            chatId,
            "⚠️ Não consegui criar um desafio novo agora.\n\n" +
            "Tenta novamente.",
            {
                reply_markup:
                    menuJogos()
            }
        );
    } catch (_) {
        // Ignora erros caso o envio da mensagem de falha também falhe
    }
}


/* =========================================================
   VERIFICAR RESPOSTA
========================================================= */

function verificarResposta(msg) {

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
    =============================================
    RESPOSTAS A/B/C/D
    =============================================
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


        if (
            indice >= 0 &&
            pergunta.opcoes[indice] !== undefined
        ) {

            respostaUsuario =
                normalizar(
                    pergunta.opcoes[
                        indice
                    ]
                );
        }
    }


    /*
    =============================================
    VERDADEIRO / FALSO
    =============================================
    */

    if (
        pergunta.resposta === "V" ||
        pergunta.resposta === "F"
    ) {

        if (
            respostaUsuario === "verdadeiro"
        ) {

            respostaUsuario = "v";
        }

        if (
            respostaUsuario === "falso"
        ) {

            respostaUsuario = "f";
        }
    }


    /*
    =============================================
    PAR / ÍMPAR
    =============================================
    */

    if (
        respostaCorreta === "par" ||
        respostaCorreta === "impar"
    ) {

        if (
            respostaUsuario === "ímpar"
        ) {

            respostaUsuario = "impar";
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

    msg => {

        obterJogador(msg);


        bot.sendMessage(

            msg.chat.id,

            `🎮 *GUARDA-CHUVA BOT*

Bem-vindo!

Aqui podes jogar vários jogos,
resolver problemas de matemática,
responder charadas e quizzes.

Também temos um gerador
de desafios novos.

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

    msg => {

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

⚡ Desafio:
Usa o botão "⚡ Desafio" para gerar um desafio novo.

⛏️ Minecraft:

/mc descrição

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

    msg => {

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

    msg => {

        enviarDesafio(
            msg,
            "soma"
        );
    }
);


bot.onText(

    /^\/quiz$/,

    msg => {

        enviarDesafio(
            msg,
            "quiz"
        );
    }
);



            // =====================================================
// 🤖 COMANDO /IA
// =====================================================

bot.onText(
    /^\/ia(?:\s+([\s\S]+))?$/,
    async (msg, match) => {

        const chatId = msg.chat.id;

        const pergunta =
            match && match[1]
                ? match[1].trim()
                : "";

        if (!pergunta) {

            await bot.sendMessage(
                chatId,
                "🤖 IA DO GUARDA-CHUVA\n\n" +
                "Escreve a tua pergunta depois de /ia.\n\n" +
                "Exemplo:\n" +
                "/ia Quem foi Albert Einstein?"
            );

            return;
        }

        let aguardando;

        try {

            aguardando =
                await bot.sendMessage(
                    chatId,
                    "🤖 Estou a pensar..."
                );

            const resposta =
                await responderIA(pergunta);

            if (
                !resposta ||
                !String(resposta).trim()
            ) {
                throw new Error(
                    "A IA não retornou uma resposta."
                );
            }

            /*
            Não usamos parse_mode aqui.
            Assim, caracteres como *, _, [, ]
            vindos da IA não quebram o Telegram.
            */

            await bot.editMessageText(

                "🤖 IA DO GUARDA-CHUVA\n\n" +
                String(resposta),

                {
                    chat_id: chatId,

                    message_id:
                        aguardando.message_id
                }
            );

        } catch (erro) {

            console.error(
                "❌ ERRO NO COMANDO /IA:",
                erro?.message || erro
            );

            const mensagemErro =
                "❌ Não consegui responder agora.\n\n" +
                "Verifica a GROQ_API_KEY no Render e " +
                "consulta os logs do serviço.";

            try {

                if (aguardando) {

                    await bot.editMessageText(

                        mensagemErro,

                        {
                            chat_id: chatId,

                            message_id:
                                aguardando.message_id
                        }
                    );

                } else {

                    await bot.sendMessage(
                        chatId,
                        mensagemErro
                    );
                }

            } catch (erroTelegram) {

                console.error(
                    "❌ Erro ao enviar erro da IA:",
                    erroTelegram?.message ||
                    erroTelegram
                );
            }
        }
    }
); 


// =====================================================
// 🤖✅ VERDADEIRO/FALSO IA - GROQ
// =====================================================

bot.onText(
    /^\/vfia$/,
    async (msg) => {

        const chatId = msg.chat.id;

        try {

            await bot.sendMessage(
                chatId,
                "🤖✅ A IA está a criar uma afirmação..."
            );

            const pergunta =
                await gerarVerdadeiroFalsoIA();

            // Guardar a pergunta para os botões
            perguntasAtivas.set(
                chatId,
                pergunta
            );

            const botoes =
                pergunta.opcoes.map(
                    (opcao, indice) => {

                        return [
                            {
                                text:
                                    opcao === "V"
                                        ? "✅ Verdadeiro"
                                        : "❌ Falso",

                                callback_data:
                                    `quiz_resposta:${chatId}:${indice}`
                            }
                        ];
                    }
                );

            await bot.sendMessage(
                chatId,
                pergunta.pergunta +
                "\n\n👇 *Escolhe uma resposta:*" +
                "\n\n🏆 Vale 10 pontos.",

                {
                    parse_mode: "Markdown",

                    reply_markup: {
                        inline_keyboard:
                            botoes
                    }
                }
            );

        } catch (erro) {

            console.error(
                "❌ Erro no Verdadeiro/Falso IA:",
                erro
            );

            await bot.sendMessage(
                chatId,
                "❌ A IA não conseguiu criar o desafio agora.\n\n" +
                "Verifica se a GROQ_API_KEY está configurada no Render."
            );
        }
    }
);
bot.onText(

    /^\/charada$/,

    msg => {

        enviarDesafio(
            msg,
            "charada"
        );
    }
);


bot.onText(

    /^\/vf$/,

    msg => {

        enviarDesafio(
            msg,
            "vf"
        );
    }
);


bot.onText(

    /^\/sequencia$/,

    msg => {

        enviarDesafio(
            msg,
            "sequencia"
        );
    }
);


bot.onText(

    /^\/palavra$/,

    msg => {

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

    msg => {

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

    msg => {

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
                    (
                        jogador,
                        indice
                    ) => {

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
   MINECRAFT
========================================================= */

bot.onText(

    /^\/mc(?:\s+([\s\S]+))?$/,

    async (
        msg,
        match
    ) => {

        const chatId =
            msg.chat.id;


        const descricao =

            match &&
            match[1]

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
                    parse_mode:
                        "Markdown"
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

                    chat_id:
                        chatId,

                    message_id:
                        mensagem.message_id,

                    parse_mode:
                        "Markdown"
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

                "❌ Erro no gerador Minecraft:",

                erro
            );


            await bot.sendMessage(

                chatId,

                "❌ Não foi possível gerar o addon.\n\n" +

                `Erro: ${erro.message}`
            );
        }
    }
);


/* =========================================================
   BOTÕES DO MENU
========================================================= */

bot.on(

    "message",

    msg => {

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
                "conversao",

            /*
            NOVO BOTÃO
            */

            "⚡ Desafio":
                "desafio"
        };


        /*
        =============================================
        BOTÕES DE JOGOS
        =============================================
        */

        if (tipos[texto]) {

            enviarDesafio(

                msg,

                tipos[texto]
            );

            return;
        }


        /*
        =============================================
        JOGOS
        =============================================
        */

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


        /*
        =============================================
        MENU
        =============================================
        */

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


        /*
        =============================================
        PERFIL
        =============================================
        */

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


        /*
        =============================================
        RANKING
        =============================================
        */

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
                        (
                            jogador,
                            indice
                        ) => {

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

${ranking}`,

                {
                    parse_mode:
                        "Markdown"
                }
            );

            return;
        }


        /*
        =============================================
        MINECRAFT
        =============================================
        */

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


        /*
        =============================================
        AJUDA
        =============================================
        */

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
        =============================================
        RESPOSTA DO JOGADOR
        =============================================
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
// =====================================================
// 🤖 COMANDO /IA
// =====================================================

bot.onText(
    /^\/ia(?:\s+([\s\S]+))?$/,
    async (msg, match) => {

        const pergunta =
            match && match[1]
                ? match[1].trim()
                : "";

        if (!pergunta) {
            await bot.sendMessage(
                msg.chat.id,
                "🤖 *IA DO GUARDA-CHUVA*\n\n" +
                "Escreve a tua pergunta depois de /ia.\n\n" +
                "Exemplo:\n" +
                "`/ia Quem foi Albert Einstein?`",
                {
                    parse_mode: "Markdown"
                }
            );

            return;
        }

        const aguardando =
            await bot.sendMessage(
                msg.chat.id,
                "🤖 Estou a pensar..."
            );

        try {

            const resposta =
                await responderIA(pergunta);

            await bot.editMessageText(
                `🤖 *IA DO GUARDA-CHUVA*\n\n${resposta}`,
                {
                    chat_id: msg.chat.id,
                    message_id: aguardando.message_id,
                    parse_mode: "Markdown"
                }
            );

        } catch (erro) {

            console.error(
                "Erro na IA:",
                erro
            );

            await bot.editMessageText(
                "❌ Não consegui responder agora.\n" +
                "Verifica se a GROQ_API_KEY está configurada no Render.",
                {
                    chat_id: msg.chat.id,
                    message_id: aguardando.message_id
                }
            );
        }
    }
);
/* =========================================================
   🎯 RESPOSTAS DOS BOTÕES DO QUIZ
========================================================= */

bot.on(
    "callback_query",
    async query => {

        try {

            const data =
                query.data || "";

            /*
            Só tratar os botões do quiz
            */

            if (
                !data.startsWith(
                    "quiz_resposta:"
                )
            ) {

                return;
            }

            const partes =
                data.split(":");

            const chatId =
                Number(partes[1]);

            const indice =
                Number(partes[2]);

            /*
            =============================================
            VERIFICAR PERGUNTA ATIVA
            =============================================
            */

            const pergunta =
                perguntasAtivas.get(
                    chatId
                );

            if (!pergunta) {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "⏰ Esta pergunta já terminou.",
                        show_alert: true
                    }
                );

                return;
            }

            /*
            =============================================
            VERIFICAR OPÇÃO
            =============================================
            */

            if (
                !Array.isArray(
                    pergunta.opcoes
                ) ||
                pergunta.opcoes[indice] === undefined
            ) {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "❌ Opção inválida.",
                        show_alert: true
                    }
                );

                return;
            }

            /*
            =============================================
            VERIFICAR JOGADOR
            =============================================
            */

            const jogador = {
                from: query.from
            };

            /*
            =============================================
            CRIAR OBJETO COMPATÍVEL
            =============================================
            */

            jogador.chat = {
                id: chatId
            };

            const dadosJogador =
                obterJogador(
                    jogador
                );

            /*
            =============================================
            RESPOSTA ESCOLHIDA
            =============================================
            */

            const respostaEscolhida =
                normalizar(
                    pergunta.opcoes[indice]
                );

            const respostaCorreta =
                normalizar(
                    pergunta.resposta
                );

            const acertou =
                respostaEscolhida ===
                respostaCorreta;

            /*
            =============================================
            REGISTAR PARTIDA
            =============================================
            */

            dadosJogador.partidas++;

            /*
            =============================================
            CORRETA
            =============================================
            */

            if (acertou) {

                dadosJogador.acertos++;

                dadosJogador.pontos += 10;

                dadosJogador.sequencia++;

                if (
                    dadosJogador.sequencia >
                    dadosJogador.melhorSequencia
                ) {

                    dadosJogador.melhorSequencia =
                        dadosJogador.sequencia;
                }

                let bonus = 0;

                if (
                    dadosJogador.sequencia >= 5
                ) {

                    bonus = 10;

                    dadosJogador.pontos +=
                        bonus;
                }

                salvarJogadores();

                let mensagem =
                    "🎉 *CORRETO!*\n\n" +
                    "✅ Muito bem!\n" +
                    "⭐ +10 pontos";

                if (bonus) {

                    mensagem +=
                        `\n🔥 Bónus de sequência: +${bonus}`;
                }

                mensagem +=
                    `\n\n🏆 Pontos: ${dadosJogador.pontos}` +
                    `\n🔥 Sequência: ${dadosJogador.sequencia}`;

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text: "🎉 Correto! +10 pontos"
                    }
                );

                await bot.editMessageText(
                    pergunta.pergunta +
                    "\n\n" +
                    `✅ *Resposta escolhida:* ${pergunta.opcoes[indice]}` +
                    "\n\n" +
                    mensagem,
                    {
                        chat_id: chatId,
                        message_id:
                            query.message.message_id,
                        parse_mode: "Markdown"
                    }
                );

            } else {

                dadosJogador.erros++;

                dadosJogador.sequencia = 0;

                salvarJogadores();

                const indiceCorreto =
                    pergunta.opcoes.findIndex(
                        opcao =>
                            normalizar(opcao) ===
                            respostaCorreta
                    );

                let respostaCorretaTexto =
                    pergunta.resposta;

                if (
                    indiceCorreto >= 0
                ) {

                    respostaCorretaTexto =
                        `${String.fromCharCode(65 + indiceCorreto)}) ` +
                        `${pergunta.opcoes[indiceCorreto]}`;
                }

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text: "❌ Resposta errada!",
                        show_alert: true
                    }
                );

                await bot.editMessageText(
                    pergunta.pergunta +
                    "\n\n" +
                    `❌ *A tua resposta:* ${pergunta.opcoes[indice]}` +
                    `\n\n✅ *Resposta correta:* ${respostaCorretaTexto}` +
                    `\n\n🏆 Pontos: ${dadosJogador.pontos}` +
                    `\n🔥 Sequência: ${dadosJogador.sequencia}`,
                    {
                        chat_id: chatId,
                        message_id:
                            query.message.message_id,
                        parse_mode: "Markdown"
                    }
                );
            }

            /*
            =============================================
            APAGAR PERGUNTA ATIVA
            =============================================
            */

            perguntasAtivas.delete(
                chatId
            );

            /*
            =============================================
            BOTÃO PARA PRÓXIMA PERGUNTA
            =============================================
            */

            await bot.sendMessage(
                chatId,
                "👇 Escolhe o que queres fazer agora:",
                {
                    reply_markup:
                        menuJogos()
                }
            );

        } catch (erro) {

            console.error(
                "❌ Erro no botão do quiz:",
                erro
            );

            try {

                await bot.answerCallbackQuery(
                    query.id,
                    {
                        text:
                            "⚠️ Ocorreu um erro. Tenta novamente.",
                        show_alert: true
                    }
                );

            } catch (_) {}
        }
    }
);
/* =========================================================
   ERROS DO TELEGRAM
========================================================= */

bot.on(

    "polling_error",

    erro => {

        console.error(

            "❌ Telegram polling:",

            erro.message
        );
    }
);


/* =========================================================
   SERVIDOR HTTP
========================================================= */

http

    .createServer(
        (
            req,
            res
        ) => {

            res.writeHead(

                200,

                {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            );


            res.end(
                "🎮 Guarda-Chuva Bot está online!"
            );
        }
    )

    .listen(

        PORT,

        "0.0.0.0",

        () => {

            console.log(

                `🌐 Servidor HTTP iniciado na porta ${PORT}`
            );
        }
    );


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

console.log(
    "🎮 Guarda-Chuva Bot iniciado!"
);

console.log(
    "⚡ Gerador de desafios ativado!"
);
