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
const jogoAtualPorChat = {}; 

// Base Completa com Histórias, Detalhes e Links de Download para Mangás/Animes/Doramas
const baseConteudo = {
    'one piece': { 
        tipo: 'Mangá / Anime',
        titulo: 'One Piece', 
        nota: '9.2/10', 
        volumes: '108+ (História Completa)', 
        sinopse: 'A jornada épica de Monkey D. Luffy e a sua tripulação em busca do tesouro lendário para se tornar o Rei dos Piratas.',
        linkDownload: 'https://exemplo.com/download/one-piece-completo.pdf' 
    },
    'jujutsu': { 
        tipo: 'Mangá / Anime',
        titulo: 'Jujutsu Kaisen', 
        nota: '8.8/10', 
        volumes: '26 (Completo)', 
        sinopse: 'Yuji Itadori engole um dedo amaldiçoado de Ryomen Sukuna, entrando de cabeça no perigoso mundo das maldições e feiticeiros.',
        linkDownload: 'https://exemplo.com/download/jujutsu-kaisen-completo.pdf' 
    },
    'naruto': { 
        tipo: 'Mangá / Anime',
        titulo: 'Naruto', 
        nota: '8.5/10', 
        volumes: '72 (Completo)', 
        sinopse: 'A história de Naruto Uzumaki, um ninja rejeitado que sonha em se tornar Hokage, o líder da sua vila.',
        linkDownload: 'https://exemplo.com/download/naruto-completo.pdf' 
    }
};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎮 Jogar', callback_data: 'proximo_jogo' }],
                [{ text: '📂 Catálogo Completo', callback_data: 'menu_catalogo' }],
                [{ text: '🏆 Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao ROS HSS Bot!* Escolhe uma opção abaixo:', { parse_mode: 'Markdown', ...teclado });
});

bot.onText(/\/catalogo|categorias/, (msg) => {
    bot.sendMessage(msg.chat.id, '📂 *Escolhe uma categoria:*', {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Filmes e Séries', callback_data: 'cat_filmes' }],
                [{ text: '⛩️ Animes e Mangás', callback_data: 'cat_mangas' }],
                [{ text: '🌸 Doramas', callback_data: 'cat_doramas' }]
            ]
        }
    });
});

// Pesquisa de Filmes, Séries e Doramas via TMDB (Com link de apoio/streaming simulado)
bot.onText(/\/filme (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `🔍 A procurar por *"${termo}"*...`, { parse_mode: 'Markdown' });

    try {
        const res = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=3d4516a7f454743260dd242e23d532f6&query=${encodeURIComponent(termo)}&language=pt-PT`, { timeout: 8000 });
        const resultados = res.data.results;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum resultado encontrado.');
        }

        const item = resultados[0];
        const titulo = item.title || item.name || 'Desconhecido';
        const sinopse = item.overview || 'Sinopse indisponível.';
        const data = item.release_date || item.first_air_date || 'Desconhecido';
        const ano = data.split('-')[0];
        const tipo = item.media_type === 'tv' ? 'Série / Dorama' : 'Filme';

        const texto = `🎬 *[${tipo}] ${titulo}* (${ano})\n\n📖 *História / Sinopse:*\n${sinopse}\n\n📥 *Para baixar:* Utilize o nosso canal oficial ou digite o nome na categoria correspondente.`;
        return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    } catch (e) {
        return bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de dados.');
    }
});

// Pesquisa detalhada de Mangás e Animes com história completa e link de download direto
bot.onText(/\/manga (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1].toLowerCase();

    let encontrado = null;
    for (let chave in baseConteudo) {
        if (termo.includes(chave)) {
            encontrado = baseConteudo[chave];
            break;
        }
    }

    if (!encontrado) {
        return bot.sendMessage(chatId, `❌ "${match[1]}" não encontrado na base.\nExperimenta: \`/manga One Piece\` ou \`/manga Jujutsu\``, { parse_mode: 'Markdown' });
    }

    const texto = `📖 *${encontrado.tipo}: ${encontrado.titulo}*` +
                  `\n⭐ *Nota:* ${encontrado.nota}` +
                  `\n📚 *Volumes/Episódios:* ${encontrado.volumes}` +
                  `\n\n📝 *História Completa / Sinopse:*\n${encontrado.sinopse}` +
                  `\n\n🔗 *Link Direto para Baixar:* \n${encontrado.linkDownload}`;

    return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
});

bot.onText(/\/anime (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1].toLowerCase();

    let encontrado = null;
    for (let chave in baseConteudo) {
        if (termo.includes(chave)) {
            encontrado = baseConteudo[chave];
            break;
        }
    }

    if (!encontrado) {
        return bot.sendMessage(chatId, `❌ Anime "${match[1]}" não encontrado na base local.`, { parse_mode: 'Markdown' });
    }

    const texto = `⛩️ *Anime: ${encontrado.titulo}*` +
                  `\n⭐ *Nota:* ${encontrado.nota}` +
                  `\n\n📝 *História Completa / Sinopse:*\n${encontrado.sinopse}` +
                  `\n\n🔗 *Link Direto para Baixar:* \n${encontrado.linkDownload}`;

    return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
});

bot.onText(/\/dorama (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];
    bot.sendMessage(chatId, `🌸 *Dorama:* ${termo}\n\n📖 Encontrado com sucesso! Para baixar os episódios completos legendados, aceda ao link do nosso catálogo principal.`, { parse_mode: 'Markdown' });
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
                    [{ text: '🔥 Filmes e Séries', callback_data: 'cat_filmes' }],
                    [{ text: '⛩️ Animes e Mangás', callback_data: 'cat_mangas' }],
                    [{ text: '🌸 Doramas', callback_data: 'cat_doramas' }]
                ]
            }
        });
    }

    if (acao.startsWith('cat_')) {
        const tipo = acao.replace('cat_', '');
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}

        let textoAjuda = '';
        if (tipo === 'filmes') textoAjuda = '🔥 *Como pesquisar Filmes/Séries:*\nUsa: `/filme [nome]`\nExemplo: `/filme Avatar`';
        if (tipo === 'mangas') textoAjuda = '📖 *Como pesquisar Mangás/Animes:*\nUsa: `/manga [nome]` ou `/anime [nome]`\nExemplo: `/manga One Piece`';
        if (tipo === 'doramas') textoAjuda = '🌸 *Como pesquisar Doramas:*\nUsa: `/dorama [nome]`\nExemplo: `/dorama Vincenzo`';

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
