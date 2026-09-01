// ============================================================
// GUARDA-CHUVA BOT
// minecraft.js V3
//
// GERADOR MINECRAFT BEDROCK
//
// Suporta:
//   - Itens
//   - Espadas / ferramentas
//   - Attachables
//   - Texturas de itens
//   - Blocos
//   - Texturas de blocos
//   - Mobs / entidades
//   - Spawn Eggs
//   - Render Controllers
//   - Modelos
//   - Behavior Pack
//   - Resource Pack
//   - MCPACK
//   - MCADDON
//
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

function slug(text) {
    return String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48) || "addon";
}

function writeJSON(file, data) {
    fs.mkdirSync(path.dirname(file), {
        recursive: true
    });

    fs.writeFileSync(
        file,
        JSON.stringify(data, null, 2),
        "utf8"
    );
}

function writeText(file, data) {
    fs.mkdirSync(path.dirname(file), {
        recursive: true
    });

    fs.writeFileSync(
        file,
        data,
        "utf8"
    );
}


// ============================================================
// PNG
// ============================================================
//
// Gera PNG RGBA válido sem depender de imagem externa.
// ============================================================

const zlib = require("zlib");

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
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);

    length.writeUInt32BE(data.length, 0);

    const crc = Buffer.alloc(4);

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

function createPNG(file, primary, secondary) {

    const width = 32;
    const height = 32;

    const rows = [];

    for (let y = 0; y < height; y++) {

        const row = Buffer.alloc(
            1 + width * 4
        );

        row[0] = 0;

        for (let x = 0; x < width; x++) {

            let color = primary;

            // borda
            if (
                x === 0 ||
                y === 0 ||
                x === width - 1 ||
                y === height - 1
            ) {
                color = secondary;
            }

            // desenho simples
            if (
                x > 12 &&
                x < 19
            ) {
                color = secondary;
            }

            if (
                y > 5 &&
                y < 27 &&
                x > 14 &&
                x < 17
            ) {
                color = primary;
            }

            const p = 1 + x * 4;

            row[p] = color[0];
            row[p + 1] = color[1];
            row[p + 2] = color[2];
            row[p + 3] = 255;
        }

        rows.push(row);
    }

    const raw = Buffer.concat(rows);

    const ihdr = Buffer.alloc(13);

    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);

    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const png = Buffer.concat([

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

    fs.mkdirSync(
        path.dirname(file),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        file,
        png
    );
}


// ============================================================
// CORES
// ============================================================

function colorsFromText(text) {

    const t = text.toLowerCase();

    if (
        t.includes("vermelho") ||
        t.includes("red")
    ) {
        return {
            primary: [220, 25, 25],
            secondary: [90, 5, 5],
            egg1: "#dc1919",
            egg2: "#5a0505"
        };
    }

    if (
        t.includes("azul") ||
        t.includes("blue")
    ) {
        return {
            primary: [30, 100, 235],
            secondary: [5, 30, 100],
            egg1: "#1e64eb",
            egg2: "#051e64"
        };
    }

    if (
        t.includes("verde") ||
        t.includes("green")
    ) {
        return {
            primary: [25, 190, 70],
            secondary: [5, 75, 25],
            egg1: "#19be46",
            egg2: "#054b19"
        };
    }

    if (
        t.includes("amarelo") ||
        t.includes("yellow")
    ) {
        return {
            primary: [240, 210, 25],
            secondary: [120, 90, 5],
            egg1: "#f0d219",
            egg2: "#785a05"
        };
    }

    if (
        t.includes("roxo") ||
        t.includes("purple")
    ) {
        return {
            primary: [150, 40, 220],
            secondary: [60, 10, 90],
            egg1: "#9628dc",
            egg2: "#3c0a5a"
        };
    }

    if (
        t.includes("preto") ||
        t.includes("black")
    ) {
        return {
            primary: [35, 35, 35],
            secondary: [5, 5, 5],
            egg1: "#232323",
            egg2: "#050505"
        };
    }

    if (
        t.includes("branco") ||
        t.includes("white")
    ) {
        return {
            primary: [235, 235, 235],
            secondary: [130, 130, 130],
            egg1: "#ebebeb",
            egg2: "#828282"
        };
    }

    return {
        primary: [40, 120, 255],
        secondary: [10, 30, 100],
        egg1: "#2878ff",
        egg2: "#0a1e64"
    };
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
        block: false,
        entity: false,

        flying: false,
        fire: false,
        fast: false,

        health: 20,
        damage: 4
    };


    // ITEM

    if (
        /item|espada|espadas|machado|picareta|pá|pa |enxada|arco|arma|varinha|cristal|anel/.test(text)
    ) {
        result.item = true;
    }


    // ARMAS

    if (
        /espada|machado|arma|arco|varinha/.test(text)
    ) {
        result.weapon = true;
    }


    // BLOCO

    if (
        /bloco|block|minério|minero|minério|pedra|cristal bloco/.test(text)
    ) {
        result.block = true;
    }


    // MOB

    if (
        /dragão|dragao|mob|monstro|criatura|entidade|zumbi|boss|animal|alien|golem|demônio|demonio|robô|robo|cavaleiro/.test(text)
    ) {
        result.entity = true;
    }


    // VOAR

    if (
        /voa|voar|voando|voador|voe/.test(text)
    ) {
        result.flying = true;
    }


    // FOGO

    if (
        /fogo|fire|chama|queima|queimar|lava/.test(text)
    ) {
        result.fire = true;
    }


    // VELOCIDADE

    if (
        /rápido|rapido|veloz|velocidade/.test(text)
    ) {
        result.fast = true;
    }


    // VIDA

    const healthMatch =
        text.match(
            /(\d+)\s*(?:de\s*)?(?:vida|vidas|hp)/
        );

    if (healthMatch) {
        result.health =
            Math.max(
                1,
                Math.min(
                    100000,
                    Number(healthMatch[1])
                )
            );
    }


    // DANO

    const damageMatch =
        text.match(
            /(\d+)\s*(?:de\s*)?(?:dano|damage)/
        );

    if (damageMatch) {
        result.damage =
            Math.max(
                1,
                Math.min(
                    10000,
                    Number(damageMatch[1])
                )
            );
    }


    return result;
}


