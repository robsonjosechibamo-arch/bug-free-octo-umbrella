const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "dados");
const USED_FILE = path.join(DATA_DIR, "usadas.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let usadas = {};

try {
    if (fs.existsSync(USED_FILE)) {
        usadas = JSON.parse(
            fs.readFileSync(USED_FILE, "utf8")
        ) || {};
    }
} catch {
    usadas = {};
}

function salvarUsadas() {
    fs.writeFileSync(
        USED_FILE,
        JSON.stringify(usadas, null, 2),
        "utf8"
    );
}

function aleatorio(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function escolha(lista) {
    return lista[
        aleatorio(0, lista.length - 1)
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
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[!?.,;:()[\]{}"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/*
=========================================================
SISTEMA ANTI-REPETIÇÃO
=========================================================
*/

function novoDesafio(categoria, criar) {

    if (!usadas[categoria]) {
        usadas[categoria] = [];
    }

    const jaUsadas = new Set(
        usadas[categoria]
    );

    for (let tentativa = 0; tentativa < 500; tentativa++) {

        const pergunta = criar();

        if (!pergunta) continue;

        const id =
            pergunta.id ||
            `${categoria}:${normalizar(
                pergunta.pergunta
            )}`;

        if (!jaUsadas.has(id)) {

            pergunta.id = id;

            usadas[categoria].push(id);

            if (
                usadas[categoria].length >
                100000
            ) {
                usadas[categoria] =
                    usadas[categoria].slice(-80000);
            }

            salvarUsadas();

            return pergunta;
        }
    }

    throw new Error(
        `Não foi possível criar um novo desafio em ${categoria}.`
    );
}

/*
=========================================================
MATEMÁTICA
=========================================================
*/

function gerarSoma() {

    return novoDesafio("soma", () => {

        const a = aleatorio(1, 9999);
        const b = aleatorio(1, 9999);

        return {
            pergunta:
                `🧮 Quanto é ${a} + ${b}?`,

            resposta:
                String(a + b),

            id:
                `soma:${a}:${b}`
        };
    });
}


function gerarSubtracao() {

    return novoDesafio("subtracao", () => {

        const a = aleatorio(50, 9999);
        const b = aleatorio(1, a);

        return {
            pergunta:
                `🧮 Quanto é ${a} − ${b}?`,

            resposta:
                String(a - b),

            id:
                `sub:${a}:${b}`
        };
    });
}


function gerarMultiplicacao() {

    return novoDesafio("multiplicacao", () => {

        const a = aleatorio(2, 200);
        const b = aleatorio(2, 200);

        return {
            pergunta:
                `🧮 Quanto é ${a} × ${b}?`,

            resposta:
                String(a * b),

            id:
                `mult:${a}:${b}`
        };
    });
}


function gerarDivisao() {

    return novoDesafio("divisao", () => {

        const divisor = aleatorio(2, 50);
        const resultado = aleatorio(2, 500);

        const dividendo =
            divisor * resultado;

        return {
            pergunta:
                `🧮 Quanto é ${dividendo} ÷ ${divisor}?`,

            resposta:
                String(resultado),

            id:
                `div:${dividendo}:${divisor}`
        };
    });
}


function gerarPorcentagem() {

    return novoDesafio("porcentagem", () => {

        const percentagens =
            [5, 10, 15, 20, 25, 30, 40, 50, 75];

        const p = escolha(percentagens);

        const base = aleatorio(2, 200);

        const total =
            base * (100 / gcd(p, 100));

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
    });
}


function gcd(a, b) {

    while (b) {
        const temp = b;
        b = a % b;
        a = temp;
    }

    return a;
}


function gerarPotencia() {

    return novoDesafio("potencia", () => {

        const base = aleatorio(2, 15);
        const expoente = aleatorio(2, 4);

        return {
            pergunta:
                `🔢 Quanto é ${base}^${expoente}?`,

            resposta:
                String(base ** expoente),

            id:
                `pot:${base}:${expoente}`
        };
    });
}


function gerarEquacao() {

    return novoDesafio("equacao", () => {

        const x = aleatorio(-30, 100);
        const b = aleatorio(1, 50);

        const resultado = x + b;

        return {
            pergunta:
                `🧠 Resolva:\n\nx + ${b} = ${resultado}\n\nQual é x?`,

            resposta:
                String(x),

            id:
                `eq:${x}:${b}`
        };
    });
}


function gerarSequencia() {

    return novoDesafio("sequencia", () => {

        const inicio = aleatorio(1, 100);
        const passo = aleatorio(2, 30);

        const valores = [
            inicio,
            inicio + passo,
            inicio + passo * 2,
            inicio + passo * 3
        ];

        const resposta =
            inicio + passo * 4;

        return {
            pergunta:
                `🔢 Complete a sequência:\n\n` +
                `${valores.join(" → ")} → ?`,

            resposta:
                String(resposta),

            id:
                `seq:${inicio}:${passo}`
        };
    });
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

    ["Tem cabeça e cauda, mas não tem corpo. O que é?", "Moeda"]

];


function gerarCharada() {

    return novoDesafio("charadas", () => {

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
    });
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

    ["O oxigénio é um metal.", "F"]

];


function gerarVerdadeiroFalso() {

    return novoDesafio(
        "verdadeiro_falso",
        () => {

            const item =
                escolha(verdadeiroFalso);

            return {

                pergunta:
                    `✅ VERDADEIRO OU FALSO\n\n` +
                    `${item[0]}\n\n` +
                    `Responde V ou F.`,

                resposta:
                    item[1],

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

const quiz = [

    [
        "Qual é a capital de Moçambique?",
        "Maputo",
        ["Maputo", "Beira", "Nampula", "Quelimane"]
    ],

    [
        "Qual planeta é conhecido como Planeta Vermelho?",
        "Marte",
        ["Vénus", "Marte", "Júpiter", "Mercúrio"]
    ],

    [
        "Quantos lados tem um hexágono?",
        "6",
        ["5", "6", "7", "8"]
    ],

    [
        "Qual é o maior oceano da Terra?",
        "Pacífico",
        ["Atlântico", "Índico", "Pacífico", "Ártico"]
    ],

    [
        "Qual estrela está no centro do Sistema Solar?",
        "Sol",
        ["Lua", "Sol", "Sirius", "Marte"]
    ],

    [
        "Quantos minutos tem uma hora?",
        "60",
        ["30", "45", "60", "90"]
    ],

    [
        "Qual é o símbolo químico do ferro?",
        "Fe",
        ["F", "Fe", "Fr", "Ir"]
    ],

    [
        "Qual é o maior continente?",
        "Ásia",
        ["África", "Ásia", "Europa", "Oceânia"]
    ],

    [
        "Qual é a fórmula química da água?",
        "H2O",
        ["CO2", "O2", "H2O", "NaCl"]
    ],

    [
        "Qual órgão bombeia o sangue?",
        "Coração",
        ["Pulmão", "Coração", "Fígado", "Estômago"]
    ],

    [
        "Qual idioma é oficial em Moçambique?",
        "Português",
        ["Português", "Inglês", "Francês", "Espanhol"]
    ],

    [
        "Qual é o planeta mais próximo do Sol?",
        "Mercúrio",
        ["Terra", "Vénus", "Mercúrio", "Marte"]
    ]

];


function gerarQuiz() {

    return novoDesafio("quiz", () => {

        const item =
            escolha(quiz);

        return {

            pergunta:
                `🌍 QUIZ\n\n${item[0]}`,

            resposta:
                item[1],

            opcoes:
                embaralhar(item[2]),

            id:
                `quiz:${normalizar(item[0])}`
        };
    });
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

    ["Objeto que protege da chuva.", "Guarda-chuva"]

];


function gerarAdivinhePalavra() {

    return novoDesafio("palavras", () => {

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
    });
}

/*
=========================================================
PAR OU ÍMPAR
=========================================================
*/

function gerarParOuImpar() {

    return novoDesafio("par_impar", () => {

        const numero =
            aleatorio(1, 999999);

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
    });
}

/*
=========================================================
MAIOR / MENOR
=========================================================
*/

function gerarMaiorMenor() {

    return novoDesafio("maior_menor", () => {

        const a = aleatorio(1, 99999);

        let b =
            aleatorio(1, 99999);

        while (a === b) {
            b = aleatorio(1, 99999);
        }

        return {

            pergunta:
                `🎯 Qual é maior: ${a} ou ${b}?`,

            resposta:
                String(Math.max(a, b)),

            id:
                `maior:${a}:${b}`
        };
    });
}

/*
=========================================================
CONVERSÕES
=========================================================
*/

function gerarConversao() {

    return novoDesafio("conversao", () => {

        const tipo =
            aleatorio(1, 3);

        if (tipo === 1) {

            const metros =
                aleatorio(1, 1000);

            return {

                pergunta:
                    `📏 Quantos centímetros existem em ${metros} metros?`,

                resposta:
                    String(metros * 100),

                id:
                    `cm:${metros}`
            };
        }

        if (tipo === 2) {

            const km =
                aleatorio(1, 1000);

            return {

                pergunta:
                    `🛣️ Quantos metros existem em ${km} km?`,

                resposta:
                    String(km * 1000),

                id:
                    `m:${km}`
            };
        }

        const horas =
            aleatorio(1, 24);

        return {

            pergunta:
                `⏱️ Quantos minutos existem em ${horas} horas?`,

            resposta:
                String(horas * 60),

            id:
                `min:${horas}`
        };
    });
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

    embaralhar,

    resetarCategoria(categoria) {

        delete usadas[categoria];

        salvarUsadas();
    }
};
