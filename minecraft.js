// ============================================================
// GUARDA-CHUVA BOT
// minecraft.js V5
//
// GERADOR MINECRAFT BEDROCK
//
// Suporte:
//  - Itens
//  - Espadas
//  - Ferramentas
//  - Ícones
//  - Attachables
//  - Geometrias
//  - Texturas
//  - Render Controllers
//  - Blocos
//  - Mobs
//  - Spawn Eggs
//  - Behavior Pack
//  - Resource Pack
//  - MCPACK
//  - MCADDON
//
// Compatibilidade alvo:
// Minecraft Bedrock 1.26.x
// ============================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
const archiver = require("archiver");

const MINECRAFT_VERSION = "1.26.36.5";

const ROOT = path.join(__dirname, "minecraft");
const OUTPUT = path.join(ROOT, "addons");

fs.mkdirSync(OUTPUT, { recursive: true });


// ============================================================
// UTILIDADES
// ============================================================

function uuid() {
    return crypto.randomUUID();
}

function slug(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48) || "addon";
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function saveJSON(file, data) {
    ensureDir(path.dirname(file));

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}


// ============================================================
// PNG RGBA
// ============================================================

function makePNG(file, width, height, draw) {

    const rows = [];

    for (let y = 0; y < height; y++) {

        const row =
            Buffer.alloc(
                1 + width * 4
            );

        row[0] = 0;

        for (let x = 0; x < width; x++) {

            const color =
                draw(x, y) || [
                    0,
                    0,
                    0,
                    0
                ];

            const p =
                1 + x * 4;

            row[p] =
                color[0];

            row[p + 1] =
                color[1];

            row[p + 2] =
                color[2];

            row[p + 3] =
                color[3];
        }

        rows.push(row);
    }

    const raw =
        Buffer.concat(rows);

    const table = [];

    for (let n = 0; n < 256; n++) {

        let c = n;

        for (let k = 0; k < 8; k++) {

            c =
                (c & 1)
                    ? (
                        0xedb88320 ^
                        (c >>> 1)
                    )
                    : (
                        c >>> 1
                    );
        }

        table[n] =
            c >>> 0;
    }

    function crc32(buffer) {

        let crc =
            0xffffffff;

        for (const value of buffer) {

            crc =
                table[
                    (crc ^ value) & 255
                ] ^
                (crc >>> 8);
        }

        return (
            crc ^
            0xffffffff
        ) >>> 0;
    }

    function chunk(type, data) {

        const typeBuffer =
            Buffer.from(type);

        const length =
            Buffer.alloc(4);

        length.writeUInt32BE(
            data.length,
            0
        );

        const crc =
            Buffer.alloc(4);

        crc.writeUInt32BE(
            crc32(
                Buffer.concat([
                    typeBuffer,
                    data
                ])
            ),
            0
        );

        return Buffer.concat([
            length,
            typeBuffer,
            data,
            crc
        ]);
    }

    const ihdr =
        Buffer.alloc(13);

    ihdr.writeUInt32BE(
        width,
        0
    );

    ihdr.writeUInt32BE(
        height,
        4
    );

    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const png =
        Buffer.concat([

            Buffer.from([
                137,
                80,
                78,
                71,
                13,
                10,
                26,
                10
            ]),

            chunk(
                "IHDR",
                ihdr
            ),

            chunk(
                "IDAT",
                zlib.deflateSync(
                    raw,
                    {
                        level: 9
                    }
                )
            ),

            chunk(
                "IEND",
                Buffer.alloc(0)
            )
        ]);

    ensureDir(
        path.dirname(file)
    );

    fs.writeFileSync(
        file,
        png
    );
}


// ============================================================
// CORES
// ============================================================

function getColors(text) {

    const t =
        String(text)
            .toLowerCase();

    if (
        /vermelho|red/.test(t)
    ) {

        return {

            main: [
                225,
                30,
                30
            ],

            dark: [
                90,
                5,
                5
            ],

            light: [
                255,
                100,
                100
            ],

            base:
                "#e11e1e",

            overlay:
                "#5a0505"
        };
    }

    if (
        /azul|blue/.test(t)
    ) {

        return {

            main: [
                30,
                100,
                235
            ],

            dark: [
                5,
                30,
                100
            ],

            light: [
                100,
                170,
                255
            ],

            base:
                "#1e64eb",

            overlay:
                "#051e64"
        };
    }

    if (
        /verde|green/.test(t)
    ) {

        return {

            main: [
                30,
                190,
                70
            ],

            dark: [
                5,
                70,
                25
            ],

            light: [
                110,
                255,
                130
            ],

            base:
                "#1ebe46",

            overlay:
                "#054619"
        };
    }

    if (
        /amarelo|yellow/.test(t)
    ) {

        return {

            main: [
                240,
                205,
                20
            ],

            dark: [
                120,
                85,
                5
            ],

            light: [
                255,
                245,
                100
            ],

            base:
                "#f0cd14",

            overlay:
                "#785505"
        };
    }

    if (
        /roxo|purple/.test(t)
    ) {

        return {

            main: [
                150,
                45,
                220
            ],

            dark: [
                60,
                10,
                90
            ],

            light: [
                220,
                130,
                255
            ],

            base:
                "#962ddc",

            overlay:
                "#3c0a5a"
        };
    }

    return {

        main: [
            40,
            120,
            255
        ],

        dark: [
            10,
            35,
            100
        ],

        light: [
            120,
            180,
            255
        ],

        base:
            "#2878ff",

        overlay:
            "#0a2364"
    };
}


