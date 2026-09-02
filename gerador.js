const fs = require("fs");
const path = require("path");

/*
=========================================================
GUARDA-CHUVA BOT
GERADOR DE DESAFIOS
=========================================================

Objetivos:
- Gerar desafios aleatórios
- Evitar repetições
- Guardar histórico em dados/usadas.json
- Manter histórico depois de reiniciar o bot
- Não usar limite artificial de quantidade de perguntas
=========================================================
*/

const DATA_DIR = path.join(__dirname, "dados");
const USED_FILE = path.join(DATA_DIR, "usadas.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/*
=========================================================
CARREGAR PERGUNTAS USADAS
=========================================================
*/

let usadas = {};

try {
    if (fs.existsSync(USED_FILE)) {
        const conteudo = fs.readFileSync(
            USED_FILE,
            "utf8"
        );

        if (conteudo.trim()) {
            usadas = JSON.parse(conteudo) || {};
        }
    }
} catch (erro) {
    console.error(
        "⚠️ Não foi possível carregar usadas.json:",
        erro.message
    );

    usadas = {};
}

/*
=========================================================
SALVAR PERGUNTAS USADAS
=========================================================
*/

function salvarUsadas() {
    try {
        fs.writeFileSync(
            USED_FILE,
            JSON.stringify(
                usadas,
                null,
                2
            ),
            "utf8"
        );
    } catch (erro) {
        console.error(
            "❌ Erro ao salvar perguntas usadas:",
            erro.message
        );
    }
}

/*
=========================================================
UTILITÁRIOS
=========================================================
*/

function aleatorio(min, max) {
    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;
}

function escolha(lista) {
    if (!Array.isArray(lista) || !lista.length) {
        throw new Error("Lista vazia.");
    }

    return lista[
        aleatorio(
            0,
            lista.length - 1
        )
    ];
}

function embaralhar(lista) {
    return [...lista].sort(
        () => Math.random() - 0.5
    );
}

function normalizar(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[!?.,;:()[\]{}"'`]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

/*
=========================================================
ANTI-REPETIÇÃO
=========================================================
*/

function novoDesafio(categoria, criar) {

    if (!usadas[categoria]) {
        usadas[categoria] = [];
    }

    let jaUsadas =
        new Set(usadas[categoria]);

    /*
    =====================================================
    TENTAR GERAR UMA PERGUNTA NOVA
    =====================================================
    */

    for (
        let tentativa = 0;
        tentativa < 1000;
        tentativa++
    ) {

        const pergunta = criar();

        if (!pergunta) {
            continue;
        }

        const id =
            pergunta.id ||
            `${categoria}:${normalizar(
                pergunta.pergunta
            )}`;

        if (!jaUsadas.has(id)) {

            pergunta.id = id;

            usadas[categoria].push(id);

            salvarUsadas();

            return pergunta;
        }
    }

    /*
    =====================================================
    CATÁLOGO ESGOTADO
    =====================================================
    */

    console.log(
        `♻️ Categoria "${categoria}" esgotada. Reiniciando ciclo.`
    );

    usadas[categoria] = [];

    salvarUsadas();

    /*
    Gerar novamente depois de limpar o histórico.
    */

    const novaPergunta = criar();

    if (!novaPergunta) {
        throw new Error(
            `Não foi possível gerar uma pergunta para "${categoria}".`
        );
    }

    const novoId =
        novaPergunta.id ||
        `${categoria}:${normalizar(
            novaPergunta.pergunta
        )}`;

    novaPergunta.id = novoId;

    usadas[categoria].push(novoId);

    salvarUsadas();

    return novaPergunta;
}

/*
=========================================================
MATEMÁTICA
=========================================================
*/

function gerarSoma() {

    return novoDesafio(
        "soma",
        () => {

            const a =
                aleatorio(
                    1,
                    999999
                );

            const b =
                aleatorio(
                    1,
                    999999
                );

            return {

                pergunta:
                    `🧮 Quanto é ${a} + ${b}?`,

                resposta:
                    String(a + b),

                id:
                    `soma:${a}:${b}`
            };
        }
    );
}

function gerarSubtracao() {

    return novoDesafio(
        "subtracao",
        () => {

            const a =
                aleatorio(
                    1,
                    999999
                );

            const b =
                aleatorio(
                    1,
                    a
                );

            return {

                pergunta:
                    `🧮 Quanto é ${a} − ${b}?`,

                resposta:
                    String(a - b),

                id:
                    `sub:${a}:${b}`
            };
        }
    );
}

function gerarMultiplicacao() {

    return novoDesafio(
        "multiplicacao",
        () => {

            const a =
                aleatorio(
                    2,
                    9999
                );

            const b =
                aleatorio(
                    2,
                    9999
                );

            return {

                pergunta:
                    `🧮 Quanto é ${a} × ${b}?`,

                resposta:
                    String(a * b),

                id:
                    `mult:${a}:${b}`
            };
        }
    );
}

function gerarDivisao() {

    return novoDesafio(
        "divisao",
        () => {

            const divisor =
                aleatorio(
                    2,
                    9999
                );

            const resultado =
                aleatorio(
                    2,
                    99999
                );

            const dividendo =
                divisor *
                resultado;

            return {

                pergunta:
                    `🧮 Quanto é ${dividendo} ÷ ${divisor}?`,

                resposta:
                    String(resultado),

                id:
                    `div:${dividendo}:${divisor}`
            };
        }
    );
}

function gcd(a, b) {

    while (b) {

        const temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}

function gerarPorcentagem() {

    return novoDesafio(
        "porcentagem",
        () => {

            const p =
                escolha([
                    1,
                    2,
                    5,
                    10,
                    15,
                    20,
                    25,
                    30,
                    40,
                    50,
                    60,
                    75,
                    80,
                    90
                ]);

            const base =
                aleatorio(
                    2,
                    10000
                );

            const divisor =
                gcd(p, 100);

            const total =
                base *
                (100 / divisor);

            const resposta =
                (total * p) / 100;

            return {

                pergunta:
                    `📊 Quanto é ${p}% de ${total}?`,

                resposta:
                    String(resposta),

                id:
                    `pct:${p}:${total}`
            };
        }
    );
}

function gerarPotencia() {

    return novoDesafio(
        "potencia",
        () => {

            const base =
                aleatorio(
                    2,
                    50
                );

            const expoente =
                aleatorio(
                    2,
                    5
                );

            return {

                pergunta:
                    `🔢 Quanto é ${base}^${expoente}?`,

                resposta:
                    String(
                        base ** expoente
                    ),

                id:
                    `pot:${base}:${expoente}`
            };
        }
    );
}

function gerarEquacao() {

    return novoDesafio(
        "equacao",
        () => {

            const x =
                aleatorio(
                    -1000,
                    1000
                );

            const b =
                aleatorio(
                    1,
                    1000
                );

            const resultado =
                x + b;

            return {

                pergunta:
                    `🧠 Resolva:\n\n` +
                    `x + ${b} = ${resultado}\n\n` +
                    `Qual é x?`,

                resposta:
                    String(x),

                id:
                    `eq:${x}:${b}`
            };
        }
    );
}

function gerarSequencia() {

    return novoDesafio(
        "sequencia",
        () => {

            const inicio =
                aleatorio(
                    1,
                    10000
                );

            const passo =
                aleatorio(
                    1,
                    1000
                );

            const valores = [

                inicio,

                inicio + passo,

                inicio + passo * 2,

                inicio + passo * 3
            ];

            const resposta =
                inicio +
                passo * 4;

            return {

                pergunta:
                    `🔢 Complete a sequência:\n\n` +
                    `${valores.join(" → ")} → ?`,

                resposta:
                    String(resposta),

                id:
                    `seq:${inicio}:${passo}`
            };
        }
    );
}

/*
=========================================================
CHARADAS
=========================================================
*/

const charadas = [

    ["Quanto mais se tira, maior fica. O que é?", "Buraco"],
    ["Tem dentes, mas não morde. O que é?", "Pente"],
    ["Tem mãos, mas não bate palmas. O que é?", "Relógio"],
    ["Fica molhada enquanto seca. O que é?", "Toalha"],
    ["Tem pescoço, mas não tem cabeça. O que é?", "Garrafa"],
    ["Sobe e desce, mas fica no mesmo lugar. O que é?", "Escada"],
    ["Corre sem ter pernas. O que é?", "Água"],
    ["Tem cidades, rios e estradas, mas não tem casas. O que é?", "Mapa"],
    ["Tem um olho, mas não consegue ver. O que é?", "Agulha"],
    ["Pode ser quebrado sem ser tocado. O que é?", "Silêncio"],
    ["Tem folhas, mas não é árvore. O que é?", "Livro"],
    ["Tem teclas, mas não abre portas. O que é?", "Teclado"],
    ["Tem pernas, mas não anda. O que é?", "Mesa"],
    ["É seu, mas outras pessoas usam mais que você. O que é?", "Nome"],
    ["Tem cabeça e cauda, mas não tem corpo. O que é?", "Moeda"],
    ["Quanto mais quente fica, mais fresca parece. O que é?", "Sombra"],
    ["Tem uma boca, mas não fala. O que é?", "Rio"],
    ["Tem olhos, mas não vê. O que é?", "Batata"],
    ["Entra na água e não fica molhado. O que é?", "Reflexo"],
    ["Quanto mais cresce, menos se vê. O que é?", "Escuridão"],
    ["Tem asas, mas não voa. O que é?", "Moinho"],
    ["Tem quatro pernas e não consegue andar. O que é?", "Cadeira"],
    ["Pode viajar pelo mundo sem sair do lugar. O que é?", "Selo"],
    ["Tem uma cama, mas nunca dorme. O que é?", "Rio"],
    ["Tem muitas palavras, mas nunca fala. O que é?", "Dicionário"]

];

function gerarCharada() {

    return novoDesafio(
        "charadas",
        () => {

            const item =
                escolha(charadas);

            return {

                pergunta:
                    `🧩 CHARADA\n\n${item[0]}`,

                resposta:
                    item[1],

                id:
                    `charada:${normalizar(item[0])}`
            };
        }
    );
}

/*
=========================================================
VERDADEIRO / FALSO
=========================================================
*/

const verdadeiroFalso = [

    ["A Terra gira em torno do Sol.", "V"],
    ["O Sol é um planeta.", "F"],
    ["Moçambique fica em África.", "V"],
    ["Um triângulo possui quatro lados.", "F"],
    ["A Lua é um satélite natural da Terra.", "V"],
    ["O número 2 é ímpar.", "F"],
    ["A água é composta por hidrogénio e oxigénio.", "V"],
    ["O Brasil fica em África.", "F"],
    ["Uma hora possui 60 minutos.", "V"],
    ["Uma semana possui 10 dias.", "F"],
    ["O gelo é água no estado sólido.", "V"],
    ["A baleia é um mamífero.", "V"],
    ["Um quilómetro possui 1000 metros.", "V"],
    ["Marte é conhecido como Planeta Vermelho.", "V"],
    ["O oxigénio é um metal.", "F"],
    ["A Terra possui um satélite natural conhecido como Lua.", "V"],
    ["O Japão fica na Europa.", "F"],
    ["O número 10 é maior que o número 5.", "V"],
    ["O Sol é uma estrela.", "V"],
    ["A água ferve normalmente a 100 °C ao nível do mar.", "V"],
    ["Um quadrado possui três lados.", "F"],
    ["O continente africano é atravessado pelo Equador.", "V"],
    ["Mercúrio é o planeta mais próximo do Sol.", "V"],
    ["A baleia é um peixe.", "F"],
    ["O ser humano adulto normalmente possui 206 ossos.", "V"]

];

function gerarVerdadeiroFalso() {

    return novoDesafio(
        "verdadeiro_falso",
        () => {

            const item =
                escolha(
                    verdadeiroFalso
                );

            return {

                pergunta:
                    `✅ VERDADEIRO OU FALSO\n\n` +
                    `${item[0]}`,

                resposta:
                    item[1],

                opcoes: [
                    "V",
                    "F"
                ],

                id:
                    `vf:${normalizar(item[0])}`
            };
        }
    );
}

/*
=========================================================
QUIZ
=========================================================
*/

function opcoesQuiz(resposta, alternativas) {

    const lista = [
        String(resposta),
        ...alternativas.map(String)
    ];

    const unicas = [];

    for (const item of lista) {

        if (!unicas.includes(item)) {
            unicas.push(item);
        }
    }

    return embaralhar(
        unicas.slice(0, 4)
    );
}

function numeroDiferente(valor, distancia = 1) {

    let novo;

    do {

        novo =
            valor +
            aleatorio(
                -Math.max(10, distancia),
                Math.max(10, distancia)
            );

    } while (novo === valor);

    return novo;
}

function quizMatematica() {

    const tipo =
        aleatorio(1, 4);

    if (tipo === 1) {

        const a =
            aleatorio(10, 9999);

        const b =
            aleatorio(10, 9999);

        const resposta =
            a + b;

        return {

            pergunta:
                `🧮 Quanto é ${a} + ${b}?`,

            resposta:
                String(resposta),

            opcoes:
                opcoesQuiz(
                    resposta,
                    [
                        numeroDiferente(resposta, 20),
                        numeroDiferente(resposta, 50),
                        numeroDiferente(resposta, 100)
                    ]
                ),

            id:
                `quiz-soma:${a}:${b}`
        };
    }

    if (tipo === 2) {

        const a =
            aleatorio(100, 9999);

        const b =
            aleatorio(1, a);

        const resposta =
            a - b;

        return {

            pergunta:
                `🧮 Quanto é ${a} − ${b}?`,

            resposta:
                String(resposta),

            opcoes:
                opcoesQuiz(
                    resposta,
                    [
                        numeroDiferente(resposta, 15),
                        numeroDiferente(resposta, 30),
                        numeroDiferente(resposta, 60)
                    ]
                ),

            id:
                `quiz-sub:${a}:${b}`
        };
    }

    if (tipo === 3) {

        const a =
            aleatorio(2, 100);

        const b =
            aleatorio(2, 50);

        const resposta =
            a * b;

        return {

            pergunta:
                `🧮 Quanto é ${a} × ${b}?`,

            resposta:
                String(resposta),

            opcoes:
                opcoesQuiz(
                    resposta,
                    [
                        numeroDiferente(resposta, 10),
                        numeroDiferente(resposta, 20),
                        numeroDiferente(resposta, 40)
                    ]
                ),

            id:
                `quiz-mult:${a}:${b}`
        };
    }

    const a =
        aleatorio(2, 30);

    const b =
        aleatorio(2, 5);

    const resposta =
        a ** b;

    return {

        pergunta:
            `🔢 Quanto é ${a}^${b}?`,

        resposta:
            String(resposta),

        opcoes:
            opcoesQuiz(
                resposta,
                [
                    numeroDiferente(resposta, 5),
                    numeroDiferente(resposta, 10),
                    numeroDiferente(resposta, 20)
                ]
            ),

        id:
            `quiz-pot:${a}:${b}`
    };
}

function quizSequencia() {

    const inicio =
        aleatorio(1, 1000);

    const passo =
        aleatorio(2, 100);

    const a = inicio;
    const b = inicio + passo;
    const c = inicio + passo * 2;
    const d = inicio + passo * 3;

    const resposta =
        inicio + passo * 4;

    return {

        pergunta:
            `🔢 Qual número completa a sequência?\n\n` +
            `${a} → ${b} → ${c} → ${d} → ?`,

        resposta:
            String(resposta),

        opcoes:
            opcoesQuiz(
                resposta,
                [
                    resposta + passo,
                    resposta - passo,
                    resposta + passo * 2
                ]
            ),

        id:
            `quiz-seq:${inicio}:${passo}`
    };
}

function quizPorcentagem() {

    const porcentagens = [
        5,
        10,
        20,
        25,
        50,
        75
    ];

    const p =
        escolha(porcentagens);

    const base =
        aleatorio(2, 1000);

    const total =
        base * (100 / gcd(p, 100));

    const resposta =
        (total * p) / 100;

    return {

        pergunta:
            `📊 Quanto é ${p}% de ${total}?`,

        resposta:
            String(resposta),

        opcoes:
            opcoesQuiz(
                resposta,
                [
                    resposta + base,
                    Math.max(0, resposta - base),
                    resposta + base * 2
                ]
            ),

        id:
            `quiz-pct:${p}:${total}`
    };
}

/*
=========================================================
CIÊNCIA
=========================================================
*/

const quizCiencia = [

    [
        "Qual é a fórmula química da água?",
        "H2O",
        ["CO2", "O2", "NaCl"]
    ],

    [
        "Qual gás os seres humanos precisam para respirar?",
        "Oxigénio",
        ["Hidrogénio", "Hélio", "Azoto"]
    ],

    [
        "Qual órgão bombeia o sangue pelo corpo?",
        "Coração",
        ["Pulmão", "Fígado", "Estômago"]
    ],

    [
        "Qual é o planeta conhecido como Planeta Vermelho?",
        "Marte",
        ["Vénus", "Júpiter", "Mercúrio"]
    ],

    [
        "Qual é a estrela no centro do Sistema Solar?",
        "Sol",
        ["Lua", "Sirius", "Marte"]
    ],

    [
        "Qual é o satélite natural da Terra?",
        "Lua",
        ["Sol", "Marte", "Vénus"]
    ],

    [
        "Qual animal é um mamífero?",
        "Baleia",
        ["Tubarão", "Sardinha", "Polvo"]
    ],

    [
        "Qual estado da água é representado pelo gelo?",
        "Sólido",
        ["Líquido", "Gasoso", "Plasma"]
    ]

];

function quizDeCiencia() {

    const item =
        escolha(quizCiencia);

    return {

        pergunta:
            `🔬 CIÊNCIA\n\n${item[0]}`,

        resposta:
            item[1],

        opcoes:
            embaralhar([
                item[1],
                ...item[2]
            ]),

        id:
            `quiz-ciencia:${normalizar(item[0])}`
    };
}

/*
=========================================================
GEOGRAFIA
=========================================================
*/

const quizGeografia = [

    [
        "Qual é a capital de Moçambique?",
        "Maputo",
        ["Beira", "Nampula", "Quelimane"]
    ],

    [
        "Em que continente fica Moçambique?",
        "África",
        ["Ásia", "Europa", "América"]
    ],

    [
        "Qual é o maior oceano da Terra?",
        "Pacífico",
        ["Atlântico", "Índico", "Ártico"]
    ],

    [
        "Qual é o maior continente?",
        "Ásia",
        ["África", "Europa", "Oceânia"]
    ],

    [
        "Qual país tem o português como língua oficial?",
        "Brasil",
        ["Japão", "Egito", "Índia"]
    ],

    [
        "Qual é a capital de Portugal?",
        "Lisboa",
        ["Porto", "Madrid", "Paris"]
    ],

    [
        "Qual continente é atravessado pelo Equador?",
        "África",
        ["Europa", "Antártida", "Oceânia"]
    ]

];

function quizDeGeografia() {

    const item =
        escolha(quizGeografia);

    return {

        pergunta:
            `🌍 GEOGRAFIA\n\n${item[0]}`,

        resposta:
            item[1],

        opcoes:
            embaralhar([
                item[1],
                ...item[2]
            ]),

        id:
            `quiz-geografia:${normalizar(item[0])}`
    };
}

/*
=========================================================
CONHECIMENTOS GERAIS
=========================================================
*/

const quizGeral = [

    [
        "Quantos dias tem uma semana?",
        "7",
        ["5", "6", "8"]
    ],

    [
        "Quantos meses tem um ano?",
        "12",
        ["10", "11", "13"]
    ],

    [
        "Quantos minutos tem uma hora?",
        "60",
        ["30", "45", "90"]
    ],

    [
        "Qual animal é conhecido como rei da selva?",
        "Leão",
        ["Tigre", "Elefante", "Lobo"]
    ],

    [
        "Qual é o maior mamífero do mundo?",
        "Baleia-azul",
        ["Elefante", "Girafa", "Hipopótamo"]
    ],

    [
        "Qual objeto usamos para saber as horas?",
        "Relógio",
        ["Bússola", "Tesoura", "Martelo"]
    ]

];

function quizDeConhecimentosGerais() {

    const item =
        escolha(quizGeral);

    return {

        pergunta:
            `📚 CONHECIMENTOS GERAIS\n\n${item[0]}`,

        resposta:
            item[1],

        opcoes:
            embaralhar([
                item[1],
                ...item[2]
            ]),

        id:
            `quiz-geral:${normalizar(item[0])}`
    };
}

/*
=========================================================
GERADOR PRINCIPAL DO QUIZ
=========================================================
*/

function gerarQuiz() {

    return novoDesafio(
        "quiz",
        () => {

            const tipo =
                aleatorio(1, 7);

            switch (tipo) {

                case 1:
                    return quizMatematica();

                case 2:
                    return quizMatematica();

                case 3:
                    return quizSequencia();

                case 4:
                    return quizPorcentagem();

                case 5:
                    return quizDeCiencia();

                case 6:
                    return quizDeGeografia();

                case 7:
                    return quizDeConhecimentosGerais();

                default:
                    return quizMatematica();
            }
        }
    );
}

/*
=========================================================
ADIVINHE A PALAVRA
=========================================================
*/

const palavras = [

    ["Animal que mia.", "Gato"],
    ["Animal conhecido por latir.", "Cão"],
    ["Planeta onde vivemos.", "Terra"],
    ["Fruta amarela muito conhecida.", "Banana"],
    ["Lugar onde estudamos.", "Escola"],
    ["Objeto usado para escrever.", "Caneta"],
    ["Objeto usado para saber as horas.", "Relógio"],
    ["Veículo com duas rodas e pedais.", "Bicicleta"],
    ["Móvel usado para dormir.", "Cama"],
    ["Objeto usado para abrir uma porta.", "Chave"],
    ["Lugar onde encontramos muitos livros.", "Biblioteca"],
    ["Objeto que protege da chuva.", "Guarda-chuva"],
    ["Animal que produz leite.", "Vaca"],
    ["Fruta geralmente vermelha e pequena.", "Morango"],
    ["Objeto usado para cortar papel.", "Tesoura"],
    ["Objeto usado para apagar o que foi escrito a lápis.", "Borracha"],
    ["Lugar onde compramos medicamentos.", "Farmácia"],
    ["Veículo que circula sobre trilhos.", "Comboio"],
    ["Animal conhecido por ter uma tromba.", "Elefante"],
    ["Fruta tropical de casca verde ou amarela.", "Manga"],
    ["Objeto usado para iluminar no escuro.", "Lanterna"],
    ["Lugar onde os aviões pousam.", "Aeroporto"],
    ["Objeto usado para ouvir música sem alto-falante.", "Fone"],
    ["Animal que vive na água e possui barbatanas.", "Peixe"],
    ["Objeto usado para tirar fotografias.", "Câmara"]

];

function gerarAdivinhePalavra() {

    return novoDesafio(
        "palavras",
        () => {

            const item =
                escolha(palavras);

            return {

                pergunta:
                    `🔤 ADIVINHE A PALAVRA\n\n` +
                    `💡 Dica: ${item[0]}`,

                resposta:
                    item[1],

                id:
                    `palavra:${normalizar(item[0])}`
            };
        }
    );
}

/*
=========================================================
PAR OU ÍMPAR
=========================================================
*/

function gerarParOuImpar() {

    return novoDesafio(
        "par_impar",
        () => {

            const numero =
                aleatorio(
                    1,
                    999999999
                );

            return {

                pergunta:
                    `🔢 O número ${numero} é PAR ou ÍMPAR?`,

                resposta:
                    numero % 2 === 0
                        ? "Par"
                        : "Ímpar",

                id:
                    `parimpar:${numero}`
            };
        }
    );
}

/*
=========================================================
MAIOR / MENOR
=========================================================
*/

function gerarMaiorMenor() {

    return novoDesafio(
        "maior_menor",
        () => {

            const a =
                aleatorio(
                    1,
                    999999999
                );

            let b =
                aleatorio(
                    1,
                    999999999
                );

            while (a === b) {

                b =
                    aleatorio(
                        1,
                        999999999
                    );
            }

            return {

                pergunta:
                    `🎯 Qual é maior: ${a} ou ${b}?`,

                resposta:
                    String(
                        Math.max(
                            a,
                            b
                        )
                    ),

                id:
                    `maior:${a}:${b}`
            };
        }
    );
}

/*
=========================================================
CONVERSÕES
=========================================================
*/

function gerarConversao() {

    return novoDesafio(
        "conversao",
        () => {

            const tipo =
                aleatorio(
                    1,
                    6
                );

            if (tipo === 1) {

                const metros =
                    aleatorio(
                        1,
                        100000
                    );

                return {

                    pergunta:
                        `📏 Quantos centímetros existem em ${metros} metros?`,

                    resposta:
                        String(
                            metros * 100
                        ),

                    id:
                        `cm:${metros}`
                };
            }

            if (tipo === 2) {

                const km =
                    aleatorio(
                        1,
                        100000
                    );

                return {

                    pergunta:
                        `🛣️ Quantos metros existem em ${km} km?`,

                    resposta:
                        String(
                            km * 1000
                        ),

                    id:
                        `m:${km}`
                };
            }

            if (tipo === 3) {

                const horas =
                    aleatorio(
                        1,
                        1000
                    );

                return {

                    pergunta:
                        `⏱️ Quantos minutos existem em ${horas} horas?`,

                    resposta:
                        String(
                            horas * 60
                        ),

                    id:
                        `min:${horas}`
                };
            }

            if (tipo === 4) {

                const kg =
                    aleatorio(
                        1,
                        100000
                    );

                return {

                    pergunta:
                        `⚖️ Quantos gramas existem em ${kg} kg?`,

                    resposta:
                        String(
                            kg * 1000
                        ),

                    id:
                        `g:${kg}`
                };
            }

            if (tipo === 5) {

                const litros =
                    aleatorio(
                        1,
                        100000
                    );

                return {

                    pergunta:
                        `🥤 Quantos mililitros existem em ${litros} litros?`,

                    resposta:
                        String(
                            litros * 1000
                        ),

                    id:
                        `ml:${litros}`
                };
            }

            const minutos =
                aleatorio(
                    1,
                    100000
                );

            return {

                pergunta:
                    `⏱️ Quantos segundos existem em ${minutos} minutos?`,

                resposta:
                    String(
                        minutos * 60
                    ),

                id:
                    `seg:${minutos}`
            };
        }
    );
}

/*
=========================================================
DESAFIO GERAL
=========================================================
*/

function gerarDesafio() {

    const categorias = [

        "soma",
        "subtracao",
        "multiplicacao",
        "divisao",
        "porcentagem",
        "potencia",
        "equacao",
        "sequencia",
        "charada",
        "verdadeiro_falso",
        "quiz",
        "palavras",
        "par_impar",
        "maior_menor",
        "conversao"

    ];

    const categoria =
        escolha(categorias);

    switch (categoria) {

        case "soma":
            return gerarSoma();

        case "subtracao":
            return gerarSubtracao();

        case "multiplicacao":
            return gerarMultiplicacao();

        case "divisao":
            return gerarDivisao();

        case "porcentagem":
            return gerarPorcentagem();

        case "potencia":
            return gerarPotencia();

        case "equacao":
            return gerarEquacao();

        case "sequencia":
            return gerarSequencia();

        case "charada":
            return gerarCharada();

        case "verdadeiro_falso":
            return gerarVerdadeiroFalso();

        case "quiz":
            return gerarQuiz();

        case "palavras":
            return gerarAdivinhePalavra();

        case "par_impar":
            return gerarParOuImpar();

        case "maior_menor":
            return gerarMaiorMenor();

        case "conversao":
            return gerarConversao();

        default:
            return gerarSoma();
    }
}

/*
=========================================================
EXPORTAÇÃO
=========================================================
*/

module.exports = {

    gerarSoma,
    gerarSubtracao,
    gerarMultiplicacao,
    gerarDivisao,
    gerarPorcentagem,
    gerarPotencia,
    gerarEquacao,
    gerarSequencia,
    gerarCharada,
    gerarVerdadeiroFalso,
    gerarQuiz,
    gerarAdivinhePalavra,
    gerarParOuImpar,
    gerarMaiorMenor,
    gerarConversao,
    gerarDesafio,
    embaralhar,

    resetarCategoria(categoria) {

        delete usadas[categoria];

        salvarUsadas();
    }

};
