const http = require("http");
const path = require("path");
const pino = require("pino");

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");


// =====================================================
// CONFIGURAÇÕES
// =====================================================

const PORT = process.env.PORT || 3000;

const AUTH_DIR = path.join(
    __dirname,
    "auth_info_baileys"
);


// =====================================================
// SERVIDOR HTTP DO RENDER
// =====================================================

http.createServer((req, res) => {

    res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8"
    });

    res.end(
        "🟢 Teste WhatsApp Baileys funcionando!"
    );

}).listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Servidor ativo na porta ${PORT}`
        );

    }
);


// =====================================================
// INICIAR WHATSAPP
// =====================================================

async function iniciarWhatsApp() {

    console.log("");
    console.log("====================================");
    console.log("🚀 INICIANDO TESTE WHATSAPP");
    console.log("====================================");


    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);


    console.log(
        "🔐 Sessão registrada:",
        state.creds.registered
    );


    const sock = makeWASocket({

        auth: state,

        logger: pino({
            level: "silent"
        }),

        printQRInTerminal: false,

        browser: [
            "Guarda-Chuva Teste",
            "Chrome",
            "1.0.0"
        ]

    });


    // =================================================
    // SALVAR CREDENCIAIS
    // =================================================

    sock.ev.on(
        "creds.update",
        saveCreds
    );


    // =================================================
    // CONEXÃO
    // =================================================

    let codigoSolicitado = false;

    sock.ev.on(
        "connection.update",
        async (update) => {

            console.log(
                "📡 connection.update:",
                JSON.stringify(
                    update,
                    null,
                    2
                )
            );


            const {
                connection,
                lastDisconnect
            } = update;


            // =========================================
            // CONECTANDO
            // =========================================

            if (
                connection === "connecting" &&
                !state.creds.registered &&
                !codigoSolicitado
            ) {

                codigoSolicitado = true;


                const numero =
                    process.env.WA_NUMBER;


                if (!numero) {

                    console.error(
                        "❌ WA_NUMBER não está configurada."
                    );

                    return;
                }


                try {

                    console.log("");
                    console.log(
                        "⏳ WhatsApp está conectando..."
                    );

                    console.log(
                        "⏳ Aguardando 3 segundos..."
                    );


                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                3000
                            )
                    );


                    console.log(
                        "📱 Solicitando código..."
                    );


                    const codigo =
                        await sock.requestPairingCode(
                            numero.replace(
                                /\D/g,
                                ""
                            )
                        );


                    console.log("");
                    console.log(
                        "===================================="
                    );
                    console.log(
                        "📱 CÓDIGO DE PAREAMENTO"
                    );
                    console.log(
                        "===================================="
                    );
                    console.log(codigo);
                    console.log(
                        "===================================="
                    );
                    console.log("");


                } catch (erro) {

                    console.error("");
                    console.error(
                        "❌ ERRO NO PAREAMENTO:"
                    );
                    console.error(
                        erro?.stack ||
                        erro?.message ||
                        erro
                    );
                    console.error("");

                    codigoSolicitado = false;
                }
            }


            // =========================================
            // CONECTADO
            // =========================================

            if (connection === "open") {

                console.log("");
                console.log(
                    "===================================="
                );
                console.log(
                    "🟢 WHATSAPP CONECTADO COM SUCESSO!"
                );
                console.log(
                    "===================================="
                );
                console.log("");

            }


            // =========================================
            // DESCONECTADO
            // =========================================

            if (connection === "close") {

                const codigo =
                    lastDisconnect
                        ?.error
                        ?.output
                        ?.statusCode;


                console.log("");
                console.log(
                    "🔴 WHATSAPP DESCONECTADO"
                );
                console.log(
                    "Código:",
                    codigo
                );
                console.log("");


                if (
                    codigo ===
                    DisconnectReason.loggedOut
                ) {

                    console.log(
                        "🚪 Sessão encerrada."
                    );

                    console.log(
                        "É necessário fazer um novo pareamento."
                    );

                    return;
                }


                console.log(
                    "🔄 Reiniciando conexão em 5 segundos..."
                );


                setTimeout(() => {

                    iniciarWhatsApp()
                        .catch(console.error);

                }, 5000);
            }

        }
    );

}


// =====================================================
// INICIAR
// =====================================================

iniciarWhatsApp().catch(
    erro => {

        console.error(
            "❌ ERRO FATAL:"
        );

        console.error(
            erro
        );

    }
);
