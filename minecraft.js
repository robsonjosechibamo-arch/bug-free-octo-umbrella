// ============================================================
// MINECRAFT.JS
// Gerador de Addons Minecraft Bedrock
// Alvo: Minecraft Bedrock 1.26.36.5
// ============================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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

    if (typeof conteudo === "string") {
        fs.writeFileSync(
            arquivo,
            conteudo,
            "utf8"
        );
    } else {
        fs.writeFileSync(
            arquivo,
            JSON.stringify(conteudo, null, 2),
            "utf8"
        );
    }
}


// ============================================================
// PNGS EMBUTIDOS
// ============================================================

// PNG 16x16 simples.
// Usado como textura inicial válida para itens/blocos/entidades.
// O gerador poderá receber texturas mais avançadas no futuro.

const TEXTURA_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAFElEQVR42mNk+M/wHwAEYgJBpA4AAAD//wMAH4QCBQAAAABJRU5ErkJggg==";

function criarPNG(arquivo) {
    fs.mkdirSync(
        path.dirname(arquivo),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        arquivo,
        Buffer.from(
            TEXTURA_PNG_BASE64,
            "base64"
        )
    );
}


// ============================================================
// INTERPRETADOR DA DESCRIÇÃO
// ============================================================

function interpretarDescricao(descricao) {

    const texto =
        String(descricao)
            .toLowerCase();

    const config = {

        nome: "Meu Addon",

        entidade: false,

        item: false,

        bloco: false,

        fogo: false,

        voar: false,

        rapido: false,

        forte: false,

        vida: 20,

        dano: 4
    };


    // --------------------------------------------------------
    // ENTIDADES
    // --------------------------------------------------------

    if (
        texto.includes("dragão") ||
        texto.includes("dragao") ||
        texto.includes("mob") ||
        texto.includes("monstro") ||
        texto.includes("criatura") ||
        texto.includes("entidade") ||
        texto.includes("alien") ||
        texto.includes("zumbi") ||
        texto.includes("boss")
    ) {
        config.entidade = true;
    }


    // --------------------------------------------------------
    // ITENS
    // --------------------------------------------------------

    if (
        texto.includes("item") ||
        texto.includes("espada") ||
        texto.includes("arma") ||
        texto.includes("machado") ||
        texto.includes("picareta") ||
        texto.includes("arco") ||
        texto.includes("comida") ||
        texto.includes("cristal")
    ) {
        config.item = true;
    }


    // --------------------------------------------------------
    // BLOCOS
    // --------------------------------------------------------

    if (
        texto.includes("bloco") ||
        texto.includes("block") ||
        texto.includes("minério") ||
        texto.includes("minerio")
    ) {
        config.bloco = true;
    }


    // --------------------------------------------------------
    // FOGO
    // --------------------------------------------------------

    if (
        texto.includes("fogo") ||
        texto.includes("fire") ||
        texto.includes("chama") ||
        texto.includes("queima") ||
        texto.includes("bola de fogo")
    ) {
        config.fogo = true;
    }


    // --------------------------------------------------------
    // VOO
    // --------------------------------------------------------

    if (
        texto.includes("voa") ||
        texto.includes("voar") ||
        texto.includes("voando") ||
        texto.includes("voador")
    ) {
        config.voar = true;
    }


    // --------------------------------------------------------
    // VELOCIDADE
    // --------------------------------------------------------

    if (
        texto.includes("rápido") ||
        texto.includes("rapido") ||
        texto.includes("veloz") ||
        texto.includes("velocidade")
    ) {
        config.rapido = true;
    }


    // --------------------------------------------------------
    // FORÇA
    // --------------------------------------------------------

    if (
        texto.includes("forte") ||
        texto.includes("força") ||
        texto.includes("forca") ||
        texto.includes("muita força")
    ) {
        config.forte = true;

        config.dano = 12;
    }


    // --------------------------------------------------------
    // VIDA
    // --------------------------------------------------------

    const vida =
        texto.match(
            /(\d+)\s*(de\s*)?(vida|vidas|hp)/i
        );

    if (vida) {

        config.vida =
            Math.max(
                1,
                Math.min(
                    100000,
                    Number(vida[1])
                )
            );
    }


    // --------------------------------------------------------
    // DANO
    // --------------------------------------------------------

    const dano =
        texto.match(
            /(\d+)\s*(de\s*)?(dano|damage)/i
        );

    if (dano) {

        config.dano =
            Math.max(
                1,
                Math.min(
                    10000,
                    Number(dano[1])
                )
            );
    }


    return config;
}


