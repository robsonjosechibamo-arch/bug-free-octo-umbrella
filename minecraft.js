// ============================================================
// GUARDA-CHUVA BOT
// minecraft.js V4
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

function saveText(file, data) {
    ensureDir(path.dirname(file));

    fs.writeFileSync(
        file,
        data,
        "utf8"
    );
}


// ============================================================
// PNG
//
// PNG RGBA válido.
// Não depende de imagens externas.
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

function pngChunk(type, data) {

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

function makePNG(file, draw) {

    const width = 32;
    const height = 32;

    const rows = [];

    for (let y = 0; y < height; y++) {

        const row =
            Buffer.alloc(
                1 + width * 4
            );

        row[0] = 0;

        for (let x = 0; x < width; x++) {

            const color =
                draw(x, y);

            const p =
                1 + x * 4;

            row[p] = color[0];
            row[p + 1] = color[1];
            row[p + 2] = color[2];
            row[p + 3] = color[3];
        }

        rows.push(row);
    }

    const raw =
        Buffer.concat(rows);

    const ihdr =
        Buffer.alloc(13);

    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);

    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const png =
        Buffer.concat([

            Buffer.from([
                137, 80, 78, 71,
                13, 10, 26, 10
            ]),

            pngChunk(
                "IHDR",
                ihdr
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
        String(text).toLowerCase();

    if (
        t.includes("vermelho") ||
        t.includes("red")
    ) {
        return {
            main: [225, 30, 30],
            dark: [90, 5, 5],
            light: [255, 100, 100],
            base: "#e11e1e",
            overlay: "#5a0505"
        };
    }

    if (
        t.includes("azul") ||
        t.includes("blue")
    ) {
        return {
            main: [30, 100, 235],
            dark: [5, 30, 100],
            light: [100, 170, 255],
            base: "#1e64eb",
            overlay: "#051e64"
        };
    }

    if (
        t.includes("verde") ||
        t.includes("green")
    ) {
        return {
            main: [30, 190, 70],
            dark: [5, 70, 25],
            light: [110, 255, 130],
            base: "#1ebe46",
            overlay: "#054619"
        };
    }

    if (
        t.includes("amarelo") ||
        t.includes("yellow")
    ) {
        return {
            main: [240, 205, 20],
            dark: [120, 85, 5],
            light: [255, 245, 100],
            base: "#f0cd14",
            overlay: "#785505"
        };
    }

    if (
        t.includes("roxo") ||
        t.includes("purple")
    ) {
        return {
            main: [150, 45, 220],
            dark: [60, 10, 90],
            light: [220, 130, 255],
            base: "#962ddc",
            overlay: "#3c0a5a"
        };
    }

    if (
        t.includes("preto") ||
        t.includes("black")
    ) {
        return {
            main: [40, 40, 40],
            dark: [5, 5, 5],
            light: [120, 120, 120],
            base: "#282828",
            overlay: "#050505"
        };
    }

    if (
        t.includes("branco") ||
        t.includes("white")
    ) {
        return {
            main: [235, 235, 235],
            dark: [125, 125, 125],
            light: [255, 255, 255],
            base: "#ebebeb",
            overlay: "#7d7d7d"
        };
    }

    return {
        main: [40, 120, 255],
        dark: [10, 35, 100],
        light: [120, 180, 255],
        base: "#2878ff",
        overlay: "#0a2364"
    };
}


// ============================================================
// ÍCONE DE ITEM
// ============================================================

function makeItemIcon(file, colors) {

    makePNG(file, (x, y) => {

        // fundo transparente
        let c = [
            0,
            0,
            0,
            0
        ];

        // lâmina diagonal
        const blade =
            x >= 13 &&
            x <= 18 &&
            y >= 3 &&
            y <= 24;

        if (blade) {

            c = [
                colors.main[0],
                colors.main[1],
                colors.main[2],
                255
            ];
        }

        // brilho da lâmina
        if (
            x === 14 &&
            y >= 4 &&
            y <= 22
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
                90,
                55,
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
    });
}


// ============================================================
// TEXTURA DA ESPADA
// ============================================================

function makeSwordTexture(file, colors) {

    makePNG(file, (x, y) => {

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
            y >= 27 &&
            y <= 31
        ) {

            c = [
                100,
                60,
                30,
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

        // cabeça
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

        // corpo
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

        // pernas
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
// INTERPRETADOR
// ============================================================

function parseDescription(description) {

    const text =
        String(description || "")
            .toLowerCase();

    const result = {

        item: false,
        weapon: false,
        sword: false,
        block: false,
        mob: false,

        flying: false,
        fire: false,
        fast: false,

        health: 20,
        damage: 4
    };


    if (
        /item|espada|machado|picareta|pa |pá |enxada|arco|arma|varinha|cristal|anel/
            .test(text)
    ) {
        result.item = true;
    }


    if (
        /espada|arma|machado|arco|varinha/
            .test(text)
    ) {
        result.weapon = true;
    }


    if (
        /espada/
            .test(text)
    ) {
        result.sword = true;
    }


    if (
        /bloco|block|minério|minerio|pedra|cristal bloco/
            .test(text)
    ) {
        result.block = true;
    }


    if (
        /dragão|dragao|mob|monstro|criatura|entidade|zumbi|boss|animal|alien|golem|demônio|demonio|robo|robô|cavaleiro/
            .test(text)
    ) {
        result.mob = true;
    }


    if (
        /voa|voar|voando|voador|voe/
            .test(text)
    ) {
        result.flying = true;
    }


    if (
        /fogo|fire|chama|queima|queimar|lava/
            .test(text)
    ) {
        result.fire = true;
    }


    if (
        /rápido|rapido|veloz|velocidade/
            .test(text)
    ) {
        result.fast = true;
    }


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
// MANIFEST BP
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
                `Gerado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                bpUUID,

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
                    rpUUID,

                version:
                    [1, 0, 0]
            }
        ]
    };
}


// ============================================================
// MANIFEST RP
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
                `Gerado pelo Guarda-Chuva Bot para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                rpUUID,

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
// ITEM BP
// ============================================================

function makeItemBP(
    identifier,
    iconKey,
    damage
) {

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

            components: {

                "minecraft:max_stack_size":
                    1,

                "minecraft:icon": {

                    texture:
                        iconKey
                },

                "minecraft:display_name": {

                    value:
                        identifier
                },

                "minecraft:damage":
                    damage
            }
        }
    };
}


// ============================================================
// ITEM_TEXTURE.JSON
//
// Estrutura baseada no exemplo oficial:
// chave = mesmo identificador usado pelo minecraft:icon.
// ============================================================

function makeItemTextureJSON(
    iconKey,
    texturePath
) {

    return {

        resource_pack_name:
            "Guarda-Chuva Resource Pack",

        texture_data: {

            [iconKey]: {

                textures:
                    texturePath
            }
        }
    };
}


// ============================================================
// ATTACHABLE
//
// Baseado na estrutura oficial da Microsoft.
// ============================================================

function makeSwordAttachable(
    identifier,
    geometry
) {

    return {

        format_version:
            "1.20.30",

        "minecraft:attachable": {

            description: {

                identifier:
                    identifier,

                item: {

                    [identifier]:
                        "query.is_owner_identifier_any('minecraft:player')"
                },

                materials: {

                    default:
                        "entity",

                    enchanted:
                        "entity_alphatest_glint"
                },

                textures: {

                    default:
                        `textures/items/${identifier.split(":")[1]}`,

                    enchanted:
                        "textures/misc/enchanted_item_glint"
                },

                geometry: {

                    default:
                        geometry
                },

                animations: {

                    hold_first_person:
                        "animation.steve_head.hold_first_person",

                    hold_third_person:
                        "animation.steve_head.hold_third_person"
                },

                scripts: {

                    animate: [

                        {
                            hold_first_person:
                                "context.is_first_person == 1.0"
                        },

                        {
                            hold_third_person:
                                "context.is_first_person == 0.0"
                        }
                    ]
                },

                render_controllers: [

                    "controller.render.item_default"
                ]
            }
        }
    };
}


// ============================================================
// GEOMETRIA DA ESPADA
//
// Geometria separada da textura do inventário.
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

                        rotation:
                            [125, 0, 0],

                        binding:
                            "q.item_slot_to_bone_name(context.item_slot)",

                        cubes: [

                            // lâmina
                            {

                                origin:
                                    [-1, 9, -8],

                                size:
                                    [2, 16, 3],

                                uv:
                                    [0, 0]
                            },

                            // ponta
                            {

                                origin:
                                    [-1, 25, -8],

                                size:
                                    [2, 4, 3],

                                uv:
                                    [4, 0]
                            },

                            // guarda
                            {

                                origin:
                                    [-4, 29, -8],

                                size:
                                    [8, 2, 3],

                                uv:
                                    [8, 0]
                            },

                            // cabo
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
    };
}


// ============================================================
// RENDER CONTROLLER ITEM
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
// BLOCO BP
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
            "Guarda-Chuva Resource Pack",

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
                        3,

                    visible_bounds_height:
                        4,

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
                            "leg_left",

                        pivot:
                            [2, 4, 0],

                        cubes: [

                            {

                                origin:
                                    [1, 0, -2],

                                size:
                                    [3, 4, 4],

                                uv:
                                    [32, 0]
                            }
                        ]
                    },

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
// MOB BP
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
                1
        };
    }


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
                    "1.10.0",

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
// SPAWN RULE
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


// ============================================================
// CRIAR PROJETO
// ============================================================

function createProject(description) {

    const config =
        parseDescription(description);

    const colors =
        getColors(description);

    const original =
        String(description || "")
            .trim();

    const clean =
        original
            .replace(/^\/mc(?:addon)?\s*/i, "")
            .trim();

    const name =
        clean
            .split(/\s+/)
            .slice(0, 8)
            .join(" ") ||
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
    // MANIFEST
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

        const itemTexture =
            `${itemName}.png`;

        const iconTexture =
            `${itemName}_ico`;


        // -----------------------------------------------
        // Behavior Pack
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Textura da mão
        // -----------------------------------------------

        if (config.sword) {

            makeSwordTexture(

                path.join(
                    RP,
                    "textures",
                    "items",
                    itemTexture
                ),

                colors
            );

        } else {

            makeGenericTexture(

                path.join(
                    RP,
                    "textures",
                    "items",
                    itemTexture
                ),

                colors
            );
        }


        // -----------------------------------------------
        // Ícone do inventário
        // -----------------------------------------------

        makeItemIcon(

            path.join(
                RP,
                "textures",
                "items",
                `${itemName}_ico.png`
            ),

            colors
        );


        // -----------------------------------------------
        // item_texture.json
        //
        // IMPORTANTE:
        // A chave é exatamente a mesma do minecraft:icon.
        // -----------------------------------------------

        saveJSON(

            path.join(
                RP,
                "textures",
                "item_texture.json"
            ),

            makeItemTextureJSON(
                itemIdentifier,
                `textures/items/${itemName}_ico`
            )
        );


        // -----------------------------------------------
        // Attachable
        // -----------------------------------------------

        saveJSON(

            path.join(
                RP,
                "attachables",
                `${itemName}.player.json`
            ),

            makeSwordAttachable(
                itemIdentifier,
                geometryName
            )
        );


        // -----------------------------------------------
        // Geometria
        // -----------------------------------------------

        if (config.sword) {

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

        } else {

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
        }


        // -----------------------------------------------
        // Render controller
        // -----------------------------------------------

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


        makeGenericTexture(

            path.join(
                RP,
                "textures",
                "blocks",
                `${blockName}.png`
            ),

            colors
        );


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


        saveJSON(

            path.join(
                RP,
                "blocks.json"
            ),

            {

                format_version:
                    "1.19.30",

                [blockIdentifier]: {

                    sound:
                        "stone",

                    textures:
                        "custom_block"
                }
            }
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


        // -----------------------------------------------
        // Behavior
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Spawn Rules
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Client Entity
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Modelo
        // -----------------------------------------------

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


        // -----------------------------------------------
        // Textura
        // -----------------------------------------------

        makeMobTexture(

            path.join(
                RP,
                "textures",
                "entity",
                `${mobName}.png`
            ),

            colors
        );


        // -----------------------------------------------
        // Render Controller
        // -----------------------------------------------

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
    }


    // ========================================================
    // INFORMAÇÕES
    // ========================================================

    saveJSON(

        path.join(
            projectDir,
            "addon-info.json"
        ),

        {

            name,

            description:
                original,

            namespace,

            minecraft_version:
                MINECRAFT_VERSION,

            behavior_pack:
                bpUUID,

            resource_pack:
                rpUUID,

            identifier,

            features:
                config,

            created_at:
                new Date().toISOString()
        }
    );


    return {

        name,

        nameSlug,

        identifier,

        projectDir,

        BP,

        RP,

        bpUUID,

        rpUUID,

        config
    };
}


// ============================================================
// ZIP
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

                    resolve(
                        output
                    );
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
// MCADDON
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

                    resolve(
                        output
                    );
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
// GERADOR
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


    const project =
        createProject(
            description
        );


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


    await zipFolder(
        project.BP,
        bpPack
    );


    await zipFolder(
        project.RP,
        rpPack
    );


    await makeMCAddon(
        bpPack,
        rpPack,
        addon
    );


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
            project.projectDir
    };
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
