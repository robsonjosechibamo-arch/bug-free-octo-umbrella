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

// Carregar as perguntas do ficheiro gerado automaticamente
let bancoDeJogos = [];
try {
    const dadosArquivo = fs.readFileSync('perguntas.json', 'utf8');
    bancoDeJogos = JSON.parse(dadosArquivo);
    console.log(`✅ Carregadas ${bancoDeJogos.length} perguntas com sucesso!`);
} catch (erro) {
    console.log('⚠️ Ficheiro perguntas.json não encontrado. Usando pergunta de segurança.');
    bancoDeJogos = [
        {
            id: 'seg_1',
            pergunta: 'Quanto é 2 + 2?',
            opcoes: [{ texto: '4', valor: 'certo' }, { texto: '5', valor: 'errado' }],
            respostaCerta: 'certo'
        }
    ];
}

const pontuacoes = {}; // { chatId: pontos }
const ultimosJogos = {}; // { chatId: [id_do_jogo_anterior] }
const jogoAtualPorChat = {}; // { chatId: { respostaCerta } }

// Comando /start atualizado com todas as opções
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

// ==========================================
// COMANDO /CATALOGO (MENU DE CATEGORIAS)
// ==========================================
bot.onText(/\/catalogo|categorias/, (msg) => {
    const chatId = msg.chat.id;

    const tecladoCategorias = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔥 Filmes Populares', callback_data: 'cat_filmes_pop' }],
                [{ text: '📺 Séries e Doramas em Alta', callback_data: 'cat_series_pop' }],
                [{ text: '⛩️ Animes Mais Vistos', callback_data: 'cat_animes_pop' }],
                [{ text: '📖 Mangás Populares', callback_data: 'cat_mangá_pop' }]
            ]
        }
    };

    bot.sendMessage(chatId, '📂 *Escolhe uma categoria abaixo para ver os títulos em destaque:*', {
        parse_mode: 'Markdown',
        ...tecladoCategorias
    });
});

// ==========================================
// SISTEMA DE PESQUISA AUTOMÁTICA (FILMES, SÉRIES, DORAMAS)
// ==========================================
bot.onText(/\/filme (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `🔍 A procurar por *"${termo}"* na base de dados mundial de filmes e doramas...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=3d4516a7f454743260dd242e23d532f6&query=${encodeURIComponent(termo)}&language=pt-PT`);
        const resultados = resposta.data.results;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum filme, série ou dorama encontrado com esse nome.');
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
        bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de dados de filmes.');
    }
});

// ==========================================
// SISTEMA DE PESQUISA AUTOMÁTICA DE ANIMES
// ==========================================
bot.onText(/\/anime (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `⛩️ A procurar por *"${termo}"* na base de dados de animes...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(termo)}&limit=1`, {
            headers: { 'User-Agent': 'BotTelegram/1.0' }
        });
        const resultados = resposta.data.data;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum anime encontrado com esse nome.');
        }

        const anime = resultados[0];
        const titulo = anime.title;
        const episodios = anime.episodes || 'Desconhecido';
        const nota = anime.score || 'N/A';
        const sinopse = anime.synopsis || 'Sinopse indisponível.';
        const imagem = anime.images?.jpg?.large_image_url || null;

        const texto = `⛩️ *Anime: ${titulo}*\n⭐ *Nota:* ${nota}/10\n📺 *Episódios:* ${episódios}\n\n📖 *Sinopse:*\n${sinopse}`;

        if (imagem) {
            bot.sendPhoto(chatId, imagem, { caption: texto, parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de dados de animes.');
    }
});

