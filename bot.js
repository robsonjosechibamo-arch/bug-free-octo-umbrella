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
        res.end('Bot de Jogos e Entretenimento Online!\n');
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
                [{ text: '🎮 Jogar / Novo Desafio', callback_data: 'proximo_jogo' }],
                [{ text: '📂 Ver Catálogo e Categorias', callback_data: 'menu_catalogo' }],
                [{ text: '🏆 Ver Meus Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, 
        '🤖 *Bem-vindo ao Super Bot de Jogos e Entretenimento!*\n\n' +
        '🧠 *Jogos:* Responde aos desafios para acumular pontos.\n' +
        '🎬 *Filmes, Séries e Doramas:* `/filme [nome]`\n' +
        '⛩️ *Animes:* `/anime [nome]`\n' +
        '📖 *Mangás:* `/manga [nome]`\n' +
        '📂 *Catálogo:* `/catalogo`\n\n' +
        'Clica abaixo para começar:', 
        { parse_mode: 'Markdown', ...teclado }
    );
});

bot.onText(/\/catalogo|categorias/, (msg) => {
    bot.sendMessage(msg.chat.id, '📂 *Escolhe uma categoria abaixo:*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Filmes Populares', callback_data: 'cat_filmes_pop' }],
                [{ text: '📺 Séries e Doramas em Alta', callback_data: 'cat_series_pop' }],
                [{ text: '⛩️ Animes Mais Vistos', callback_data: 'cat_animes_pop' }],
                [{ text: '📖 Mangás Populares', callback_data: 'cat_manga_pop' }]
            ]
        }
    });
});

bot.onText(/\/filme (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `🔍 A procurar por *"${termo}"*...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=3d4516a7f454743260dd242e23d532f6&query=${encodeURIComponent(termo)}&language=pt-PT`);
        const resultados = resposta.data.results;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum resultado encontrado.');
        }

        const item = resultados[0];
        const titulo = item.title || item.name || 'Título Desconhecido';
        const sinopse = item.overview || 'Sinopse não disponível.';
        const data = item.release_date || item.first_air_date || 'Desconhecido';
        const ano = data.split('-')[0];
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null;
        const tipo = item.media_type === 'tv' ? 'Série / Dorama' : 'Filme';

        const texto = `🎬 *[${tipo}] ${titulo}* (${ano})\n\n📖 *Sinopse:*\n${sinopse}`;

        if (poster) {
            bot.sendPhoto(chatId, poster, { caption: texto, parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de dados.');
    }
});

bot.onText(/\/anime (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `⛩️ A procurar pelo anime *"${termo}"*...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(termo)}&limit=1`, {
            headers: { 'User-Agent': 'BotTelegram/1.0' }
        });
        const resultados = resposta.data.data;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum anime encontrado.');
        }

        const anime = resultados[0];
        const texto = `⛩️ *Anime: ${anime.title}*\n⭐ *Nota:* ${anime.score || 'N/A'}/10\n📺 *Episódios:* ${anime.episodes || 'Desconhecido'}\n\n📖 *Sinopse:*\n${anime.synopsis || 'Indisponível'}`;

        if (anime.images?.jpg?.large_image_url) {
            bot.sendPhoto(chatId, anime.images.jpg.large_image_url, { caption: texto, parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Erro ao consultar a base de animes.');
    }
});

