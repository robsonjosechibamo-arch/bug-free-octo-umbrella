// Variável global para guardar o histórico por chat
const historicoPerguntasPorChat = {};

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;
    if (!historicoPerguntasPorChat[chatId]) historicoPerguntasPorChat[chatId] = [];

    if (acao === 'ver_pontos') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `🏆 Tens atualmente *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });
    }

    if (acao === 'menu_catalogo') {
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
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
        try { await bot.answerCallbackQuery(query.id, { text: 'A carregar lista...' }); } catch (e) {}

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
                const res = await axios.get(`https://api.jikan.moe/v4/top/manga?limit=5`, { headers: { 'User-Agent': 'BotTelegram/1.0' } });
                let texto = '📖 *Mangás Populares:*\n\n';
                res.data.data.forEach((m, i) => {
                    texto += `${i + 1}. *${m.title}* (⭐ ${m.score})\n👉 \`/manga ${m.title}\`\n\n`;
                });
                return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            return bot.sendMessage(chatId, '⚠️ Erro ao carregar a lista de categorias.');
        }
    }

    if (acao === 'proximo_jogo') {
        if (!bancoDeJogos || bancoDeJogos.length === 0) {
            try { await bot.answerCallbackQuery(query.id, { text: 'Sem perguntas disponíveis!' }); } catch (e) {}
            return;
        }

        // Se já respondeu a todas, limpa o histórico para o ciclo recomeçar do zero
        if (historicoPerguntasPorChat[chatId].length >= bancoDeJogos.length) {
            historicoPerguntasPorChat[chatId] = [];
        }

        // Encontra índices que ainda não saíram para este chat
        let indicesDisponiveis = [];
        for (let i = 0; i < bancoDeJogos.length; i++) {
            if (!historicoPerguntasPorChat[chatId].includes(i)) {
                indicesDisponiveis.push(i);
            }
        }

        // Sorteia aleatoriamente de dentro dos índices que faltam
        const indiceSorteado = indicesDisponiveis[Math.floor(Math.random() * indicesDisponiveis.length)];
        
        // Guarda no histórico que esta pergunta já foi vista
        historicoPerguntasPorChat[chatId].push(indiceSorteado);

        const jogoSorteado = bancoDeJogos[indiceSorteado];
        jogoAtualPorChat[chatId] = { respostaCerta: jogoSorteado.respostaCerta };

        const botoesOpcoes = jogoSorteado.opcoes.map(opcao => {
            return [{ text: opcao.texto, callback_data: `resp_${opcao.valor}` }];
        });

        try { await bot.answerCallbackQuery(query.id); } catch (e) {}
        return bot.sendMessage(chatId, `${jogoSorteado.pergunta}\n\n👇 *Escolha uma opção:*`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botoesOpcoes }
        });
    }

    if (acao.startsWith('resp_')) {
        const escolhaUsuario = acao.replace('resp_', '');
        const dadosJogo = jogoAtualPorChat[chatId];

        if (!dadosJogo) {
            try { await bot.answerCallbackQuery(query.id, { text: '⚠️ Desafio expirado!' }); } catch (e) {}
            return;
        }

        if (escolhaUsuario === dadosJogo.respostaCerta) {
            pontuacoes[chatId] += 10;
            delete jogoAtualPorChat[chatId];

            try { await bot.answerCallbackQuery(query.id, { text: '🎉 Correto! +10 pontos' }); } catch (e) {}
            return bot.sendMessage(chatId, `🎉 **Parabéns! Acertaste!**\nTotal: *${pontuacoes[chatId]}* pontos`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '➡️ Próximo Desafio', callback_data: 'proximo_jogo' }]]
                }
            });
        } else {
            try { await bot.answerCallbackQuery(query.id, { text: '❌ Errado!' }); } catch (e) {}
            return bot.sendMessage(chatId, `❌ **Resposta incorreta!**`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Tentar Outro', callback_data: 'proximo_jogo' }]]
                }
            });
        }
    }
});
