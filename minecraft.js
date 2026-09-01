// ============================================================
// GUARDA-CHUVA BOT - MINECRAFT.JS V2
// Gerador de Addons Minecraft Bedrock
//
// Suporte:
//   - Itens
//   - Blocos
//   - Mobs / entidades
//   - Spawn Eggs
//   - Texturas PNG reais
//   - Modelos de entidades
//   - Render Controllers
//   - Resource Pack
//   - Behavior Pack
//   - .mcpack
//   - .mcaddon
//
// Alvo do projeto: Minecraft Bedrock 1.26.36.5
// ============================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const archiver = require("archiver");

const MINECRAFT_VERSION = "1.26.36.5";

const BASE_DIR = path.join(__dirname, "minecraft");
const OUTPUT_DIR = path.join(BASE_DIR, "addons");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });


// ============================================================
// UTILIDADES
// ============================================================

function uuid() {
    return crypto.randomUUID();
}

function slug(texto) {
    return String(texto)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "addon";
}

function escrever(arquivo, dados) {
    fs.mkdirSync(path.dirname(arquivo), {
        recursive: true
    });

    if (typeof dados === "string") {
        fs.writeFileSync(arquivo, dados, "utf8");
    } else {
        fs.writeFileSync(
            arquivo,
            JSON.stringify(dados, null, 2),
            "utf8"
        );
    }
}


// ============================================================
// PNG GERADO PELO PRÓPRIO NODE.JS
// ============================================================
//
// Não dependemos de outra biblioteca de imagem.
// Criamos um PNG RGBA válido diretamente.
//
// Isso evita o problema das texturas quebradas/inválidas.
// ============================================================

