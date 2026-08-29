const http = require('http');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

const PORT = process.env.PORT || 3000;
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';

bot.setWebHook(`${URL}/bot${TOKEN}`);

const server = http.createServer((req, res) => {
    if (req.url === `/bot${TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                bot.processUpdate(JSON.parse(body));
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

let bancoDeJogos = [];
try {
    const dadosArquivo = fs.readFileSync('perguntas.json', 'utf8');
    bancoDeJogos = JSON.parse(dadosArquivo);
} catch (erro) {
    bancoDeJogos = [
        {
            id: 'seg_1',
            pergunta: 'Quanto é 2 + 2?',
            opcoes: [{ texto: '4', valor: 'certo' }, { texto: '5', valor: 'errado' }],
            respostaCerta: 'certo'
        }
    ];
}

const pontuacoes = {}; 
const jogoAtualPorChat = {}; 

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎮 Jogar', callback_data: 'proximo_jogo' }],
                [{ text: '📂 Catálogo', callback_data: 'menu_catalogo' }],
                [{ text: '🏆 Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao Bot!* Escolhe uma opção:', { parse_mode: 'Markdown', ...teclado });
});

bot.onText(/\/catalogo|categorias/, (msg) => {
    bot.sendMessage(msg.chat.id, '📂 *Escolhe uma categoria para ver como pesquisar:*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Filmes', callback_data: 'cat_filmes' }],
                [{ text: '📺 Séries', callback_data: 'cat_series' }],
                [{ text: '⛩️ Animes', callback_data: 'cat_animes' }],
                [{ text: '📖 Mangás', callback_data: 'cat_mangas' }]
            ]
        }
    });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    if (acao === 'ver_pontos') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `🏆 Tens *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });
    }

    if (acao === 'menu_catalogo') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, '📂 *Escolhe uma categoria:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔥 Filmes', callback_data: 'cat_filmes' }],
                    [{ text: '📺 Séries', callback_data: 'cat_series' }],
                    [{ text: '⛩️ Animes', callback_data: 'cat_animes' }],
                    [{ text: '📖 Mangás', callback_data: 'cat_mangas' }]
                ]
            }
        });
    }

    if (acao.startsWith('cat_')) {
        const tipo = acao.replace('cat_', '');
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}

        let textoAjuda = '';
        if (tipo === 'filmes') textoAjuda = '🔥 *Como pesquisar Filmes:*\nUsa o comando: `/filme [nome do filme]`\nExemplo: `/filme Avatar`';
        if (tipo === 'series') textoAjuda = '📺 *Como pesquisar Séries:*\nUsa o comando: `/filme [nome da série]`\nExemplo: `/filme Loki`';
        if (tipo === 'animes') textoAjuda = '⛩️ *Como pesquisar Animes:*\nUsa o comando: `/anime [nome do anime]`\nExemplo: `/anime Naruto`';
        if (tipo === 'mangas') textoAjuda = '📖 *Como pesquisar Mangás:*\nUsa o comando: `/manga [nome do mangá]`\nExemplo: `/manga One Piece`';

        return bot.sendMessage(chatId, textoAjuda, { parse_mode: 'Markdown' });
    }

    if (acao === 'proximo_jogo') {
        const jogo = bancoDeJogos[Math.floor(Math.random() * bancoDeJogos.length)];
        jogoAtualPorChat[chatId] = { respostaCerta: jogo.respostaCerta };

        const botoes = jogo.opcoes.map(o => [{ text: o.texto, callback_data: `resp_${o.valor}` }]);

        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `${jogo.pergunta}`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botoes }
        });
    }

    if (acao.startsWith('resp_')) {
        const op = acao.replace('resp_', '');
        const j = jogoAtualPorChat[chatId];

        if (!j) {
            try { await bot.answerCallbackQuery(query.id, { text: 'Fim!' }); } catch (e) {}
            return;
        }

        if (op === j.respostaCerta) {
            pontuacoes[chatId] += 10;
            delete jogoAtualPorChat[chatId];

            try { await bot.answerCallbackQuery(query.id, { text: '+10 pontos!' }); } catch (e) {}
            return bot.sendMessage(chatId, `🎉 **Certo!** Total: *${pontuacoes[chatId]}* pts`, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: '➡️ Próximo', callback_data: 'proximo_jogo' }]] }
            });
        }

        try { await bot.answerCallbackQuery(query.id, { text: 'Errado!' }); } catch (e) {}
        return bot.sendMessage(chatId, `❌ **Errado!**`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🔄 Tentar Outro', callback_data: 'proximo_jogo' }]] }
        });
    }
});
