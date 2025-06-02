# Legacy JavaScript Files Analysis

This document analyzes the legacy JavaScript files and their relationship to the new React/Next.js implementation.

## 1. index.html

### Functionality Provided:
- Multi-step wizard interface (5 steps) for sink configuration
- Customer information form
- Sink selection interface
- Sink configuration UI
- Accessories selection
- Review and BOM generation
- Progress indicator
- Loading states

### Status in React/Next.js System:
✅ **FULLY REPLACED** by React components:
- Multi-step wizard → `components/order/OrderWizard.tsx`
- Progress indicator → Built into `OrderWizard.tsx`
- Loading states → React components with loading states
- All form sections → Individual step components

### Gaps/Missing Features:
- None identified - all functionality has been reimplemented

### Still Being Served:
- ❌ Not being served by Next.js or the Node.js backend
- Not referenced in any configuration files

## 2. app.js

### Functionality Provided:
- Main application class (SinkConfigApp)
- Step navigation logic
- Form validation for all steps
- Data management (customer, sinks, configurations, accessories)
- API integration with backend endpoints
- Build number management
- State persistence during configuration

### Status in React/Next.js System:
✅ **FULLY REPLACED** by:
- Application state → `stores/orderCreateStore.ts` (Zustand store)
- Step navigation → `OrderWizard.tsx` component
- Form validation → `isStepValid` function in store
- API integration → `lib/api.ts` with `nextJsApiClient` and `plainNodeApiClient`
- Build number management → Handled in store and components

### Gaps/Missing Features:
- None identified - all core functionality has been reimplemented

### Still Being Served:
- ❌ Not being served or referenced

## 3. sink-config.js

### Functionality Provided:
- Sink configuration UI rendering (Step 3)
- Dynamic basin forms based on sink model
- Pegboard configuration
- Faucet and sprayer configuration
- Form validation for configuration options
- Auto-selection of DI faucet for DI basins
- Configuration persistence

### Status in React/Next.js System:
✅ **FULLY REPLACED** by:
- UI rendering → `components/order/ConfigurationStep.tsx`
- Dynamic forms → React component with conditional rendering
- Validation → Built into React component and store
- Configuration persistence → Zustand store with persistence
- API integration for options → Uses `nextJsApiClient` to fetch from `/api/configurator`

### Gaps/Missing Features:
- ⚠️ Auto-selection of DI faucet when DI basin is selected - this logic appears to be missing in the React component

### Still Being Served:
- ❌ Not being served or referenced

## 4. accessories.js

### Functionality Provided:
- Accessories selection UI (Step 4)
- Category-based accessory display
- Quantity selection for each accessory
- Accessory management per build number
- UI event handlers

### Status in React/Next.js System:
✅ **FULLY REPLACED** by:
- UI rendering → `components/order/AccessoriesStep.tsx`
- Category filtering → Implemented with search and category tabs
- Quantity management → Per-build-number quantity controls
- API integration → Uses `/api/accessories` endpoint
- State management → Zustand store

### Enhancements in React Version:
- ✨ Search functionality added
- ✨ Better visual organization with cards
- ✨ Real-time summary display

### Gaps/Missing Features:
- None identified - React version has enhanced functionality

### Still Being Served:
- ❌ Not being served or referenced

## 5. bom-generator.js

### Functionality Provided:
- Order summary display
- BOM (Bill of Materials) display
- CSV export functionality
- Nested component tree rendering
- Edit configuration navigation

### Status in React/Next.js System:
✅ **PARTIALLY REPLACED**:
- BOM generation logic → Moved to backend `src/services/bomService.js`
- Order summary display → Would be in `ReviewStep.tsx` (not shown in analysis)
- Display logic → Frontend components would handle display

### Current Implementation:
- ✅ Backend BOM generation is fully implemented in `bomService.js`
- ✅ Complex recursive assembly expansion logic preserved
- ✅ API endpoint `/api/bom/generate` available

### Gaps/Missing Features:
- ⚠️ CSV export functionality - needs to be implemented in React `ReviewStep.tsx`
- ⚠️ BOM display with nested components - needs frontend implementation
- ⚠️ Edit configuration navigation - needs to be added to review step

### Still Being Served:
- ❌ Not being served or referenced

## Summary

### Can These Files Be Removed?
**YES** - All legacy JavaScript files can be safely removed:
1. They are not being served by any server configuration
2. They are not referenced in any active code
3. Their functionality has been reimplemented in React/Next.js

### Missing Features to Implement:
1. **ConfigurationStep.tsx**: Add auto-selection of DI faucet when DI basin is selected
2. **ReviewStep.tsx**: 
   - Implement CSV export functionality
   - Add nested BOM display
   - Add "Edit Configuration" navigation

### Architecture Improvements in React Version:
1. **Better State Management**: Zustand store with persistence vs. class-based state
2. **Type Safety**: TypeScript throughout vs. plain JavaScript
3. **Modern UI**: Radix UI components vs. vanilla HTML/CSS
4. **Better API Integration**: Separate API clients for different contexts
5. **Code Organization**: Component-based architecture vs. monolithic scripts

### Recommendation:
Remove all legacy files (`index.html`, `app.js`, `sink-config.js`, `accessories.js`, `bom-generator.js`) after implementing the missing features listed above.