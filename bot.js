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

// Carrega as perguntas geradas pelo gerador.js
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
        '🤖 *Bem-vindo ao Super Bot de Matemática e Utilidades!*\n\n' +  
        '🧠 *Jogos:* Responde aos desafios matemáticos para acumular pontos.\n' +  
        '🧮 *Calculadora:* `/calc [expressão]` (ex: `/calc 15 + 25`)\n' +
        '🌤️ *Previsão do Tempo:* `/tempo [cidade]`\n\n' +  
        'Clica abaixo para começar:',   
        { parse_mode: 'Markdown', ...teclado }  
    );
});
// Comando Calculadora
bot.onText(/\/calc (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    let expressao = match[1];

    try {
        // Substitui os dois pontos (:) por sinal de divisão real (/)
        expressaoFormatada = expressao.replace(/:/g, '/');

        // Permite apenas números, operadores seguros e parênteses
        const resultado = eval(expressaoFormatada.replace(/[^0-9+\-*/().]/g, ''));
        
        if (resultado === undefined || isNaN(resultado)) {
            return bot.sendMessage(chatId, '❌ Expressão inválida. Usa números e operadores simples (ex: `/calc 50 / 5` ou `/calc 50:5`)', { parse_mode: 'Markdown' });
        }
        bot.sendMessage(chatId, `🧮 *Resultado:* \`${expressao} = ${resultado}\``, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, '❌ Erro ao calcular a expressão.');
    }
});
// Comando Previsão do Tempo
bot.onText(/\/tempo (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const cidade = match[1];

    bot.sendMessage(chatId, `🌤️ A consultar o tempo para *"${cidade}"*...`, { parse_mode: 'Markdown' });

    try {
        const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt`);
        
        if (!geoRes.data || !geoRes.data.results || geoRes.data.results.length === 0) {
            return bot.sendMessage(chatId, '❌ Cidade não encontrada. Tenta escrever o nome de outra forma.');
        }

        const loc = geoRes.data.results[0];
        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`);
        
        if (!weatherRes.data || !weatherRes.data.current_weather) {
            return bot.sendMessage(chatId, '❌ Não foi possível obter os dados meteorológicos para esta localização.');
        }

        const currentWeather = weatherRes.data.current_weather;

        const texto = `🌤️ *Previsão do Tempo para ${loc.name} (${loc.country || 'N/D'})*\n\n` +
                      `🌡️ *Temperatura:* ${currentWeather.temperature}°C\n` +
                      `💨 *Vento:* ${currentWeather.windspeed} km/h`;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    } catch (e) {
        bot.sendMessage(chatId, '⚠️ Erro ao consultar a previsão do tempo. Tenta novamente mais tarde.');
    }
});
        // Reinicia o ciclo se já tiver respondido a todas as perguntas do banco
        if (historicoPerguntasPorChat[chatId].length >= bancoDeJogos.length) {
            historicoPerguntasPorChat[chatId] = [];
        }

        let indicesDisponiveis = [];
        for (let i = 0; i < bancoDeJogos.length; i++) {
            if (!historicoPerguntasPorChat[chatId].includes(i)) {
                indicesDisponiveis.push(i);
            }
        }

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
