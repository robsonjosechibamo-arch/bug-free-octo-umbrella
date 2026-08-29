const http = require('http');
const fs = require('fs');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN, { polling: false });

const PORT = process.env.PORT || 3000;
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';

bot.setWebHook(`${URL}/bot${TOKEN}`).then(() => {
    console.log(`Webhook definido com sucesso para: ${URL}/bot${TOKEN}`);
}).catch(err => {
    console.log(`Erro ao definir webhook: ${err.message}`);
});

const server = http.createServer((req, res) => {
    if (req.url === `/bot${TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const update = JSON.parse(body);
                bot.processUpdate(update);
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

// Carrega as perguntas do ficheiro perguntas.json
let bancoDeJogos = [];
try {
    const dadosArquivo = fs.readFileSync('perguntas.json', 'utf8');
    bancoDeJogos = JSON.parse(dadosArquivo);
    console.log(`✅ Sucesso! Carregadas ${bancoDeJogos.length} perguntas.`);
} catch (erro) {
    console.log('⚠️ Erro ao carregar o perguntas.json, a usar perguntas de segurança.');
    bancoDeJogos = [
        {
            id: 'seg_1',
            pergunta: '🧮 Quanto é 2 + 2?',
            opcoes: [{ texto: '3', valor: 'errado1' }, { texto: '4', valor: 'certo' }, { texto: '5', valor: 'errado2' }],
            respostaCerta: 'certo'
        },
        {
            id: 'seg_2',
            pergunta: '🧮 Quanto é 10 - 5?',
            opcoes: [{ texto: '5', valor: 'certo' }, { texto: '2', valor: 'errado1' }, { texto: '8', valor: 'errado2' }],
            respostaCerta: 'certo'
        }
    ];
}

const pontuacoes = {};
const jogoAtualPorChat = {};
const historicoPerguntasPorChat = {};

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

    bot.sendMessage(chatId,   
        '🤖 *Bem-vindo ao Super Bot de Matemática e IA!*\n\n' +  
        '🧠 *Quiz Matemático:* Desafios dinâmicos sem repetições cansativas.\n' +  
        '🧮 *Calculadora:* `/calc [expressão]` (ex: `/calc 50:5`)\n' +
        '💡 *IA Ajuda Pessoal:* `/ia [pergunta]` (ex: `/ia como criar uma rotina de estudos`)\n\n' +  
        'Clica abaixo para começar:',   
        { parse_mode: 'Markdown', ...teclado }  
    );
});

// Comando Calculadora
bot.onText(/\/calc (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const expressao = match[1];

    try {
        const expressaoFormatada = expressao.replace(/:/g, '/');
        const resultado = eval(expressaoFormatada.replace(/[^0-9+\-*/().]/g, ''));
        
        if (resultado === undefined || isNaN(resultado)) {
            return bot.sendMessage(chatId, '❌ Expressão inválida. Usa números e operadores simples (ex: `/calc 50 / 5` ou `/calc 50:5`)', { parse_mode: 'Markdown' });
        }
        bot.sendMessage(chatId, `🧮 *Resultado:* \`${expressao} = ${resultado}\``, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, '❌ Erro ao calcular a expressão.');
    }
});
// Comando IA atualizado com suporte real a respostas inteligentes
bot.onText(/\/ia (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const pergunta = match[1];

    bot.sendMessage(chatId, '💡 *A IA está a pensar numa resposta para ti...*', { parse_mode: 'Markdown' });

    try {
        // Podes obter uma chave gratuita da API do Google Gemini no Google AI Studio
        // Ou utilizar um endpoint público alternativo se preferires não usar chave.
        const respostaIa = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=SUA_CHAVE_API_AQUI`, {
            contents: [{ parts: [{ text: pergunta }] }]
        });

        let textoResposta = respostaIa.data.candidates[0].content.parts[0].text;

        bot.sendMessage(chatId, `💡 *Resposta da IA:*\n\n${textoResposta}`, { parse_mode: 'Markdown' });
    } catch (e) {
        // Alternativa de fallback caso queiras manter sem chave (usando uma API pública de chat livre)
        try {
            const respostaAlternativa = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(pergunta)}`);
            if (respostaAlternativa.data && respostaAlternativa.data.response) {
                return bot.sendMessage(chatId, `💡 *Resposta da IA:*\n\n${respostaAlternativa.data.response}`, { parse_mode: 'Markdown' });
            }
        } catch (errAlt) {}

        bot.sendMessage(chatId, '⚠️ Ocorreu um erro ao consultar a IA. Tenta novamente mais tarde.');
    }
});
// Gestão de Botões (Callback Query com correção definitiva para evitar repetições)
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (!pontuacoes[chatId]) pontuacoes[chatId] = 0;
    if (!historicoPerguntasPorChat[chatId]) historicoPerguntasPorChat[chatId] = [];

    if (acao === 'ver_pontos') {  
        try { await bot.answerCallbackQuery(query.id); } catch (e) {}  
        return bot.sendMessage(chatId, `🏆 Tens atualmente *${pontuacoes[chatId]}* pontos!`, { parse_mode: 'Markdown' });  
    }  

    if (acao === 'proximo_jogo') {  
        if (!bancoDeJogos || bancoDeJogos.length === 0) {
            try { await bot.answerCallbackQuery(query.id, { text: 'Sem perguntas disponíveis!' }); } catch (e) {}
            return;
        }

        // Se já respondeu a todas as perguntas do banco, limpa o histórico para recomeçar o ciclo limpo
        if (historicoPerguntasPorChat[chatId].length >= bancoDeJogos.length) {
            historicoPerguntasPorChat[chatId] = [];
        }

        // Filtra apenas os índices que ainda NÃO foram respondidos por este chat
        let indicesDisponiveis = [];
        for (let i = 0; i < bancoDeJogos.length; i++) {
            if (!historicoPerguntasPorChat[chatId].includes(i)) {
                indicesDisponiveis.push(i);
            }
        }

        // Se por alguma razão o array ficar vazio, limpa o histórico por segurança
        if (indicesDisponiveis.length === 0) {
            historicoPerguntasPorChat[chatId] = [];
            for (let i = 0; i < bancoDeJogos.length; i++) {
                indicesDisponiveis.push(i);
            }
        }

        // Sorteia estritamente de entre os índices que ainda não saíram
        const indiceSorteado = indicesDisponiveis[Math.floor(Math.random() * indicesDisponiveis.length)];
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
