const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

// --- COLOCA AQUI O TEU ID DE TELEGRAM ---
const ADMIN_ID = 8695108674; // Substitui pelo teu ID numérico real

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
        res.end('Bot DarkTunnel Online!\n');
    }
});

server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Listas de servidores
let servidoresGratis = [
    { ip: "45.134.9.133", porta: "443", user: "u5816912004", pass: "Robson654", validade: "3 Dias" }
];

let servidoresVip30Dias = [];

// --- COMANDO ADICIONAR GRÁTIS (APENAS ADMIN) ---
bot.onText(/\/addgratis (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== ADMIN_ID) {
        return bot.sendMessage(chatId, '❌ Não tens permissão para usar este comando!');
    }

    const dados = match[1].split(' ');
    if (dados.length < 5) {
        return bot.sendMessage(chatId, '❌ Formato errado!\nUse: `/addgratis IP PORTA UTILIZADOR SENHA VALIDADE`', { parse_mode: 'Markdown' });
    }

    const conta = { ip: dados[0], porta: dados[1], user: dados[2], pass: dados[3], validade: dados[4] };
    servidoresGratis.push(conta);
    bot.sendMessage(chatId, `✅ Conta GRÁTIS adicionada!\nTotal grátis: *${servidoresGratis.length}*`, { parse_mode: 'Markdown' });
});

// --- COMANDO ADICIONAR VIP (APENAS ADMIN) ---
bot.onText(/\/addvip (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (userId !== ADMIN_ID) {
        return bot.sendMessage(chatId, '❌ Não tens permissão para usar este comando!');
    }

    const dados = match[1].split(' ');
    if (dados.length < 4) {
        return bot.sendMessage(chatId, '❌ Formato errado!\nUse: `/addvip IP PORTA UTILIZADOR SENHA`', { parse_mode: 'Markdown' });
    }

    const conta = { ip: dados[0], porta: dados[1], user: dados[2], pass: dados[3], validade: "30 Dias (VIP)" };
    servidoresVip30Dias.push(conta);
    bot.sendMessage(chatId, `💎 Conta VIP (30 Dias) adicionada!\nTotal VIP: *${servidoresVip30Dias.length}*`, { parse_mode: 'Markdown' });
});

// Menu Principal
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const teclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🆓 Servidor Grátis (Payload)', callback_data: 'gratis_payload' }],
                [{ text: '🛡️ Servidor Grátis (SNI Cloudfront)', callback_data: 'gratis_sni_cloudfront' }],
                [{ text: '🌐 Servidor Grátis (SNI Mymuze)', callback_data: 'gratis_sni_mymuze' }],
                [{ text: '💎 Servidor VIP 30 Dias (Pago - 20 MT)', callback_data: 'vip_info' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Painel DarkTunnel HSS*\n\nEscolha uma opção de configuração abaixo:', { parse_mode: 'Markdown', ...teclado });
});

// Processar Botões
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (acao === 'vip_info') {
        const textoVip = `💎 *Servidor VIP - 30 Dias*\n\n` +
                         `• *Preço:* 20 MT\n` +
                         `• *Validade:* 30 Dias de acesso contínuo.\n\n` +
                         `📲 *Como comprar:*\n` +
                         `Faça o pagamento de *20 MT* para o número:\n` +
                         `👉 \`853961088\`\n\n` +
                         `Após pagar, envie o comprovativo para o administrador para receber os seus dados VIP!`;
        
        return bot.sendMessage(chatId, textoVip, { parse_mode: 'Markdown' });
    }

    if (servidoresGratis.length === 0) {
        return bot.sendMessage(chatId, '⚠️ De momento não há servidores grátis disponíveis. Tente mais tarde.');
    }

    const conta = servidoresGratis[servidoresGratis.length - 1];
 

    if (acao === 'gratis_payload') {
        const payload = "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]";

        const texto = `🆓 *Configuração Grátis (Payload)*\n\n` +
                      `🖥️ *Host/IP:* \`${conta.ip}\`\n` +
                      `🔌 *Porta:* \`${conta.porta}\`\n` +
                      `👤 *Utilizador:* \`${conta.user}\`\n` +
                      `🔑 *Senha:* \`${conta.pass}\`\n` +
                      `⏳ *Validade:* \`${conta.validade}\`\n\n` +
                      `📝 *Payload (toque para copiar):*\n\`${payload}\``;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    } 
    else if (acao === 'gratis_sni_cloudfront') {
        const sni = "d35a8meha201do.cloudfront.net";

        const texto = `🛡️ *Configuração Grátis (SNI Cloudfront)*\n\n` +
                      `🖥️ *Host/IP:* \`${conta.ip}\`\n` +
                      `🔌 *Porta:* \`${conta.porta}\`\n` +
                      `👤 *Utilizador:* \`${conta.user}\`\n` +
                      `🔑 *Senha:* \`${conta.pass}\`\n` +
                      `⏳ *Validade:* \`${conta.validade}\`\n\n` +
                      `🌐 *SNI (toque para copiar):*\n\`${sni}\``;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    }
    else if (acao === 'gratis_sni_mymuze') {
        const sni = "mymuze.vm.co.mz";

        const texto = `🌐 *Configuração Grátis (SNI Mymuze)*\n\n` +
                      `🖥️ *Host/IP:* \`${conta.ip}\`\n` +
                      `🔌 *Porta:* \`${conta.porta}\`\n` +
                      `👤 *Utilizador:* \`${conta.user}\`\n` +
                      `🔑 *Senha:* \`${conta.pass}\`\n` +
                      `⏳ *Validade:* \`${conta.validade}\`\n\n` +
                      `🌐 *SNI (toque para copiar):*\n\`${sni}\``;

        bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    }

    bot.answerCallbackQuery(query.id);
});
