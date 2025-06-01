//Placeholder for configuratorService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSinkModels(family) {
    // Assuming sink models are assemblies and can be identified by a naming convention or a specific category/type
    // For MDRD, models are T2-B1, T2-B2, T2-B3. This might mean filtering by name or a specific category.
    // Let's assume they are of type 'COMPLEX' and their name starts with 'T2-B' for the 'MDRD' family.
    // This will need refinement based on actual data structure and how sink families/models are stored.
    if (family === 'MDRD') {
        return prisma.assembly.findMany({
            where: {
                name: {
                    startsWith: 'T2-B', // Example: T2-B1, T2-B2, T2-B3
                },
                // Add other conditions if necessary, e.g., a specific category or type
                // type: 'COMPLEX' // Assuming sink models are complex assemblies
            },
            select: {
                assemblyId: true,
                name: true,
                // Include other relevant fields
            }
        });
    }
    return []; // Return empty for other families for now as per PRD
}

async function getLegTypes() {
    // PRD mentions: Height Adjustable (DL27, DL14, LC1), Fixed Height (DL27, DL14).
    // These are likely specific assemblies.
    // Example Assembly IDs: T2-DL27-KIT, T2-DL14-KIT, T2-LC1-KIT (for HA)
    // T2-DL27-FH-KIT, T2-DL14-FH-KIT (for Fixed Height)
    // Querying based on a list of known assembly IDs or a category like "CASTERS AND LIFTERS" (subcategory "721.711")
    return prisma.assembly.findMany({
        where: {
            // This condition needs to be precise. Using OR for known assembly IDs or a category.
            OR: [
                { assemblyId: 'T2-DL27-KIT' }, { assemblyId: 'T2-DL14-KIT' }, { assemblyId: 'T2-LC1-KIT' },
                { assemblyId: 'T2-DL27-FH-KIT' }, { assemblyId: 'T2-DL14-FH-KIT' }
                // Alternatively, if they belong to a specific subcategory:
                // { subcategoryCode: '721.711' } // And then further filter by name/type if needed
            ]
        },
        select: {
            assemblyId: true,
            name: true,
            // Add a field to distinguish between 'Height Adjustable' and 'Fixed Height' if not in name
        }
    });
}

async function getFeetTypes() {
    // PRD: Lock & Leveling Casters, S.S Adjustable Seismic Feet
    // These are likely specific assemblies.
    // Example Assembly IDs: T2-FEET-CASTERS-KIT, T2-FEET-SEISMIC-KIT
    return prisma.assembly.findMany({
        where: {
            OR: [
                { assemblyId: 'T2-FEET-CASTERS-KIT' }, // Replace with actual ID
                { assemblyId: 'T2-FEET-SEISMIC-KIT' }  // Replace with actual ID
                // Or filter by a specific category/subcategory if applicable
            ]
        },
        select: {
            assemblyId: true,
            name: true,
        }
    });
}

async function getPegboardOptions() {
    // Types: Perforated, Solid. These might be attributes of pegboard assemblies or separate parts.
    // Sizes: Standard sizes (e.g., T2-ADW-PB-3436) and "Same as Sink Length" logic.
    // Custom part number generation: "720.215.002 T2-ADW-PB-[width]x[length]"
    const standardPegboards = await prisma.assembly.findMany({
        where: {
            // Assuming pegboard assemblies have a specific naming convention or category
            name: {
                startsWith: 'T2-ADW-PB-'
            },
            // AND: {
            //     NOT: {
            //         name: {
            //             contains: 'CUSTOM' // If custom ones are also stored but should be excluded here
            //         }
            //     }
            // }
        },
        select: {
            assemblyId: true,
            name: true,
            // Add fields for type (Perforated/Solid) and dimensions if available
        }
    });
    // The "Same as Sink Length" and custom generation are more about client-side/BOM logic
    // but we can return available standard types and sizes.
    // For "Perforated" / "Solid", this might be part of the assembly name/description or a separate field.
    // This function primarily returns existing standard pegboard assemblies.
    // The custom generation rule is noted for bomService.
    return {
        types: ["Perforated", "Solid"], // These might need to be derived from data
        standardSizes: standardPegboards,
        customPartNumberRule: "720.215.002 T2-ADW-PB-[width]x[length]"
    };
}

async function getBasinTypeOptions() {
    // PRD: E-Sink, E-Sink DI, E-Drain. These are likely not direct assembly names but conceptual types.
    // The selection will drive which actual basin assemblies are chosen.
    // For now, returning the conceptual types as per PRD.
    return [
        { id: 'E_SINK', name: 'E-Sink' },
        { id: 'E_SINK_DI', name: 'E-Sink DI' },
        { id: 'E_DRAIN', name: 'E-Drain' }
    ];
}

