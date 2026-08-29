const http = require('http');
const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN, { polling: false });

const PORT = process.env.PORT || 3000;
const URL = 'https://bug-free-octo-umbrella-1.onrender.com';

bot.setWebHook(`${URL}/bot${TOKEN}`).then(() => {
    console.log(`Webhook definido com sucesso para: ${URL}/bot${TOKEN}`);
}).catch(err => {
    console.log(`Erro ao definir webhook: ${err.message}`);
});

const server = http.createServer((req, res) => {
    if (req.url === `/bot${TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const update = JSON.parse(body);
                bot.processUpdate(update);
            } catch (e) {}
            res.writeHead(200);
            res.end('OK');
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// =========================================================================
// BANCO DE DADOS DE JOGOS E PERGUNTAS (Totalmente automático)
// =========================================================================
const bancoDeJogos = [
    {
        id: '1',
        pergunta: 'Quanto é 7 x 8?',
        opcoes: [{ texto: '54', valor: 'errado' }, { texto: '56', valor: 'certo' }, { texto: '62', valor: 'errado' }],
        respostaCerta: 'certo'
    },
    {
        id: '2',
        pergunta: 'Qual é a capital de Portugal?',
        opcoes: [{ texto: 'Lisboa', valor: 'certo' }, { texto: 'Porto', valor: 'errado' }, { texto: 'Coimbra', valor: 'errado' }],
        respostaCerta: 'certo'
    },
    {
        id: '3',
        pergunta: 'Qual destes planetas é conhecido como o Planeta Vermelho?',
        opcoes: [{ texto: 'Vénus', valor: 'errado' }, { texto: 'Marte', valor: 'certo' }, { texto: 'Júpiter', valor: 'errado' }],
        respostaCerta: 'certo'
    },
    {
        id: '4',
        pergunta: 'Quanto é 15 + 27?',
        opcoes: [{ texto: '42', valor: 'certo' }, { texto: '40', valor: 'errado' }, { texto: '45', valor: 'errado' }],
        respostaCerta: 'certo'
    }
];

const pontuacoes = {};
const jogoAtualPorChat = {};

// =========================================================================
// COMANDO /start
// =========================================================================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎮 Jogar Quiz Automático', callback_data: 'proximo_jogo' }],
                [{ text: '🌤️ Ver Tempo (Exemplo)', callback_data: 'ajuda_tempo' }],
                [{ text: '🧮 Como Calcular', callback_data: 'ajuda_calc' }],
                [{ text: '🏆 Ver Meus Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao ROS HSS Bot!*\n\nEscolhe uma das opções automáticas abaixo:', { parse_mode: 'Markdown', ...teclado });
});

// =========================================================================
// 1. MÓDULO DE CÁLCULO AUTOMÁTICO
// Uso: /calc 5 + 5
// =========================================================================
bot.onText(/\/calc (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const expressao = match[1];

    try {
        // Segurança estrita: permite apenas números e operadores matemáticos básicos (+, -, *, /)
        if (!/^[\d\+\-\*\/\.\(\)\s]+$/.test(expressao)) {
            return bot.sendMessage(chatId, '❌ Expressão inválida. Usa apenas números e operadores básicos (+, -, *, /).');
        }

        // Avaliação segura da matemática
        const resultado = Function('"use strict";return (' + expressao + ')')();
        return bot.sendMessage(chatId, `🧮 *Resultado:* \`${expressao} = ${resultado}\``, { parse_mode: 'Markdown' });
    } catch (e) {
        return bot.sendMessage(chatId, '❌ Erro ao calcular. Verifica a expressão.');
    }
});

// =========================================================================
// 2. MÓDULO DE PREVISÃO DO TEMPO (Simples e Direto)
// Uso: /tempo [cidade]
// =========================================================================
bot.onText(/\/tempo (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const cidade = match[1];

    bot.sendMessage(chatId, `🔍 A consultar o tempo para *"${cidade}"*...`, { parse_mode: 'Markdown' });

    try {
        // Usando a API gratuita wttr.in para obter o clima em formato texto limpo
        const resposta = await axios.get(`https://wttr.in/${encodeURIComponent(cidade)}?format=%C+%t+(Vento:+%w)&lang=pt`, { timeout: 7000 });
        const climaInfo = resposta.data.trim();

        return bot.sendMessage(chatId, `🌤️ *Previsão do Tempo para ${cidade}:*\n\n${climaInfo}`, { parse_mode: 'Markdown' });
    } catch (e) {
        return bot.sendMessage(chatId, `⚠️ Não foi possível obter o clima para "${cidade}" neste momento.`);
    }
});

// =========================================================================
// SISTEMA DE JOGOS E CALLBACKS (Interativo e Automático)
// =========================================================================
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    if (acao === 'ver_pontos') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `🏆 Tens *${pontuacoes[chatId]}* pontos acumulados!`, { parse_mode: 'Markdown' });
    }

    if (acao === 'ajuda_tempo') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, '🌤️ *Como ver o tempo:*\nEnvia o comando no chat assim:\n`/tempo Maputo` (ou qualquer outra cidade)', { parse_mode: 'Markdown' });
    }

    if (acao === 'ajuda_calc') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, '🧮 *Como usar a calculadora:*\nEnvia o comando no chat assim:\n`/calc 50 * 2 + 10`', { parse_mode: 'Markdown' });
    }

    if (acao === 'proximo_jogo') {
        const jogo = bancoDeJogos[Math.floor(Math.random() * bancoDeJogos.length)];
        jogoAtualPorChat[chatId] = { respostaCerta: jogo.respostaCerta };

        const botoes = jogo.opcoes.map(o => [{ text: o.texto, callback_data: `resp_${o.valor}` }]);

        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `🧠 **Pergunta de Quiz:**\n\n${jogo.pergunta}`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botoes }
        });
    }

    if (acao.startsWith('resp_')) {
        const op = acao.replace('resp_', '');
        const j = jogoAtualPorChat[chatId];

        if (!j) {
            try { await bot.answerCallbackQuery(query.id, { text: 'Jogo expirado!' }); } catch (e) {}
            return;
        }

        if (op === j.respostaCerta) {
            pontuacoes[chatId] += 10;
            delete jogoAtualPorChat[chatId];

            try { await bot.answerCallbackQuery(query.id, { text: '+10 pontos!' }); } catch (e) {}
            return bot.sendMessage(chatId, `🎉 **Certa resposta!** Ganhaste 10 pontos.\nTotal: *${pontuacoes[chatId]}* pts`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: '➡️ Próxima Pergunta', callback_data: 'proximo_jogo' }]] }
            });
        }

        try { await bot.answerCallbackQuery(query.id, { text: 'Resposta errada!' }); } catch (e) {}
        return bot.sendMessage(chatId, `❌ **Resposta Errada!** Tenta outra vez.`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🔄 Tentar Outra', callback_data: 'proximo_jogo' }]] }
        });
    }
});
