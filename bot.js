const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

// Configuração do Webhook para o Render
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';
bot.setWebHook(`${URL}/bot${TOKEN}`);

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

// --- FUNÇÃO PARA GERAR DADOS DINÂMICOS E ALEATÓRIOS ---
function gerarContaAleatoria() {
    // Lista de IPs de servidores base (podes adicionar quantos quiseres aqui)
    const baseIPs = [
        "45.134.9.133",
        "185.199.108.153",
        "104.21.65.22",
        "190.92.210.11"
    ];

    // Portas comuns para túnel
    const portas = ["443", "80", "8080", "22", "8443"];

    // Gerar username e senha automáticos
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const userGerado = `hss_user_${randomNum}`;
    const passGerada = `pass_${Math.random().toString(36.substring(2, 8))}`;
    
    // Escolher IP e porta aleatórios
    const ipEscolhido = baseIPs[Math.floor(Math.random() * baseIPs.length)];
    const portaEscolhida = portas[Math.floor(Math.random() * portas.length)];

    return {
        ip: ipEscolhido,
        porta: portaEscolhida,
        user: userGerado,
        pass: passGerada
    };
}

// --- MENU PRINCIPAL /START ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const menuTeclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '⚙️ Gerar Nova Conta & Payload', callback_data: 'gerar_novo_payload' }],
                [{ text: '🛡️ Gerar Nova Conta & SNI', callback_data: 'gerar_novo_sni' }],
                [{ text: '📞 Contactos de Suporte', callback_data: 'suporte' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Painel DarkTunnel HSS*\n\nClique abaixo para gerar dados dinâmicos e contas automáticas:', { parse_mode: 'Markdown', ...menuTeclado });
});

// --- PROCESSAMENTO DOS BOTÕES ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    // Gera uma nova conta totalmente aleatória a cada clique
    const novaConta = gerarContaAleatoria();

    if (acao === 'gerar_novo_payload') {
        const payloadTexto = "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]";

        const resposta = `⚙️ *Nova Conta Payload Gerada*\n\n` +
                         `🖥️ *Host/IP:* \`${novaConta.ip}\`\n` +
                         `🔌 *Porta:* \`${novaConta.porta}\`\n` +
                         `👤 *Utilizador:* \`${novaConta.user}\`\n` +
                         `🔑 *Senha:* \`${novaConta.pass}\`\n\n` +
                         `📝 *Payload (toque para copiar):*\n\`${payloadTexto}\``;

        bot.sendMessage(chatId, resposta, { parse_mode: 'Markdown' });
    } 
    else if (acao === 'gerar_novo_sni') {
        const sniTexto = "mymuze.vm.co.mz";

        const resposta = `🛡️ *Nova Conta SNI Gerada*\n\n` +
                         `🖥️ *Host/IP:* \`${novaConta.ip}\`\n` +
                         `🔌 *Porta:* \`${novaConta.porta}\`\n` +
                         `👤 *Utilizador:* \`${novaConta.user}\`\n` +
                         `🔑 *Senha:* \`${novaConta.pass}\`\n\n` +
                         `🌐 *SNI (toque para copiar):*\n\`${sniTexto}\``;

        bot.sendMessage(chatId, resposta, { parse_mode: 'Markdown' });
    }
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, '📞 Para suporte técnico, contacte o administrador.');
    }

    bot.answerCallbackQuery(query.id);
});

console.log('Bot gerador de contas dinâmicas rodando!');