async function getBasinSizeOptions() {
    // PRD: Standard sizes (20X20X8, etc.) and custom.
    // Standard sizes likely map to specific basin assemblies (e.g., T2-ADW-BASIN20X20X8).
    // Custom part number generation: "720.215.001 T2-ADW-BASIN-[width]x[length]x[depth]"
    const standardBasins = await prisma.assembly.findMany({
        where: {
            name: {
                startsWith: 'T2-ADW-BASIN' // Example prefix
            },
            // AND: {
            //     NOT: {
            //         name: {
            //             contains: 'CUSTOM'
            //         }
            //     }
            // }
        },
        select: {
            assemblyId: true,
            name: true,
            // Add fields for dimensions if available
        }
    });
    return {
        standardSizes: standardBasins,
        customPartNumberRule: "720.215.001 T2-ADW-BASIN-[width]x[length]x[depth]"
    };
}

async function getBasinAddonOptions(basinType) {
    // P-TRAP (T2-OA-MS-1026)
    // BASIN LIGHT KIT (T2-OA-BASIN-LIGHT-EDR-KIT for E-Drain, T2-OA-BASIN-LIGHT-ESK-KIT for E-Sink/E-Sink DI)
    const addOns = [];
    const pTrap = await prisma.assembly.findUnique({
        where: { assemblyId: 'T2-OA-MS-1026' }, // P-TRAP
        select: { assemblyId: true, name: true }
    });
    if (pTrap) addOns.push(pTrap);

    let basinLightKitId;
    if (basinType === 'E_DRAIN') {
        basinLightKitId = 'T2-OA-BASIN-LIGHT-EDR-KIT';
    } else if (basinType === 'E_SINK' || basinType === 'E_SINK_DI') {
        basinLightKitId = 'T2-OA-BASIN-LIGHT-ESK-KIT';
    }

    if (basinLightKitId) {
        const basinLight = await prisma.assembly.findUnique({
            where: { assemblyId: basinLightKitId },
            select: { assemblyId: true, name: true }
        });
        if (basinLight) addOns.push(basinLight);
    }
    return addOns;
}

async function getFaucetTypeOptions() {
    // PRD: 10" WRIST BLADE..., PRE-RINSE..., GOOSENECK...
    // These map to specific assembly kits.
    // Example IDs: T2-OA-STD-FAUCET-WB-KIT, T2-OA-PRE-RINSE-KIT, T2-OA-GOOSENECK-DI-KIT
    return prisma.assembly.findMany({
        where: {
            OR: [
                { assemblyId: 'T2-OA-STD-FAUCET-WB-KIT' }, // Replace with actual ID
                { assemblyId: 'T2-OA-PRE-RINSE-KIT' },    // Replace with actual ID
                { assemblyId: 'T2-OA-GOOSENECK-DI-KIT' }  // Replace with actual ID
                // Or filter by a specific category/subcategory if applicable
            ]
        },
        select: {
            assemblyId: true,
            name: true,
        }
    });
}

async function getSprayerTypeOptions() {
    // PRD: DI WATER GUN KIT & TURRET, DI WATER GUN KIT & ROSETTE, AIR GUN KIT & TURRET, AIR GUN KIT & ROSETTE
    // These map to specific assembly kits.
    // Example IDs: T2-OA-WATERGUN-TURRET-KIT, T2-OA-WATERGUN-ROSETTE-KIT, T2-OA-AIRGUN-TURRET-KIT, T2-OA-AIRGUN-ROSETTE-KIT
    return prisma.assembly.findMany({
        where: {
            OR: [
                { assemblyId: 'T2-OA-WATERGUN-TURRET-KIT' }, // Replace with actual ID
                { assemblyId: 'T2-OA-WATERGUN-ROSETTE-KIT' },// Replace with actual ID
                { assemblyId: 'T2-OA-AIRGUN-TURRET-KIT' },   // Replace with actual ID
                { assemblyId: 'T2-OA-AIRGUN-ROSETTE-KIT' }   // Replace with actual ID
                // Or filter by a specific category/subcategory if applicable
            ]
        },
        select: {
            assemblyId: true,
            name: true,
        }
    });
}

async function getAccessoryCategories() {
    // Fetches subcategories under "ACCESSORY LIST" (category ID "720")
    return prisma.category.findUnique({
        where: { categoryId: '720' },
        include: {
            subcategories: {
                select: {
                    subcategoryId: true,
                    name: true,
                }
            }
        }
    });
}

async function getAccessoriesByCategory(subcategoryCode) {
    // Fetches assemblies linked to a specific accessory subcategory code.
    // This requires the SubcategoryAssemblies relation to be defined in Prisma schema
    // or querying assemblies directly if they have a subcategoryCode field.
    return prisma.assembly.findMany({
        where: {
            subcategoryCode: subcategoryCode,
            // Potentially also filter by a type like 'ACCESSORY' or 'KIT' if applicable
        },
        select: {
            assemblyId: true,
            name: true,
            // include other fields like description, photoURL if needed for display
        }
    });
}

module.exports = {
    getSinkModels,
    getLegTypes,
    getFeetTypes,
    getPegboardOptions,
    getBasinTypeOptions,
    getBasinSizeOptions,
    getBasinAddonOptions,
    getFaucetTypeOptions,
    getSprayerTypeOptions,
    getAccessoryCategories,
    getAccessoriesByCategory,
};
