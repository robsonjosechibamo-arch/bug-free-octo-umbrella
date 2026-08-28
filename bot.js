const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg'; // Cole o seu token atual aqui
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

// --- COMANDO /START COM O MENU DE BOTÕES ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const menuTeclado = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '👤 Criar Conta Premium', callback_data: 'criar_conta' }],
                [{ text: '📂 Gerar Arquivo MyMuz (Dark)', callback_data: 'gerar_arquivo' }],
                [{ text: '📞 Contactos de Suporte', callback_data: 'suporte' }]
            ]
        }
    };

    bot.sendMessage(chatId, 'Menu Principal:', menuTeclado);
});

// --- AÇÕES DOS BOTÕES E GERAÇÃO DO ARQUIVO COM O SEU PAYLOAD ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (acao === 'gerar_arquivo') {
        bot.sendMessage(chatId, 'Gerando o seu arquivo MyMuz...');

        // Estrutura contendo o seu payload exato e a SNI de mymuz
        const configuracao = {
            server_sni: "mymuze.vm.co.mz",
            payload: "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]",
            sni: "h.facebook.com",
            porta: "80"
        };

        const jsonStr = JSON.stringify(configuracao, null, 2);
        const nomeArquivo = 'mymuze.vm.co.mz_30dias.dark';

        // Cria o arquivo no servidor
        fs.writeFileSync(nomeArquivo, jsonStr);

        // Envia o documento para o Telegram e o remove do servidor
        bot.sendDocument(chatId, nomeArquivo).then(() => {
            fs.unlinkSync(nomeArquivo);
        });
    } 
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, 'Para suporte, entre em contacto com o administrador.');
    }
    else if (acao === 'criar_conta') {
        bot.sendMessage(chatId, 'Funcionalidade de criar conta selecionada.');
    }

    bot.answerCallbackQuery(query.id);
});

console.log('Bot rodando com sucesso!');
