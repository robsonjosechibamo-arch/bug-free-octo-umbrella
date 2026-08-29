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
        res.end('Bot de Jogos Infinitos Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

let bancoDeJogos = [];
try {
    const dadosArquivo = fs.readFileSync('perguntas.json', 'utf8');
    bancoDeJogos = JSON.parse(dadosArquivo);
    console.log(`✅ Carregadas ${bancoDeJogos.length} perguntas com sucesso!`);
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
                [{ text: '🎮 Jogar / Novo Desafio Infinito', callback_data: 'proximo_jogo' }],
                [{ text: '🏆 Ver Meus Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao Bot de Desafios Infinitos!*\n\nEscolhe uma opção abaixo:', { parse_mode: 'Markdown', ...teclado });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    if (acao === 'ver_pontos') {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `🏆 Tens atualmente *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });
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