// ============================================================
// MANIFEST RESOURCE PACK
// ============================================================

function criarManifestRP(nome, rpUuid) {

    return {

        format_version: 2,

        header: {

            name:
                `${nome} - Recursos`,

            description:
                `Resource Pack criado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                rpUuid,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 26, 0]
        },

        modules: [

            {

                type:
                    "resources",

                uuid:
                    uuid(),

                version:
                    [1, 0, 0]
            }
        ]
    };
}


// ============================================================
// MANIFEST BEHAVIOR PACK
// ============================================================

function criarManifestBP(nome, bpUuid, rpUuid) {

    return {

        format_version: 2,

        header: {

            name:
                `${nome} - Comportamento`,

            description:
                `Behavior Pack criado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                bpUuid,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 26, 0]
        },

        modules: [

            {

                type:
                    "data",

                uuid:
                    uuid(),

                version:
                    [1, 0, 0]
            }
        ],

        dependencies: [

            {

                uuid:
                    rpUuid,

                version:
                    [1, 0, 0]
            }
        ]
    };
}


// ============================================================
// ENTIDADE - BEHAVIOR PACK
// ============================================================

function criarEntidadeBP(id, config) {

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

            width:
                0.8,

            height:
                1.8
        },

        "minecraft:physics": {},

        "minecraft:movement": {

            value:
                config.rapido
                    ? 0.8
                    : 0.25
        },

        "minecraft:attack": {

            damage:
                config.dano
        },

        "minecraft:nameable": {},

        "minecraft:behavior.float": {

            priority:
                0
        },

        "minecraft:behavior.nearest_attackable_target": {

            priority:
                2,

            must_see:
                true,

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

            priority:
                3,

            track_target:
                true
        },

        "minecraft:behavior.random_stroll": {

            priority:
                6,

            speed_multiplier:
                1
        },

        "minecraft:behavior.look_at_player": {

            priority:
                7,

            look_distance:
                8,

            probability:
                0.02
        },

        "minecraft:behavior.random_look_around": {

            priority:
                8
        }
    };


    // --------------------------------------------------------
    // VOO
    // --------------------------------------------------------

    if (config.voar) {

        componentes[
            "minecraft:movement.fly"
        ] = {};

        componentes[
            "minecraft:navigation.fly"
        ] = {

            can_path_over_water:
                true,

            can_sink:
                false,

            can_pass_doors:
                true
        };

        componentes[
            "minecraft:behavior.random_hover"
        ] = {

            priority:
                5,

            duration:
                4,

            speed_multiplier:
                1
        };
    }


    // --------------------------------------------------------
    // FOGO
    // --------------------------------------------------------

    if (config.fogo) {

        componentes[
            "minecraft:fire_immune"
        ] = {};

        componentes[
            "minecraft:damage_sensor"
        ] = {

            triggers: [

                {

                    cause:
                        "fire",

                    deals_damage:
                        false
                }
            ]
        };
    }


    return {

        format_version:
            "1.21.0",

        "minecraft:entity": {

            description: {

                identifier:
                    id,

                is_spawnable:
                    true,

                is_summonable:
                    true,

                is_experimental:
                    false
            },

            components:
                componentes
        }
    };
}


// ============================================================
// MODELO DA ENTIDADE
// ============================================================

