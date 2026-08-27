const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// Substitua SEU_TOKEN_AQUI pelo seu token do BotFather (mantenha as aspas)
const TOKEN = '8813967882:AAEHIXyiZHLMcy6hHHYK51HInzB_zE4yqLw; 
const bot = new TelegramBot(TOKEN, { polling: true });

const SNI_PADRAO = 'd35a8meha201do.cloudfront.net';

function gerarArquivoDark(sni, dias = 30) {
  const config = {
    name: `MyMuz_${dias}D`,
    sni: sni,
    payload: `GET / HTTP/1.1[crlf]Host: ${sni}[crlf]Upgrade: websocket[crlf][crlf]`,
    mode: "SSL_PAYLOAD",
    server: "127.0.0.1",
    port: "80"
  };
  
  const jsonStr = JSON.stringify(config);
  const base64Data = Buffer.from(jsonStr).toString('base64');
  const fileName = `mymuz_${dias}dias.dark`;
  
  fs.writeFileSync(fileName, base64Data);
  return fileName;
}

bot.onText(/\/start|\/menu/, (msg) => {
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Gerar Arquivo MyMuz (.dark)', callback_data: 'gerar_dark' }],
        [{ text: '👤 Criar Conta Premium', callback_data: 'criar_conta' }],
        [{ text: '📞 Suporte', callback_data: 'suporte' }]
      ]
    }
  };
  bot.sendMessage(chatId, '🤖 *Bem-vindo ao Bot MyMuz!*\nEscolha uma opção no menu abaixo:', { parse_mode: 'Markdown', ...opts });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  
  if (query.data === 'gerar_dark') {
    const arquivo = gerarArquivoDark(SNI_PADRAO, 30);
    await bot.sendDocument(chatId, arquivo, {
      caption: `✅ *Arquivo MyMuz Gerado com Sucesso!*\n\n🔹 *SNI:* \`${SNI_PADRAO}\`\n🔹 *Validade:* 30 Dias\n\nImporte o arquivo direto no aplicativo Dark Tunnel.`,
      parse_mode: 'Markdown'
    });
    if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
  } else if (query.data === 'criar_conta') {
    bot.sendMessage(chatId, '🔑 Para criar uma conta premium, entre em contato com o suporte.');
  } else if (query.data === 'suporte') {
    bot.sendMessage(chatId, '💬 Suporte técnico disponível. Envie sua dúvida aqui!');
  }
});