// ============================================================
// MANIFEST BP
// ============================================================

function createBPManifest(
    name,
    bpUUID,
    rpUUID
) {

    return {

        format_version: 2,

        header: {

            name:
                `${name} - Behavior`,

            description:
                `Addon gerado para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                bpUUID,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
        },

        modules: [

            {
                description:
                    "Behavior Pack",

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

function createRPManifest(
    name,
    rpUUID
) {

    return {

        format_version: 2,

        header: {

            name:
                `${name} - Resource`,

            description:
                `Addon gerado para Minecraft Bedrock ${MINECRAFT_VERSION}`,

            uuid:
                rpUUID,

            version:
                [1, 0, 0],

            min_engine_version:
                [1, 21, 0]
        },

        modules: [

            {
                description:
                    "Resource Pack",

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
// ITEM
// ============================================================

function createItemBP(
    identifier,
    iconName,
    isWeapon
) {

    const components = {

        "minecraft:max_stack_size":
            isWeapon ? 1 : 64,

        "minecraft:icon": {

            texture:
                iconName
        },

        "minecraft:display_name": {

            value:
                identifier
        }
    };


    // Dano para armas
    if (isWeapon) {

        components[
            "minecraft:damage"
        ] = 8;
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

            components:
                components
        }
    };
}


// ============================================================
// ITEM_TEXTURE.JSON
// ============================================================

function createItemTexture(
    iconName,
    texturePath
) {

    return {

        resource_pack_name:
            "GuardaChuva Resource Pack",

        texture_name:
            "atlas.items",

        texture_data: {

            [iconName]: {

                textures:
                    texturePath
            }
        }
    };
}


// ============================================================
// ATTACHABLE DO ITEM
// ============================================================
//
// Esta é a correção principal para itens personalizados
// que precisam aparecer corretamente quando segurados.
//
// ============================================================

function createItemAttachable(
    identifier,
    textureName,
    geometryName
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
                        `textures/items/${textureName}`,

                    enchanted:
                        "textures/misc/enchanted_item_glint"
                },

                geometry: {

                    default:
                        geometryName
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
// MODELO DO ITEM
// ============================================================

function createItemGeometry(
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

                            {

                                origin:
                                    [-1, 9, -8],

                                size:
                                    [2, 18, 3],

                                uv:
                                    [0, 0]
                            },

                            {

                                origin:
                                    [-3, 27, -9],

                                size:
                                    [6, 4, 3],

                                uv:
                                    [8, 0]
                            }
                        ]
                    }
                ]
            }
        ]
    };
}


// ============================================================
// BLOCO BP
// ============================================================

function createBlockBP(identifier) {

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

function createTerrainTexture(
    textureName
) {

    return {

        resource_pack_name:
            "GuardaChuva Resource Pack",

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

function createBlocksJSON() {

    return {

        format_version:
            "1.19.30",

        "guardachuva:custom_block": {

            sound:
                "stone",

            textures:
                "custom_block"
        }
    };
}


// ============================================================
// MOB GEOMETRY
// ============================================================

function createMobGeometry(
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

function createMobBP(
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
            "1.21.0",

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

function createClientEntity(
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
                        colors.egg1,

                    overlay_color:
                        colors.egg2
                }
            }
        }
    };
}


// ============================================================
// RENDER CONTROLLER MOB
// ============================================================

function createMobRenderController(
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

function createSpawnRules(identifier) {

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
// ITEM RENDER CONTROLLER
// ============================================================

function createItemRenderController() {

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
// CRIAR PROJETO
// ============================================================

function createProject(description) {

    const config =
        parseDescription(description);

    const colors =
        colorsFromText(description);

    let cleanName =
        String(description || "")
            .replace(/^\/mc\s*/i, "")
            .trim();

    if (!cleanName) {
        cleanName =
            "Meu Addon";
    }

    const name =
        cleanName
            .split(/\s+/)
            .slice(0, 8)
            .join(" ");

    const nameSlug =
        slug(name);

    const bpUUID =
        uuid();

    const rpUUID =
        uuid();

    const identifier =
        `guardachuva:${nameSlug}`;

    const projectDir =
        path.join(
            OUTPUT_DIR,
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


    fs.mkdirSync(
        BP,
        {
            recursive:
                true
        }
    );

    fs.mkdirSync(
        RP,
        {
            recursive:
                true
        }
    );


    // ========================================================
    // MANIFESTS
    // ========================================================

    writeJSON(
        path.join(
            BP,
            "manifest.json"
        ),

        createBPManifest(
            name,
            bpUUID,
            rpUUID
        )
    );

    writeJSON(
        path.join(
            RP,
            "manifest.json"
        ),

        createRPManifest(
            name,
            rpUUID
        )
    );


    // ========================================================
    // ITEM
    // ========================================================

    if (config.item) {

        const itemIdentifier =
            identifier;

        const itemName =
            `${nameSlug}_item`;

        const geometryName =
            `geometry.${nameSlug}_item`;


        // BP ITEM

        writeJSON(
            path.join(
                BP,
                "items",
                `${itemName}.json`
            ),

            createItemBP(
                itemIdentifier,
                `guardachuva:${itemName}`,
                config.weapon
            )
        );


        // ICON TEXTURE

        createPNG(

            path.join(
                RP,
                "textures",
                "items",
                `${itemName}_ico.png`
            ),

            colors.primary,
            colors.secondary
        );


        // HAND TEXTURE

        createPNG(

            path.join(
                RP,
                "textures",
                "items",
                `${itemName}.png`
            ),

            colors.primary,
            colors.secondary
        );


        // ITEM TEXTURE CATALOG

        writeJSON(

            path.join(
                RP,
                "textures",
                "item_texture.json"
            ),

            createItemTexture(
                `guardachuva:${itemName}`,
                `textures/items/${itemName}_ico`
            )
        );


        // ATTACHABLE

        writeJSON(

            path.join(
                RP,
                "attachables",
                `${itemName}.player.json`
            ),

            createItemAttachable(
                itemIdentifier,
                itemName,
                geometryName
            )
        );


        // GEOMETRIA

        writeJSON(

            path.join(
                RP,
                "models",
                "entity",
                `${itemName}.geo.json`
            ),

            createItemGeometry(
                geometryName
            )
        );


        // RENDER CONTROLLER

        writeJSON(

            path.join(
                RP,
                "render_controllers",
                `${itemName}.render_controllers.json`
            ),

            createItemRenderController()
        );
    }


    // ========================================================
    // BLOCO
    // ========================================================

    if (config.block) {

        const blockIdentifier =
            `${identifier}_block`;

        const blockName =
            `${nameSlug}_block`;


        // BP

        writeJSON(

            path.join(
                BP,
                "blocks",
                `${blockName}.json`
            ),

            createBlockBP(
                blockIdentifier
            )
        );


        // TEXTURE

        createPNG(

            path.join(
                RP,
                "textures",
                "blocks",
                `${blockName}.png`
            ),

            colors.primary,
            colors.secondary
        );


        // TERRAIN

        writeJSON(

            path.join(
                RP,
                "textures",
                "terrain_texture.json"
            ),

            createTerrainTexture(
                blockName
            )
        );


        // BLOCKS.JSON

        const blocksFile =
            createBlocksJSON();

        blocksFile[
            blockIdentifier
        ] = {

            sound:
                "stone",

            textures:
                "custom_block"
        };

        writeJSON(

            path.join(
                RP,
                "blocks.json"
            ),

            blocksFile
        );
    }


    // ========================================================
    // MOB
    // ========================================================

    if (config.entity) {

        const entityIdentifier =
            identifier;

        const entityName =
            nameSlug;

        const geometryName =
            `geometry.${entityName}`;

        // BP ENTITY

        writeJSON(

            path.join(
                BP,
                "entities",
                `${entityName}.json`
            ),

            createMobBP(
                entityIdentifier,
                config
            )
        );


        // SPAWN RULE

        writeJSON(

            path.join(
                BP,
                "spawn_rules",
                `${entityName}.json`
            ),

            createSpawnRules(
                entityIdentifier
            )
        );


        // CLIENT ENTITY

        writeJSON(

            path.join(
                RP,
                "entity",
                `${entityName}.entity.json`
            ),

            createClientEntity(
                entityIdentifier,
                geometryName,
                entityName,
                colors
            )
        );


        // GEOMETRIA

        writeJSON(

            path.join(
                RP,
                "models",
                "entity",
                `${entityName}.geo.json`
            ),

            createMobGeometry(
                geometryName
            )
        );


        // TEXTURA

        createPNG(

            path.join(
                RP,
                "textures",
                "entity",
                `${entityName}.png`
            ),

            colors.primary,
            colors.secondary
        );


        // RENDER CONTROLLER

        writeJSON(

            path.join(
                RP,
                "render_controllers",
                `${entityName}.render_controllers.json`
            ),

            createMobRenderController(
                entityName
            )
        );
    }


    // ========================================================
    // INFO
    // ========================================================

    writeJSON(

        path.join(
            projectDir,
            "addon-info.json"
        ),

        {

            name:
                name,

            description:
                description,

            minecraft_version:
                MINECRAFT_VERSION,

            identifier:
                identifier,

            behavior_pack_uuid:
                bpUUID,

            resource_pack_uuid:
                rpUUID,

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
    outputFile
) {

    return new Promise(
        (resolve, reject) => {

            const output =
                fs.createWriteStream(
                    outputFile
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
                () => {

                    resolve(
                        outputFile
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


            archive.pipe(output);


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

function createMcaddon(
    bpPack,
    rpPack,
    outputFile
) {

    return new Promise(
        (resolve, reject) => {

            const output =
                fs.createWriteStream(
                    outputFile
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
                () => {

                    resolve(
                        outputFile
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


            archive.pipe(output);


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
            "Descreva o addon que deseja criar."
        );
    }


    const project =
        createProject(
            description
        );


    const bpPack =
        path.join(
            OUTPUT_DIR,
            `${project.nameSlug}_BP.mcpack`
        );


    const rpPack =
        path.join(
            OUTPUT_DIR,
            `${project.nameSlug}_RP.mcpack`
        );


    const mcaddon =
        path.join(
            OUTPUT_DIR,
            `${project.nameSlug}_${Date.now()}.mcaddon`
        );


    // BP

    await zipFolder(
        project.BP,
        bpPack
    );


    // RP

    await zipFolder(
        project.RP,
        rpPack
    );


    // MCADDON

    await createMcaddon(
        bpPack,
        rpPack,
        mcaddon
    );


    return {

        sucesso:
            true,

        nome:
            project.name,

        versao:
            MINECRAFT_VERSION,

        arquivo:
            mcaddon,

        behavior_pack:
            bpPack,

        resource_pack:
            rpPack,

        pasta:
            project.projectDir
    };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    gerarAddon,

    createProject,

    MINECRAFT_VERSION
};
