const { prisma } = require('../config');

async function getAssemblyDetails(assemblyId) {
    return prisma.assembly.findUnique({
        where: { assemblyId: assemblyId },
        include: {
            components: {
                include: {
                    part: true, // Include the actual Part record
                },
            },
        },
    });
}

async function getPartDetails(partId) { // partId here is the UUID
    return prisma.part.findUnique({
        where: { id: partId }
    });
}


async function addItemToBOMRecursive(assemblyId, quantity, category, bomList, processedAssemblies = new Set()) {
    if (processedAssemblies.has(assemblyId + '_' + category)) { // Avoid infinite loops for same item in same category context
        // console.warn(`Recursive call detected for ${assemblyId} in category ${category}, skipping.`);
        // return; // Or handle as needed, perhaps add as a simple reference without expanding
    }
    processedAssemblies.add(assemblyId + '_' + category);

    const assembly = await getAssemblyDetails(assemblyId);
    if (!assembly) {
        console.warn(`Assembly with ID ${assemblyId} not found in database.`);
        // Add a placeholder or skip
        bomList.push({
            id: assemblyId,
            name: `Unknown Assembly: ${assemblyId}`,
            quantity: quantity,
            category: category || 'UNKNOWN',
            type: 'UNKNOWN',
            components: [],
            isPlaceholder: true,
        });
        return;
    }

    const bomItem = {
        id: assembly.assemblyId, // User-facing ID
        name: assembly.name,
        quantity: quantity,
        category: category || assembly.type, // Use provided category or assembly's own type
        type: assembly.type, // AssemblyType (COMPLEX, KIT, etc.)
        components: [],
    };

    if (assembly.components && assembly.components.length > 0) {
        for (const componentLink of assembly.components) {
            const part = componentLink.part; // This is the actual Part record
            if (!part) {
                console.warn(`Linked part with ID ${componentLink.partId} not found for assembly ${assembly.assemblyId}.`);
                bomItem.components.push({
                    id: `UNKNOWN_PART_${componentLink.partId}`,
                    name: `Unknown Part: ${componentLink.partId}`,
                    quantity: componentLink.quantity,
                    type: 'UNKNOWN_PART_TYPE',
                    components: [],
                    isPlaceholder: true,
                });
                continue;
            }

            // Check if this part itself is an assembly that needs further expansion
            // A part is considered a sub-assembly if its part.type suggests it OR if an Assembly record exists with assemblyId === part.partNumber
            const subAssembly = await prisma.assembly.findUnique({ 
                where: { assemblyId: part.partNumber },
                include: { components: { include: { part: true } } } 
            });

            if (subAssembly) { // It's a sub-assembly
                const subAssemblyBomItem = {
                    id: subAssembly.assemblyId,
                    name: subAssembly.name,
                    quantity: componentLink.quantity, // Quantity of this sub-assembly within the parent
                    type: subAssembly.type, // Type of the sub-assembly
                    components: [],
                    // category: 'SUB_ASSEMBLY' // Or derive more specifically
                };
                // Recursively add components of the sub-assembly
                // Pass componentLink.quantity as the multiplier for sub-components
                if (subAssembly.components && subAssembly.components.length > 0) {
                    for (const subComponentLink of subAssembly.components) {
                        const subPart = subComponentLink.part;
                        if (!subPart) continue;
                         // Check if this subPart is an assembly again
                        const deeperSubAssembly = await prisma.assembly.findUnique({ where: { assemblyId: subPart.partNumber }});
                        if (deeperSubAssembly) {
                            // If it's another level of assembly, call addItemToBOMRecursive
                            // For simplicity in this step, we'll add it as a component part.
                            // A more robust solution might involve deeper recursion here if parts can be many levels of assemblies.
                            // For now, we assume parts that are assemblies are expanded one level directly.
                             await addItemToBOMRecursive(subPart.partNumber, subComponentLink.quantity, 'SUB_COMPONENT_ASSEMBLY', subAssemblyBomItem.components, new Set(processedAssemblies));

                        } else {
                             subAssemblyBomItem.components.push({
                                id: subPart.partNumber,
                                name: subPart.name,
                                quantity: subComponentLink.quantity,
                                type: subPart.type,
                                components: [],
                            });
                        }
                    }
                }
                bomItem.components.push(subAssemblyBomItem);

            } else { // It's a simple part
                bomItem.components.push({
                    id: part.partNumber, // User-facing part number
                    name: part.name,
                    quantity: componentLink.quantity, // Quantity of this part within the assembly
                    type: part.type, // PartType
                    components: [], // Simple parts don't have further components in this context
                });
            }
        }
    }
    bomList.push(bomItem);
    // Remove from processed after successful expansion to allow this assembly to be part of another chain
    // processedAssemblies.delete(assemblyId + '_' + category); 
}


