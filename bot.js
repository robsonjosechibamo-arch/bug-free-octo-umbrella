const http = require('http');
const fs = require('fs');
const axios = require('axios');
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
const ultimosJogos = {}; 
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
    bot.sendMessage(msg.chat.id, '📂 *Escolhe uma categoria:*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Filmes', callback_data: 'cat_filmes_pop' }],
                [{ text: '📺 Séries', callback_data: 'cat_series_pop' }],
                [{ text: '⛩️ Animes', callback_data: 'cat_animes_pop' }],
                [{ text: '📖 Mangás', callback_data: 'cat_manga_pop' }]
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
                    [{ text: '🔥 Filmes', callback_data: 'cat_filmes_pop' }],
                    [{ text: '📺 Séries', callback_data: 'cat_series_pop' }],
                    [{ text: '⛩️ Animes', callback_data: 'cat_animes_pop' }],
                    [{ text: '📖 Mangás', callback_data: 'cat_manga_pop' }]
                ]
            }
        });
    }

    if (acao.startsWith('cat_')) {
        const tipo = acao.replace('cat_', '');
        try { await bot.answerCallbackQuery(query.id, { text: 'A carregar...' }); } catch (e) {}

        try {
            if (tipo === 'filmes_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                let txt = '🔥 *Filmes:*\n\n';
                res.data.results.slice(0, 5).forEach((f, i) => {
                    txt += `${i + 1}. *${f.title}* (⭐ ${f.vote_average})\n`;
                });
                return bot.sendMessage(chatId, txt, { parse_mode: 'Markdown' });
            }

            if (tipo === 'series_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                let txt = '📺 *Séries:*\n\n';
                res.data.results.slice(0, 5).forEach((s, i) => {
                    txt += `${i + 1}. *${s.name}* (⭐ ${s.vote_average})\n`;
                });
                return bot.sendMessage(chatId, txt, { parse_mode: 'Markdown' });
            }

            if (tipo === 'animes_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/anime?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                let txt = '⛩️ *Animes:*\n\n';
                res.data.data.forEach((a, i) => {
                    txt += `${i + 1}. *${a.title}* (⭐ ${a.score})\n`;
                });
                return bot.sendMessage(chatId, txt, { parse_mode: 'Markdown' });
            }

            if (tipo === 'manga_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/manga?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                let txt = '📖 *Mangás:*\n\n';
                res.data.data.forEach((m, i) => {
                    txt += `${i + 1}. *${m.title}* (⭐ ${m.score})\n`;
                });
                return bot.sendMessage(chatId, txt, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            console.error("Erro:", e.message);
            return bot.sendMessage(chatId, `⚠️ ERRO EXATO: ${e.message}`);
        }
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
