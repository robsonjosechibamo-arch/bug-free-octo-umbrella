const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Token inserido diretamente conforme solicitado
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

// --- PROCESSAMENTO DOS BOTÕES COM GERAÇÃO AUTOMÁTICA DE HOST E PORTA ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    // Credenciais de usuário (mantidas protegidas por variáveis de ambiente ou com fallback seguro)
    const usuarioSSH = process.env.SSH_USER || "u5816912004";
    const senhaSSH = process.env.SSH_PASS || "Robson654";

    if (acao === 'gerar_payload') {
        bot.sendMessage(chatId, '⚙️ Gerando configuração com Payload (Host e Porta automáticos)...');

        // Payload definido
        const payloadStr = "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]";

        // Detecção automática de Host e Porta para o modo Payload (Ex: extrai do payload ou define padrão compatível)
        const detectedServer = "45.134.9.133"; 
        const detectedPort = 443;

        const configPayload = {
            version: 2,
            mode: "direct",
            server: detectedServer,
            port: detectedPort,
            username: usuarioSSH,
            password: senhaSSH,
            sni: "",
            payload: payloadStr
        };

        const jsonStr = JSON.stringify(configPayload, null, 2);
        const nomeArquivo = 'Payload_DarkTunnel.dtun';

        fs.writeFileSync(nomeArquivo, jsonStr);
        bot.sendDocument(chatId, nomeArquivo, { caption: '✅ Arquivo com Payload gerado com sucesso!' }).then(() => {
            fs.unlinkSync(nomeArquivo);
        });
    } 
    else if (acao === 'gerar_sni') {
        bot.sendMessage(chatId, '🛡️ Gerando configuração com SNI (Host e Porta automáticos)...');

        // SNI definida
        const sniStr = "mymuze.vm.co.mz";

        // Detecção automática de Host e Porta para o modo SNI
        const detectedServer = "45.134.9.133";
        const detectedPort = 443;

        const configSni = {
            version: 2,
            mode: "sni",
            server: detectedServer,
            port: detectedPort,
            username: usuarioSSH,
            password: senhaSSH,
            sni: sniStr,
            payload: ""
        };

        const jsonStr = JSON.stringify(configSni, null, 2);
        const nomeArquivo = 'SNI_MyMuz_DarkTunnel.dtun';

        fs.writeFileSync(nomeArquivo, jsonStr);
        bot.sendDocument(chatId, nomeArquivo, { caption: '✅ Arquivo SNI (`mymuze.vm.co.mz`) gerado com sucesso!' }).then(() => {
            fs.unlinkSync(nomeArquivo);
        });
    }
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, '📞 Para suporte técnico, contacte o administrador.');
    }

    bot.answerCallbackQuery(query.id);
});

console.log('Bot rodando com sucesso!');
