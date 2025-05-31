// BOM Generator Module - Business Logic for Mapping User Selections to Assemblies
SinkConfigApp.prototype.generateBOM = function() {
    this.bom = [];
    
    // Add system items first
    this.addSystemItems();
    
    // Process each sink configuration
    this.orderData.buildNumbers.forEach(buildNumber => {
        this.addSinkConfigurationToBOM(buildNumber);
        this.addAccessoriesToBOM(buildNumber);
    });
    
    // Consolidate duplicate items
    this.consolidateBOM();
};

SinkConfigApp.prototype.addSystemItems = function() {
    // Add language-specific manual kit
    const language = this.orderData.customer.language;
    const manualKit = language === 'FR' ? 'T2-STD-MANUAL-FR-KIT' : 'T2-STD-MANUAL-EN-KIT';
    this.addItemToBOM(manualKit, 1, 'SYSTEM');
};

SinkConfigApp.prototype.addSinkConfigurationToBOM = function(buildNumber) {
    const config = this.orderData.configurations[buildNumber];
    if (!config) return;

    // Add sink body assembly based on length
    this.addSinkBodyAssembly(config.sinkBody);
    
    // Add legs kit
    this.addLegsKit(config.sinkBody.legsType);
    
    // Add feet type
    this.addFeetType(config.sinkBody.feetType);
    
    // Add pegboard if selected
    if (config.sinkBody.pegboard) {
        this.addPegboardAssemblies(config.sinkBody);
    }
    
    // Add basin assemblies
    config.basins.forEach(basin => {
        this.addBasinAssemblies(basin);
    });
    
    // Add control box (system determined)
    this.addControlBox(config.basins);
    
    // Add faucet assemblies
    this.addFaucetAssemblies(config.faucets);
    
    // Add sprayer assemblies if selected
    if (config.faucets.sprayer) {
        this.addSprayerAssemblies(config.faucets);
    }
};

SinkConfigApp.prototype.addSinkBodyAssembly = function(sinkBody) {
    const sinkLength = sinkBody.sinkLength;
    let assemblyId;
    
    if (sinkLength >= 34 && sinkLength <= 60) {
        assemblyId = 'T2-BODY-48-60-HA';
    } else if (sinkLength >= 61 && sinkLength <= 72) {
        assemblyId = 'T2-BODY-61-72-HA';
    } else if (sinkLength >= 73 && sinkLength <= 120) {
        assemblyId = 'T2-BODY-73-120-HA';
    }
    
    if (assemblyId) {
        this.addItemToBOM(assemblyId, 1, 'SINK_BODY');
    }
};

SinkConfigApp.prototype.addLegsKit = function(legsType) {
    const legsMappings = {
        'DL27': 'T2-DL27-KIT',
        'DL14': 'T2-DL14-KIT',
        'LC1': 'T2-LC1-KIT',
        'DL27-FH': 'T2-DL27-FH-KIT',
        'DL14-FH': 'T2-DL14-FH-KIT'
    };
    
    const assemblyId = legsMappings[legsType];
    if (assemblyId) {
        this.addItemToBOM(assemblyId, 1, 'LEGS');
    }
};

SinkConfigApp.prototype.addFeetType = function(feetType) {
    const feetMappings = {
        'CASTERS': 'T2-LEVELING-CASTOR-475',
        'SEISMIC': 'T2-SEISMIC-FEET'
    };
    
    const assemblyId = feetMappings[feetType];
    if (assemblyId) {
        this.addItemToBOM(assemblyId, 1, 'FEET');
    }
};

