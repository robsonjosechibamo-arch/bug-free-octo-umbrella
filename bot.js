const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot online!\n');
});
server.listen(process.env.PORT || 3000);

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TOKEN = '8813967882:AAEHIXyiZHLMcy6hHHYK51HInzB_zE4yqLw';
const bot = new TelegramBot(TOKEN, { polling: true });

// Seu payload exato inserido aqui sem nenhuma alteração
const PAYLOAD_EXATO = "GET http://h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile/ HTTP/1.1[crlf]Host: h.facebook.com/hr/zsh/api?h_token=MTU5NwZDZD&v2=1&cid=1000107557969131740854005636510%2CAT1pB5d8zsxzyvIrl2wv_vTnWB4CP2qYAhGV4NLPXyU_3HbY%2C1740854005&ni=mobile[crlf]Connection: Keep-Alive[crlf]User-Agent: [ua][crlf][crlf]CONNECT [host_port] [protocol][crlf][crlf]";

const SNI_PADRAO = 'h.facebook.com';

function gerarArquivoDark(cargaUtil, sni, dias = 30) {
  const configurazione = {
    nome: `MyMuz_${dias}D`,
    sni: sni,
    "carga útil": cargaUtil,
    modo: "SSL_PAYLOAD",
    servidor: "127.0.0.1",
    porta: "80"
  };

  const jsonStr = JSON.stringify(configurazione);
  const dadosBase46 = Buffer.from(jsonStr).toString('base64');
  const nome_do_arquivo = `mymuz_${dias}dias.dark`;

  fs.writeFileSync(nome_do_arquivo, dadosBase46);
  return nome_do_arquivo;
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Olá! Envie /gerar para criar o seu arquivo Dark Tunnel com o payload personalizado.");
});

bot.onText(/\/gerar/, (msg) => {
  const chatId = msg.chat.id;
  const arquivo = gerarArquivoDark(PAYLOAD_EXATO, SNI_PADRAO, 30);
  
  bot.sendDocument(chatId, arquivo).then(() => {
    fs.unlinkSync(arquivo);
  });
});

console.log('Bot rodando com sucesso!');
