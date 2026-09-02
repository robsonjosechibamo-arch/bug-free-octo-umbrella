// =====================================================
// 🤖 IA DO GUARDA-CHUVA BOT - GROQ
// =====================================================

const Groq = require("groq-sdk");

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
    console.warn("⚠️ GROQ_API_KEY não configurada.");
}

const groq = API_KEY
    ? new Groq({ apiKey: API_KEY })
    : null;

const MODELO = "openai/gpt-oss-120b";

// =====================================================
// 💬 RESPONDER PERGUNTAS
// =====================================================

async function responderIA(pergunta, historico = []) {

    if (!groq) {
        throw new Error("GROQ_API_KEY não configurada.");
    }

    const mensagens = [
        {
            role: "system",
            content:
                "Tu és a IA do Guarda-Chuva Bot. " +
                "Responde em português de forma clara, útil e natural. " +
                "Quando necessário, explica passo a passo. " +
                "Não inventes informações. " +
                "Se não souberes algo, diz claramente que não tens certeza."
        },

        ...historico.slice(-10),

        {
            role: "user",
            content: pergunta
        }
    ];

    const resposta = await groq.chat.completions.create({
        model: MODELO,
        messages: mensagens,
        temperature: 0.7,
        max_completion_tokens: 1500
    });

    return (
        resposta.choices?.[0]?.message?.content ||
        "Não consegui gerar uma resposta."
    );
}

// =====================================================
// 🎯 GERAR QUIZ COM IA
// =====================================================

async function gerarQuizIA() {

    if (!groq) {
        throw new Error("GROQ_API_KEY não configurada.");
    }

    const resposta = await groq.chat.completions.create({
        model: MODELO,
        messages: [
            {
                role: "system",
                content:
                    "Gera perguntas de conhecimentos gerais para um jogo de Telegram. " +
                    "A pergunta deve ser verdadeira, clara e interessante. " +
                    "Evita matemática. " +
                    "Cria 4 opções diferentes e apenas uma correta. " +
                    "Responde SOMENTE com JSON válido."
            },
            {
                role: "user",
                content:
                    "Cria uma pergunta nova. " +
                    "Usa temas variados como ciência, história, geografia, " +
                    "animais, tecnologia, espaço, cultura e curiosidades. " +
                    "Não repitas perguntas comuns."
            }
        ],
        temperature: 0.9,
        max_completion_tokens: 600,
        response_format: {
            type: "json_object"
        }
    });

    const texto =
        resposta.choices?.[0]?.message?.content;

    if (!texto) {
        throw new Error("A IA não retornou uma pergunta.");
    }

    const dados = JSON.parse(texto);

    if (
        !dados.pergunta ||
        !Array.isArray(dados.opcoes) ||
        dados.opcoes.length !== 4 ||
        !Number.isInteger(dados.resposta)
    ) {
        throw new Error("Formato de pergunta inválido.");
    }

    if (
        dados.resposta < 0 ||
        dados.resposta > 3
    ) {
        throw new Error("Resposta inválida.");
    }

    return {
        pergunta:
            `🌍 QUIZ IA\n\n${dados.pergunta}`,

        opcoes:
            dados.opcoes.map(String),

        resposta:
            String(dados.opcoes[dados.resposta]),

        explicacao:
            dados.explicacao
                ? String(dados.explicacao)
                : "",

        id:
            `ia_quiz:${Date.now()}`
    };
}

// =====================================================
// ✅ VERDADEIRO / FALSO COM IA
// =====================================================

async function gerarVerdadeiroFalsoIA() {

    if (!groq) {
        throw new Error("GROQ_API_KEY não configurada.");
    }

    const resposta = await groq.chat.completions.create({
        model: MODELO,
        messages: [
            {
                role: "system",
                content:
                    "Gera perguntas de Verdadeiro ou Falso " +
                    "para um jogo de conhecimentos gerais. " +
                    "Evita matemática. " +
                    "A afirmação deve ser verificável e clara. " +
                    "Responde SOMENTE com JSON válido."
            },
            {
                role: "user",
                content:
                    "Cria uma afirmação nova sobre ciência, história, " +
                    "geografia, animais, tecnologia, espaço ou cultura."
            }
        ],
        temperature: 0.9,
        max_completion_tokens: 400,
        response_format: {
            type: "json_object"
        }
    });

    const texto =
        resposta.choices?.[0]?.message?.content;

    if (!texto) {
        throw new Error("A IA não retornou a pergunta.");
    }

    const dados = JSON.parse(texto);

    const valor =
        String(dados.resposta || "")
            .trim()
            .toUpperCase();

    if (
        !dados.pergunta ||
        !["V", "F"].includes(valor)
    ) {
        throw new Error("Formato de Verdadeiro/Falso inválido.");
    }

    return {
        pergunta:
            `🤖 VERDADEIRO OU FALSO IA\n\n${dados.pergunta}`,

        opcoes: [
            "V",
            "F"
        ],

        resposta: valor,

        explicacao:
            dados.explicacao
                ? String(dados.explicacao)
                : "",

        id:
            `ia_vf:${Date.now()}`
    };
}

module.exports = {
    responderIA,
    gerarQuizIA,
    gerarVerdadeiroFalsoIA
};
