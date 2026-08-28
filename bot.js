const http = require('http');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = '8887234517:AAFRBZUzlNYlX5SaCx8qHbojAdJGp32YDzg'; // Seu token atual
const bot = new TelegramBot(TOKEN);

// Configuração do Webhook para o Render
const URL = process.env.RENDER_EXTERNAL_URL || 'https://bug-free-octo-umbrella-1.onrender.com';
bot.setWebHook(`${URL}/bot${TOKEN}`);

// Servidor HTTP para manter a porta do Render aberta
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

// --- COMANDO /START COM OS BOTÃES DO MENU ---
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

// --- AÇÕES QUANDO OS BOTÃES FOREM CLICADOS ---
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const acao = query.data;

    if (acao === 'gerar_arquivo') {
        bot.sendMessage(chatId, 'Gerando o seu arquivo Dark...');
        
        // Exemplo de criação do arquivo
        const nomeArquivo = 'mymuze.vm.co.mz_30dias.dark';
        fs.writeFileSync(nomeArquivo, 'Conteudo da configuracao dark...');

        bot.sendDocument(chatId, nomeArquivo).then(() => {
            fs.unlinkSync(nomeArquivo); // Apaga o arquivo após enviar
        });
    } 
    else if (acao === 'suporte') {
        bot.sendMessage(chatId, 'Para suporte, entre em contacto com o administrador.');
    }
    else if (acao === 'criar_conta') {
        bot.sendMessage(chatId, 'Envie o comando no formato: /criar_usuario <nome>');
    }
    
    // Responde o aviso de clique do botão no Telegram
    bot.answerCallbackQuery(query.id);
});

console.log('Bot rodando com sucesso com os botões do menu!');
