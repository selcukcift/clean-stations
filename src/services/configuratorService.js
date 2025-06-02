/**
 * Configurator Service - Dynamic Configuration Logic
 * Implements business rules from "sink configuration and bom.txt"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get sink models for a specific family
 * @param {string} family - Sink family (MDRD, ENDOSCOPE_CLEANSTATION, INSTROSINK)
 * @returns {Promise<Array>} Available sink models
 */
async function getSinkModels(family) {
    if (family === 'MDRD') {
        // T2-B1 (1 basin), T2-B2 (2 basins), T2-B3 (3 basins)
        return [
            { id: 'T2-B1', name: 'T2-B1 (Single Basin)', basinCount: 1 },
            { id: 'T2-B2', name: 'T2-B2 (Dual Basin)', basinCount: 2 },
            { id: 'T2-B3', name: 'T2-B3 (Triple Basin)', basinCount: 3 }
        ];
    }
    // Other families return empty (under construction)
    return [];
}

/**
 * Get sink body assemblies based on dimensions
 * @param {number} length - Sink length in inches
 * @returns {Promise<Object>} Matching sink body assembly
 */
async function getSinkBodyAssembly(length) {
    // Business logic from sink configuration:
    // 48-60": 709.82 T2-BODY-48-60-HA
    // 61-72": 709.83 T2-BODY-61-72-HA
    // 73-120": 709.84 T2-BODY-73-120-HA
    
    let assemblyId;
    if (length >= 48 && length <= 60) {
        assemblyId = '709.82';
    } else if (length >= 61 && length <= 72) {
        assemblyId = '709.83';
    } else if (length >= 73 && length <= 120) {
        assemblyId = '709.84';
    }
    
    if (assemblyId) {
        const assembly = await prisma.assembly.findUnique({
            where: { assemblyId },
            select: { assemblyId: true, name: true }
        });
        return assembly;
    }
    
    return null;
}

/**
 * Get available leg types
 * @returns {Promise<Array>} Available leg types with assembly info
 */
async function getLegTypes() {
    const legOptions = [
        // Height Adjustable
        { assemblyId: '711.97', name: 'T2-DL27-KIT', type: 'HEIGHT_ADJUSTABLE', legType: 'DL27' },
        { assemblyId: '711.98', name: 'T2-DL14-KIT', type: 'HEIGHT_ADJUSTABLE', legType: 'DL14' },
        { assemblyId: '711.99', name: 'T2-LC1-KIT', type: 'HEIGHT_ADJUSTABLE', legType: 'LC1' },
        // Fixed Height
        { assemblyId: '711.100', name: 'T2-DL27-FH-KIT', type: 'FIXED_HEIGHT', legType: 'DL27' },
        { assemblyId: '711.101', name: 'T2-DL14-FH-KIT', type: 'FIXED_HEIGHT', legType: 'DL14' }
    ];
    
    // Verify assemblies exist in database
    const assemblyIds = legOptions.map(opt => opt.assemblyId);
    const existingAssemblies = await prisma.assembly.findMany({
        where: { assemblyId: { in: assemblyIds } },
        select: { assemblyId: true, name: true }
    });
    
    // Merge with business logic data
    return legOptions.map(option => {
        const dbAssembly = existingAssemblies.find(a => a.assemblyId === option.assemblyId);
        return {
            ...option,
            exists: !!dbAssembly,
            dbName: dbAssembly?.name
        };
    });
}

/**
 * Get available feet types
 * @returns {Promise<Array>} Available feet types
 */
async function getFeetTypes() {
    const feetOptions = [
        { assemblyId: '711.95', name: 'T2-LEVELING-CASTOR-475', type: 'LOCK_LEVELING_CASTERS' },
        { assemblyId: '711.96', name: 'T2-SEISMIC-FEET', type: 'SS_ADJUSTABLE_SEISMIC_FEET' }
    ];
    
    const assemblyIds = feetOptions.map(opt => opt.assemblyId);
    const existingAssemblies = await prisma.assembly.findMany({
        where: { assemblyId: { in: assemblyIds } },
        select: { assemblyId: true, name: true }
    });
    
    return feetOptions.map(option => {
        const dbAssembly = existingAssemblies.find(a => a.assemblyId === option.assemblyId);
        return {
            ...option,
            exists: !!dbAssembly,
            dbName: dbAssembly?.name
        };
    });
}

