# CleanStation Sink Configuration Tool

## Overview
The CleanStation Sink Configuration Tool is a web-based application that allows sales personnel to configure MDRD (Medical Device Reprocessing Department) sinks through a 5-step process and generate accurate Bill of Materials (BOM).

## Features
- **Step 1: Customer Information** - Collect order details and customer information
- **Step 2: Sink Selection** - Choose sink family and specify quantities with build numbers
- **Step 3: Sink Configuration** - Configure sink body, basins, and faucets for each build
- **Step 4: Add-on Accessories** - Select from curated list of high-priority accessories
- **Step 5: Review & BOM Generation** - Review complete configuration and export BOM to CSV

## Technology Stack
- **Frontend**: HTML5, CSS3, vanilla JavaScript
- **Data**: JSON files (assemblies.json, parts.json, categories.json)
- **Export**: CSV generation for Bill of Materials

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for loading JSON files)

### Installation

1. **Clone or download** all project files to a local directory:
   ```
   Clean-stations/
   ├── index.html
   ├── styles.css
   ├── app.js
   ├── sink-config.js
   ├── accessories.js
   ├── bom-generator.js
   ├── assemblies.json
   ├── parts.json
   ├── categories.json
   └── README.md
   ```

2. **Set up a local web server**:

   **Option A: Using Python (if installed)**
   ```bash
   # Navigate to the project directory
   cd Clean-stations
   
   # Python 3
   python -m http.server 8000
   
   # Or Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option B: Using Node.js (if installed)**
   ```bash
   # Install http-server globally
   npm install -g http-server
   
   # Navigate to project directory and start server
   cd Clean-stations
   http-server -p 8000
   ```

   **Option C: Using Visual Studio Code**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Access the application**:
   - Open your web browser
   - Navigate to `http://localhost:8000` (or the port your server is using)

## Usage Guide

### Step 1: Customer Information
- Enter all required fields marked with asterisk (*)
- PO Number, Customer Name, Sales Person must be at least 3 characters
- Delivery Date must be in the future
- Select order language (affects manual kit in BOM)
- Notes field is optional

### Step 2: Sink Selection
- Select "MDRD" as sink family (other options show "Under Construction")
- Enter number of sinks (1-10)
- Provide unique build numbers for each sink

### Step 3: Sink Configuration
**Repeated for each build number:**

**Sink Body Configuration:**
- Select sink model (1, 2, or 3 basins)
- Enter sink dimensions (width and length in inches)
- Choose legs type (height adjustable or fixed height)
- Select feet type (casters or seismic feet)
- Optionally add pegboard with type and size

**Basin Configuration:**
- Configure each basin based on selected model
- Choose basin type (E-Sink, E-Sink DI, E-Drain)
- Select basin size from available options
- Add optional basin accessories

**Faucet Configuration:**
- Select faucet type (auto-selected for DI basins)
- Specify number of faucets (max depends on basin count)
- Choose faucet placement
- Optionally add sprayers with type and location

### Step 4: Add-on Accessories
**Repeated for each build number:**
- Browse accessories by category:
  - Baskets, Bins & Shelves
  - Holders, Plates & Hangers
  - Lighting Add-ons
  - Electronic & Digital Add-ons
  - Faucet, Outlet, Drain, Sprayer Kits
  - Drawers & Compartments
- Select desired accessories and specify quantities

### Step 5: Review & BOM Generation
- Review complete order summary
- View generated Bill of Materials with:
  - Assembly-level items
  - Component-level breakdown (for kits and complex assemblies)
  - Quantities and categories
- Export BOM to CSV file
- Edit configuration if needed (returns to Step 1)

## BOM Business Logic

The application automatically maps user selections to specific assembly IDs:

### Sink Body
- Length 34"-60": `T2-BODY-48-60-HA`
- Length 61"-72": `T2-BODY-61-72-HA`
- Length 73"-120": `T2-BODY-73-120-HA`

### Control Box (Auto-determined)
Based on basin type combinations:
- 1 E-Sink: `T2-CTRL-ESK1`
- 1 E-Drain: `T2-CTRL-EDR1`
- 1 E-Sink + 1 E-Drain: `T2-CTRL-EDR1-ESK1`
- And so on...

### System Items
- English manual: `T2-STD-MANUAL-EN-KIT`
- French manual: `T2-STD-MANUAL-FR-KIT`

## Data Files

### assemblies.json
Contains buildable products with:
- Assembly ID, name, type (SIMPLE, COMPLEX, KIT, SERVICE_PART)
- Components list for complex assemblies and kits

### parts.json
Individual component parts referenced by assemblies:
- Part ID, name, manufacturer information

### categories.json
Product hierarchy and organization:
- Categories and subcategories
- Assembly references for accessory selection

## Validation Rules

- **Customer Info**: All required fields, minimum lengths, future delivery date
- **Sink Selection**: Valid family, quantity, unique build numbers
- **Sink Config**: Required dimensions, valid ranges, dependent field validation
- **Accessories**: Optional selection with quantity validation

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## File Export

BOM CSV files are named: `BOM_{PO_Number}_{Date}.csv`

Example: `BOM_PO12345_2024-01-15.csv`

## Troubleshooting

### Common Issues

1. **JSON loading errors**:
   - Ensure you're using a web server, not opening files directly
   - Check browser console for specific error messages

2. **Validation errors**:
   - Review all required fields marked with asterisk
   - Check field length requirements and data formats

3. **BOM generation issues**:
   - Verify all sink configurations are complete
   - Check browser console for missing assembly warnings

### Support
For technical issues or questions about the application, refer to the implementation documentation or contact the development team.

## Future Enhancements (Deferred from MVP)

- Support for Endoscope CleanStation and InstroSink families
- Custom pegboard and basin size inputs
- PDF BOM export
- Order submission and save/draft functionality
- Enhanced accessory categorization and search
- User authentication and order history 