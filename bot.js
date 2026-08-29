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

// Base local de Mangás e Animes (Texto/Sinopse - Intacta)
const baseMangas = {
    'one piece': { titulo: 'One Piece', nota: '9.2/10', volumes: '108+', sinopse: 'A jornada de Monkey D. Luffy para se tornar o Rei dos Piratas.' },
    'jujutsu': { titulo: 'Jujutsu Kaisen', nota: '8.8/10', volumes: '26', sinopse: 'Yuji Itadori engole um dedo amaldiçoado e entra para o mundo dos feiticeiros.' },
    'naruto': { titulo: 'Naruto', nota: '8.5/10', volumes: '72', sinopse: 'Um jovem ninja que busca reconhecimento e o sonho de se tornar Hokage.' }
};

// Base de Ficheiros Reais para o comando /baixar
// Podes usar um link direto válido OU o caminho de um ficheiro local (ex: './ficheiros/jujutsu.pdf')
const baseFicheiros = {
    'one piece': { 
        titulo: 'One Piece - Capítulo/Pack', 
        origem: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // Exemplo de link PDF válido para teste
    },
    'jujutsu': { 
        titulo: 'Jujutsu Kaisen - Mangá PDF', 
        origem: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // Exemplo de link PDF válido para teste
    }
};

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
                [{ text: '🔥 Filmes e Séries', callback_data: 'cat_filmes' }],
                [{ text: '⛩️ Animes e Mangás', callback_data: 'cat_mangas' }]
            ]
        }
    });
});

// Pesquisa de Filmes e Séries (Intacta)
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
        const tipo = item.media_type === 'tv' ? 'Série' : 'Filme';

        const texto = `🎬 *[${tipo}] ${titulo}* (${ano})\n\n📖 *Sinopse:*\n${sinopse}`;
        return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    } catch (e) {
        return bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de filmes.');
    }
});

// Pesquisa de Mangás (Intacta - Texto)
bot.onText(/\/manga (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1].toLowerCase();

    let encontrado = null;
    for (let chave in baseMangas) {
        if (termo.includes(chave)) {
            encontrado = baseMangas[chave];
            break;
        }
    }

    if (!encontrado) {
        return bot.sendMessage(chatId, `❌ Mangá "${match[1]}" não encontrado na base local.\nExperimenta: \`/manga One Piece\` ou \`/manga Jujutsu\``, { parse_mode: 'Markdown' });
    }

    const texto = `📖 *Mangá: ${encontrado.titulo}*\n⭐ *Nota:* ${encontrado.nota}\n📚 *Volumes:* ${encontrado.volumes}\n\n📝 *Sinopse:*\n${encontrado.sinopse}`;
    return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
});

bot.onText(/\/anime (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1].toLowerCase();

    let encontrado = null;
    for (let chave in baseMangas) {
        if (termo.includes(chave)) {
            encontrado = baseMangas[chave];
            break;
        }
    }

    if (!encontrado) {
        return bot.sendMessage(chatId, `❌ Anime "${match[1]}" não encontrado na base local.`, { parse_mode: 'Markdown' });
    }

    const texto = `⛩️ *Anime: ${encontrado.titulo}*\n⭐ *Nota:* ${encontrado.nota}\n\n📝 *Sinopse:*\n${encontrado.sinopse}`;
    return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
});

// Comando /baixar corrigido e funcional
bot.onText(/\/baixar (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1].toLowerCase();

    let encontrado = null;
    for (let chave in baseFicheiros) {
        if (termo.includes(chave)) {
            encontrado = baseFicheiros[chave];
            break;
        }
    }

    if (!encontrado) {
        return bot.sendMessage(chatId, `❌ Ficheiro para "${match[1]}" não encontrado.\nUsa: \`/baixar One Piece\` ou \`/baixar Jujutsu\``, { parse_mode: 'Markdown' });
    }

    bot.sendMessage(chatId, `⏳ A enviar o ficheiro de *${encontrado.titulo}*...`, { parse_mode: 'Markdown' });

    // Verifica se é um link web ou se deve ler como ficheiro local do servidor
    let envio;
    if (encontrado.origem.startsWith('http://') || encontrado.origem.startsWith('https://')) {
        envio = encontrado.origem;
    } else {
        envio = fs.createReadStream(encontrado.origem);
    }

    return bot.sendDocument(chatId, envio, {
        caption: `📂 *${encontrado.titulo}*\nAqui tens o teu ficheiro!`,
        parse_mode: 'Markdown'
    }).catch(err => {
        bot.sendMessage(chatId, '⚠️ Erro ao enviar o ficheiro. Certifica-te de que o link ou caminho local está correto.');
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
                    [{ text: '🔥 Filmes e Séries', callback_data: 'cat_filmes' }],
                    [{ text: '⛩️ Animes e Mangás', callback_data: 'cat_mangas' }]
                ]
            }
        });
    }

    if (acao.startsWith('cat_')) {
        const tipo = acao.replace('cat_', '');
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}

        let textoAjuda = '';
        if (tipo === 'filmes') textoAjuda = '🔥 *Como pesquisar Filmes/Séries:*\nUsa: `/filme [nome]`\nExemplo: `/filme Avatar`';
        if (tipo === 'mangas') textoAjuda = '📖 *Como pesquisar Mangás/Animes:*\nUsa: `/manga [nome]` ou `/anime [nome]`\nExemplo: `/manga One Piece`\n\n📥 *Para descarregar ficheiros:*\nUsa: `/baixar [nome]`';

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
 