SinkConfigApp.prototype.addPegboardAssemblies = function(sinkBody) {
    // Add pegboard type kit
    const pegboardTypeMappings = {
        'PERFORATED': 'T2-ADW-PB-PERF-KIT',
        'SOLID': 'T2-ADW-PB-SOLID-KIT'
    };
    
    const typeKit = pegboardTypeMappings[sinkBody.pegboardType];
    if (typeKit) {
        this.addItemToBOM(typeKit, 1, 'PEGBOARD');
    }
    
    // Add pegboard size based on sink length
    if (sinkBody.pegboardSizeOption === 'SAME_AS_SINK') {
        const sinkLength = sinkBody.sinkLength;
        let sizeAssembly;
        
        if (sinkLength >= 34 && sinkLength <= 47) {
            sizeAssembly = 'T2-ADW-PB-3436';
        } else if (sinkLength >= 48 && sinkLength <= 59) {
            sizeAssembly = 'T2-ADW-PB-4836';
        } else if (sinkLength >= 60 && sinkLength <= 71) {
            sizeAssembly = 'T2-ADW-PB-6036';
        } else if (sinkLength >= 72 && sinkLength <= 83) {
            sizeAssembly = 'T2-ADW-PB-7236';
        } else if (sinkLength >= 84 && sinkLength <= 95) {
            sizeAssembly = 'T2-ADW-PB-8436';
        } else if (sinkLength >= 96 && sinkLength <= 107) {
            sizeAssembly = 'T2-ADW-PB-9636';
        } else if (sinkLength >= 108 && sinkLength <= 120) {
            sizeAssembly = 'T2-ADW-PB-10836';
        }
        
        if (sizeAssembly) {
            this.addItemToBOM(sizeAssembly, 1, 'PEGBOARD_SIZE');
        }
    }
    
    // Add mandatory OHL kit for pegboard
    this.addItemToBOM('T2-OHL-MDRD-KIT', 1, 'PEGBOARD_OHL');
};

SinkConfigApp.prototype.addBasinAssemblies = function(basin) {
    // Add basin type kit
    const basinTypeMappings = {
        'E_SINK': 'T2-BSN-ESK-KIT',
        'E_SINK_DI': 'T2-BSN-ESK-DI-KIT',
        'E_DRAIN': 'T2-BSN-EDR-KIT'
    };
    
    const typeKit = basinTypeMappings[basin.basinType];
    if (typeKit) {
        this.addItemToBOM(typeKit, 1, 'BASIN_TYPE');
    }
    
    // Add basin size
    const sizeMapping = {
        '20X20X8': 'T2-ADW-BASIN20X20X8',
        '24X20X8': 'T2-ADW-BASIN24X20X8',
        '24X20X10': 'T2-ADW-BASIN24X20X10',
        '30X20X8': 'T2-ADW-BASIN30X20X8',
        '30X20X10': 'T2-ADW-BASIN30X20X10'
    };
    
    const sizeAssembly = sizeMapping[basin.basinSize];
    if (sizeAssembly) {
        this.addItemToBOM(sizeAssembly, 1, 'BASIN_SIZE');
    }
    
    // Add basin add-ons
    basin.addons.forEach(addon => {
        if (addon === 'PTRAP_DRAIN') {
            this.addItemToBOM('T2-OA-MS-1026', 1, 'BASIN_ADDON');
        } else if (addon === 'BASIN_LIGHT') {
            if (basin.basinType === 'E_DRAIN') {
                this.addItemToBOM('T2-OA-BASIN-LIGHT-EDR-KIT', 1, 'BASIN_ADDON');
            } else if (basin.basinType === 'E_SINK' || basin.basinType === 'E_SINK_DI') {
                this.addItemToBOM('T2-OA-BASIN-LIGHT-ESK-KIT', 1, 'BASIN_ADDON');
            }
        }
    });
};

