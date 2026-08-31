const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const MINECRAFT_VERSION = "1.26.36.5";

const BASE_DIR = path.join(__dirname, "minecraft");
const OUTPUT_DIR = path.join(BASE_DIR, "addons");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function uuid() {
    return crypto.randomUUID();
}

function slug(texto) {
    return String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "addon";
}

function escreverArquivo(arquivo, conteudo) {
    fs.mkdirSync(path.dirname(arquivo), {
        recursive: true
    });

    fs.writeFileSync(
        arquivo,
        typeof conteudo === "string"
            ? conteudo
            : JSON.stringify(conteudo, null, 2),
        "utf8"
    );
}

function lerDescricao(descricao) {

    const texto = descricao.toLowerCase();

    const resultado = {
        nome: "Meu Addon",
        entidade: false,
        item: false,
        bloco: false,
        fogo: false,
        voar: false,
        vida: 20
    };

    if (
        texto.includes("dragão") ||
        texto.includes("dragao") ||
        texto.includes("mob") ||
        texto.includes("entidade") ||
        texto.includes("alien")
    ) {
        resultado.entidade = true;
    }

    if (
        texto.includes("item") ||
        texto.includes("espada") ||
        texto.includes("arma")
    ) {
        resultado.item = true;
    }

    if (
        texto.includes("bloco") ||
        texto.includes("block")
    ) {
        resultado.bloco = true;
    }

    if (
        texto.includes("fogo") ||
        texto.includes("fire") ||
        texto.includes("bola de fogo")
    ) {
        resultado.fogo = true;
    }

    if (
        texto.includes("voa") ||
        texto.includes("voar") ||
        texto.includes("voando")
    ) {
        resultado.voar = true;
    }

    const vidaEncontrada =
        texto.match(
            /(\d+)\s*(de\s*)?(vida|vidas|hp)/i
        );

    if (vidaEncontrada) {
        resultado.vida =
            Math.max(
                1,
                Math.min(
                    10000,
                    Number(vidaEncontrada[1])
                )
            );
    }

    return resultado;
}

function criarManifestRP(nome) {

    return {
        format_version: 2,

        header: {
            name: `${nome} - Recursos`,
            description:
                `Resource Pack criado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,
            uuid: uuid(),
            version: [1, 0, 0],
            min_engine_version: [1, 26, 0]
        },

        modules: [
            {
                type: "resources",
                uuid: uuid(),
                version: [1, 0, 0]
            }
        ]
    };
}

function criarManifestBP(
    nome,
    rpHeaderUuid
) {

    return {
        format_version: 2,

        header: {
            name: `${nome} - Comportamento`,
            description:
                `Behavior Pack criado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,
            uuid: uuid(),
            version: [1, 0, 0],
            min_engine_version: [1, 26, 0]
        },

        modules: [
            {
                type: "data",
                uuid: uuid(),
                version: [1, 0, 0]
            }
        ],

        dependencies: [
            {
                uuid: rpHeaderUuid,
                version: [1, 0, 0]
            }
        ]
    };
}

function criarEntidade(nome, config) {

    const id =
        `guardachuva:${slug(nome)}`;

    const components = {

        "minecraft:health": {
            value: config.vida,
            max: config.vida
        },

        "minecraft:collision_box": {
            width: 1,
            height: 2
        },

        "minecraft:physics": {},

        "minecraft:movement": {
            value: config.voar ? 0.35 : 0.2
        },

        "minecraft:attack": {
            damage: 6
        },

        "minecraft:nameable": {},

        "minecraft:loot": {
            table: "loot_tables/entities/default.json"
        }
    };

    if (config.voar) {

        components[
            "minecraft:movement.fly"
        ] = {};

        components[
            "minecraft:navigation.fly"
        ] = {
            can_path_over_water: true,
            can_sink: false,
            can_pass_doors: true
        };

        components[
            "minecraft:behavior.random_hover"
        ] = {
            priority: 5,
            duration: 2,
            speed_multiplier: 1
        };
    }

    return {

        format_version: "1.21.0",

        "minecraft:entity": {

            description: {

                identifier: id,

                is_spawnable: true,

                is_summonable: true,

                is_experimental: false
            },

            components
        }
    };
}

function criarLoot() {

    return {

        pools: [
            {
                rolls: 1,
                entries: []
            }
        ]
    };
}

