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
        res.end('Bot de Jogos Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor de jogos rodando na porta ${PORT}`);
});

// Base de dados simulada em memória para pontuações e histórico por usuário
const pontuacoes = {}; // { chatId: pontos }
const ultimosJogos = {}; // { chatId: [id_do_jogo_anterior] }

// Lista ampla de jogos e desafios para evitar repetição
const bancoDeJogos = [
    {
        id: 'mat_1',
        pergunta: '🧮 **Desafio Matemático**\nQuanto é `15 * 4 - 10`?',
        resposta: '50'
    },
    {
        id: 'geo_1',
        pergunta: '🌍 **Geografia**\nQual é o país cuja capital é Tóquio?',
        resposta: 'japao'
    },
    {
        id: 'adv_1',
        pergunta: '🧩 **Adivinhação**\nO que é, o que é: Tem capa mas não é livro, tem dentes mas não bite?',
        resposta: 'alho'
    },
    {
        id: 'qui_1',
        pergunta: '⚗️ **Química & Ciências**\nQual é a fórmula química da água?',
        resposta: 'h2o'
    },
    {
        id: 'prog_1',
        pergunta: '💻 **Tecnologia**\nEm programação, como chamamos um bloco de código reutilizável que executa uma tarefa específica?',
        resposta: 'funcao'
    },
    {
        id: 'mat_2',
        pergunta: '🧮 **Desafio Matemático**\nQual é a raiz quadrada de 144?',
        resposta: '12'
    },
    {
        id: 'hist_1',
        pergunta: '📜 **História**\nEm que ano terminou a Segunda Guerra Mundial?',
        resposta: '1945'
    },
    {
        id: 'pop_1',
        pergunta: '🎬 **Cultura Pop**\nQual é o nome do super-herói da Marvel conhecido como o Homem de Ferro?',
        resposta: 'tony stark'
    }
];

// Comando /start para iniciar
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

    bot.sendMessage(chatId, '🤖 *Bem-vindo ao Bot de Desafios e Jogos!*\n\nResponda corretamente aos enigmas e perguntas para acumular pontos. Clique abaixo para começar:', { parse_mode: 'Markdown', ...teclado });
});

// Processar cliques nos botões e respostas via chat
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;

    if (acao === 'ver_pontos') {
        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `🏆 Tens atualmente *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });
    }

    if (acao === 'proximo_jogo') {
        // Inicializar histórico de jogos do chat se não existir
        if (!ultimosJogos[chatId]) ultimosJogos[chatId] = [];

        // Filtrar jogos para não repetir os últimos 3 jogados recentemente
        const jogosDisponiveis = bancoDeJogos.filter(j => !ultimosJogos[chatId].includes(j.id));
        
        // Se esgotar o filtro, limpa o histórico para recomeçar o ciclo
        const pool = jogosDisponiveis.length > 0 ? jogosDisponiveis : bancoDeJogos;
        
        const jogoSorteado = pool[Math.floor(Math.random() * pool.length)];

        // Guardar no histórico recente (mantém os últimos 3)
        ultimosJogos[chatId].push(jogoSorteado.id);
        if (ultimosJogos[chatId].length > 3) {
            ultimosJogos[chatId].shift();
        }

        // Guardar qual é a resposta correta associada a este chat temporariamente
        bot[chatId] = { respostaAtual: jogoSorteado.resposta };

        bot.answerCallbackQuery(query.id);
        return bot.sendMessage(chatId, `${jogoSorteado.pergunta}\n\n💬 *Responda diretamente nesta conversa com a sua resposta!*`, { parse_mode: 'Markdown' });
    }
});

// Capturar respostas de texto enviadas pelos utilizadores
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const texto = msg.text ? msg.text.trim().toLowerCase() : '';

    // Ignorar se for comando
    if (texto.startsWith('/')) return;

    // Verificar se há um jogo ativo aguardando resposta neste chat
    if (bot[chatId] && bot[chatId].respostaAtual) {
        const respostaCerta = bot[chatId].respostaAtual;

        if (texto === respostaCerta) {
            pontuacoes[chatId] += 10; // Adiciona 10 pontos por acerto
            bot[chatId].respostaAtual = null; // Limpa o desafio atual

            const tecladoNovoJogo = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '➡️ Próximo Desafio', callback_data: 'proximo_jogo' }],
                        [{ text: '🏆 Ver Pontuação', callback_data: 'ver_pontos' }]
                    ]
                }
            };

            bot.sendMessage(chatId, `🎉 **Parabéns! Acertaste em cheio!**\n+10 pontos adicionados. Pontuação total: *${pontuacoes[chatId]}*`, { parse_mode: 'Markdown', ...tecladoNovoJogo });
        } else {
            bot.sendMessage(chatId, '❌ **Resposta incorreta!** Tenta novamente ou clica abaixo para pedir outro desafio.', {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: '🔄 Tentar Outro Jogo', callback_data: 'proximo_jogo' }]]
                }
            });
        }
    }
});