SinkConfigApp.prototype.addControlBox = function(basins) {
    // Determine control box based on basin types and count
    const eSinkCount = basins.filter(b => b.basinType === 'E_SINK' || b.basinType === 'E_SINK_DI').length;
    const eDrainCount = basins.filter(b => b.basinType === 'E_DRAIN').length;
    
    let controlBoxId;
    
    if (eSinkCount === 1 && eDrainCount === 0) {
        controlBoxId = 'T2-CTRL-ESK1';
    } else if (eSinkCount === 0 && eDrainCount === 1) {
        controlBoxId = 'T2-CTRL-EDR1';
    } else if (eSinkCount === 1 && eDrainCount === 1) {
        controlBoxId = 'T2-CTRL-EDR1-ESK1';
    } else if (eSinkCount === 2 && eDrainCount === 0) {
        controlBoxId = 'T2-CTRL-ESK2';
    } else if (eSinkCount === 0 && eDrainCount === 2) {
        controlBoxId = 'T2-CTRL-EDR2';
    } else if (eSinkCount === 2 && eDrainCount === 1) {
        controlBoxId = 'T2-CTRL-EDR1-ESK2';
    } else if (eSinkCount === 1 && eDrainCount === 2) {
        controlBoxId = 'T2-CTRL-EDR2-ESK1';
    } else if (eSinkCount === 3 && eDrainCount === 0) {
        controlBoxId = 'T2-CTRL-ESK3';
    } else if (eSinkCount === 0 && eDrainCount === 3) {
        controlBoxId = 'T2-CTRL-EDR3';
    }
    
    if (controlBoxId) {
        this.addItemToBOM(controlBoxId, 1, 'CONTROL_BOX');
    }
};

SinkConfigApp.prototype.addFaucetAssemblies = function(faucets) {
    const faucetTypeMappings = {
        'STD_WRIST_BLADE': 'T2-OA-STD-FAUCET-WB-KIT',
        'PRE_RINSE': 'T2-OA-PRE-RINSE-FAUCET-KIT',
        'GOOSENECK_DI': 'T2-OA-DI-GOOSENECK-FAUCET-KIT'
    };
    
    const faucetAssembly = faucetTypeMappings[faucets.faucetType];
    if (faucetAssembly) {
        this.addItemToBOM(faucetAssembly, faucets.faucetQuantity, 'FAUCET');
    }
};

SinkConfigApp.prototype.addSprayerAssemblies = function(faucets) {
    const sprayerTypeMappings = {
        'DI_WATER_TURRET': 'T2-OA-WATERGUN-TURRET-KIT',
        'DI_WATER_ROSETTE': 'T2-OA-WATERGUN-ROSETTE-KIT',
        'AIR_GUN_TURRET': 'T2-OA-AIRGUN-TURRET-KIT',
        'AIR_GUN_ROSETTE': 'T2-OA-AIRGUN-ROSETTE-KIT'
    };
    
    if (Array.isArray(faucets.sprayerType)) {
        faucets.sprayerType.forEach(type => {
            const assemblyId = sprayerTypeMappings[type];
            if (assemblyId) {
                this.addItemToBOM(assemblyId, 1, 'SPRAYER');
            }
        });
    } else if (faucets.sprayerType) {
        const assemblyId = sprayerTypeMappings[faucets.sprayerType];
        if (assemblyId) {
            this.addItemToBOM(assemblyId, faucets.sprayerQuantity, 'SPRAYER');
        }
    }
};

SinkConfigApp.prototype.addAccessoriesToBOM = function(buildNumber) {
    const accessories = this.orderData.accessories[buildNumber];
    if (!accessories) return;
    
    accessories.forEach(accessory => {
        this.addItemToBOM(accessory.assemblyId, accessory.quantity, 'ACCESSORY');
    });
};

SinkConfigApp.prototype.addItemToBOM = function(assemblyId, quantity, category) {
    // Check if assembly exists in data
    const assembly = this.data.assemblies.assemblies[assemblyId];
    if (!assembly) {
        console.warn(`Assembly not found: ${assemblyId}`);
        return;
    }
    
    this.bom.push({
        assemblyId: assemblyId,
        name: assembly.name,
        quantity: quantity,
        category: category,
        type: assembly.type,
        components: assembly.components || []
    });
};

