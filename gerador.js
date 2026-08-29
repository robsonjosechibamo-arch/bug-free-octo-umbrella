const fs = require('fs');

const totalPerguntas = 10000;
const banco = [];

console.log(`⏳ A gerar ${totalPerguntas} perguntas automaticamente...`);

for (let i = 1; i <= totalPerguntas; i++) {
    const n1 = Math.floor(Math.random() * 90) + 10;
    const n2 = Math.floor(Math.random() * 90) + 10;
    const soma = n1 + n2;

    banco.push({
        id: `mat_${i}`,
        pergunta: `🧮 **Desafio Matemático #${i}**\nQuanto é \`${n1} + ${n2}\`?`,
        opcoes: [
            { texto: `${soma - 2}`, valor: 'errado1' },
            { texto: `${soma}`, valor: 'certo' },
            { texto: `${soma + 5}`, valor: 'errado2' }
        ],
        respostaCerta: 'certo'
    });
}

fs.writeFileSync('perguntas.json', JSON.stringify(banco, null, 2));
console.log(`✅ Sucesso! O ficheiro 'perguntas.json' foi criado com ${totalPerguntas} perguntas.`);
