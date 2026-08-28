const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg'; // Cole o seu token novo aqui
const bot = new TelegramBot(TOKEN);

// Configura o Webhook usando a URL pública do seu serviço no Render
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Servidor HTTP obrigatório para o Render manter a porta aberta
const server = http.createServer((req, res) => {
    if (req.url === `/bot${TOKEN}`) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            bot.processUpdate(JSON.parse(body));
            res.writeHead(200);
            res.end('OK');
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot online via Webhook!\n');
    }
});

server.listen(process.env.PORT || 3000);

// Suas funções e comandos normais
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Olá! Bot online e pronto para uso!');
});

console.log('Bot rodando com sucesso via Webhook!');