async function generateBOMForOrder(orderData) {
    const bom = [];
    const { customer, configurations, accessories: orderAccessories, buildNumbers } = orderData;

    // 1. Add system items
    const manualKitId = customer.language === 'FR' ? 'T2-STD-MANUAL-FR-KIT' : 'T2-STD-MANUAL-EN-KIT';
    if (manualKitId) {
        await addItemToBOMRecursive(manualKitId, 1, 'SYSTEM', bom, new Set());
    }

    for (const buildNumber of buildNumbers) {
        const config = configurations[buildNumber];
        if (!config) continue;

        const { sinkBody, basins, faucets } = config;

        // 2. Sink Body Assembly
        let sinkBodyAssemblyId;
        if (sinkBody.sinkLength >= 34 && sinkBody.sinkLength <= 60) sinkBodyAssemblyId = 'T2-BODY-48-60-HA';
        else if (sinkBody.sinkLength >= 61 && sinkBody.sinkLength <= 72) sinkBodyAssemblyId = 'T2-BODY-61-72-HA';
        else if (sinkBody.sinkLength >= 73 && sinkBody.sinkLength <= 120) sinkBodyAssemblyId = 'T2-BODY-73-120-HA';
        if (sinkBodyAssemblyId) await addItemToBOMRecursive(sinkBodyAssemblyId, 1, 'SINK_BODY', bom, new Set());

        // 3. Legs Kit
        const legsMappings = {
            'DL27': 'T2-DL27-KIT', 'DL14': 'T2-DL14-KIT', 'LC1': 'T2-LC1-KIT',
            'DL27-FH': 'T2-DL27-FH-KIT', 'DL14-FH': 'T2-DL14-FH-KIT',
        };
        if (legsMappings[sinkBody.legsType]) await addItemToBOMRecursive(legsMappings[sinkBody.legsType], 1, 'LEGS', bom, new Set());

        // 4. Feet Type
        const feetMappings = { 'CASTERS': 'T2-LEVELING-CASTOR-475', 'SEISMIC': 'T2-SEISMIC-FEET' };
        if (feetMappings[sinkBody.feetType]) await addItemToBOMRecursive(feetMappings[sinkBody.feetType], 1, 'FEET', bom, new Set());
        
        // 5. Pegboard
        if (sinkBody.pegboard) {
            const pegboardTypeMappings = { 'PERFORATED': 'T2-ADW-PB-PERF-KIT', 'SOLID': 'T2-ADW-PB-SOLID-KIT' };
            if (pegboardTypeMappings[sinkBody.pegboardType]) await addItemToBOMRecursive(pegboardTypeMappings[sinkBody.pegboardType], 1, 'PEGBOARD_TYPE', bom, new Set());

            if (sinkBody.pegboardSizeOption === 'SAME_AS_SINK') {
                let pegboardSizeId;
                if (sinkBody.sinkLength >= 34 && sinkBody.sinkLength <= 47) pegboardSizeId = 'T2-ADW-PB-3436';
                else if (sinkBody.sinkLength >= 48 && sinkBody.sinkLength <= 59) pegboardSizeId = 'T2-ADW-PB-4836';
                else if (sinkBody.sinkLength >= 60 && sinkBody.sinkLength <= 71) pegboardSizeId = 'T2-ADW-PB-6036';
                else if (sinkBody.sinkLength >= 72 && sinkBody.sinkLength <= 83) pegboardSizeId = 'T2-ADW-PB-7236';
                else if (sinkBody.sinkLength >= 84 && sinkBody.sinkLength <= 95) pegboardSizeId = 'T2-ADW-PB-8436';
                else if (sinkBody.sinkLength >= 96 && sinkBody.sinkLength <= 107) pegboardSizeId = 'T2-ADW-PB-9636';
                else if (sinkBody.sinkLength >= 108 && sinkBody.sinkLength <= 120) pegboardSizeId = 'T2-ADW-PB-10836';
                // else if (sinkBody.sinkLength >= 120 && sinkBody.sinkLength <= 130) pegboardSizeId = 'T2-ADW-PB-12036'; // From doc, current UI max 120
                if (pegboardSizeId) await addItemToBOMRecursive(pegboardSizeId, 1, 'PEGBOARD_SIZE', bom, new Set());
            }
            await addItemToBOMRecursive('T2-OHL-MDRD-KIT', 1, 'PEGBOARD_OHL', bom, new Set());
        }

        // 6. Basin Assemblies
        const basinTypeMappings = { 'E_SINK': 'T2-BSN-ESK-KIT', 'E_SINK_DI': 'T2-BSN-ESK-DI-KIT', 'E_DRAIN': 'T2-BSN-EDR-KIT' };
        const basinSizeMappings = {
            '20X20X8': 'T2-ADW-BASIN20X20X8', '24X20X8': 'T2-ADW-BASIN24X20X8',
            '24X20X10': 'T2-ADW-BASIN24X20X10', '30X20X8': 'T2-ADW-BASIN30X20X8',
            '30X20X10': 'T2-ADW-BASIN30X20X10',
        };
        for (const basin of basins) {
            if (basinTypeMappings[basin.basinType]) await addItemToBOMRecursive(basinTypeMappings[basin.basinType], 1, 'BASIN_TYPE', bom, new Set());
            if (basinSizeMappings[basin.basinSize]) await addItemToBOMRecursive(basinSizeMappings[basin.basinSize], 1, 'BASIN_SIZE', bom, new Set());
            for (const addon of basin.addons) {
                if (addon === 'PTRAP_DRAIN') await addItemToBOMRecursive('T2-OA-MS-1026', 1, 'BASIN_ADDON_PTRAP', bom, new Set());
                if (addon === 'BASIN_LIGHT') {
                    const lightKitId = (basin.basinType === 'E_DRAIN') ? 'T2-OA-BASIN-LIGHT-EDR-KIT' : 'T2-OA-BASIN-LIGHT-ESK-KIT';
                    await addItemToBOMRecursive(lightKitId, 1, 'BASIN_ADDON_LIGHT', bom, new Set());
                }
            }
        }
        
        // 7. Control Box
        const eSinkCount = basins.filter(b => b.basinType === 'E_SINK' || b.basinType === 'E_SINK_DI').length;
        const eDrainCount = basins.filter(b => b.basinType === 'E_DRAIN').length;
        let controlBoxId;
        if (eSinkCount === 1 && eDrainCount === 0) controlBoxId = 'T2-CTRL-ESK1';
        else if (eSinkCount === 0 && eDrainCount === 1) controlBoxId = 'T2-CTRL-EDR1';
        else if (eSinkCount === 1 && eDrainCount === 1) controlBoxId = 'T2-CTRL-EDR1-ESK1';
        else if (eSinkCount === 2 && eDrainCount === 0) controlBoxId = 'T2-CTRL-ESK2';
        else if (eSinkCount === 0 && eDrainCount === 2) controlBoxId = 'T2-CTRL-EDR2';
        else if (eSinkCount === 1 && eDrainCount === 2) controlBoxId = 'T2-CTRL-EDR2-ESK1'; // Doc: T2-CTRL-EDR2-ESK1, bom-gen: T2-CTRL-EDR2-ESK1
        else if (eSinkCount === 2 && eDrainCount === 1) controlBoxId = 'T2-CTRL-EDR1-ESK2'; // Doc: T2-CTRL-EDR1-ESK2, bom-gen: T2-CTRL-EDR1-ESK2
        else if (eSinkCount === 3 && eDrainCount === 0) controlBoxId = 'T2-CTRL-ESK3';
        else if (eSinkCount === 0 && eDrainCount === 3) controlBoxId = 'T2-CTRL-EDR3';
        if (controlBoxId) await addItemToBOMRecursive(controlBoxId, 1, 'CONTROL_BOX', bom, new Set());

        // 8. Faucets
        const faucetTypeMappings = {
            'STD_WRIST_BLADE': 'T2-OA-STD-FAUCET-WB-KIT',
            'PRE_RINSE': 'T2-OA-PRE-RINSE-FAUCET-KIT',
            'GOOSENECK_DI': 'T2-OA-DI-GOOSENECK-FAUCET-KIT',
        };
        if (faucetTypeMappings[faucets.faucetType]) {
            await addItemToBOMRecursive(faucetTypeMappings[faucets.faucetType], faucets.faucetQuantity || 1, 'FAUCET', bom, new Set());
        }

        // 9. Sprayers
        if (faucets.sprayer) {
            const sprayerTypeMappings = {
                'DI_WATER_TURRET': 'T2-OA-WATERGUN-TURRET-KIT', 'DI_WATER_ROSETTE': 'T2-OA-WATERGUN-ROSETTE-KIT',
                'AIR_GUN_TURRET': 'T2-OA-AIRGUN-TURRET-KIT', 'AIR_GUN_ROSETTE': 'T2-OA-AIRGUN-ROSETTE-KIT',
            };
            const sprayerTypes = Array.isArray(faucets.sprayerType) ? faucets.sprayerType : (faucets.sprayerType ? [faucets.sprayerType] : []);
            // The old bom-generator.js logic for sprayer quantity was:
            // if array, qty 1 each. if single, faucets.sprayerQuantity.
            // The UI has sprayerType as multi-select and sprayerQuantity as a separate single select (1 or 2).
            // This implies total quantity, not per type.
            // For now, let's assume each selected sprayer type implies one kit. The total quantity might be a constraint rather than a multiplier for each type.
            // The `sink configuration and bom.txt` implies quantity is per selected type.
            // The `sink-config.js` UI has sprayerType (multi-select) and sprayerQuantity (single select 1 or 2).
            // Let's assume each selected type in sprayerType array gets a quantity of 1.
            // The `faucets.sprayerQuantity` might be a validation rule or for a different context.
            // Sticking to bom-generator.js logic: if array, 1 each. If single string, use faucet.sprayerQuantity.
            // Current UI (sink-config.js) makes sprayerType an array if multi-selected.
            
            if (Array.isArray(faucets.sprayerType)) {
                 for (const type of faucets.sprayerType) {
                    if (sprayerTypeMappings[type]) {
                        await addItemToBOMRecursive(sprayerTypeMappings[type], 1, 'SPRAYER', bom, new Set());
                    }
                }
            } else if (faucets.sprayerType && sprayerTypeMappings[faucets.sprayerType]) {
                 await addItemToBOMRecursive(sprayerTypeMappings[faucets.sprayerType], faucets.sprayerQuantity || 1, 'SPRAYER', bom, new Set());
            }
        }
    }
    
    // 10. Accessories
    if (orderAccessories) {
        for (const buildNumber of buildNumbers) {
            const buildAccessories = orderAccessories[buildNumber];
            if (buildAccessories) {
                for (const acc of buildAccessories) {
                    if (acc.assemblyId && acc.quantity > 0) {
                         await addItemToBOMRecursive(acc.assemblyId, acc.quantity, 'ACCESSORY', bom, new Set());
                    }
                }
            }
        }
    }

    // 11. Consolidate BOM
    const consolidatedBOM = [];
    const itemMap = new Map();

    for (const item of bom) {
        if (item.isPlaceholder) { // Keep placeholders separate if any
            consolidatedBOM.push(item);
            continue;
        }
        const key = item.id + (item.category || ''); // Consolidate based on ID and category
        if (itemMap.has(key)) {
            const existingItem = itemMap.get(key);
            existingItem.quantity += item.quantity;
            // Naive component quantity update: if parent quantity increases, child quantities effectively do too.
            // This simple consolidation might need more sophisticated component quantity handling if components are shared and not just multiplied.
            // For now, assuming components are tied to their direct parent's summed quantity.
        } else {
            itemMap.set(key, { ...item }); // Shallow copy, components are references
        }
    }    itemMap.forEach(value => consolidatedBOM.push(value));
    
    return consolidatedBOM;
}

module.exports = { generateBOMForOrder };