// ==========================================
// SISTEMA DE PESQUISA AUTOMÁTICA DE MANGÁS
// ==========================================
bot.onText(/\/manga (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const termo = match[1];

    bot.sendMessage(chatId, `📖 A procurar pelo mangá *"${termo}"* na base de dados...`, { parse_mode: 'Markdown' });

    try {
        const resposta = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(termo)}&limit=1`, {
            headers: { 'User-Agent': 'BotTelegram/1.0' }
        });
        const resultados = resposta.data.data;

        if (!resultados || resultados.length === 0) {
            return bot.sendMessage(chatId, '❌ Nenhum mangá encontrado com esse nome.');
        }

        const manga = resultados[0];
        const titulo = manga.title;
        const volumes = manga.volumes || 'Desconhecido';
        const capitulos = manga.chapters || 'Desconhecido';
        const nota = manga.score || 'N/A';
        const sinopse = manga.synopsis || 'Sinopse indisponível.';
        const imagem = manga.images?.jpg?.large_image_url || null;

        const texto = `📖 *Mangá: ${titulo}*\n⭐ *Nota:* ${nota}/10\n📚 *Volumes:* ${volumes} | *Capítulos:* ${capitulos}\n\n📝 *Sinopse:*\n${sinopse}`;

        if (imagem) {
            bot.sendPhoto(chatId, imagem, { caption: texto, parse_mode: 'Markdown' });
        } else {
            bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
        }
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a base de dados de mangás.');
    }
});

// ==========================================
// PROCESSAMENTO DOS BOTÕES E JOGOS
// ==========================================
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
        const tecladoCategorias = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🔥 Filmes Populares', callback_data: 'cat_filmes_pop' }],
                    [{ text: '📺 Séries e Doramas em Alta', callback_data: 'cat_series_pop' }],
                    [{ text: '⛩️ Animes Mais Vistos', callback_data: 'cat_animes_pop' }],
                    [{ text: '📖 Mangás Populares', callback_data: 'cat_mangá_pop' }]
                ]
            }
        };
        return bot.sendMessage(chatId, '📂 *Escolhe uma categoria abaixo:*', { parse_mode: 'Markdown', ...tecladoCategorias });
    }

        // Processar cliques nas categorias do catálogo
    if (acao.startsWith('cat_')) {
        const tipoCat = acao.replace('cat_', '');
        bot.answerCallbackQuery(query.id, { text: 'A carregar lista...' });

        try {
            if (tipoCat === 'filmes_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                const itens = res.data.results.slice(0, 5);
                let texto = '🔥 *Filmes Populares no Momento:*\n\n';
                itens.forEach((f, i) => {
                    texto += `${i + 1}. *${f.title}* (⭐ ${f.vote_average})\n👉 Usa: \`/filme ${f.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'series_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                const itens = res.data.results.slice(0, 5);
                let texto = '📺 *Séries e Doramas em Alta:*\n\n';
                itens.forEach((s, i) => {
                    texto += `${i + 1}. *${s.name}* (⭐ ${s.vote_average})\n👉 Usa: \`/filme ${s.name}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'animes_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/anime?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                const itens = res.data.data;
                let texto = '⛩️ *Animes Mais Vistos:*\n\n';
                itens.forEach((a, i) => {
                    texto += `${i + 1}. *${a.title}* (⭐ ${a.score})\n👉 Usa: \`/anime ${a.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'manga_pop' || tipoCat === 'mangá_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/manga?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                const itens = res.data.data;
                let texto = '📖 *Mangás Populares:*\n\n';
                itens.forEach((m, i) => {
                    texto += `${i + 1}. *${m.title}* (⭐ ${m.score})\n👉 Usa: \`/manga ${m.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

        } catch (e) {
            console.error("Erro no catálogo:", e.message);
            bot.sendMessage(chatId, '⚠️ Erro ao carregar a lista de categorias. Tenta novamente.');
        }
    }

        try {
            if (tipoCat === 'filmes_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                const itens = res.data.results.slice(0, 5);
                let texto = '🔥 *Filmes Populares no Momento:*\n\n';
                itens.forEach((f, i) => {
                    texto += `${i + 1}. *${f.title}* (⭐ ${f.vote_average})\n👉 Usa: \`/filme ${f.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'series_pop') {
                const res = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=3d4516a7f454743260dd242e23d532f6&language=pt-PT&page=1`);
                const itens = res.data.results.slice(0, 5);
                let texto = '📺 *Séries e Doramas em Alta:*\n\n';
                itens.forEach((s, i) => {
                    texto += `${i + 1}. *${s.name}* (⭐ ${s.vote_average})\n👉 Usa: \`/filme ${s.name}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'animes_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/anime?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                const itens = res.data.data;
                let texto = '⛩️ *Animes Mais Vistos:*\n\n';
                itens.forEach((a, i) => {
                    texto += `${i + 1}. *${a.title}* (⭐ ${a.score})\n👉 Usa: \`/anime ${a.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

            if (tipoCat === 'mangá_pop') {
                const res = await axios.get(`https://api.jikan.moe/v4/top/manga?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                const itens = res.data.data;
                let texto = '📖 *Mangás Populares:*\n\n';
                itens.forEach((m, i) => {
                    texto += `${i + 1}. *${m.title}* (⭐ ${m.score})\n👉 Usa: \`/manga ${m.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }

        } catch (e) {
            bot.sendMessage(chatId, '⚠️ Erro ao carregar a lista de categorias.');
        }
    }

    if (acao === 'proximo_jogo') {
        if (!ultimosJogos[chatId]) ultimosJogos[chatId] = [];

        const jogosDisponiveis = bancoDeJogos.filter(j => !ultimosJogos[chatId].includes(j.id));
        const pool = jogosDisponiveis.length > 0 ? jogosDisponiveis : bancoDeJogos;
        
        const jogoSorteado = pool[Math.floor(Math.random() * pool.length)];

        ultimosJogos[chatId].push(jogoSorteado.id);
        if (ultimosJogos[chatId].length > 5) {
            ultimosJogos[chatId].shift();
        }

        jogoAtualPorChat[chatId] = { respostaCerta: jogoSorteado.respostaCerta };

        const botoesOpcoes = jogoSorteado.opcoes.map(opcao => {
            return [{ text: opcao.texto, callback_data: `resp_${opcao.valor}` }];
        });

        botoesOpcoes.push([{ text: '🏆 Ver Pontuação', callback_data: 'ver_pontos' }]);

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
            bot.answerCallbackQuery(query.id, { text: '⚠️ Desafio expirado. Clica em novo jogo!' });
            return;
        }

        const tecladoProximo = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➡️ Próximo Desafio', callback_data: 'proximo_jogo' }],
                    [{ text: '🏆 Ver Pontuação', callback_data: 'ver_pontos' }]
                ]
            }
        };

        if (escolhaUsuario === dadosJogo.respostaCerta) {
            pontuacoes[chatId] += 10;
            delete jogoAtualPorChat[chatId];

            bot.answerCallbackQuery(query.id, { text: '🎉 Correto! +10 pontos' });
            bot.sendMessage(chatId, `🎉 **Parabéns! Acertaste!**\n+10 pontos. Total: *${pontuacoes[chatId]}*`, { parse_mode: 'Markdown', ...tecladoProximo });
        } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Errado!' });
            bot.sendMessage(chatId, `❌ **Resposta incorreta!** Tenta outro desafio.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Tentar Outro', callback_data: 'proximo_jogo' }]]
                }
            });
        }
    }
});