function criarPack(descricao) {

    const config =
        lerDescricao(descricao);

    const nome =
        config.nome === "Meu Addon"
            ? "Addon " +
              descricao
                .split(/\s+/)
                .slice(0, 4)
                .join(" ")
            : config.nome;

    const pasta =
        `${Date.now()}_${slug(nome)}`;

    const addonDir =
        path.join(
            OUTPUT_DIR,
            pasta
        );

    const bpDir =
        path.join(
            addonDir,
            "BP"
        );

    const rpDir =
        path.join(
            addonDir,
            "RP"
        );

    fs.mkdirSync(bpDir, {
        recursive: true
    });

    fs.mkdirSync(rpDir, {
        recursive: true
    });

    /*
    ============================================
    RESOURCE PACK
    ============================================
    */

    const rpManifest =
        criarManifestRP(nome);

    escreverArquivo(
        path.join(
            rpDir,
            "manifest.json"
        ),
        rpManifest
    );

    /*
    ============================================
    BEHAVIOR PACK
    ============================================
    */

    const bpManifest =
        criarManifestBP(
            nome,
            rpManifest.header.uuid
        );

    escreverArquivo(
        path.join(
            bpDir,
            "manifest.json"
        ),
        bpManifest
    );

    /*
    ============================================
    ENTIDADE
    ============================================
    */

    if (config.entidade) {

        const entidade =
            criarEntidade(
                nome,
                config
            );

        escreverArquivo(
            path.join(
                bpDir,
                "entities",
                `${slug(nome)}.json`
            ),
            entidade
        );

        escreverArquivo(
            path.join(
                bpDir,
                "loot_tables",
                "entities",
                "default.json"
            ),
            criarLoot()
        );

        /*
        Arquivo de spawn simples.
        */

        const spawn =
            {
                format_version: "1.21.0",

                "minecraft:spawn_rules": {

                    description: {

                        identifier:
                            `guardachuva:${slug(nome)}`,

                        population_control:
                            "animal"
                    },

                    conditions: [
                        {
                            "minecraft:brightness_filter": {
                                min: 0,
                                max: 15,
                                adjust_for_weather: false
                            },

                            "minecraft:difficulty_filter": {
                                min: "easy",
                                max: "hard"
                            },

                            "minecraft:weight": {
                                default: 5
                            }
                        }
                    ]
                }
            };

        escreverArquivo(
            path.join(
                bpDir,
                "spawn_rules",
                `${slug(nome)}.json`
            ),
            spawn
        );
    }

    /*
    ============================================
    ITEM
    ============================================
    */

    if (config.item) {

        const itemId =
            `guardachuva:${slug(nome)}_item`;

        const item = {

            format_version: "1.21.0",

            "minecraft:item": {

                description: {
                    identifier: itemId,
                    menu_category: {
                        category: "items"
                    }
                },

                components: {

                    "minecraft:max_stack_size": 1,

                    "minecraft:icon": {
                        texture: slug(nome)
                    },

                    "minecraft:display_name": {
                        value: nome
                    }
                }
            }
        };

        escreverArquivo(
            path.join(
                bpDir,
                "items",
                `${slug(nome)}_item.json`
            ),
            item
        );
    }

    /*
    ============================================
    BLOCO
    ============================================
    */

    if (config.bloco) {

        const blocoId =
            `guardachuva:${slug(nome)}_block`;

        const bloco = {

            format_version: "1.21.0",

            "minecraft:block": {

                description: {
                    identifier: blocoId,

                    menu_category: {
                        category: "construction"
                    }
                },

                components: {

                    "minecraft:destructible_by_mining": {
                        seconds_to_destroy: 1
                    },

                    "minecraft:destructible_by_explosion": {
                        explosion_resistance: 1
                    }
                }
            }
        };

        escreverArquivo(
            path.join(
                bpDir,
                "blocks",
                `${slug(nome)}_block.json`
            ),
            bloco
        );
    }

    /*
    ============================================
    RECEITA EXEMPLO
    ============================================
    */

    if (config.item) {

        const receita = {

            format_version: "1.20.10",

            "minecraft:recipe_shaped": {

                description: {
                    identifier:
                        `guardachuva:${slug(nome)}_recipe`
                },

                tags: [
                    "crafting_table"
                ],

                pattern: [
                    "AAA",
                    " B ",
                    " B "
                ],

                key: {

                    A: {
                        item: "minecraft:iron_ingot"
                    },

                    B: {
                        item: "minecraft:stick"
                    }
                },

                result: {
                    item:
                        `guardachuva:${slug(nome)}_item`,
                    count: 1
                }
            }
        };

        escreverArquivo(
            path.join(
                bpDir,
                "recipes",
                `${slug(nome)}_recipe.json`
            ),
            receita
        );
    }

    /*
    ============================================
    INFORMAÇÕES DO ADDON
    ============================================
    */

    escreverArquivo(

        path.join(
            addonDir,
            "addon-info.json"
        ),

        {
            nome,
            versaoMinecraft:
                MINECRAFT_VERSION,
            descricao,
            criadoPor:
                "Guarda-Chuva Bot",
            criadoEm:
                new Date().toISOString()
        }
    );

    return {
        nome,
        pasta: addonDir,
        bp: bpDir,
        rp: rpDir
    };
}

function listarArquivos(dir) {

    let resultado = [];

    for (const nome of fs.readdirSync(dir)) {

        const caminho =
            path.join(
                dir,
                nome
            );

        const stat =
            fs.statSync(caminho);

        if (stat.isDirectory()) {

            resultado =
                resultado.concat(
                    listarArquivos(caminho)
                );

        } else {

            resultado.push(caminho);
        }
    }

    return resultado;
}

function zipar(pastaOrigem, arquivoZip) {

    return new Promise(
        (resolve, reject) => {

            /*
              Usa o comando zip disponível
              na maioria das plataformas Node.
            */

            execFile(
                "zip",
                [
                    "-r",
                    arquivoZip,
                    "."
                ],
                {
                    cwd: pastaOrigem
                },
                (erro, stdout, stderr) => {

                    if (erro) {

                        reject(
                            new Error(
                                stderr ||
                                erro.message
                            )
                        );

                        return;
                    }

                    resolve(
                        arquivoZip
                    );
                }
            );
        }
    );
}

async function gerarAddon(descricao) {

    if (
        !descricao ||
        !String(descricao).trim()
    ) {

        throw new Error(
            "A descrição do addon está vazia."
        );
    }

    const projeto =
        criarPack(
            descricao
        );

    const arquivoMcaddon =
        path.join(
            OUTPUT_DIR,
            `${path.basename(projeto.pasta)}.mcaddon`
        );

    await zipar(
        projeto.pasta,
        arquivoMcaddon
    );

    return {
        nome: projeto.nome,

        arquivo:
            arquivoMcaddon,

        pasta:
            projeto.pasta,

        versao:
            MINECRAFT_VERSION
    };
}

module.exports = {
    gerarAddon,
    criarPack,
    MINECRAFT_VERSION
};
