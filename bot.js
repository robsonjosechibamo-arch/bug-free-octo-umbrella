const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Token inserido conforme solicitado
const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg';
const bot = new TelegramBot(TOKEN);

// Configuração do Webhook para o Render
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Servidor HTTP para manter o Render ativo
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
                [{ text: '📂 Gerar Arquivo Payload (DarkTunnel)', callback_data: 'gerar_payload' }],
                [{ text: '🛡️ Gerar Arquivo SNI (DarkTunnel)', callback_data: 'gerar_sni' }],
                [{ text: '📞 Contactos de Suporte', callback_data: 'suporte' }]
            ]
        }
    };

    bot.sendMessage(chatId, '🤖 *Painel DarkTunnel HSS*\n\nEscolha o tipo de configuração:', { parse_mode: 'Markdown', ...menuTeclado });
});

// --- PROCESSAMENTO DOS BOTÕES E GERAÇÃO DOS ARQUIVOS COMPATÍVEIS ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    // Credenciais fixas do servidor
    const servidorIP = "45.134.9.133";
    const servidorPorta = 443;
    const usuarioSSH = "u5816912004";
    const senhaSSH = "Robson654";

    if (acao === 'gerar_payload') {
        bot.sendMessage(chatId, '⚙️ A gerar configuração com Payload estruturada...');

        const configPayload = {
            version: 2,
            profile_name: "Payload MyMuz",
            mode: "direct",
            server: servidorIP,
            port: servidorPorta,
            username: usuarioSSH,
            password: senhaSSH,
            sni: "",
            payload: "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]",
            dns: "8.8.8.8",
            udp_forward: false
        };

        const jsonStr = JSON.stringify(configPayload, null, 2);
        const nomeArquivo = 'Payload_DarkTunnel.dtun';

        fs.writeFileSync(nomeArquivo, jsonStr);
        bot.sendDocument(chatId, nomeArquivo, { caption: '✅ Arquivo com Payload gerado com sucesso! Pronto para importar no DarkTunnel.' }).then(() => {
            fs.unlinkSync(nomeArquivo);
        });
    } 
    else if (acao === 'gerar_sni') {
        bot.sendMessage(chatId, '🛡️ A gerar configuração com SNI estruturada...');

        const configSni = {
            version: 2,
            profile_name: "SNI MyMuz",
            mode: "sni",
            server: servidorIP,
            port: servidorPorta,
            username: usuarioSSH,
            password: senhaSSH,
            sni: "mymuze.vm.co.mz",
            payload: "",
            dns: "8.8.8.8",
            udp_forward: false
        };

        const jsonStr = JSON.stringify(configSni, null, 2);
        const nomeArquivo = 'SNI_MyMuz_DarkTunnel.dtun';

        fs.writeFileSync(nomeArquivo, jsonStr);
        bot.sendDocument(chatId, nomeArquivo, { caption: '✅ Arquivo SNI (`mymuze.vm.co.mz`) gerado com sucesso! Pronto para importar no DarkTunnel.' }).then(() => {
            fs.unlinkSync(nomeArquivo);
        });
    }
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, '📞 Para suporte técnico, contacte o administrador.');
    }

    bot.answerCallbackQuery(query.id);
});

console.log('Bot DarkTunnel atualizado e rodando com sucesso!');