/**
 * Get pegboard options and generate custom part numbers
 * @param {Object} sinkDimensions - { width, length }
 * @returns {Promise<Object>} Pegboard configuration options
 */
async function getPegboardOptions(sinkDimensions = {}) {
    // Standard pegboard sizes with coverage ranges
    const standardPegboards = [
        { assemblyId: '715.120', name: 'T2-ADW-PB-3436', width: 34, length: 36, covers: '34" - 47"' },
        { assemblyId: '715.121', name: 'T2-ADW-PB-4836', width: 48, length: 36, covers: '48" - 59"' },
        { assemblyId: '715.122', name: 'T2-ADW-PB-6036', width: 60, length: 36, covers: '60" - 71"' },
        { assemblyId: '715.123', name: 'T2-ADW-PB-7236', width: 72, length: 36, covers: '72" - 83"' },
        { assemblyId: '715.124', name: 'T2-ADW-PB-8436', width: 84, length: 36, covers: '84" - 95"' },
        { assemblyId: '715.125', name: 'T2-ADW-PB-9636', width: 96, length: 36, covers: '95" - 107"' },
        { assemblyId: '715.126', name: 'T2-ADW-PB-10836', width: 108, length: 36, covers: '108" - 119"' },
        { assemblyId: '715.127', name: 'T2-ADW-PB-12036', width: 120, length: 36, covers: '120" - 130"' }
    ];
    
    // Additional mandatory parts when pegboard is selected
    const mandatoryParts = [
        { assemblyId: '716.128', name: 'T2-OHL-MDRD-KIT', condition: 'ALWAYS' },
        { assemblyId: '716.130', name: 'T2-ADW-PB-PERF-KIT', condition: 'PERFORATED' },
        { assemblyId: '716.131', name: 'T2-ADW-PB-SOLID-KIT', condition: 'SOLID' }
    ];
    
    // Pegboard types
    const pegboardTypes = [
        { id: 'PERFORATED', name: 'Perforated' },
        { id: 'SOLID', name: 'Solid' }
    ];
    
    // Color options for Colorsafe+
    const colorOptions = [
        { assemblyId: '708.77', name: 'T-OA-PB-COLOR', colors: ['Green', 'Black', 'Yellow', 'Grey', 'Red', 'Blue', 'Orange', 'White'] }
    ];
    
    // Determine best fit for sink dimensions
    let recommendedPegboard = null;
    let needsCustom = false;
    
    if (sinkDimensions.length) {
        // Find standard pegboard that covers the sink length
        recommendedPegboard = standardPegboards.find(pb => {
            const [minCover, maxCover] = pb.covers.replace(/"/g, '').split(' - ').map(Number);
            return sinkDimensions.length >= minCover && sinkDimensions.length <= maxCover;
        });
        
        if (!recommendedPegboard) {
            needsCustom = true;
        }
    }
    
    return {
        types: pegboardTypes,
        standardSizes: standardPegboards,
        colorOptions,
        mandatoryParts,
        recommendedPegboard,
        needsCustom,
        customPartNumberRule: "720.215.002 T2-ADW-PB-[width]x[length]",
        sinkDimensions
    };
}

/**
 * Generate custom pegboard part number
 * @param {number} width - Width in inches
 * @param {number} length - Length in inches
 * @returns {string} Custom part number
 */
function generateCustomPegboardPartNumber(width, length) {
    return `720.215.002 T2-ADW-PB-${width}x${length}`;
}

/**
 * Get basin type options
 * @returns {Array} Available basin types
 */
async function getBasinTypeOptions() {
    return [
        { 
            id: 'E_SINK', 
            name: 'E-Sink', 
            kitAssemblyId: '713.109',
            kitName: 'T2-BSN-ESK-KIT'
        },
        { 
            id: 'E_SINK_DI', 
            name: 'E-Sink DI', 
            kitAssemblyId: '713.108',
            kitName: 'T2-BSN-ESK-DI-KIT'
        },
        { 
            id: 'E_DRAIN', 
            name: 'E-Drain', 
            kitAssemblyId: '713.107',
            kitName: 'T2-BSN-EDR-KIT'
        }
    ];
}

/**
 * Get basin size options
 * @returns {Promise<Object>} Basin size configurations
 */
async function getBasinSizeOptions() {
    const standardSizes = [
        { assemblyId: '712.102', name: 'T2-ADW-BASIN20X20X8', dimensions: '20X20X8' },
        { assemblyId: '712.103', name: 'T2-ADW-BASIN24X20X8', dimensions: '24X20X8' },
        { assemblyId: '712.104', name: 'T2-ADW-BASIN24X20X10', dimensions: '24X20X10' },
        { assemblyId: '712.105', name: 'T2-ADW-BASIN30X20X8', dimensions: '30X20X8' },
        { assemblyId: '712.106', name: 'T2-ADW-BASIN30X20X10', dimensions: '30X20X10' }
    ];
    
    return {
        standardSizes,
        customPartNumberRule: "720.215.001 T2-ADW-BASIN-[width]x[length]x[depth]"
    };
}

/**
 * Generate custom basin part number
 * @param {number} width - Width in inches
 * @param {number} length - Length in inches
 * @param {number} depth - Depth in inches
 * @returns {string} Custom part number
 */
function generateCustomBasinPartNumber(width, length, depth) {
    return `720.215.001 T2-ADW-BASIN-${width}x${length}x${depth}`;
}

/**
 * Get basin addon options based on basin type
 * @param {string} basinType - Basin type (E_SINK, E_SINK_DI, E_DRAIN)
 * @returns {Promise<Array>} Available addons
 */
async function getBasinAddonOptions(basinType) {
    const addons = [];
    
    // P-TRAP is available for all basin types
    const pTrapOption = {
        assemblyId: '706.65',
        name: 'T2-OA-MS-1026',
        displayName: 'P-TRAP DISINFECTION DRAIN UNIT',
        applicableToAll: true
    };
    addons.push(pTrapOption);
    
    // Basin Light Kit varies by basin type
    let basinLightOption = null;
    if (basinType === 'E_DRAIN') {
        basinLightOption = {
            assemblyId: '706.67',
            name: 'T2-OA-BASIN-LIGHT-EDR-KIT',
            displayName: 'Basin Light Kit (E-Drain)',
            basinType: 'E_DRAIN'
        };
    } else if (basinType === 'E_SINK' || basinType === 'E_SINK_DI') {
        basinLightOption = {
            assemblyId: '706.68',
            name: 'T2-OA-BASIN-LIGHT-ESK-KIT',
            displayName: 'Basin Light Kit (E-Sink)',
            basinType: 'E_SINK'
        };
    }
    
    if (basinLightOption) {
        addons.push(basinLightOption);
    }
    
    return addons;
}

/**
 * Get faucet type options with auto-selection logic
 * @param {string} basinType - Basin type for conditional logic
 * @returns {Promise<Object>} Faucet options and auto-selection rules
 */
async function getFaucetTypeOptions(basinType) {
    const faucetTypes = [
        {
            assemblyId: '706.58',
            name: 'T2-OA-STD-FAUCET-WB-KIT',
            displayName: '10" WRIST BLADE SWING SPOUT WALL MOUNTED FAUCET KIT',
            type: 'WRIST_BLADE'
        },
        {
            assemblyId: '706.59',
            name: 'T2-OA-PRE-RINSE-FAUCET-KIT',
            displayName: 'PRE-RINSE OVERHEAD SPRAY UNIT KIT',
            type: 'PRE_RINSE'
        },
        {
            assemblyId: '706.60',
            name: 'T2-OA-DI-GOOSENECK-FAUCET-KIT',
            displayName: 'GOOSENECK TREATED WATER FAUCET KIT PVC',
            type: 'GOOSENECK_DI'
        }
    ];
    
    // Auto-selection rule: E-Sink DI automatically selects Gooseneck
    const autoSelected = basinType === 'E_SINK_DI' ? 'GOOSENECK_DI' : null;
    
    return {
        options: faucetTypes,
        autoSelected,
        autoSelectionRule: 'E-Sink DI automatically selects Gooseneck Treated Water Faucet'
    };
}

/**
 * Get sprayer type options
 * @returns {Promise<Array>} Available sprayer types
 */
async function getSprayerTypeOptions() {
    return [
        {
            assemblyId: '706.61',
            name: 'T2-OA-WATERGUN-TURRET-KIT',
            displayName: 'DI WATER GUN KIT & TURRET',
            type: 'WATER_TURRET'
        },
        {
            assemblyId: '706.62',
            name: 'T2-OA-WATERGUN-ROSETTE-KIT',
            displayName: 'DI WATER GUN KIT & ROSETTE',
            type: 'WATER_ROSETTE'
        },
        {
            assemblyId: '706.63',
            name: 'T2-OA-AIRGUN-TURRET-KIT',
            displayName: 'AIR GUN KIT & TURRET',
            type: 'AIR_TURRET'
        },
        {
            assemblyId: '706.64',
            name: 'T2-OA-AIRGUN-ROSETTE-KIT',
            displayName: 'AIR GUN KIT & ROSETTE',
            type: 'AIR_ROSETTE'
        }
    ];
}

/**
 * Determine control box based on basin configurations
 * @param {Array} basinConfigurations - Array of basin configurations
 * @returns {Promise<Object|null>} Required control box assembly
 */
async function getControlBox(basinConfigurations) {
    if (!basinConfigurations || basinConfigurations.length === 0) {
        return null;
    }
    
    let eDrainCount = 0;
    let eSinkCount = 0; // Includes both E_SINK and E_SINK_DI
    
    // Count basins by type
    basinConfigurations.forEach(basin => {
        if (basin.basinType === 'E_DRAIN') {
            eDrainCount++;
        } else if (basin.basinType === 'E_SINK' || basin.basinType === 'E_SINK_DI') {
            eSinkCount++;
        }
    });
    
    // Control box mapping based on business rules
    const controlBoxMappings = {
        'T2-CTRL-EDR1': { eDrain: 1, eSink: 0 },
        'T2-CTRL-ESK1': { eDrain: 0, eSink: 1 },
        'T2-CTRL-EDR1-ESK1': { eDrain: 1, eSink: 1 },
        'T2-CTRL-EDR2': { eDrain: 2, eSink: 0 },
        'T2-CTRL-ESK2': { eDrain: 0, eSink: 2 },
        'T2-CTRL-EDR3': { eDrain: 3, eSink: 0 },
        'T2-CTRL-ESK3': { eDrain: 0, eSink: 3 },
        'T2-CTRL-EDR1-ESK2': { eDrain: 1, eSink: 2 },
        'T2-CTRL-EDR2-ESK1': { eDrain: 2, eSink: 1 }
    };
    
    // Find matching control box
    for (const [controlBoxId, config] of Object.entries(controlBoxMappings)) {
        if (config.eDrain === eDrainCount && config.eSink === eSinkCount) {
            // Verify assembly exists in database
            const controlBox = await prisma.assembly.findUnique({
                where: { assemblyId: controlBoxId },
                select: { assemblyId: true, name: true }
            });
            
            if (controlBox) {
                return {
                    ...controlBox,
                    basinConfiguration: { eDrainCount, eSinkCount },
                    mappingRule: `${eDrainCount} E-Drain + ${eSinkCount} E-Sink basins`
                };
            }
        }
    }
    
    console.warn(`No control box found for configuration: ${eDrainCount} E-Drain, ${eSinkCount} E-Sink basins`);
    return null;
}

/**
 * Get workflow direction options
 * @returns {Array} Available workflow directions
 */
function getWorkflowDirections() {
    return [
        { id: 'LEFT_TO_RIGHT', name: 'Left to Right' },
        { id: 'RIGHT_TO_LEFT', name: 'Right to Left' }
    ];
}

/**
 * Get faucet placement options based on basin count
 * @param {number} basinCount - Number of basins
 * @returns {Array} Available placement options
 */
function getFaucetPlacementOptions(basinCount) {
    const options = [{ id: 'CENTER', name: 'Center' }];
    
    if (basinCount > 1) {
        options.push({ id: 'BETWEEN_BASINS', name: 'Between Basins' });
    }
    
    return options;
}

/**
 * Get sprayer location options
 * @returns {Array} Available sprayer locations
 */
function getSprayerLocationOptions() {
    return [
        { id: 'LEFT_SIDE', name: 'Left Side' },
        { id: 'RIGHT_SIDE', name: 'Right Side' }
    ];
}

module.exports = {
    getSinkModels,
    getSinkBodyAssembly,
    getLegTypes,
    getFeetTypes,
    getPegboardOptions,
    generateCustomPegboardPartNumber,
    getBasinTypeOptions,
    getBasinSizeOptions,
    generateCustomBasinPartNumber,
    getBasinAddonOptions,
    getFaucetTypeOptions,
    getSprayerTypeOptions,
    getControlBox,
    getWorkflowDirections,
    getFaucetPlacementOptions,
    getSprayerLocationOptions
};