const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

// Token do seu bot
const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

// Configuração do Webhook para o Render
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Servidor HTTP para manter o Render ativo no Render
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

// --- MENU PRINCIPAL /START ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const menuTeclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚙️ Gerar Conta & Payload (DarkTunnel)', callback_data: 'info_payload' }],
                [{ text: '🛡️ Gerar Conta & SNI (DarkTunnel)', callback_data: 'info_sni' }],
                [{ text: '📞 Contactos de Suporte', callback_data: 'suporte' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Painel DarkTunnel HSS*\n\nEscolha o que deseja gerar para copiar e colar no aplicativo:', { parse_mode: 'Markdown', ...menuTeclado });
});

// --- LISTA DE SERVIDORES / CONTAS SSH PARA SORTEAR OU USAR ---
const servidoresDisponiveis = [
    { ip: "45.134.9.133", porta: "443", user: "u5816912004", pass: "Robson654" },
    { ip: "45.134.9.133", porta: "80", user: "u5816912004", pass: "Robson654" }
];

// --- PROCESSAMENTO DOS BOTÕES E ENVIO DOS DADOS EM TEXTO ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    // Seleciona um servidor (pode ser fixo ou aleatório da lista)
    const srv = servidoresDisponiveis[Math.floor(Math.random() * servidoresDisponiveis.length)];

    if (acao === 'info_payload') {
        const payloadTexto = `GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]`;

        const resposta = `⚙️ *Configuração Payload (DarkTunnel)*\n\n` +
                         `🖥️ *Host/IP:* \`${srv.ip}\`\n` +
                         `🔌 *Porta:* \`${srv.porta}\`\n` +
                         `👤 *Utilizador:* \`${srv.user}\`\n` +
                         `🔑 *Senha:* \`${srv.pass}\`\n\n` +
                         `📝 *Payload para copiar:*\n\`${payloadTexto}\``;

        bot.sendMessage(chatId, resposta, { parse_mode: 'Markdown' });
    } 
    else if (acao === 'info_sni') {
        const sniTexto = "mymuze.vm.co.mz";

        const resposta = `🛡️ *Configuração SNI (DarkTunnel)*\n\n` +
                         `🖥️ *Host/IP:* \`${srv.ip}\`\n` +
                         `🔌 *Porta:* \`${srv.porta}\`\n` +
                         `👤 *Utilizador:* \`${srv.user}\`\n` +
                         `🔑 *Senha:* \`${srv.pass}\`\n\n` +
                         `🌐 *SNI para copiar:*\n\`${sniTexto}\``;

        bot.sendMessage(chatId, resposta, { parse_mode: 'Markdown' });
    }
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, '📞 Para suporte técnico, contacte o administrador.');
    }

    bot.answerCallbackQuery(query.id);
});

console.log('Bot de envio de dados em texto rodando com sucesso!');