// ============================================================
// ÍCONE DO ITEM
// ============================================================

function makeItemIcon(file, colors) {

    makePNG(
        file,
        32,
        32,
        (x, y) => {

            let c = [
                0,
                0,
                0,
                0
            ];

            // lâmina
            if (
                x >= 13 &&
                x <= 18 &&
                y >= 3 &&
                y <= 22
            ) {

                c = [
                    colors.main[0],
                    colors.main[1],
                    colors.main[2],
                    255
                ];
            }

            // brilho
            if (
                x === 14 &&
                y >= 4 &&
                y <= 21
            ) {

                c = [
                    colors.light[0],
                    colors.light[1],
                    colors.light[2],
                    255
                ];
            }

            // guarda
            if (
                y >= 23 &&
                y <= 25 &&
                x >= 8 &&
                x <= 23
            ) {

                c = [
                    colors.dark[0],
                    colors.dark[1],
                    colors.dark[2],
                    255
                ];
            }

            // cabo
            if (
                x >= 14 &&
                x <= 17 &&
                y >= 25 &&
                y <= 30
            ) {

                c = [
                    100,
                    60,
                    30,
                    255
                ];
            }

            // pomo
            if (
                y >= 29 &&
                y <= 31 &&
                x >= 12 &&
                x <= 19
            ) {

                c = [
                    colors.dark[0],
                    colors.dark[1],
                    colors.dark[2],
                    255
                ];
            }

            return c;
        }
    );
}


// ============================================================
// TEXTURA DA ESPADA
// ============================================================

function makeSwordTexture(file, colors) {

    makePNG(
        file,
        32,
        32,
        (x, y) => {

            let c = [
                0,
                0,
                0,
                0
            ];

            // lâmina
            if (
                x >= 13 &&
                x <= 18 &&
                y >= 1 &&
                y <= 22
            ) {

                c = [
                    colors.main[0],
                    colors.main[1],
                    colors.main[2],
                    255
                ];
            }

            // ponta
            if (
                y >= 22 &&
                y <= 24 &&
                x >= 14 &&
                x <= 17
            ) {

                c = [
                    colors.main[0],
                    colors.main[1],
                    colors.main[2],
                    255
                ];
            }

            // brilho
            if (
                x === 14 &&
                y >= 2 &&
                y <= 21
            ) {

                c = [
                    colors.light[0],
                    colors.light[1],
                    colors.light[2],
                    255
                ];
            }

            // guarda
            if (
                y >= 24 &&
                y <= 26 &&
                x >= 7 &&
                x <= 24
            ) {

                c = [
                    colors.dark[0],
                    colors.dark[1],
                    colors.dark[2],
                    255
                ];
            }

            // cabo
            if (
                x >= 14 &&
                x <= 17 &&
                y >= 27
            ) {

                c = [
                    100,
                    60,
                    30,
                    255
                ];
            }

            return c;
        }
    );
}
// ============================================================
// CONTINUAÇÃO: TEXTURA DA ESPADA
// ============================================================

