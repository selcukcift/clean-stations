const { prisma } = require('../config');

async function getAssemblyDetails(assemblyId) {
    return prisma.assembly.findUnique({
        where: { assemblyId: assemblyId },
        include: {
            components: {
                include: {
                    childPart: true, // Include the actual Part record
                    childAssembly: true, // Include sub-assemblies
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


async function addControlBoxWithDynamicComponents(controlBoxId, quantity, category, bomList, processedAssemblies = new Set()) {
    // Get the control box assembly
    const assembly = await getAssemblyDetails(controlBoxId);
    if (!assembly) {
        console.warn(`Control box with ID ${controlBoxId} not found in database.`);
        bomList.push({
            id: controlBoxId,
            name: `Unknown Control Box: ${controlBoxId}`,
            quantity: quantity,
            category: category || 'UNKNOWN',
            type: 'UNKNOWN',
            components: [],
            isPlaceholder: true,
        });
        return;
    }

    const bomItem = {
        id: assembly.assemblyId,
        name: assembly.name,
        quantity: quantity,
        category: category || assembly.type,
        type: assembly.type,
        components: [],
    };

    // Define dynamic components based on control box type
    let dynamicComponents = [];
    
    // Base components that all control boxes share
    const baseComponents = [
        { partId: 'T2-RFK-BRD-MNT', quantity: 1 },
        { partId: 'T2-CTRL-RK3-SHELL', quantity: 1 },
        { partId: 'PW-105R3-06', quantity: 1 },
        { partId: 'LRS-100-24', quantity: 1 }
    ];
    
    // Determine specific components based on control box type
    switch (controlBoxId) {
        case 'T2-CTRL-EDR1':
            dynamicComponents = [
                ...baseComponents,
                { partId: 'T2-EDRAIN-BOARD-R3', quantity: 1 },
                { partId: 'T-ESOM-F4-01-EDR', quantity: 1 },
                { partId: '52-67001-7', quantity: 1 },
                { partId: 'DC11.0031.201', quantity: 1 },
                { partId: 'T4072014031-001', quantity: 1 }
            ];
            break;
            
        case 'T2-CTRL-ESK1':
            dynamicComponents = [
                ...baseComponents,
                { partId: 'T2-ESINK-BOARD-R3', quantity: 1 },
                { partId: 'T-ESOM-F4-01-ESK', quantity: 1 },
                { partId: '52-67001-7', quantity: 1 },
                { partId: 'DC11.0031.201', quantity: 1 },
                { partId: 'T4072014031-001', quantity: 1 }
            ];
            break;
            
        case 'T2-CTRL-EDR1-ESK1':
            dynamicComponents = [
                ...baseComponents,
                { partId: 'T2-EDRAIN-BOARD-R3', quantity: 1 },
                { partId: 'T2-ESINK-BOARD-R3', quantity: 1 },
                { partId: 'T-ESOM-F4-01-EDR', quantity: 1 },
                { partId: 'T-ESOM-F4-01-ESK', quantity: 1 },
                { partId: '52-67001-7', quantity: 2 },
                { partId: 'DC11.0031.201', quantity: 2 },
                { partId: 'T4072014031-001', quantity: 2 }
            ];
            break;
            
        case 'T2-CTRL-EDR2':
        case 'T2-CTRL-ESK2':
        case 'T2-CTRL-EDR1-ESK2':
        case 'T2-CTRL-EDR2-ESK1':
            // For dual basin configurations, add bracket
            dynamicComponents = [...baseComponents];
            if (controlBoxId.includes('EDR')) {
                const edrCount = controlBoxId.includes('EDR2') ? 2 : 1;
                dynamicComponents.push(
                    { partId: 'T2-EDRAIN-BOARD-R3', quantity: edrCount },
                    { partId: 'T-ESOM-F4-01-EDR', quantity: edrCount }
                );
            }
            if (controlBoxId.includes('ESK')) {
                const eskCount = controlBoxId.includes('ESK2') ? 2 : 1;
                dynamicComponents.push(
                    { partId: 'T2-ESINK-BOARD-R3', quantity: eskCount },
                    { partId: 'T-ESOM-F4-01-ESK', quantity: eskCount }
                );
            }
            const totalBoards = (controlBoxId.match(/\d/g) || []).reduce((a, b) => parseInt(a) + parseInt(b), 0);
            dynamicComponents.push(
                { partId: '52-67001-7', quantity: totalBoards },
                { partId: 'DC11.0031.201', quantity: totalBoards },
                { partId: 'T4072014031-001', quantity: totalBoards },
                { partId: 'T2-UPG-CTRL-BOX-BRKT', quantity: 1 }
            );
            break;
            
        case 'T2-CTRL-EDR3':
        case 'T2-CTRL-ESK3':
            // For triple basin configurations
            dynamicComponents = [
                ...baseComponents,
                { partId: 'T2-UPG-CTRL-BOX-BRKT', quantity: 1 }
            ];
            if (controlBoxId === 'T2-CTRL-EDR3') {
                dynamicComponents.push(
                    { partId: 'T2-EDRAIN-BOARD-R3', quantity: 3 },
                    { partId: 'T-ESOM-F4-01-EDR', quantity: 3 }
                );
            } else {
                dynamicComponents.push(
                    { partId: 'T2-ESINK-BOARD-R3', quantity: 3 },
                    { partId: 'T-ESOM-F4-01-ESK', quantity: 3 }
                );
            }
            dynamicComponents.push(
                { partId: '52-67001-7', quantity: 3 },
                { partId: 'DC11.0031.201', quantity: 3 },
                { partId: 'T4072014031-001', quantity: 3 }
            );
            break;
    }

    // Add each component to the BOM
    for (const component of dynamicComponents) {
        // First check if it's a part
        const part = await prisma.part.findUnique({
            where: { partId: component.partId }
        });

        if (part) {
            bomItem.components.push({
                id: part.partId,
                name: part.name,
                quantity: component.quantity,
                type: part.type,
                components: [],
            });
        } else {
            // Check if it's an assembly
            const subAssembly = await prisma.assembly.findUnique({
                where: { assemblyId: component.partId }
            });

            if (subAssembly) {
                // Recursively add the sub-assembly
                await addItemToBOMRecursive(
                    subAssembly.assemblyId,
                    component.quantity,
                    'SUB_ASSEMBLY',
                    bomItem.components,
                    new Set(processedAssemblies)
                );
            } else {
                console.warn(`Component ${component.partId} not found as part or assembly`);
            }
        }
    }

    bomList.push(bomItem);
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
            // Handle both childPart and childAssembly relationships
            const part = componentLink.childPart;
            const childAssembly = componentLink.childAssembly;
            
            if (!part && !childAssembly) {
                console.warn(`No linked part or assembly found for component in assembly ${assembly.assemblyId}.`);
                bomItem.components.push({
                    id: `UNKNOWN_COMPONENT_${componentLink.id}`,
                    name: `Unknown Component`,
                    quantity: componentLink.quantity,
                    type: 'UNKNOWN_TYPE',
                    components: [],
                    isPlaceholder: true,
                });
                continue;
            }

            // If it's a direct child assembly
            if (childAssembly) {
                await addItemToBOMRecursive(
                    childAssembly.assemblyId, 
                    componentLink.quantity, 
                    'SUB_ASSEMBLY', 
                    bomItem.components, 
                    new Set(processedAssemblies)
                );
            } else if (part) {
                // Check if this part itself is an assembly that needs further expansion
                const subAssembly = await prisma.assembly.findUnique({ 
                    where: { assemblyId: part.partId },
                    include: { components: { include: { childPart: true, childAssembly: true } } } 
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
                        const subPart = subComponentLink.childPart;
                        if (!subPart) continue;
                         // Check if this subPart is an assembly again
                        const deeperSubAssembly = await prisma.assembly.findUnique({ where: { assemblyId: subPart.partId }});
                        if (deeperSubAssembly) {
                            // If it's another level of assembly, call addItemToBOMRecursive
                            // For simplicity in this step, we'll add it as a component part.
                            // A more robust solution might involve deeper recursion here if parts can be many levels of assemblies.
                            // For now, we assume parts that are assemblies are expanded one level directly.
                             await addItemToBOMRecursive(subPart.partId, subComponentLink.quantity, 'SUB_COMPONENT_ASSEMBLY', subAssemblyBomItem.components, new Set(processedAssemblies));

                        } else {
                             subAssemblyBomItem.components.push({
                                id: subPart.partId,
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
                    id: part.partId, // User-facing part ID
                    name: part.name,
                    quantity: componentLink.quantity, // Quantity of this part within the assembly
                    type: part.type, // PartType
                    components: [], // Simple parts don't have further components in this context
                });
            }
            } // Close the `else if (part)` block
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
            legTypeId,  
            feetTypeId,  
            pegboard, 
            pegboardTypeId, 
            pegboardSizePartNumber, 
            basins, 
            faucetTypeId, 
            faucetQuantity,
            faucets, // New array format
            sprayer, 
            sprayerTypeIds,
            sprayers, // New array format 
            controlBoxId,
            // Use length or sinkLength for body assembly
            length,
            sinkLength
        } = config; 

        // 2. Sink Body Assembly
        // Use length (from UI) or sinkLength for body assembly selection
        const actualLength = length || sinkLength;
        let sinkBodyAssemblyId;
        if (actualLength) { // Check if length is provided and valid
            if (actualLength >= 48 && actualLength <= 60) sinkBodyAssemblyId = 'T2-BODY-48-60-HA'; // T2-BODY-48-60-HA
            else if (actualLength >= 61 && actualLength <= 72) sinkBodyAssemblyId = 'T2-BODY-61-72-HA'; // T2-BODY-61-72-HA
            else if (actualLength >= 73 && actualLength <= 120) sinkBodyAssemblyId = 'T2-BODY-73-120-HA'; // T2-BODY-73-120-HA
            
            if (sinkBodyAssemblyId) {
                await addItemToBOMWithPartNumber(sinkBodyAssemblyId, 1, 'SINK_BODY', bom, new Set());
            } else {
                console.warn(`No sink body assembly found for length: ${actualLength}`);
            }
        } else if (sinkModelId) {
            // Fallback or primary logic: if sinkModelId is intended to be the main assembly including the body.
            // This needs to align with how getSinkModels structures data.
            // For now, we assume sinkModelId might be a more general identifier or a kit.
            // If it IS the body assembly, this call would be appropriate:
            // await addItemToBOMRecursive(sinkModelId, 1, 'SINK_MODEL_ASSEMBLY', bom, new Set());
            console.log(`Sink length not provided, relying on other components or sinkModelId: ${sinkModelId} if it includes body.`);
        }

        // 3. Legs Kit (handle both legTypeId and legsTypeId)
        const actualLegTypeId = legTypeId || legsTypeId;
        if (actualLegTypeId) {
            await addItemToBOMWithPartNumber(actualLegTypeId, 1, 'LEGS', bom, new Set());
        }

        // 4. Feet Type
        if (feetTypeId) {
            await addItemToBOMWithPartNumber(feetTypeId, 1, 'FEET', bom, new Set());
        }
        
        // 5. Pegboard (Updated with document logic)
        if (pegboard) {
            // MANDATORY: Overhead light kit (Document line 113)
            await addItemToBOMWithPartNumber('T2-OHL-MDRD-KIT', 1, 'PEGBOARD_MANDATORY', bom, new Set());
            
            // Pegboard type selection
            if (pegboardTypeId) {
                // MANDATORY based on pegboard type (Document lines 113-114)
                if (pegboardTypeId === 'PERFORATED') {
                    await addItemToBOMWithPartNumber('T2-ADW-PB-PERF-KIT', 1, 'PEGBOARD_MANDATORY', bom, new Set());
                } else if (pegboardTypeId === 'SOLID') {
                    await addItemToBOMWithPartNumber('T2-ADW-PB-SOLID-KIT', 1, 'PEGBOARD_MANDATORY', bom, new Set());
                }
            }
            
            // Color selection (Document line 74)
            // Note: Color selection should be handled in UI, adding color kit if selected
            // This would be passed as a separate field in the configuration
            
            // Pegboard size logic
            if (pegboardSizePartNumber) {
                if (pegboardSizePartNumber.startsWith('720.215.002 T2-ADW-PB-')) {
                    // Custom pegboard size
                    let partDetails = await prisma.part.findUnique({ where: { partId: pegboardSizePartNumber } });
                    if (!partDetails) {
                        partDetails = {
                            partId: pegboardSizePartNumber,
                            name: `Custom Pegboard Panel ${pegboardSizePartNumber.substring('720.215.002 T2-ADW-PB-'.length)}`,
                            type: 'CUSTOM_PART_AUTOGEN'
                        };
                    }
                    bom.push({
                        id: partDetails.partId,
                        partNumber: pegboardSizePartNumber,
                        name: partDetails.name,
                        quantity: 1,
                        category: 'PEGBOARD_PANEL',
                        type: partDetails.type,
                        components: [],
                        isCustom: true
                    });
                } else {
                    // Standard pegboard size assembly
                    await addItemToBOMWithPartNumber(pegboardSizePartNumber, 1, 'PEGBOARD_SIZE', bom, new Set());
                }
            } else {
                // Auto-select pegboard size based on sink length (Document line 88)
                const pegboardSizeId = getPegboardSizeByLength(actualLength);
                if (pegboardSizeId) {
                    await addItemToBOMWithPartNumber(pegboardSizeId, 1, 'PEGBOARD_SIZE_AUTO', bom, new Set());
                }
            }
        }

        // 6. Basin Assemblies
        if (basins && basins.length > 0) {
            for (const basin of basins) {
                if (basin.basinTypeId) {
                    await addItemToBOMRecursive(basin.basinTypeId, 1, 'BASIN_TYPE_KIT', bom, new Set());
                }
                if (basin.basinSizePartNumber) {
                    if (basin.basinSizePartNumber.startsWith('720.215.001 T2-ADW-BASIN-')) {
                        let partDetails = await prisma.part.findUnique({ where: { partId: basin.basinSizePartNumber } });
                        if (!partDetails) {
                            partDetails = {
                                partId: basin.basinSizePartNumber,
                                name: `Custom Basin ${basin.basinSizePartNumber.substring('720.215.001 T2-ADW-BASIN-'.length)}`,
                                type: 'CUSTOM_PART_AUTOGEN'
                            };
                        }
                        bom.push({
                            id: partDetails.partId,
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
        
        // 7. Control Box (Auto-select based on basin types - only when configuration is complete)
        const isConfigurationComplete = isSinkConfigurationComplete(config);
        if (isConfigurationComplete) {
            const autoControlBoxId = controlBoxId || getAutoControlBoxId(basins);
            if (autoControlBoxId) {
                const controlBoxesWithDynamicComponents = [
                    'T2-CTRL-EDR1', 'T2-CTRL-ESK1', 'T2-CTRL-EDR1-ESK1',
                    'T2-CTRL-EDR2', 'T2-CTRL-ESK2', 'T2-CTRL-EDR1-ESK2',
                    'T2-CTRL-EDR2-ESK1', 'T2-CTRL-EDR3', 'T2-CTRL-ESK3'
                ];
                
                if (controlBoxesWithDynamicComponents.includes(autoControlBoxId)) {
                    await addControlBoxWithDynamicComponents(autoControlBoxId, 1, 'CONTROL_BOX', bom, new Set());
                } else {
                    await addItemToBOMWithPartNumber(autoControlBoxId, 1, 'CONTROL_BOX', bom, new Set());
                }
            }
        }

        // 8. Faucets (handle both single and array format + auto-selection)
        // Auto-select faucets for E-Sink DI basins
        const autoSelectedFaucets = getAutoSelectedFaucets(basins);
        for (const autoFaucet of autoSelectedFaucets) {
            await addItemToBOMWithPartNumber(autoFaucet.faucetTypeId, autoFaucet.quantity, 'FAUCET_AUTO', bom, new Set());
        }
        
        // User-selected faucets
        if (faucets && faucets.length > 0) {
            for (const faucet of faucets) {
                if (faucet.faucetTypeId) {
                    await addItemToBOMWithPartNumber(faucet.faucetTypeId, 1, 'FAUCET_KIT', bom, new Set());
                }
            }
        } else if (faucetTypeId) {
            // Legacy single faucet format
            await addItemToBOMWithPartNumber(faucetTypeId, faucetQuantity || 1, 'FAUCET_KIT', bom, new Set());
        }

        // 9. Sprayers (handle both single and array format)
        if (sprayers && sprayers.length > 0) {
            // New array format
            for (const sprayer of sprayers) {
                if (sprayer.sprayerTypeId) {
                    await addItemToBOMRecursive(sprayer.sprayerTypeId, 1, 'SPRAYER_KIT', bom, new Set());
                }
            }
        } else if (sprayer && sprayerTypeIds && sprayerTypeIds.length > 0) {
            // Legacy array of IDs format
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

    // 11. Return hierarchical BOM structure
    // We now preserve the hierarchical structure to show parent->child->grandchild relationships
    
    console.log(`Generated BOM with ${bom.length} top-level items`);
    
    // Return both hierarchical and flattened versions for different display needs
    const flattenedBOM = flattenBOMForDisplay(bom);
    
    return {
        hierarchical: bom,           // Full nested structure for detailed views
        flattened: flattenedBOM,     // Flattened with indentation for simple display
        totalItems: flattenedBOM.length,
        topLevelItems: bom.length
    };
}

/**
 * Auto-select control box based on basin type combinations
 * @param {Array} basins - Array of basin configurations
 * @returns {string|null} Control box assembly ID
 */
/**
 * Check if sink configuration is complete enough to determine control box
 * @param {Object} config - Sink configuration
 * @returns {boolean} - True if configuration is complete
 */
function isSinkConfigurationComplete(config) {
    // Must have sink model
    if (!config.sinkModelId) return false;
    
    // Must have basins configured
    if (!config.basins || config.basins.length === 0) return false;
    
    // Check if all basins have basin types configured
    const allBasinsHaveTypes = config.basins.every(basin => 
        basin.basinTypeId && basin.basinTypeId !== 'undefined'
    );
    
    if (!allBasinsHaveTypes) return false;
    
    // Check if basin count matches sink model expectations
    const sinkModel = config.sinkModelId;
    const expectedBasinCount = sinkModel === 'T2-B1' ? 1 : 
                              sinkModel === 'T2-B2' ? 2 : 
                              sinkModel === 'T2-B3' ? 3 : 0;
    
    // Only require control box when we have the expected number of basins
    // This prevents control box from appearing while user is still configuring basins
    if (config.basins.length < expectedBasinCount) return false;
    
    // Optional: Check if basin sizes are configured (less strict)
    // This allows control box to appear even if basin sizes aren't fully configured
    
    return true;
}

function getAutoControlBoxId(basins) {
    if (!basins || basins.length === 0) return null;
    
    // Count basin types (treating E_SINK_DI as E_SINK for control box logic)
    const eSinks = basins.filter(b => b.basinTypeId === 'T2-BSN-ESK-KIT' || b.basinTypeId === 'T2-BSN-ESK-DI-KIT').length;
    const eDrains = basins.filter(b => b.basinTypeId === 'T2-BSN-EDR-KIT').length;
    
    // Control box logic from document (lines 151-159)
    if (eDrains === 1 && eSinks === 0) return 'T2-CTRL-EDR1';          // 719.176
    if (eDrains === 0 && eSinks === 1) return 'T2-CTRL-ESK1';          // 719.177
    if (eDrains === 1 && eSinks === 1) return 'T2-CTRL-EDR1-ESK1';     // 719.178
    if (eDrains === 2 && eSinks === 0) return 'T2-CTRL-EDR2';          // 719.179
    if (eDrains === 0 && eSinks === 2) return 'T2-CTRL-ESK2';          // 719.180
    if (eDrains === 3 && eSinks === 0) return 'T2-CTRL-EDR3';          // 719.181
    if (eDrains === 0 && eSinks === 3) return 'T2-CTRL-ESK3';          // 719.182
    if (eDrains === 1 && eSinks === 2) return 'T2-CTRL-EDR1-ESK2';     // 719.183
    if (eDrains === 2 && eSinks === 1) return 'T2-CTRL-EDR2-ESK1';     // 719.184
    
    console.warn(`No control box defined for ${eDrains} E-Drains and ${eSinks} E-Sinks`);
    return null;
}

/**
 * Get pegboard size assembly based on sink length
 * @param {number} sinkLength - Sink length in inches
 * @returns {string|null} Pegboard size assembly ID
 */
function getPegboardSizeByLength(sinkLength) {
    if (!sinkLength) return null;
    
    // Pegboard size logic from document (lines 90-97)
    if (sinkLength >= 34 && sinkLength <= 47) return 'T2-ADW-PB-3436';   // 715.120
    if (sinkLength >= 48 && sinkLength <= 59) return 'T2-ADW-PB-4836';   // 715.121
    if (sinkLength >= 60 && sinkLength <= 71) return 'T2-ADW-PB-6036';   // 715.122
    if (sinkLength >= 72 && sinkLength <= 83) return 'T2-ADW-PB-7236';   // 715.123
    if (sinkLength >= 84 && sinkLength <= 95) return 'T2-ADW-PB-8436';   // 715.124
    if (sinkLength >= 96 && sinkLength <= 107) return 'T2-ADW-PB-9636';  // 715.125
    if (sinkLength >= 108 && sinkLength <= 119) return 'T2-ADW-PB-10836'; // 715.126
    if (sinkLength >= 120 && sinkLength <= 130) return 'T2-ADW-PB-12036'; // 715.127
    
    console.warn(`No pegboard size defined for sink length: ${sinkLength}`);
    return null;
}

/**
 * Auto-select faucet for E-Sink DI basins
 * @param {Array} basins - Array of basin configurations
 * @returns {Array} Auto-selected faucets
 */
function getAutoSelectedFaucets(basins) {
    if (!basins || basins.length === 0) return [];
    
    const autoFaucets = [];
    
    // Auto-select DI gooseneck faucet for E-Sink DI basins (document line 175)
    const eSinkDICount = basins.filter(b => b.basinTypeId === 'T2-BSN-ESK-DI-KIT').length;
    if (eSinkDICount > 0) {
        autoFaucets.push({
            faucetTypeId: 'T2-OA-DI-GOOSENECK-FAUCET-KIT',  // 706.60
            quantity: eSinkDICount,
            autoSelected: true,
            reason: 'Auto-selected for E-Sink DI basins'
        });
    }
    
    return autoFaucets;
}

/**
 * Add BOM item with complete hierarchical structure (parent -> child -> grandchild)
 * @param {string} assemblyId - Assembly ID
 * @param {number} quantity - Quantity
 * @param {string} category - Category
 * @param {Array} bom - BOM array to add to
 * @param {Set} processedAssemblies - Set of processed assemblies to avoid infinite loops
 * @param {number} level - Current hierarchy level (0 = top level)
 */
async function addItemToBOMWithPartNumber(assemblyId, quantity, category, bom, processedAssemblies = new Set(), level = 0) {
    // Create a unique key for this assembly at this level to avoid infinite recursion
    const processKey = `${assemblyId}-${level}`;
    if (processedAssemblies.has(processKey)) return;
    processedAssemblies.add(processKey);

    const assembly = await getAssemblyDetails(assemblyId);
    if (!assembly) {
        console.warn(`Assembly not found: ${assemblyId}`);
        return;
    }

    // Create BOM item with part number and hierarchy info
    const bomItem = {
        id: assembly.assemblyId,
        partNumber: assembly.subcategoryCode || assembly.categoryCode || 'NO-PART-NUMBER',
        name: assembly.name,
        quantity: quantity,
        category: category,
        type: assembly.type,
        level: level,
        children: [],
        hasChildren: assembly.components && assembly.components.length > 0
    };

    // Recursively add child components
    if (assembly.components && assembly.components.length > 0) {
        for (const component of assembly.components) {
            if (component.childAssembly) {
                // Child is an assembly - recurse deeper
                await addItemToBOMWithPartNumber(
                    component.childAssembly.assemblyId,
                    component.quantity * quantity,
                    `${category}_SUB`,
                    bomItem.children,
                    processedAssemblies,
                    level + 1
                );
            } else if (component.childPart) {
                // Child is a part - terminal node
                bomItem.children.push({
                    id: component.childPart.partId,
                    partNumber: component.childPart.partId, // Parts use partId as part number
                    name: component.childPart.name,
                    quantity: component.quantity * quantity,
                    category: 'PART',
                    type: component.childPart.type,
                    level: level + 1,
                    children: [],
                    hasChildren: false,
                    isPart: true
                });
            }
        }
    }

    bom.push(bomItem);
}

/**
 * Flatten hierarchical BOM for display while preserving structure info
 * @param {Array} hierarchicalBom - BOM with nested children
 * @returns {Array} Flattened BOM with level indicators
 */
function flattenBOMForDisplay(hierarchicalBom) {
    const flattened = [];
    
    function flattenRecursive(items, parentLevel = 0) {
        for (const item of items) {
            // Add the item itself
            flattened.push({
                ...item,
                isChild: parentLevel > 0,
                indentLevel: parentLevel
            });
            
            // Recursively add children (stored in 'components' property)
            if (item.components && item.components.length > 0) {
                flattenRecursive(item.components, parentLevel + 1);
            }
        }
    }
    
    flattenRecursive(hierarchicalBom);
    return flattened;
}

module.exports = {
    generateBOMForOrder,
    addItemToBOMRecursive,
    addItemToBOMWithPartNumber,
    flattenBOMForDisplay,
    getAssemblyDetails,
    getPartDetails,
    getAutoControlBoxId,
    getPegboardSizeByLength,
    getAutoSelectedFaucets
};