function crc32(buffer) {
    let crc = 0xffffffff;

    for (let i = 0; i < buffer.length; i++) {
        crc ^= buffer[i];

        for (let j = 0; j < 8; j++) {
            crc =
                (crc >>> 1) ^
                (0xedb88320 & -(crc & 1));
        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(tipo, dados) {
    const tipoBuffer = Buffer.from(tipo);
    const tamanho = Buffer.alloc(4);

    tamanho.writeUInt32BE(dados.length, 0);

    const crc = Buffer.alloc(4);

    crc.writeUInt32BE(
        crc32(
            Buffer.concat([
                tipoBuffer,
                dados
            ])
        ),
        0
    );

    return Buffer.concat([
        tamanho,
        tipoBuffer,
        dados,
        crc
    ]);
}

function criarPNG(
    arquivo,
    corPrincipal = [40, 120, 255],
    corSecundaria = [10, 30, 100]
) {
    const largura = 16;
    const altura = 16;

    const linhas = [];

    for (let y = 0; y < altura; y++) {
        const linha = Buffer.alloc(
            1 + largura * 4
        );

        linha[0] = 0;

        for (let x = 0; x < largura; x++) {

            let cor = corPrincipal;

            // Bordas
            if (
                x === 0 ||
                y === 0 ||
                x === largura - 1 ||
                y === altura - 1
            ) {
                cor = corSecundaria;
            }

            // Padrão diagonal
            if ((x + y) % 5 === 0) {
                cor = corSecundaria;
            }

            const pos = 1 + x * 4;

            linha[pos] = cor[0];
            linha[pos + 1] = cor[1];
            linha[pos + 2] = cor[2];
            linha[pos + 3] = 255;
        }

        linhas.push(linha);
    }

    const raw = Buffer.concat(linhas);

    const header = Buffer.alloc(13);

    header.writeUInt32BE(largura, 0);
    header.writeUInt32BE(altura, 4);

    header[8] = 8;
    header[9] = 6;
    header[10] = 0;
    header[11] = 0;
    header[12] = 0;

    const png = Buffer.concat([
        Buffer.from([
            137, 80, 78, 71,
            13, 10, 26, 10
        ]),

        pngChunk(
            "IHDR",
            header
        ),

        pngChunk(
            "IDAT",
            zlib.deflateSync(raw)
        ),

        pngChunk(
            "IEND",
            Buffer.alloc(0)
        )
    ]);

    fs.mkdirSync(
        path.dirname(arquivo),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        arquivo,
        png
    );
}


// ============================================================
// CORES
// ============================================================

function escolherCores(texto) {

    const t = texto.toLowerCase();

    if (
        t.includes("vermelho") ||
        t.includes("red")
    ) {
        return {
            principal: [220, 30, 30],
            secundaria: [90, 5, 5],
            egg1: "#c91f1f",
            egg2: "#5c0909"
        };
    }

    if (
        t.includes("azul") ||
        t.includes("blue")
    ) {
        return {
            principal: [30, 100, 230],
            secundaria: [5, 30, 100],
            egg1: "#2464d8",
            egg2: "#071f66"
        };
    }

    if (
        t.includes("verde") ||
        t.includes("green")
    ) {
        return {
            principal: [30, 190, 70],
            secundaria: [5, 80, 25],
            egg1: "#28b84a",
            egg2: "#07541d"
        };
    }

    if (
        t.includes("amarelo") ||
        t.includes("yellow")
    ) {
        return {
            principal: [240, 210, 30],
            secundaria: [130, 100, 5],
            egg1: "#e6c82c",
            egg2: "#75620b"
        };
    }

    if (
        t.includes("roxo") ||
        t.includes("purple")
    ) {
        return {
            principal: [150, 40, 220],
            secundaria: [65, 10, 100],
            egg1: "#9634d1",
            egg2: "#3f0962"
        };
    }

    if (
        t.includes("preto") ||
        t.includes("black")
    ) {
        return {
            principal: [35, 35, 35],
            secundaria: [5, 5, 5],
            egg1: "#252525",
            egg2: "#050505"
        };
    }

    if (
        t.includes("branco") ||
        t.includes("white")
    ) {
        return {
            principal: [230, 230, 230],
            secundaria: [130, 130, 130],
            egg1: "#eeeeee",
            egg2: "#777777"
        };
    }

    return {
        principal: [40, 120, 255],
        secundaria: [10, 30, 100],
        egg1: "#2878ff",
        egg2: "#0a1e64"
    };
}


// ============================================================
// INTERPRETAÇÃO
// ============================================================

function interpretar(descricao) {

    const texto =
        String(descricao)
            .toLowerCase();

    const resultado = {

        entidade: false,
        item: false,
        bloco: false,

        voa: false,
        fogo: false,
        rapido: false,
        forte: false,

        vida: 20,
        dano: 4
    };

    // ---------------- ENTIDADE ----------------

    if (
        /drag[aã]o|mob|monstro|criatura|entidade|alien|zumbi|boss|animal|rob[oô]|golem|dem[oô]nio|cavaleiro/.test(texto)
    ) {
        resultado.entidade = true;
    }

    // ---------------- ITEM ----------------

    if (
        /item|espada|machado|picareta|pá|pa |enxada|arco|arma|cristal|comida|poção|pocao|varinha/.test(texto)
    ) {
        resultado.item = true;
    }

    // ---------------- BLOCO ----------------

    if (
        /bloco|block|min[eé]rio|ore|pedra|cristal bloco/.test(texto)
    ) {
        resultado.bloco = true;
    }

    // ---------------- VOO ----------------

    if (
        /voa|voar|voando|voador|voe/.test(texto)
    ) {
        resultado.voa = true;
    }

    // ---------------- FOGO ----------------

    if (
        /fogo|fire|chama|queima|queimar|lava/.test(texto)
    ) {
        resultado.fogo = true;
    }

    // ---------------- VELOCIDADE ----------------

    if (
        /rápido|rapido|veloz|velocidade/.test(texto)
    ) {
        resultado.rapido = true;
    }

    // ---------------- FORÇA ----------------

    if (
        /forte|força|forca|poderoso|poderosa/.test(texto)
    ) {
        resultado.forte = true;
        resultado.dano = 12;
    }

    // ---------------- VIDA ----------------

    const vida =
        texto.match(
            /(\d+)\s*(?:de\s*)?(?:vida|vidas|hp)/
        );

    if (vida) {
        resultado.vida =
            Math.max(
                1,
                Math.min(
                    100000,
                    Number(vida[1])
                )
            );
    }

    // ---------------- DANO ----------------

    const dano =
        texto.match(
            /(\d+)\s*(?:de\s*)?(?:dano|damage)/
        );

    if (dano) {
        resultado.dano =
            Math.max(
                1,
                Math.min(
                    10000,
                    Number(dano[1])
                )
            );
    }

    return resultado;
}


// ============================================================
// MANIFEST RP
// ============================================================

function manifestRP(nome, uuidRP) {

    return {
        format_version: 2,

        header: {
            name:
                `${nome} - Recursos`,

            description:
                `Resource Pack ${MINECRAFT_VERSION}`,

            uuid:
                uuidRP,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
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


// ============================================================
// MANIFEST BP
// ============================================================

function manifestBP(
    nome,
    uuidBP,
    uuidRP
) {

    return {
        format_version: 2,

        header: {
            name:
                `${nome} - Comportamento`,

            description:
                `Behavior Pack ${MINECRAFT_VERSION}`,

            uuid:
                uuidBP,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
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
                uuid: uuidRP,
                version: [1, 0, 0]
            }
        ]
    };
}


// ============================================================
// MODELO DA ENTIDADE
// ============================================================

function modeloEntidade(nome) {

    return {

        format_version: "1.12.0",

        "minecraft:geometry": [
            {
                description: {
                    identifier:
                        `geometry.${nome}`,

                    texture_width: 64,
                    texture_height: 64,

                    visible_bounds_width: 3,
                    visible_bounds_height: 4,

                    visible_bounds_offset:
                        [0, 1, 0]
                },

                bones: [

                    {
                        name: "body",

                        pivot:
                            [0, 12, 0],

                        cubes: [
                            {
                                origin:
                                    [-4, 4, -2],

                                size:
                                    [8, 8, 4],

                                uv:
                                    [0, 0]
                            }
                        ]
                    },

                    {
                        name: "head",

                        pivot:
                            [0, 16, 0],

                        cubes: [
                            {
                                origin:
                                    [-4, 12, -4],

                                size:
                                    [8, 8, 8],

                                uv:
                                    [0, 16]
                            }
                        ]
                    },

                    {
                        name: "right_leg",

                        pivot:
                            [-2, 4, 0],

                        cubes: [
                            {
                                origin:
                                    [-3, 0, -2],

                                size:
                                    [3, 4, 4],

                                uv:
                                    [32, 0]
                            }
                        ]
                    },

                    {
                        name: "left_leg",

                        pivot:
                            [2, 4, 0],

                        cubes: [
                            {
                                origin:
                                    [2, 0, -2],

                                size:
                                    [3, 4, 4],

                                uv:
                                    [32, 8]
                            }
                        ]
                    }
                ]
            }
        ]
    };
}


// ============================================================
// RENDER CONTROLLER
// ============================================================

function renderController(nome) {

    return {

        format_version: "1.8.0",

        render_controllers: {

            [`controller.render.${nome}`]: {

                geometry:
                    "Geometry.default",

                materials: [
                    {
                        "*":
                            "Material.default"
                    }
                ],

                textures: [
                    "Texture.default"
                ]
            }
        }
    };
}


// ============================================================
// CLIENT ENTITY
// ============================================================

function clientEntity(
    id,
    nome,
    cores
) {

    return {

        format_version: "1.10.0",

        "minecraft:client_entity": {

            description: {

                identifier:
                    id,

                min_engine_version:
                    "1.10.0",

                materials: {

                    default:
                        "entity"
                },

                textures: {

                    default:
                        `textures/entity/${nome}`
                },

                geometry: {

                    default:
                        `geometry.${nome}`
                },

                render_controllers: [

                    `controller.render.${nome}`
                ],

                spawn_egg: {

                    base_color:
                        cores.egg1,

                    overlay_color:
                        cores.egg2
                }
            }
        }
    };
}


// ============================================================
// ENTIDADE BP
// ============================================================

function entidadeBP(
    id,
    config
) {

    const componentes = {

        "minecraft:type_family": {
            family: [
                "guardachuva_custom"
            ]
        },

        "minecraft:health": {
            value:
                config.vida,

            max:
                config.vida
        },

        "minecraft:collision_box": {
            width: 0.8,
            height: 1.8
        },

        "minecraft:physics": {},

        "minecraft:movement": {
            value:
                config.rapido
                    ? 0.5
                    : 0.25
        },

        "minecraft:attack": {
            damage:
                config.dano
        },

        "minecraft:nameable": {},

        "minecraft:behavior.float": {
            priority: 0
        },

        "minecraft:behavior.nearest_attackable_target": {

            priority: 2,

            must_see: true,

            entity_types: [
                {
                    filters: {
                        test:
                            "is_family",

                        subject:
                            "other",

                        value:
                            "player"
                    },

                    max_dist:
                        32
                }
            ]
        },

        "minecraft:behavior.melee_attack": {
            priority: 3,
            track_target: true
        },

        "minecraft:behavior.random_stroll": {
            priority: 6,
            speed_multiplier: 1
        },

        "minecraft:behavior.look_at_player": {
            priority: 7,
            look_distance: 8,
            probability: 0.02
        },

        "minecraft:behavior.random_look_around": {
            priority: 8
        }
    };

    // ---------------- VOO ----------------

    if (config.voa) {

        componentes[
            "minecraft:movement.fly"
        ] = {};

        componentes[
            "minecraft:navigation.fly"
        ] = {
            can_path_over_water: true,
            can_sink: false,
            can_pass_doors: true
        };

        componentes[
            "minecraft:behavior.random_hover"
        ] = {
            priority: 5,
            duration: 4,
            speed_multiplier: 1
        };
    }

    // ---------------- FOGO ----------------

    if (config.fogo) {

        componentes[
            "minecraft:fire_immune"
        ] = {};

        componentes[
            "minecraft:damage_sensor"
        ] = {
            triggers: [
                {
                    cause: "fire",
                    deals_damage: false
                }
            ]
        };
    }

    return {

        format_version: "1.21.0",

        "minecraft:entity": {

            description: {

                identifier:
                    id,

                is_spawnable:
                    true,

                is_summonable:
                    true
            },

            components:
                componentes
        }
    };
}


// ============================================================
// SPAWN RULES
// ============================================================

function spawnRules(id) {

    return {

        format_version: "1.21.0",

        "minecraft:spawn_rules": {

            description: {

                identifier:
                    id,

                population_control:
                    "animal"
            },

            conditions: [

                {
                    "minecraft:brightness_filter": {

                        min: 0,
                        max: 15,

                        adjust_for_weather:
                            false
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
}


// ============================================================
// ITEM BP
// ============================================================

function itemBP(
    id,
    nome
) {

    return {

        format_version: "1.21.0",

        "minecraft:item": {

            description: {

                identifier:
                    id,

                menu_category: {

                    category:
                        "items"
                }
            },

            components: {

                "minecraft:max_stack_size":
                    1,

                "minecraft:icon": {

                    texture:
                        nome
                },

                "minecraft:display_name": {

                    value:
                        nome
                }
            }
        }
    };
}


// ============================================================
// ITEM TEXTURE
// ============================================================

function itemTexture(nome) {

    return {

        resource_pack_name:
            "guardachuva",

        texture_name:
            "atlas.items",

        texture_data: {

            [nome]: {

                textures:
                    `textures/items/${nome}`
            }
        }
    };
}


// ============================================================
// BLOCO BP
// ============================================================

function blocoBP(id) {

    return {

        format_version: "1.21.0",

        "minecraft:block": {

            description: {

                identifier:
                    id,

                menu_category: {

                    category:
                        "construction"
                }
            },

            components: {

                "minecraft:destroy_time":
                    1,

                "minecraft:explosion_resistance":
                    1
            }
        }
    };
}


// ============================================================
// TERRAIN TEXTURE
// ============================================================

function terrainTexture(nome) {

    return {

        resource_pack_name:
            "guardachuva",

        texture_name:
            "atlas.terrain",

        texture_data: {

            [nome]: {

                textures:
                    `textures/blocks/${nome}`
            }
        }
    };
}


// ============================================================
// BLOCKS.JSON
// ============================================================

function blocksJSON(nome) {

    return {

        format_version: [
            1,
            1,
            0
        ],

        [`guardachuva:${nome}_block`]: {

            sound:
                "stone",

            textures:
                nome
        }
    };
}


// ============================================================
// RECEITA
// ============================================================

function receita(id) {

    return {

        format_version:
            "1.20.10",

        "minecraft:recipe_shaped": {

            description: {

                identifier:
                    `${id}_recipe`
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
                    item:
                        "minecraft:iron_ingot"
                },

                B: {
                    item:
                        "minecraft:stick"
                }
            },

            result: {
                item:
                    id,

                count:
                    1
            }
        }
    };
}


// ============================================================
// CRIA PROJETO
// ============================================================

function criarProjeto(descricao) {

    const config =
        interpretar(descricao);

    const cores =
        escolherCores(descricao);

    let nome =
        String(descricao)
            .replace(/^\/mc\s*/i, "")
            .trim()
            .split(/\s+/)
            .slice(0, 6)
            .join(" ");

    if (!nome) {
        nome = "Meu Addon";
    }

    const nomeSlug =
        slug(nome);

    const id =
        `guardachuva:${nomeSlug}`;

    const uuidBP =
        uuid();

    const uuidRP =
        uuid();

    const pasta =
        path.join(
            OUTPUT_DIR,
            `${nomeSlug}_${Date.now()}`
        );

    const BP =
        path.join(
            pasta,
            `${nomeSlug}_BP`
        );

    const RP =
        path.join(
            pasta,
            `${nomeSlug}_RP`
        );

    fs.mkdirSync(BP, {
        recursive: true
    });

    fs.mkdirSync(RP, {
        recursive: true
    });


    // ========================================================
    // MANIFESTS
    // ========================================================

    escrever(
        path.join(
            BP,
            "manifest.json"
        ),
        manifestBP(
            nome,
            uuidBP,
            uuidRP
        )
    );

    escrever(
        path.join(
            RP,
            "manifest.json"
        ),
        manifestRP(
            nome,
            uuidRP
        )
    );


    // ========================================================
    // ENTIDADE
    // ========================================================

    if (config.entidade) {

        escrever(
            path.join(
                BP,
                "entities",
                `${nomeSlug}.json`
            ),
            entidadeBP(
                id,
                config
            )
        );

        escrever(
            path.join(
                BP,
                "spawn_rules",
                `${nomeSlug}.json`
            ),
            spawnRules(id)
        );


        // CLIENT ENTITY

        escrever(
            path.join(
                RP,
                "entity",
                `${nomeSlug}.entity.json`
            ),
            clientEntity(
                id,
                nomeSlug,
                cores
            )
        );


        // MODELO

        escrever(
            path.join(
                RP,
                "models",
                "entity",
                `${nomeSlug}.geo.json`
            ),
            modeloEntidade(
                nomeSlug
            )
        );


        // RENDER CONTROLLER

        escrever(
            path.join(
                RP,
                "render_controllers",
                `${nomeSlug}.render_controllers.json`
            ),
            renderController(
                nomeSlug
            )
        );


        // TEXTURA REAL

        criarPNG(
            path.join(
                RP,
                "textures",
                "entity",
                `${nomeSlug}.png`
            ),
            cores.principal,
            cores.secundaria
        );
    }


    // ========================================================
    // ITEM
    // ========================================================

    if (config.item) {

        const itemId =
            `guardachuva:${nomeSlug}_item`;

        escrever(
            path.join(
                BP,
                "items",
                `${nomeSlug}_item.json`
            ),
            itemBP(
                itemId,
                nomeSlug
            )
        );


        criarPNG(
            path.join(
                RP,
                "textures",
                "items",
                `${nomeSlug}.png`
            ),
            cores.principal,
            cores.secundaria
        );


        escrever(
            path.join(
                RP,
                "textures",
                "item_texture.json"
            ),
            itemTexture(
                nomeSlug
            )
        );


        escrever(
            path.join(
                BP,
                "recipes",
                `${nomeSlug}_recipe.json`
            ),
            receita(itemId)
        );
    }


    // ========================================================
    // BLOCO
    // ========================================================

    if (config.bloco) {

        const blocoId =
            `guardachuva:${nomeSlug}_block`;

        escrever(
            path.join(
                BP,
                "blocks",
                `${nomeSlug}_block.json`
            ),
            blocoBP(blocoId)
        );


        criarPNG(
            path.join(
                RP,
                "textures",
                "blocks",
                `${nomeSlug}.png`
            ),
            cores.principal,
            cores.secundaria
        );


        escrever(
            path.join(
                RP,
                "textures",
                "terrain_texture.json"
            ),
            terrainTexture(
                nomeSlug
            )
        );


        escrever(
            path.join(
                RP,
                "blocks.json"
            ),
            blocksJSON(
                nomeSlug
            )
        );
    }


    // ========================================================
    // DIRETÓRIOS BÁSICOS
    // ========================================================

    fs.mkdirSync(
        path.join(
            RP,
            "textures"
        ),
        {
            recursive: true
        }
    );

    fs.mkdirSync(
        path.join(
            RP,
            "textures",
            "items"
        ),
        {
            recursive: true
        }
    );

    fs.mkdirSync(
        path.join(
            RP,
            "textures",
            "blocks"
        ),
        {
            recursive: true
        }
    );

    fs.mkdirSync(
        path.join(
            RP,
            "textures",
            "entity"
        ),
        {
            recursive: true
        }
    );


    // ========================================================
    // INFO
    // ========================================================

    escrever(
        path.join(
            pasta,
            "addon-info.json"
        ),
        {
            nome:
                nome,

            descricao:
                descricao,

            minecraft:
                MINECRAFT_VERSION,

            uuid_bp:
                uuidBP,

            uuid_rp:
                uuidRP,

            recursos:
                config,

            criado_em:
                new Date().toISOString()
        }
    );


    return {
        nome,
        nomeSlug,
        pasta,
        BP,
        RP,
        uuidBP,
        uuidRP,
        config
    };
}


// ============================================================
// ZIP / MCPACK
// ============================================================

function criarZip(
    pasta,
    destino
) {

    return new Promise(
        (resolve, reject) => {

            const output =
                fs.createWriteStream(
                    destino
                );

            const archive =
                archiver(
                    "zip",
                    {
                        zlib: {
                            level: 9
                        }
                    }
                );


            output.on(
                "close",
                () => resolve(destino)
            );

            output.on(
                "error",
                reject
            );

            archive.on(
                "error",
                reject
            );

            archive.pipe(output);

            archive.directory(
                pasta,
                false
            );

            archive.finalize();
        }
    );
}


// ============================================================
// MCADDON
// ============================================================

function criarMcaddon(
    BPpack,
    RPpack,
    destino
) {

    return new Promise(
        (resolve, reject) => {

            const output =
                fs.createWriteStream(
                    destino
                );

            const archive =
                archiver(
                    "zip",
                    {
                        zlib: {
                            level: 9
                        }
                    }
                );


            output.on(
                "close",
                () => resolve(destino)
            );

            output.on(
                "error",
                reject
            );

            archive.on(
                "error",
                reject
            );

            archive.pipe(output);


            archive.file(
                BPpack,
                {
                    name:
                        path.basename(BPpack)
                }
            );


            archive.file(
                RPpack,
                {
                    name:
                        path.basename(RPpack)
                }
            );


            archive.finalize();
        }
    );
}


// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

async function gerarAddon(
    descricao
) {

    if (
        !descricao ||
        !String(descricao).trim()
    ) {
        throw new Error(
            "A descrição do addon está vazia."
        );
    }


    const projeto =
        criarProjeto(
            descricao
        );


    const BPpack =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_BP.mcpack`
        );


    const RPpack =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_RP.mcpack`
        );


    const arquivoFinal =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_${Date.now()}.mcaddon`
        );


    // --------------------------------------------------------
    // BP
    // --------------------------------------------------------

    await criarZip(
        projeto.BP,
        BPpack
    );


    // --------------------------------------------------------
    // RP
    // --------------------------------------------------------

    await criarZip(
        projeto.RP,
        RPpack
    );


    // --------------------------------------------------------
    // MCADDON
    // --------------------------------------------------------

    await criarMcaddon(
        BPpack,
        RPpack,
        arquivoFinal
    );


    return {

        nome:
            projeto.nome,

        arquivo:
            arquivoFinal,

        bp:
            BPpack,

        rp:
            RPpack,

        versao:
            MINECRAFT_VERSION
    };
}


// ============================================================
// EXPORTAÇÃO
// ============================================================

module.exports = {
    gerarAddon,
    criarProjeto,
    MINECRAFT_VERSION
};