function criarModeloEntidade() {

    return {

        format_version:
            "1.12.0",

        "minecraft:geometry": [

            {

                description: {

                    identifier:
                        "geometry.guardachuva_mob",

                    texture_width:
                        64,

                    texture_height:
                        64,

                    visible_bounds_width:
                        2,

                    visible_bounds_height:
                        3,

                    visible_bounds_offset:
                        [0, 1, 0]
                },

                bones: [

                    {

                        name:
                            "body",

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

                        name:
                            "head",

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

                        name:
                            "right_leg",

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

                        name:
                            "left_leg",

                        pivot:
                            [2, 4, 0],

                        cubes: [

                            {

                                origin:
                                    [0, 0, -2],

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
// CLIENT ENTITY - RESOURCE PACK
// ============================================================

function criarClientEntity(id, nome) {

    return {

        format_version:
            "1.10.0",

        "minecraft:client_entity": {

            description: {

                identifier:
                    id,

                materials: {

                    default:
                        "entity_alphatest"
                },

                textures: {

                    default:
                        `textures/entity/${nome}`
                },

                geometry: {

                    default:
                        "geometry.guardachuva_mob"
                },

                render_controllers: [

                    "controller.render.default"
                ]
            }
        }
    };
}


// ============================================================
// SPAWN RULES
// ============================================================

function criarSpawnRules(id) {

    return {

        format_version:
            "1.21.0",

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

                        min:
                            0,

                        max:
                            15,

                        adjust_for_weather:
                            false
                    },

                    "minecraft:difficulty_filter": {

                        min:
                            "easy",

                        max:
                            "hard"
                    },

                    "minecraft:weight": {

                        default:
                            5
                    }
                }
            ]
        }
    };
}


// ============================================================
// ITEM - BEHAVIOR PACK
// ============================================================

function criarItemBP(id, nome) {

    return {

        format_version:
            "1.21.0",

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
// ITEM TEXTURE REGISTRY
// ============================================================

function criarItemTexture(nome) {

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
// BLOCO - BEHAVIOR PACK
// ============================================================

function criarBlocoBP(id) {

    return {

        format_version:
            "1.21.0",

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

                "minecraft:destructible_by_mining": {

                    seconds_to_destroy:
                        1
                },

                "minecraft:destructible_by_explosion": {

                    explosion_resistance:
                        1
                }
            }
        }
    };
}


// ============================================================
// BLOCKS.JSON - RESOURCE PACK
// ============================================================

function criarBlocksJSON(nome) {

    return {

        format_version:
            [1, 1, 0],

        [`guardachuva:${nome}_block`]: {

            sound:
                "stone",

            textures:
                nome
        }
    };
}


// ============================================================
// TERRAIN TEXTURE
// ============================================================

function criarTerrainTexture(nome) {

    return {

        resource_pack_name:
            "guardachuva",

        texture_name:
            "atlas.terrain",

        padding:
            8,

        num_mip_levels:
            4,

        texture_data: {

            [nome]: {

                textures:
                    `textures/blocks/${nome}`
            }
        }
    };
}


// ============================================================
// RECEITA DO ITEM
// ============================================================

function criarReceita(id) {

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
// LOOT
// ============================================================

function criarLoot() {

    return {

        pools: [

            {

                rolls:
                    1,

                entries: []
            }
        ]
    };
}


// ============================================================
// CRIAR BP E RP
// ============================================================

function criarPacks(descricao) {

    const config =
        interpretarDescricao(descricao);


    // --------------------------------------------------------
    // NOME
    // --------------------------------------------------------

    let nomeBase =
        descricao
            .replace(/^\/mc\s*/i, "")
            .trim()
            .split(/\s+/)
            .slice(0, 5)
            .join(" ");

    if (!nomeBase) {
        nomeBase = "Meu Addon";
    }

    const nome =
        nomeBase
            .replace(/[^\p{L}\p{N}\s_-]/gu, "")
            .trim() ||
        "Meu Addon";


    const nomeSlug =
        slug(nome);


    const bpUuid =
        uuid();

    const rpUuid =
        uuid();


    const projetoId =
        `${Date.now()}_${nomeSlug}`;


    const raiz =
        path.join(
            OUTPUT_DIR,
            projetoId
        );


    const bp =
        path.join(
            raiz,
            `${nomeSlug}_BP`
        );


    const rp =
        path.join(
            raiz,
            `${nomeSlug}_RP`
        );


    fs.mkdirSync(bp, {
        recursive:
            true
    });

    fs.mkdirSync(rp, {
        recursive:
            true
    });


    // ========================================================
    // MANIFESTS
    // ========================================================

    escreverArquivo(

        path.join(
            bp,
            "manifest.json"
        ),

        criarManifestBP(
            nome,
            bpUuid,
            rpUuid
        )
    );


    escreverArquivo(

        path.join(
            rp,
            "manifest.json"
        ),

        criarManifestRP(
            nome,
            rpUuid
        )
    );


    // ========================================================
    // DIRETÓRIOS BASE
    // ========================================================

    fs.mkdirSync(
        path.join(
            rp,
            "textures"
        ),
        {
            recursive:
                true
        }
    );


    fs.mkdirSync(
        path.join(
            rp,
            "textures",
            "items"
        ),
        {
            recursive:
                true
        }
    );


    fs.mkdirSync(
        path.join(
            rp,
            "textures",
            "blocks"
        ),
        {
            recursive:
                true
        }
    );


    fs.mkdirSync(
        path.join(
            rp,
            "textures",
            "entity"
        ),
        {
            recursive:
                true
        }
    );


    // ========================================================
    // ENTIDADE
    // ========================================================

    if (config.entidade) {

        const id =
            `guardachuva:${nomeSlug}`;


        escreverArquivo(

            path.join(
                bp,
                "entities",
                `${nomeSlug}.json`
            ),

            criarEntidadeBP(
                id,
                config
            )
        );


        escreverArquivo(

            path.join(
                bp,
                "spawn_rules",
                `${nomeSlug}.json`
            ),

            criarSpawnRules(
                id
            )
        );


        escreverArquivo(

            path.join(
                rp,
                "entity",
                `${nomeSlug}.entity.json`
            ),

            criarClientEntity(
                id,
                nomeSlug
            )
        );


        escreverArquivo(

            path.join(
                rp,
                "models",
                "entity",
                `${nomeSlug}.geo.json`
            ),

            criarModeloEntidade()
        );


        criarPNG(

            path.join(
                rp,
                "textures",
                "entity",
                `${nomeSlug}.png`
            )
        );
    }


    // ========================================================
    // ITEM
    // ========================================================

    if (config.item) {

        const itemId =
            `guardachuva:${nomeSlug}_item`;


        escreverArquivo(

            path.join(
                bp,
                "items",
                `${nomeSlug}_item.json`
            ),

            criarItemBP(
                itemId,
                nomeSlug
            )
        );


        criarPNG(

            path.join(
                rp,
                "textures",
                "items",
                `${nomeSlug}.png`
            )
        );


        escreverArquivo(

            path.join(
                rp,
                "textures",
                "item_texture.json"
            ),

            criarItemTexture(
                nomeSlug
            )
        );


        escreverArquivo(

            path.join(
                bp,
                "recipes",
                `${nomeSlug}_recipe.json`
            ),

            criarReceita(
                itemId
            )
        );
    }


    // ========================================================
    // BLOCO
    // ========================================================

    if (config.bloco) {

        const blocoId =
            `guardachuva:${nomeSlug}_block`;


        escreverArquivo(

            path.join(
                bp,
                "blocks",
                `${nomeSlug}_block.json`
            ),

            criarBlocoBP(
                blocoId
            )
        );


        criarPNG(

            path.join(
                rp,
                "textures",
                "blocks",
                `${nomeSlug}.png`
            )
        );


        escreverArquivo(

            path.join(
                rp,
                "blocks.json"
            ),

            criarBlocksJSON(
                nomeSlug
            )
        );


        escreverArquivo(

            path.join(
                rp,
                "textures",
                "terrain_texture.json"
            ),

            criarTerrainTexture(
                nomeSlug
            )
        );
    }


    // ========================================================
    // LOOT TABLE
    // ========================================================

    escreverArquivo(

        path.join(
            bp,
            "loot_tables",
            "entities",
            "default.json"
        ),

        criarLoot()
    );


    // ========================================================
    // INFORMAÇÕES
    // ========================================================

    escreverArquivo(

        path.join(
            raiz,
            "addon-info.json"
        ),

        {

            nome:

                nome,

            descricao:

                descricao,

            minecraft:

                MINECRAFT_VERSION,

            behavior_pack:

                path.basename(bp),

            resource_pack:

                path.basename(rp),

            recursos:

                {

                    entidade:
                        config.entidade,

                    item:
                        config.item,

                    bloco:
                        config.bloco,

                    fogo:
                        config.fogo,

                    voar:
                        config.voar,

                    rapido:
                        config.rapido,

                    forte:
                        config.forte
                },

            criado_em:

                new Date().toISOString()
        }
    );


    return {

        nome,

        nomeSlug,

        raiz,

        bp,

        rp,

        bpUuid,

        rpUuid,

        config
    };
}


// ============================================================
// CRIAR .MCPACK
// ============================================================

function criarMcpack(pasta, destino) {

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
                        zlib:
                            {
                                level:
                                    9
                            }
                    }
                );


            output.on(
                "close",
                () => {

                    resolve(
                        destino
                    );
                }
            );


            output.on(
                "error",
                reject
            );


            archive.on(
                "error",
                reject
            );


            archive.pipe(
                output
            );


            archive.directory(
                pasta,
                false
            );


            archive.finalize();
        }
    );
}


// ============================================================
// CRIAR .MCADDON
// ============================================================

function criarMcaddon(
    bpPack,
    rpPack,
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
                        zlib:
                            {
                                level:
                                    9
                            }
                    }
                );


            output.on(
                "close",
                () => {

                    resolve(
                        destino
                    );
                }
            );


            output.on(
                "error",
                reject
            );


            archive.on(
                "error",
                reject
            );


            archive.pipe(
                output
            );


            // ------------------------------------------------
            // BP .MCPACK
            // ------------------------------------------------

            archive.file(
                bpPack,
                {
                    name:
                        path.basename(
                            bpPack
                        )
                }
            );


            // ------------------------------------------------
            // RP .MCPACK
            // ------------------------------------------------

            archive.file(
                rpPack,
                {
                    name:
                        path.basename(
                            rpPack
                        )
                }
            );


            archive.finalize();
        }
    );
}


// ============================================================
// GERADOR PRINCIPAL
// ============================================================

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
        criarPacks(
            descricao
        );


    const bpPack =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_BP.mcpack`
        );


    const rpPack =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_RP.mcpack`
        );


    const mcaddon =
        path.join(
            OUTPUT_DIR,
            `${projeto.nomeSlug}_${Date.now()}.mcaddon`
        );


    // ========================================================
    // GERAR OS DOIS MCPACKS
    // ========================================================

    await criarMcpack(
        projeto.bp,
        bpPack
    );


    await criarMcpack(
        projeto.rp,
        rpPack
    );


    // ========================================================
    // GERAR MCADDON
    // ========================================================

    await criarMcaddon(
        bpPack,
        rpPack,
        mcaddon
    );


    return {

        nome:
            projeto.nome,

        arquivo:
            mcaddon,

        bp:
            bpPack,

        rp:
            rpPack,

        pasta:
            projeto.raiz,

        versao:
            MINECRAFT_VERSION
    };
}


// ============================================================
// EXPORTAÇÕES
// ============================================================

module.exports = {

    gerarAddon,

    criarPacks,

    MINECRAFT_VERSION
};