SinkConfigApp.prototype.consolidateBOM = function() {
    const consolidated = {};
    
    this.bom.forEach(item => {
        const key = item.assemblyId;
        if (consolidated[key]) {
            consolidated[key].quantity += item.quantity;
        } else {
            consolidated[key] = { ...item };
        }
    });
    
    this.bom = Object.values(consolidated);
};

SinkConfigApp.prototype.displayReview = function() {
    this.displayOrderSummary();
    this.displayBOM();
};

SinkConfigApp.prototype.displayOrderSummary = function() {
    const container = document.getElementById('summary-details');
    const customer = this.orderData.customer;
    
    let summaryHTML = `
        <div class="summary-section">
            <h4>Customer Information</h4>
            <div class="summary-item">
                <span class="summary-label">PO Number:</span>
                <span class="summary-value">${customer.poNumber}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Customer Name:</span>
                <span class="summary-value">${customer.customerName}</span>
            </div>
            ${customer.projectName ? `
            <div class="summary-item">
                <span class="summary-label">Project Name:</span>
                <span class="summary-value">${customer.projectName}</span>
            </div>
            ` : ''}
            <div class="summary-item">
                <span class="summary-label">Sales Person:</span>
                <span class="summary-value">${customer.salesPerson}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Delivery Date:</span>
                <span class="summary-value">${customer.wantDate}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Language:</span>
                <span class="summary-value">${customer.language === 'EN' ? 'English' : 'French'}</span>
            </div>
            ${customer.notes ? `
            <div class="summary-item">
                <span class="summary-label">Notes:</span>
                <span class="summary-value">${customer.notes}</span>
            </div>
            ` : ''}
        </div>

        <div class="summary-section">
            <h4>Sink Configuration</h4>
            <div class="summary-item">
                <span class="summary-label">Sink Family:</span>
                <span class="summary-value">${this.orderData.sinkFamily}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Number of Sinks:</span>
                <span class="summary-value">${this.orderData.quantity}</span>
            </div>
        </div>
    `;
    
    // Add configuration details for each build number
    this.orderData.buildNumbers.forEach(buildNumber => {
        const config = this.orderData.configurations[buildNumber];
        const accessories = this.orderData.accessories[buildNumber] || [];
        
        summaryHTML += `
            <div class="summary-section">
                <h4>Build #${buildNumber} Configuration</h4>
                <div class="summary-item">
                    <span class="summary-label">Sink Model:</span>
                    <span class="summary-value">${config.sinkBody.sinkModel} (${this.getBasinCount(config.sinkBody.sinkModel)} basin${this.getBasinCount(config.sinkBody.sinkModel) > 1 ? 's' : ''})</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Dimensions:</span>
                    <span class="summary-value">${config.sinkBody.sinkWidth}" W × ${config.sinkBody.sinkLength}" L</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Legs/Feet:</span>
                    <span class="summary-value">${config.sinkBody.legsType} / ${config.sinkBody.feetType}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Pegboard:</span>
                    <span class="summary-value">${config.sinkBody.pegboard ? `Yes (${config.sinkBody.pegboardType})` : 'No'}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Faucets:</span>
                    <span class="summary-value">${config.faucets.faucetQuantity} × ${config.faucets.faucetType}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Accessories:</span>
                    <span class="summary-value">${accessories.length} selected</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = summaryHTML;
};

SinkConfigApp.prototype.displayBOM = function() {
    const container = document.getElementById('bom-display');
    
    let tableHTML = `
        <table class="bom-table">
            <thead>
                <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Category</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    this.bom.forEach(item => {
        tableHTML += this.renderBOMItem(item, 0, item.quantity);
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
};

// New helper function to recursively render BOM items with proper nesting
SinkConfigApp.prototype.renderBOMItem = function(item, level, parentQuantity) {
    const indent = '└─ '.repeat(level);
    const isTopLevel = level === 0;
    const rowClass = isTopLevel ? 'bom-assembly' : 'bom-component';
    
    let html = `
        <tr class="${rowClass}">
            <td>${indent}${item.assemblyId || item.part_id}</td>
            <td>${item.name}</td>
            <td>${item.quantity * parentQuantity}</td>
            <td>${isTopLevel ? item.category : 'Component'}</td>
        </tr>
    `;
    
    // Add components if it's a complex assembly or kit
    if (isTopLevel && (item.type === 'COMPLEX' || item.type === 'KIT') && item.components && item.components.length > 0) {
        item.components.forEach(component => {
            html += this.renderComponentTree(component, level + 1, item.quantity);
        });
    }
    
    return html;
};

// New helper function to recursively render component tree
SinkConfigApp.prototype.renderComponentTree = function(component, level, parentQuantity) {
    const part = this.data.parts.parts[component.part_id];
    if (!part) return '';
    
    const indent = '└─ '.repeat(level);
    const totalQuantity = component.quantity * parentQuantity;
    
    let html = `
        <tr class="bom-component">
            <td>${indent}${component.part_id}</td>
            <td>${part.name}</td>
            <td>${totalQuantity}</td>
            <td>Component</td>
        </tr>
    `;
    
    // Check if this component is also an assembly with its own components
    const componentAssembly = this.data.assemblies.assemblies[component.part_id];
    if (componentAssembly && (componentAssembly.type === 'COMPLEX' || componentAssembly.type === 'KIT') && componentAssembly.components && componentAssembly.components.length > 0) {
        componentAssembly.components.forEach(subComponent => {
            html += this.renderComponentTree(subComponent, level + 1, totalQuantity);
        });
    }
    
    return html;
};

// Enhanced CSV generation to include nested components
SinkConfigApp.prototype.generateCSV = function() {
    let csvContent = "Level,Part Number,Description,Quantity,Category\n";
    
    this.bom.forEach(item => {
        csvContent += this.renderCSVItem(item, 0, item.quantity);
    });
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `BOM_${this.orderData.customer.poNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function for CSV generation with nested structure
SinkConfigApp.prototype.renderCSVItem = function(item, level, parentQuantity) {
    const isTopLevel = level === 0;
    let csvLines = `${level},"${item.assemblyId || item.part_id}","${item.name}",${item.quantity * parentQuantity},"${isTopLevel ? item.category : 'Component'}"\n`;
    
    // Add components if it's a complex assembly or kit
    if (isTopLevel && (item.type === 'COMPLEX' || item.type === 'KIT') && item.components && item.components.length > 0) {
        item.components.forEach(component => {
            csvLines += this.renderCSVComponentTree(component, level + 1, item.quantity);
        });
    }
    
    return csvLines;
};

// Helper function for CSV component tree
SinkConfigApp.prototype.renderCSVComponentTree = function(component, level, parentQuantity) {
    const part = this.data.parts.parts[component.part_id];
    if (!part) return '';
    
    const totalQuantity = component.quantity * parentQuantity;
    let csvLines = `${level},"${component.part_id}","${part.name}",${totalQuantity},"Component"\n`;
    
    // Check if this component is also an assembly with its own components
    const componentAssembly = this.data.assemblies.assemblies[component.part_id];
    if (componentAssembly && (componentAssembly.type === 'COMPLEX' || componentAssembly.type === 'KIT') && componentAssembly.components && componentAssembly.components.length > 0) {
        componentAssembly.components.forEach(subComponent => {
            csvLines += this.renderCSVComponentTree(subComponent, level + 1, totalQuantity);
        });
    }
    
    return csvLines;
};

SinkConfigApp.prototype.editConfiguration = function() {
    // Navigate back to step 1 to allow editing
    this.currentStep = 1;
    this.showStep(this.currentStep);
}; 