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

        const {
            sinkModelId, 
            legsTypeId,  
            feetTypeId,  
            pegboard, 
            pegboardTypeId, 
            pegboardSizePartNumber, 
            basins, 
            faucetTypeId, 
            faucetQuantity,
            sprayer, 
            sprayerTypeIds, 
            controlBoxId,
            // sinkLength might be part of a sinkBody object within config or a top-level prop
            // Adjust based on actual structure passed from UI after configuratorService integration
            sinkLength // Assuming sinkLength is available in config for now for body logic
        } = config; 

        // 2. Sink Body Assembly
        // This logic might be superseded if sinkModelId itself is the complete body assembly.
        // For now, retaining length-based selection if specific sinkLength is provided.
        let sinkBodyAssemblyId;
        if (sinkLength) { // Check if sinkLength is provided and valid
            if (sinkLength >= 34 && sinkLength <= 60) sinkBodyAssemblyId = 'T2-BODY-48-60-HA';
            else if (sinkLength >= 61 && sinkLength <= 72) sinkBodyAssemblyId = 'T2-BODY-61-72-HA';
            else if (sinkLength >= 73 && sinkLength <= 120) sinkBodyAssemblyId = 'T2-BODY-73-120-HA';
            
            if (sinkBodyAssemblyId) {
                await addItemToBOMRecursive(sinkBodyAssemblyId, 1, 'SINK_BODY', bom, new Set());
            } else {
                console.warn(`No sink body assembly found for length: ${sinkLength}`);
            }
        } else if (sinkModelId) {
            // Fallback or primary logic: if sinkModelId is intended to be the main assembly including the body.
            // This needs to align with how getSinkModels structures data.
            // For now, we assume sinkModelId might be a more general identifier or a kit.
            // If it IS the body assembly, this call would be appropriate:
            // await addItemToBOMRecursive(sinkModelId, 1, 'SINK_MODEL_ASSEMBLY', bom, new Set());
            console.log(`Sink length not provided, relying on other components or sinkModelId: ${sinkModelId} if it includes body.`);
        }

        // 3. Legs Kit
        if (legsTypeId) {
            await addItemToBOMRecursive(legsTypeId, 1, 'LEGS', bom, new Set());
        }

        // 4. Feet Type
        if (feetTypeId) {
            await addItemToBOMRecursive(feetTypeId, 1, 'FEET', bom, new Set());
        }
        
        // 5. Pegboard
        if (pegboard) {
            if (pegboardTypeId) {
                await addItemToBOMRecursive(pegboardTypeId, 1, 'PEGBOARD_TYPE_KIT', bom, new Set());
            }

            if (pegboardSizePartNumber) {
                // Check if it's a custom part number pattern
                if (pegboardSizePartNumber.startsWith('720.215.002 T2-ADW-PB-')) {
                    // Attempt to find it in the Part table
                    let partDetails = await prisma.part.findUnique({ where: { partNumber: pegboardSizePartNumber } });
                    if (!partDetails) {
                        // If not in DB, add as a custom part placeholder
                        partDetails = {
                            partNumber: pegboardSizePartNumber,
                            name: `Custom Pegboard Panel ${pegboardSizePartNumber.substring('720.215.002 T2-ADW-PB-'.length)}`,
                            type: 'CUSTOM_PART_AUTOGEN' // Indicate it was auto-generated
                        };
                    }
                    bom.push({
                        id: partDetails.partNumber,
                        name: partDetails.name,
                        quantity: 1,
                        category: 'PEGBOARD_PANEL',
                        type: partDetails.type,
                        components: [],
                        isCustom: true
                    });
                } else {
                    // Assume it's a standard assembly ID for the pegboard size/panel
                    await addItemToBOMRecursive(pegboardSizePartNumber, 1, 'PEGBOARD_SIZE_ASSEMBLY', bom, new Set());
                }
            }
            await addItemToBOMRecursive('T2-OHL-MDRD-KIT', 1, 'PEGBOARD_OHL', bom, new Set());
        }

        // 6. Basin Assemblies
        if (basins && basins.length > 0) {
            for (const basin of basins) {
                if (basin.basinTypeId) {
                    await addItemToBOMRecursive(basin.basinTypeId, 1, 'BASIN_TYPE_KIT', bom, new Set());
                }
                if (basin.basinSizePartNumber) {
                    if (basin.basinSizePartNumber.startsWith('720.215.001 T2-ADW-BASIN-')) {
                        let partDetails = await prisma.part.findUnique({ where: { partNumber: basin.basinSizePartNumber } });
                        if (!partDetails) {
                            partDetails = {
                                partNumber: basin.basinSizePartNumber,
                                name: `Custom Basin ${basin.basinSizePartNumber.substring('720.215.001 T2-ADW-BASIN-'.length)}`,
                                type: 'CUSTOM_PART_AUTOGEN'
                            };
                        }
                        bom.push({
                            id: partDetails.partNumber,
                            name: partDetails.name,
                            quantity: 1,
                            category: 'BASIN_PANEL',
                            type: partDetails.type,
                            components: [],
                            isCustom: true
                        });
                    } else {
                        await addItemToBOMRecursive(basin.basinSizePartNumber, 1, 'BASIN_SIZE_ASSEMBLY', bom, new Set());
                    }
                }

                if (basin.addonIds && basin.addonIds.length > 0) {
                    for (const addonId of basin.addonIds) {
                        await addItemToBOMRecursive(addonId, 1, 'BASIN_ADDON', bom, new Set());
                    }
                }
            }
        }
        
        // 7. Control Box
        if (controlBoxId) {
            await addItemToBOMRecursive(controlBoxId, 1, 'CONTROL_BOX', bom, new Set());
        }

        // 8. Faucets
        if (faucetTypeId) {
            await addItemToBOMRecursive(faucetTypeId, faucetQuantity || 1, 'FAUCET_KIT', bom, new Set());
        }

        // 9. Sprayers
        if (sprayer && sprayerTypeIds && sprayerTypeIds.length > 0) {
            for (const sprayerId of sprayerTypeIds) {
                await addItemToBOMRecursive(sprayerId, 1, 'SPRAYER_KIT', bom, new Set());
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
        if (!itemMap.has(key)) {
            itemMap.set(key, { ...item });
        } else {
            // Consolidate quantities for the same item
            const existingItem = itemMap.get(key);
            existingItem.quantity += item.quantity;
            // Merge components if needed, or handle as per business logic
            // For now, we just consolidate the top-level items
        }
    }

    // Convert itemMap back to array
    for (const consolidatedItem of itemMap.values()) {
        consolidatedBOM.push(consolidatedItem);
    }

    return consolidatedBOM;
}

module.exports = {
    generateBOMForOrder,
    addItemToBOMRecursive,
    getAssemblyDetails,
    getPartDetails,
};