bot.onText(/\/manga (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `📖 A procurar pelo mangá *"${termo}"*...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(termo)}&limit=1`, {
            headers: { 'User-Agent': 'BotTelegram/1.0' }
        });
        const resultados = resposta.data.data;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum mangá encontrado.');
        }

        const manga = resultados[0];
        const texto = `📖 *Mangá: ${manga.title}*\n⭐ *Nota:* ${manga.score || 'N/A'}/10\n📚 *Volumes:* ${manga.volumes || 'Desconhecido'}\n\n📝 *Sinopse:*\n${manga.synopsis || 'Indisponível'}`;

        if (manga.images?.jpg?.large_image_url) {
            bot.sendPhoto(chatId, manga.images.jpg.large_image_url, { caption: texto, parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Erro ao consultar a base de mangás.');
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    if (acao === 'ver_pontos') {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `🏆 Tens atualmente *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });
    }

    if (acao === 'menu_catalogo') {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, '📂 *Escolhe uma categoria abaixo:*', {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔥 Filmes Populares', callback_data: 'cat_filmes_pop' }],
                    [{ text: '📺 Séries e Doramas em Alta', callback_data: 'cat_series_pop' }],
                    [{ text: '⛩️ Animes Mais Vistos', callback_data: 'cat_animes_pop' }],
                    [{ text: '📖 Mangás Populares', callback_data: 'cat_manga_pop' }]
                ]
            }
        });
    }

    if (acao.startsWith('cat_')) {
        const tipoCat = acao.replace('cat_', '');
        try {
            bot.answerCallbackQuery(query.id, { text: 'A carregar lista...' });
        } catch (e) {}

        try {
            if (tipoCat === 'filmes_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                let texto = '🔥 *Filmes Populares:*\n\n';
                res.data.results.slice(0, 5).forEach((f, i) => {
                    texto += `${i + 1}. *${f.title}* (⭐ ${f.vote_average})\n👉 \`/filme ${f.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'series_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                let texto = '📺 *Séries e Doramas em Alta:*\n\n';
                res.data.results.slice(0, 5).forEach((s, i) => {
                    texto += `${i + 1}. *${s.name}* (⭐ ${s.vote_average})\n👉 \`/filme ${s.name}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'animes_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/anime?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                let texto = '⛩️ *Animes Mais Vistos:*\n\n';
                res.data.data.forEach((a, i) => {
                    texto += `${i + 1}. *${a.title}* (⭐ ${a.score})\n👉 \`/anime ${a.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'manga_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/manga?limit=5`, { headers: { 'User-Agent': 'User-Agent: BotTelegram/1.0' } });
                let texto = '📖 *Mangás Populares:*\n\n';
                res.data.data.forEach((m, i) => {
                    texto += `${i + 1}. *${m.title}* (⭐ ${m.score})\n👉 \`/manga ${m.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            bot.sendMessage(chatId, '⚠️ Erro ao carregar a lista de categorias.');
        }
    }

    if (acao === 'proximo_jogo') {
        if (!ultimosJogos[chatId]) ultimosJogos[chatId] = [];

        const pool = bancoDeJogos;
        const jogoSorteado = pool[Math.floor(Math.random() * pool.length)];

        jogoAtualPorChat[chatId] = { respostaCerta: jogoSorteado.respostaCerta };

        const botoesOpcoes = jogoSorteado.opcoes.map(opcao => {
            return [{ text: opcao.texto, callback_data: `resp_${opcao.valor}` }];
        });

        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `${jogoSorteado.pergunta}\n\n👇 *Escolha uma opção:*`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botoesOpcoes }
        });
    }

    if (acao.startsWith('resp_')) {
        const escolhaUsuario = acao.replace('resp_', '');
        const dadosJogo = jogoAtualPorChat[chatId];

        if (!dadosJogo) {
            return bot.answerCallbackQuery(query.id, { text: '⚠️ Desafio expirado!' });
        }

        if (escolhaUsuario === dadosJogo.respostaCerta) {
            pontuacoes[chatId] += 10;
            delete jogoAtualPorChat[chatId];

            bot.answerCallbackQuery(query.id, { text: '🎉 Correto! +10 pontos' });
            bot.sendMessage(chatId, `🎉 **Parabéns! Acertaste!**\nTotal: *${pontuacoes[chatId]}* pontos`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '➡️ Próximo Desafio', callback_data: 'proximo_jogo' }]]
                }
            });
        } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Errado!' });
            bot.sendMessage(chatId, `❌ **Resposta incorreta!**`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Tentar Outro', callback_data: 'proximo_jogo' }]]
                }
            });
        }
    }
});