function makeSwordTexture(file, colors) {

    makePNG(file, (x, y) => {

        let c = [
            0,
            0,
            0,
            0
        ];

        // Lâmina principal
        if (
            x >= 13 &&
            x <= 18 &&
            y >= 1 &&
            y <= 22
        ) {
            c = [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // Ponta
        if (
            y === 23 &&
            x >= 14 &&
            x <= 17
        ) {
            c = [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // Brilho da lâmina
        if (
            x === 14 &&
            y >= 2 &&
            y <= 21
        ) {
            c = [
                colors.light[0],
                colors.light[1],
                colors.light[2],
                255
            ];
        }

        // Guarda
        if (
            y >= 24 &&
            y <= 26 &&
            x >= 7 &&
            x <= 24
        ) {
            c = [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        // Cabo
        if (
            x >= 14 &&
            x <= 17 &&
            y >= 27 &&
            y <= 30
        ) {
            c = [
                100,
                60,
                30,
                255
            ];
        }

        // Pomo
        if (
            y === 31 &&
            x >= 12 &&
            x <= 19
        ) {
            c = [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        return c;
    });
}


// ============================================================
// TEXTURA GENÉRICA
// ============================================================

function makeGenericTexture(file, colors) {

    makePNG(file, (x, y) => {

        // Borda
        if (
            x === 0 ||
            y === 0 ||
            x === 31 ||
            y === 31
        ) {
            return [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        // Interior
        return [
            colors.main[0],
            colors.main[1],
            colors.main[2],
            255
        ];
    });
}


// ============================================================
// TEXTURA DO MOB
// ============================================================

function makeMobTexture(file, colors) {

    makePNG(file, (x, y) => {

        // Cabeça
        if (
            x >= 8 &&
            x <= 23 &&
            y >= 3 &&
            y <= 15
        ) {
            return [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // Olho esquerdo
        if (
            x >= 11 &&
            x <= 13 &&
            y >= 7 &&
            y <= 9
        ) {
            return [
                255,
                255,
                255,
                255
            ];
        }

        // Olho direito
        if (
            x >= 18 &&
            x <= 20 &&
            y >= 7 &&
            y <= 9
        ) {
            return [
                255,
                255,
                255,
                255
            ];
        }

        // Corpo
        if (
            x >= 7 &&
            x <= 24 &&
            y >= 14 &&
            y <= 25
        ) {
            return [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // Perna esquerda
        if (
            x >= 8 &&
            x <= 13 &&
            y >= 24 &&
            y <= 31
        ) {
            return [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        // Perna direita
        if (
            x >= 18 &&
            x <= 23 &&
            y >= 24 &&
            y <= 31
        ) {
            return [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        return [
            colors.dark[0],
            colors.dark[1],
            colors.dark[2],
            255
        ];
    });
}


// ============================================================
// INTERPRETADOR DA DESCRIÇÃO
// ============================================================

function parseDescription(description) {

    const text =
        String(description || "")
            .toLowerCase();

    const result = {

        item: false,

        weapon: false,

        sword: false,

        tool: false,

        block: false,

        mob: false,

        spawnEgg: false,

        flying: false,

        fire: false,

        fast: false,

        enchanted: false,

        health: 20,

        damage: 4
    };


    // --------------------------------------------------------
    // ITEM
    // --------------------------------------------------------

    if (
        /item|espada|machado|picareta|pa |pá |enxada|arco|arma|varinha|cristal|anel|comida/
            .test(text)
    ) {
        result.item = true;
    }


    // --------------------------------------------------------
    // ARMAS
    // --------------------------------------------------------

    if (
        /espada|arma|machado|arco|varinha/
            .test(text)
    ) {
        result.weapon = true;
    }


    // --------------------------------------------------------
    // ESPADA
    // --------------------------------------------------------

    if (
        /espada/
            .test(text)
    ) {
        result.sword = true;
    }


    // --------------------------------------------------------
    // FERRAMENTAS
    // --------------------------------------------------------

    if (
        /picareta|machado|pá |pa |enxada/
            .test(text)
    ) {
        result.tool = true;
        result.item = true;
    }


    // --------------------------------------------------------
    // BLOCO
    // --------------------------------------------------------

    if (
        /bloco|block|minério|minerio|pedra|cristal bloco/
            .test(text)
    ) {
        result.block = true;
    }


    // --------------------------------------------------------
    // MOB
    // --------------------------------------------------------

    if (
        /dragão|dragao|mob|monstro|criatura|entidade|zumbi|boss|animal|alien|golem|demônio|demonio|robo|robô|cavaleiro/
            .test(text)
    ) {
        result.mob = true;
    }


    // --------------------------------------------------------
    // SPAWN EGG
    // --------------------------------------------------------

    if (
        /ovo|spawn egg|ovo de spawn|invocar|summon/
            .test(text)
    ) {
        result.spawnEgg = true;
    }


    // Se for mob, gera spawn egg automaticamente
    if (result.mob) {
        result.spawnEgg = true;
    }


    // --------------------------------------------------------
    // VOO
    // --------------------------------------------------------

    if (
        /voa|voar|voando|voador|voe|voo/
            .test(text)
    ) {
        result.flying = true;
    }


    // --------------------------------------------------------
    // FOGO
    // --------------------------------------------------------

    if (
        /fogo|fire|chama|queima|queimar|lava|flame/
            .test(text)
    ) {
        result.fire = true;
    }


    // --------------------------------------------------------
    // VELOCIDADE
    // --------------------------------------------------------

    if (
        /rápido|rapido|veloz|velocidade|speed/
            .test(text)
    ) {
        result.fast = true;
    }


    // --------------------------------------------------------
    // ENCANTAMENTO
    // --------------------------------------------------------

    if (
        /encantado|encantamento|enchant|mágico|magico/
            .test(text)
    ) {
        result.enchanted = true;
    }


    // --------------------------------------------------------
    // VIDA
    // --------------------------------------------------------

    const hp =
        text.match(
            /(\d+)\s*(?:de\s*)?(?:vida|vidas|hp)/
        );

    if (hp) {

        result.health =
            Math.max(
                1,
                Math.min(
                    100000,
                    Number(hp[1])
                )
            );
    }


    // --------------------------------------------------------
    // DANO
    // --------------------------------------------------------

    const dmg =
        text.match(
            /(\d+)\s*(?:de\s*)?(?:dano|damage)/
        );

    if (dmg) {

        result.damage =
            Math.max(
                1,
                Math.min(
                    10000,
                    Number(dmg[1])
                )
            );
    }


    return result;
}


// ============================================================
// MANIFEST DO BEHAVIOR PACK
// ============================================================

function makeBPManifest(
    name,
    bpUUID,
    rpUUID
) {

    return {

        format_version: 2,

        header: {

            name:
                `${name} - Behavior Pack`,

            description:
                `Gerado pelo Guarda-Chuva Bot - Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                bpUUID,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
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
                    rpUUID,

                version:
                    [1, 0, 0]
            }
        ]
    };
}


// ============================================================
// MANIFEST DO RESOURCE PACK
// ============================================================

function makeRPManifest(
    name,
    rpUUID
) {

    return {

        format_version: 2,

        header: {

            name:
                `${name} - Resource Pack`,

            description:
                `Gerado pelo Guarda-Chuva Bot - Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                rpUUID,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
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
// ITEM BP
//
// CORREÇÃO IMPORTANTE:
// minecraft:icon usa uma chave simples.
//
// Exemplo:
//
// "minecraft:icon": {
//     "texture": "espada_vermelha"
// }
//
// E item_texture.json usa exatamente:
// "espada_vermelha": {
//     "textures": "textures/items/espada_vermelha"
// }
//
// Não usamos "guardachuva:espada_vermelha"
// como chave do ícone.
// ============================================================

function makeItemBP(
    identifier,
    iconKey,
    damage,
    displayName,
    isWeapon
) {

    const components = {

        "minecraft:max_stack_size":
            1,

        "minecraft:icon": {

            texture:
                iconKey
        },

        "minecraft:display_name": {

            value:
                displayName
        }
    };


    // --------------------------------------------------------
    // Item equipado na mão
    // --------------------------------------------------------

    if (isWeapon) {

        components[
            "minecraft:hand_equipped"
        ] = true;
    }


    // --------------------------------------------------------
    // Dano da arma
    // --------------------------------------------------------

    if (
        isWeapon &&
        damage > 0
    ) {

        components[
            "minecraft:damage"
        ] = damage;
    }


    return {

        format_version:
            "1.21.30",

        "minecraft:item": {

            description: {

                identifier:
                    identifier,

                menu_category: {

                    category:
                        "items"
                }
            },

            components
        }
    };
}


// ============================================================
// ITEM_TEXTURE.JSON
//
// A CHAVE precisa ser exatamente igual ao valor:
// minecraft:icon.texture
// ============================================================

function makeItemTextureJSON(
    iconKey,
    texturePath
) {

    return {

        resource_pack_name:
            "Guarda-Chuva",

        texture_name:
            "atlas.items",

        texture_data: {

            [iconKey]: {

                textures:
                    texturePath
            }
        }
    };
}


// ============================================================
// ITEM ICONS JSON
//
// Arquivo adicional para compatibilidade.
// ============================================================

function makeItemIconsJSON(
    itemIdentifier,
    iconKey
) {

    return {

        resource_pack_name:
            "Guarda-Chuva",

        texture_name:
            "atlas.items",

        texture_data: {

            [iconKey]: {

                textures:
                    `textures/items/${iconKey}`
            }
        },

        items: {

            [itemIdentifier]: {

                icon:
                    iconKey
            }
        }
    };
}


// ============================================================
// GEOMETRIA SIMPLES DA ESPADA
//
// Esta geometria fica disponível para futuras versões
// que precisem de modelo personalizado.
// ============================================================

function makeSwordGeometry(
    geometryName
) {

    return {

        format_version:
            "1.16.0",

        "minecraft:geometry": [

            {

                description: {

                    identifier:
                        geometryName,

                    texture_width:
                        32,

                    texture_height:
                        32,

                    visible_bounds_width:
                        3,

                    visible_bounds_height:
                        4,

                    visible_bounds_offset:
                        [0, 1, 0]
                },

                bones: [

                    {

                        name:
                            "bb_main",

                        pivot:
                            [0, 19, -6],

                        cubes: [

                            {

                                origin:
                                    [-1, 9, -8],

                                size:
                                    [2, 16, 3],

                                uv:
                                    [0, 0]
                            },

                            {

                                origin:
                                    [-1, 25, -8],

                                size:
                                    [2, 4, 3],

                                uv:
                                    [4, 0]
                            },

                            {

                                origin:
                                    [-4, 29, -8],

                                size:
                                    [8, 2, 3],

                                uv:
                                    [8, 0]
                            },

                            {

                                origin:
                                    [-1, 31, -8],

                                size:
                                    [2, 6, 3],

                                uv:
                                    [18, 0]
                            }
                        ]
                    }
                ]
            }
        ] 
        // ============================================================
// RENDER CONTROLLER DO ITEM
// ============================================================

function makeItemRenderController() {

    return {

        format_version:
            "1.8.0",

        render_controllers: {

            "controller.render.item_default": {

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
// BLOCO - BEHAVIOR PACK
// ============================================================

function makeBlockBP(
    identifier
) {

    return {

        format_version:
            "1.21.20",

        "minecraft:block": {

            description: {

                identifier:
                    identifier,

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
                },

                "minecraft:geometry":
                    "geometry.full_block",

                "minecraft:material_instances": {

                    "*": {

                        texture:
                            "custom_block",

                        render_method:
                            "opaque"
                    }
                }
            }
        }
    };
}


// ============================================================
// TERRAIN TEXTURE
// ============================================================

function makeTerrainTexture(
    textureName
) {

    return {

        resource_pack_name:
            "Guarda-Chuva",

        texture_name:
            "atlas.terrain",

        padding:
            8,

        num_mip_levels:
            4,

        texture_data: {

            custom_block: {

                textures:
                    `textures/blocks/${textureName}`
            }
        }
    };
}


// ============================================================
// BLOCKS.JSON
// ============================================================

function makeBlocksJSON(
    identifier
) {

    return {

        format_version:
            "1.19.30",

        [identifier]: {

            sound:
                "stone",

            textures:
                "custom_block"
        }
    };
}


// ============================================================
// GEOMETRIA DE BLOCO
// ============================================================

function makeBlockGeometry() {

    return {

        format_version:
            "1.12.0",

        "minecraft:geometry": [

            {

                description: {

                    identifier:
                        "geometry.full_block",

                    texture_width:
                        16,

                    texture_height:
                        16,

                    visible_bounds_width:
                        2,

                    visible_bounds_height:
                        2,

                    visible_bounds_offset:
                        [0, 0.5, 0]
                },

                bones: [

                    {

                        name:
                            "bb_main",

                        pivot:
                            [0, 0, 0],

                        cubes: [

                            {

                                origin:
                                    [-8, 0, -8],

                                size:
                                    [16, 16, 16],

                                uv:
                                    [0, 0]
                            }
                        ]
                    }
                ]
            }
        ]
    };
}


// ============================================================
// MOB GEOMETRY
// ============================================================

function makeMobGeometry(
    geometryName
) {

    return {

        format_version:
            "1.16.0",

        "minecraft:geometry": [

            {

                description: {

                    identifier:
                        geometryName,

                    texture_width:
                        64,

                    texture_height:
                        64,

                    visible_bounds_width:
                        2.5,

                    visible_bounds_height:
                        3.5,

                    visible_bounds_offset:
                        [0, 1, 0]
                },

                bones: [

                    // ----------------------------------------
                    // CORPO
                    // ----------------------------------------

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
                                    [8, 10, 4],

                                uv:
                                    [0, 0]
                            }
                        ]
                    },

                    // ----------------------------------------
                    // CABEÇA
                    // ----------------------------------------

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

                    // ----------------------------------------
                    // PERNA ESQUERDA
                    // ----------------------------------------

                    {

                        name:
                            "leg_left",

                        pivot:
                            [2, 4, 0],

                        cubes: [

                            {

                                origin:
                                    [1, 0, -2],

                                size:
                                    [3, 5, 4],

                                uv:
                                    [32, 0]
                            }
                        ]
                    },

                    // ----------------------------------------
                    // PERNA DIREITA
                    // ----------------------------------------

                    {

                        name:
                            "leg_right",

                        pivot:
                            [-2, 4, 0],

                        cubes: [

                            {

                                origin:
                                    [-4, 0, -2],

                                size:
                                    [3, 5, 4],

                                uv:
                                    [32, 8]
                            }
                        ]
                    },

                    // ----------------------------------------
                    // BRAÇO ESQUERDO
                    // ----------------------------------------

                    {

                        name:
                            "arm_left",

                        pivot:
                            [5, 13, 0],

                        cubes: [

                            {

                                origin:
                                    [4, 8, -2],

                                size:
                                    [3, 8, 4],

                                uv:
                                    [40, 0]
                            }
                        ]
                    },

                    // ----------------------------------------
                    // BRAÇO DIREITO
                    // ----------------------------------------

                    {

                        name:
                            "arm_right",

                        pivot:
                            [-5, 13, 0],

                        cubes: [

                            {

                                origin:
                                    [-7, 8, -2],

                                size:
                                    [3, 8, 4],

                                uv:
                                    [40, 12]
                            }
                        ]
                    }
                ]
            }
        ]
    };
}


// ============================================================
// MOB - BEHAVIOR PACK
// ============================================================

function makeMobBP(
    identifier,
    config
) {

    const components = {

        "minecraft:type_family": {

            family: [
                "guardachuva_custom"
            ]
        },

        "minecraft:health": {

            value:
                config.health,

            max:
                config.health
        },

        "minecraft:collision_box": {

            width:
                0.8,

            height:
                1.8
        },

        "minecraft:physics": {},

        "minecraft:nameable": {},

        "minecraft:movement": {

            value:
                config.fast
                    ? 0.5
                    : 0.25
        },

        "minecraft:attack": {

            damage:
                config.damage
        },

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


    // ========================================================
    // MOB VOADOR
    // ========================================================

    if (config.flying) {

        components[
            "minecraft:movement.fly"
        ] = {};

        components[
            "minecraft:navigation.fly"
        ] = {

            can_path_over_water:
                true,

            can_sink:
                false,

            can_pass_doors:
                true
        };

        components[
            "minecraft:behavior.random_hover"
        ] = {

            priority:
                5,

            duration:
                4,

            speed_multiplier:
                config.fast
                    ? 1.5
                    : 1
        };
    }


    // ========================================================
    // IMUNIDADE AO FOGO
    // ========================================================

    if (config.fire) {

        components[
            "minecraft:fire_immune"
        ] = {};

        components[
            "minecraft:damage_sensor"
        ] = {

            triggers: [

                {

                    cause:
                        "fire",

                    deals_damage:
                        false
                },

                {

                    cause:
                        "fire_tick",

                    deals_damage:
                        false
                }
            ]
        };
    }


    return {

        format_version:
            "1.21.30",

        "minecraft:entity": {

            description: {

                identifier:
                    identifier,

                is_spawnable:
                    true,

                is_summonable:
                    true
            },

            components:
                components
        }
    };
}


// ============================================================
// CLIENT ENTITY
// ============================================================

function makeClientEntity(
    identifier,
    geometryName,
    textureName,
    colors
) {

    return {

        format_version:
            "1.10.0",

        "minecraft:client_entity": {

            description: {

                identifier:
                    identifier,

                min_engine_version:
                    "1.21.0",

                materials: {

                    default:
                        "entity"
                },

                textures: {

                    default:
                        `textures/entity/${textureName}`
                },

                geometry: {

                    default:
                        geometryName
                },

                render_controllers: [

                    `controller.render.${textureName}`
                ],

                spawn_egg: {

                    base_color:
                        colors.base,

                    overlay_color:
                        colors.overlay
                }
            }
        }
    };
}


// ============================================================
// MOB RENDER CONTROLLER
// ============================================================

function makeMobRenderController(
    name
) {

    return {

        format_version:
            "1.8.0",

        render_controllers: {

            [`controller.render.${name}`]: {

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
// SPAWN RULES
// ============================================================

function makeSpawnRules(
    identifier
) {

    return {

        format_version:
            "1.21.0",

        "minecraft:spawn_rules": {

            description: {

                identifier:
                    identifier,

                population_control:
                    "animal"
            },

            conditions: [

                {

                    "minecraft:brightness_filter": {

                        min:
                            0,

                        max:
                            15
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
    
    };
    }
// ============================================================
// SPAWN EGG
// ============================================================

function makeSpawnEggTexture(
    file,
    colors
) {

    makePNG(file, (x, y) => {

        // fundo transparente
        let c = [
            0,
            0,
            0,
            0
        ];

        // ovo
        const dx = x - 15.5;
        const dy = y - 15.5;

        if (
            (dx * dx) / 120 +
            (dy * dy) / 170 <= 1
        ) {

            c = [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // parte clara
        if (
            x >= 11 &&
            x <= 17 &&
            y >= 7 &&
            y <= 12
        ) {

            c = [
                colors.light[0],
                colors.light[1],
                colors.light[2],
                255
            ];
        }

        // mancha
        if (
            x >= 18 &&
            x <= 22 &&
            y >= 17 &&
            y <= 22
        ) {

            c = [
                colors.dark[0],
                colors.dark[1],
                colors.dark[2],
                255
            ];
        }

        return c;
    });
}


// ============================================================
// TEXTURE PACK COMPLETA
// ============================================================

function makeItemTexturePack(
    RP,
    itemName,
    itemIdentifier
) {

    const file =
        path.join(
            RP,
            "textures",
            "item_texture.json"
        );

    let data = {

        resource_pack_name:
            "Guarda-Chuva",

        texture_name:
            "atlas.items",

        texture_data: {}
    };

    if (fs.existsSync(file)) {

        try {

            data =
                JSON.parse(
                    fs.readFileSync(
                        file,
                        "utf8"
                    )
                );

        } catch {

            data = {

                resource_pack_name:
                    "Guarda-Chuva",

                texture_name:
                    "atlas.items",

                texture_data: {}
            };
        }
    }

    if (!data.texture_data) {

        data.texture_data = {};
    }

    data.texture_data[itemIdentifier] = {

        textures:
            `textures/items/${itemName}_ico`
    };

    saveJSON(
        file,
        data
    );
}


// ============================================================
// CRIAR PROJETO COMPLETO
// ============================================================

function createProject(description) {

    const config =
        parseDescription(
            description
        );

    const colors =
        getColors(
            description
        );

    const original =
        String(
            description || ""
        ).trim();


    const clean =
        original
            .replace(
                /^\/mc(?:addon)?\s*/i,
                ""
            )
            .trim();


    const name =
        clean
            .split(/\s+/)
            .slice(0, 8)
            .join(" ")
            ||
            "Meu Addon";


    const nameSlug =
        slug(name);


    const namespace =
        "guardachuva";


    const bpUUID =
        uuid();


    const rpUUID =
        uuid();


    const identifier =
        `${namespace}:${nameSlug}`;


    const projectDir =
        path.join(
            OUTPUT,
            `${nameSlug}_${Date.now()}`
        );


    const BP =
        path.join(
            projectDir,
            `${nameSlug}_BP`
        );


    const RP =
        path.join(
            projectDir,
            `${nameSlug}_RP`
        );


    ensureDir(BP);
    ensureDir(RP);


    // ========================================================
    // MANIFEST BP
    // ========================================================

    saveJSON(

        path.join(
            BP,
            "manifest.json"
        ),

        makeBPManifest(
            name,
            bpUUID,
            rpUUID
        )
    );


    // ========================================================
    // MANIFEST RP
    // ========================================================

    saveJSON(

        path.join(
            RP,
            "manifest.json"
        ),

        makeRPManifest(
            name,
            rpUUID
        )
    );


    // ========================================================
    // ITEM
    // ========================================================

    if (config.item) {

        const itemName =
            `${nameSlug}_item`;


        const itemIdentifier =
            `${namespace}:${itemName}`;


        const geometryName =
            `geometry.${itemName}`;


        // ----------------------------------------------------
        // ITEM BP
        // ----------------------------------------------------

        saveJSON(

            path.join(
                BP,
                "items",
                `${itemName}.json`
            ),

            makeItemBP(
                itemIdentifier,
                itemIdentifier,
                config.weapon
                    ? config.damage
                    : 0
            )
        );


        // ----------------------------------------------------
        // TEXTURA DO ITEM
        // ----------------------------------------------------

        if (config.sword) {

            makeSwordTexture(

                path.join(
                    RP,
                    "textures",
                    "items",
                    `${itemName}.png`
                ),

                colors
            );

        } else {

            makeGenericTexture(

                path.join(
                    RP,
                    "textures",
                    "items",
                    `${itemName}.png`
                ),

                colors
            );
        }


        // ----------------------------------------------------
        // ÍCONE
        // ----------------------------------------------------

        makeItemIcon(

            path.join(
                RP,
                "textures",
                "items",
                `${itemName}_ico.png`
            ),

            colors
        );


        // ----------------------------------------------------
        // ITEM_TEXTURE.JSON
        // ----------------------------------------------------

        makeItemTexturePack(

            RP,
            itemName,
            itemIdentifier
        );


        // ----------------------------------------------------
        // GEOMETRIA
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "models",
                "entity",
                `${itemName}.geo.json`
            ),

            makeSwordGeometry(
                geometryName
            )
        );


        // ----------------------------------------------------
        // ATTACHABLE
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "attachables",
                `${itemName}.json`
            ),

            makeSwordAttachable(
                itemIdentifier,
                geometryName
            )
        );


        // ----------------------------------------------------
        // RENDER CONTROLLER
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "render_controllers",
                `${itemName}.render_controllers.json`
            ),

            makeItemRenderController()
        );
    }


    // ========================================================
    // BLOCO
    // ========================================================

    if (config.block) {

        const blockName =
            `${nameSlug}_block`;


        const blockIdentifier =
            `${namespace}:${blockName}`;


        // ----------------------------------------------------
        // BEHAVIOR
        // ----------------------------------------------------

        saveJSON(

            path.join(
                BP,
                "blocks",
                `${blockName}.json`
            ),

            makeBlockBP(
                blockIdentifier
            )
        );


        // ----------------------------------------------------
        // TEXTURA
        // ----------------------------------------------------

        makeGenericTexture(

            path.join(
                RP,
                "textures",
                "blocks",
                `${blockName}.png`
            ),

            colors
        );


        // ----------------------------------------------------
        // TERRAIN
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "textures",
                "terrain_texture.json"
            ),

            makeTerrainTexture(
                blockName
            )
        );


        // ----------------------------------------------------
        // BLOCKS.JSON
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "blocks.json"
            ),

            makeBlocksJSON(
                blockIdentifier
            )
        );


        // ----------------------------------------------------
        // GEOMETRIA DO BLOCO
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "models",
                "blocks",
                "full_block.geo.json"
            ),

            makeBlockGeometry()
        );
    }


    // ========================================================
    // MOB
    // ========================================================

    if (config.mob) {

        const mobName =
            nameSlug;


        const mobIdentifier =
            `${namespace}:${mobName}`;


        const geometryName =
            `geometry.${mobName}`;


        // ----------------------------------------------------
        // BEHAVIOR ENTITY
        // ----------------------------------------------------

        saveJSON(

            path.join(
                BP,
                "entities",
                `${mobName}.json`
            ),

            makeMobBP(
                mobIdentifier,
                config
            )
        );


        // ----------------------------------------------------
        // SPAWN RULES
        // ----------------------------------------------------

        saveJSON(

            path.join(
                BP,
                "spawn_rules",
                `${mobName}.json`
            ),

            makeSpawnRules(
                mobIdentifier
            )
        );


        // ----------------------------------------------------
        // TEXTURA DO MOB
        // ----------------------------------------------------

        makeMobTexture(

            path.join(
                RP,
                "textures",
                "entity",
                `${mobName}.png`
            ),

            colors
        );


        // ----------------------------------------------------
        // GEOMETRIA DO MOB
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "models",
                "entity",
                `${mobName}.geo.json`
            ),

            makeMobGeometry(
                geometryName
            )
        );


        // ----------------------------------------------------
        // CLIENT ENTITY
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "entity",
                `${mobName}.entity.json`
            ),

            makeClientEntity(
                mobIdentifier,
                geometryName,
                mobName,
                colors
            )
        );


        // ----------------------------------------------------
        // RENDER CONTROLLER
        // ----------------------------------------------------

        saveJSON(

            path.join(
                RP,
                "render_controllers",
                `${mobName}.render_controllers.json`
            ),

            makeMobRenderController(
                mobName
            )
        );


        // ----------------------------------------------------
        // SPAWN EGG
        // ----------------------------------------------------

        makeSpawnEggTexture(

            path.join(
                RP,
                "textures",
                "items",
                `${mobName}_spawn_egg.png`
            ),

            colors
        );
    }


    // ========================================================
    // INFORMAÇÕES DO PROJETO
    // ========================================================

    saveJSON(

        path.join(
            projectDir,
            "addon-info.json"
        ),

        {

            name:
                name,

            description:
                original,

            namespace:
                namespace,

            minecraft_version:
                MINECRAFT_VERSION,

            behavior_pack_uuid:
                bpUUID,

            resource_pack_uuid:
                rpUUID,

            identifier:
                identifier,

            features:
                config,

            created_at:
                new Date().toISOString()
        }
    );


    return {

        name:
            name,

        nameSlug:
            nameSlug,

        identifier:
            identifier,

        projectDir:
            projectDir,

        BP:
            BP,

        RP:
            RP,

        bpUUID:
            bpUUID,

        rpUUID:
            rpUUID,

        config:
            config
    };
                        }
// ============================================================
// ZIP DE UMA PASTA
// ============================================================

function zipFolder(
    folder,
    output
) {

    return new Promise(
        (resolve, reject) => {

            const stream =
                fs.createWriteStream(
                    output
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


            stream.on(
                "close",
                () => {

                    resolve(output);
                }
            );


            stream.on(
                "error",
                reject
            );


            archive.on(
                "error",
                reject
            );


            archive.pipe(stream);


            archive.directory(
                folder,
                false
            );


            archive.finalize();
        }
    );
}


// ============================================================
// CRIAR MCADDON
//
// O .mcaddon contém:
//   - Behavior Pack .mcpack
//   - Resource Pack .mcpack
// ============================================================

function makeMCAddon(
    bpPack,
    rpPack,
    output
) {

    return new Promise(
        (resolve, reject) => {

            const stream =
                fs.createWriteStream(
                    output
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


            stream.on(
                "close",
                () => {

                    resolve(output);
                }
            );


            stream.on(
                "error",
                reject
            );


            archive.on(
                "error",
                reject
            );


            archive.pipe(stream);


            archive.file(
                bpPack,
                {
                    name:
                        path.basename(bpPack)
                }
            );


            archive.file(
                rpPack,
                {
                    name:
                        path.basename(rpPack)
                }
            );


            archive.finalize();
        }
    );
}


// ============================================================
// VERIFICAR ARQUIVO
// ============================================================

function fileExists(file) {

    try {

        return (
            fs.existsSync(file) &&
            fs.statSync(file).isFile()
        );

    } catch {

        return false;
    }
}


// ============================================================
// GERADOR PRINCIPAL
// ============================================================

async function gerarAddon(
    description
) {

    if (
        !description ||
        !String(description).trim()
    ) {

        throw new Error(
            "Descreva o addon Minecraft que deseja criar."
        );
    }


    // --------------------------------------------------------
    // CRIAR PROJETO
    // --------------------------------------------------------

    const project =
        createProject(
            description
        );


    // --------------------------------------------------------
    // NOMES DOS PACKS
    // --------------------------------------------------------

    const bpPack =
        path.join(
            OUTPUT,
            `${project.nameSlug}_BP.mcpack`
        );


    const rpPack =
        path.join(
            OUTPUT,
            `${project.nameSlug}_RP.mcpack`
        );


    const addon =
        path.join(
            OUTPUT,
            `${project.nameSlug}_${Date.now()}.mcaddon`
        );


    // --------------------------------------------------------
    // CRIAR BP
    // --------------------------------------------------------

    await zipFolder(
        project.BP,
        bpPack
    );


    // --------------------------------------------------------
    // CRIAR RP
    // --------------------------------------------------------

    await zipFolder(
        project.RP,
        rpPack
    );


    // --------------------------------------------------------
    // CRIAR MCADDON
    // --------------------------------------------------------

    await makeMCAddon(
        bpPack,
        rpPack,
        addon
    );


    // --------------------------------------------------------
    // VERIFICAÇÃO
    // --------------------------------------------------------

    if (!fileExists(bpPack)) {

        throw new Error(
            "O Behavior Pack não foi criado corretamente."
        );
    }


    if (!fileExists(rpPack)) {

        throw new Error(
            "O Resource Pack não foi criado corretamente."
        );
    }


    if (!fileExists(addon)) {

        throw new Error(
            "O MCADDON não foi criado corretamente."
        );
    }


    // --------------------------------------------------------
    // RESULTADO
    // --------------------------------------------------------

    return {

        sucesso:
            true,

        nome:
            project.name,

        versao:
            MINECRAFT_VERSION,

        arquivo:
            addon,

        mcaddon:
            addon,

        behavior_pack:
            bpPack,

        resource_pack:
            rpPack,

        pasta:
            project.projectDir,

        identificador:
            project.identifier,

        features:
            project.config
    };
}


// ============================================================
// TESTE DO GERADOR
// ============================================================

async function testarGerador() {

    const teste =
        await gerarAddon(
            "espada vermelha com 8 de dano"
        );


    return teste;
}


// ============================================================
// EXPORTAÇÃO
// ============================================================

module.exports = {

    gerarAddon,

    createProject,

    parseDescription,

    MINECRAFT_VERSION
};


// ============================================================
// EXECUÇÃO DIRETA
//
// Se executar:
//
// node minecraft.js
//
// será criado um addon de teste.
// ============================================================

if (
    require.main === module
) {

    testarGerador()

        .then(
            resultado => {

                console.log(
                    "\n===================================="
                );

                console.log(
                    "   MINECRAFT ADDON GERADO"
                );

                console.log(
                    "===================================="
                );

                console.log(
                    "Nome:",
                    resultado.nome
                );

                console.log(
                    "Minecraft:",
                    resultado.versao
                );

                console.log(
                    "MCADDON:",
                    resultado.mcaddon
                );

                console.log(
                    "BP:",
                    resultado.behavior_pack
                );

                console.log(
                    "RP:",
                    resultado.resource_pack
                );

                console.log(
                    "====================================\n"
                );
            }
        )

        .catch(
            error => {

                console.error(
                    "\nERRO AO GERAR ADDON:"
                );

                console.error(
                    error
                );

                process.exit(1);
            }
        );
        } 
