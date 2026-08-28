const http = require('http');
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
        res.end('Bot de Jogos com Opções Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor de jogos rodando na porta ${PORT}`);
});

const pontuacoes = {}; // { chatId: pontos }
const ultimosJogos = {}; // { chatId: [id_do_jogo_anterior] }
const jogoAtualPorChat = {}; // { chatId: { respostaCerta } }

// Banco de jogos com perguntas e opções de resposta
const bancoDeJogos = [
    {
        id: 'mat_1',
        pergunta: '🧮 **Desafio Matemático**\nQuanto é `15 * 4 - 10`?',
        opcoes: [
            { texto: '40', valor: 'errado1' },
            { texto: '50', valor: 'certo' },
            { texto: '60', valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    },
    {
        id: 'geo_1',
        pergunta: '🌍 **Geografia**\nQual é o país cuja capital é Tóquio?',
        opcoes: [
            { texto: 'China', valor: 'errado1' },
            { texto: 'Coreia do Sul', valor: 'errado2' },
            { texto: 'Japão', valor: 'certo' }
        ],
        respostaCerta: 'certo'
    },
    {
        id: 'adv_1',
        pergunta: '🧩 **Adivinhação**\nO que é, o que é: Tem capa mas não é livro, tem dentes mas não bite?',
        opcoes: [
            { texto: 'Alho', valor: 'certo' },
            { texto: 'Pente', valor: 'errado1' },
            { texto: 'Tubarão', valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    },
    {
        id: 'qui_1',
        pergunta: '⚗️ **Química & Ciências**\nQual é a fórmula química da água?',
        opcoes: [
            { texto: 'CO2', valor: 'errado1' },
            { texto: 'H2O', valor: 'certo' },
            { texto: 'NaCl', valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    },
    {
        id: 'prog_1',
        pergunta: '💻 **Tecnologia**\nEm programação, como chamamos um bloco de código reutilizável?',
        opcoes: [
            { texto: 'Variável', valor: 'errado1' },
            { texto: 'Função', valor: 'certo' },
            { texto: 'Loop', valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    },
    {
        id: 'hist_1',
        pergunta: '📜 **História**\nEm que ano terminou a Segunda Guerra Mundial?',
        opcoes: [
            { texto: '1945', valor: 'certo' },
            { texto: '1939', valor: 'errado1' },
            { texto: '1950', valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    }
];

// Comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎮 Jogar / Novo Desafio', callback_data: 'proximo_jogo' }],
                [{ text: '🏆 Ver Meus Pontos', callback_data: 'ver_pontos' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao Bot de Desafios com Opções!*\n\nResponda aos desafios escolhendo uma das opções em botões para acumular pontos:', { parse_mode: 'Markdown', ...teclado });
});

// Processar ações dos botões
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

        // Filtrar para não repetir os últimos jogos
        const jogosDisponiveis = bancoDeJogos.filter(j => !ultimosJogos[chatId].includes(j.id));
        const pool = jogosDisponiveis.length > 0 ? jogosDisponiveis : bancoDeJogos;
        
        const jogoSorteado = pool[Math.floor(Math.random() * pool.length)];

        // Guardar no histórico
        ultimosJogos[chatId].push(jogoSorteado.id);
        if (ultimosJogos[chatId].length > 3) {
            ultimosJogos[chatId].shift();
        }

        // Registar qual é a resposta certa para este chat
        jogoAtualPorChat[chatId] = { respostaCerta: jogoSorteado.respostaCerta };

        // Criar botões com as opções baralhadas ou ordenadas do jogo
        const botoesOpcoes = jogoSorteado.opcoes.map(opcao => {
            return [{ text: opcao.texto, callback_data: `resp_${opcao.valor}` }];
        });

        // Adicionar botão extra para pular ou ver pontos
        botoesOpcoes.push([{ text: '🏆 Ver Pontuação', callback_data: 'ver_pontos' }]);

        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `${jogoSorteado.pergunta}\n\n👇 *Escolha uma das opções abaixo:*`, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: botoesOpcoes }
        });
    }

    // Processar cliques nas opções de resposta
    if (acao.startsWith('resp_')) {
        const escolhaUsuario = acao.replace('resp_', '');
        const dadosJogo = jogoAtualPorChat[chatId];

        if (!dadosJogo) {
            bot.answerCallbackQuery(query.id, { text: '⚠️ Este desafio já expirou. Clica em novo jogo!' });
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
            delete jogoAtualPorChat[chatId]; // Limpa a questão ativa

            bot.answerCallbackQuery(query.id, { text: '🎉 Resposta Correta! +10 pontos' });
            bot.sendMessage(chatId, `🎉 **Parabéns! Acertaste em cheio!**\n+10 pontos adicionados. Pontuação total: *${pontuacoes[chatId]}*`, { parse_mode: 'Markdown', ...tecladoProximo });
        } else {
            bot.answerCallbackQuery(query.id, { text: '❌ Resposta Errada!' });
            bot.sendMessage(chatId, `❌ **Resposta incorreta!** Tenta novamente um novo desafio.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Tentar Outro Jogo', callback_data: 'proximo_jogo' }]]
                }
            });
        }
    }
});
