const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

const PORT = process.env.PORT || 3000;
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';

bot.setWebHook(`${URL}/bot${TOKEN}`);

// Servidor HTTP simples para manter o Render acordado
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
        res.end('Bot DarkTunnel Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Função para gerar dados de servidores e contas automáticas
function gerarConta() {
    const servidores = ["45.134.9.133", "185.199.108.153", "104.21.65.22"];
    const portas = ["443", "80", "8080", "22"];
    
    const ip = servidores[Math.floor(Math.random() * servidores.length)];
    const porta = portas[Math.floor(Math.random() * portas.length)];
    const user = `hss_${Math.floor(1000 + Math.random() * 9000)}`;
    const pass = `pass_${Math.random().toString(36).substring(2, 8)}`;

    return { ip, porta, user, pass };
}

// Menu /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚙️ Gerar Conta & Payload', callback_data: 'gerar_payload' }],
                [{ text: '🛡️ Gerar Conta & SNI', callback_data: 'gerar_sni' }],
                [{ text: '📞 Suporte', callback_data: 'suporte' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Painel DarkTunnel HSS*\n\nEscolha uma opção abaixo:', { parse_mode: 'Markdown', ...teclado });
});

// Ações dos botões
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;
    const conta = gerarConta();

    if (acao === 'gerar_payload') {
        const payload = "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]";

        const texto = `⚙️ *Payload Gerada*\n\n` +
                      `🖥️ *Host/IP:* \`${conta.ip}\`\n` +
                      `🔌 *Porta:* \`${conta.porta}\`\n` +
                      `👤 *Utilizador:* \`${conta.user}\`\n` +
                      `🔑 *Senha:* \`${conta.pass}\`\n\n` +
                      `📝 *Payload (toque para copiar):*\n\`${payload}\``;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    } 
    else if (acao === 'gerar_sni') {
        const sni = "mymuze.vm.co.mz";

        const texto = `🛡️ *SNI Gerada*\n\n` +
                      `🖥️ *Host/IP:* \`${conta.ip}\`\n` +
                      `🔌 *Porta:* \`${conta.porta}\`\n` +
                      `👤 *Utilizador:* \`${conta.user}\`\n` +
                      `🔑 *Senha:* \`${conta.pass}\`\n\n` +
                      `🌐 *SNI (toque para copiar):*\n\`${sni}\``;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    }
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, '📞 Contacte o administrador para suporte.');
    }

    bot.answerCallbackQuery(query.id);
});
