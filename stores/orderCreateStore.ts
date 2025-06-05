import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomerInfo {
  poNumber: string
  customerName: string
  projectName: string
  salesPerson: string
  wantDate: Date | null
  language: 'EN' | 'FR' | 'ES'
  notes: string
  poDocument?: File
}

export interface SinkSelection {
  sinkModelId: string
  sinkFamily?: string
  quantity: number
  buildNumbers: string[]
}

export interface BasinConfiguration {
  basinTypeId?: string
  basinType?: string
  basinSizePartNumber?: string
  basinSize?: string
  addonIds?: string[]
  customWidth?: number | null
  customLength?: number | null
  customDepth?: number | null
}

export interface FaucetConfiguration {
  id?: string
  faucetTypeId?: string
  quantity?: number
  placement?: string
}

export interface SprayerConfiguration {
  id?: string
  sprayerTypeId?: string
  location?: string
  hasSprayerSystem?: boolean
  sprayerTypeIds?: string[]
  quantity?: number
  locations?: string[]
}

export interface SinkConfiguration {
  sinkModelId: string
  sinkWidth?: number
  sinkLength?: number
  width?: number
  length?: number
  legsTypeId?: string
  legsType?: string
  legsKitId?: string
  feetTypeId?: string
  feetType?: string
  pegboard: boolean
  hasPegboard?: boolean
  pegboardType?: string
  pegboardColor?: string
  pegboardSizePartNumber?: string
  pegboardSizeType?: string
  pegboardWidth?: number
  pegboardLength?: number
  workflowDirection?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT'
  workFlowDirection?: 'Left' | 'Right'
  basins: BasinConfiguration[]
  faucets?: FaucetConfiguration[]
  faucet?: FaucetConfiguration
  faucetType?: string
  faucetTypeId?: string
  faucetQuantity?: number
  faucetPlacement?: string
  autoSelectedFaucet?: boolean
  sprayers?: SprayerConfiguration[]
  sprayer?: SprayerConfiguration
  hasSprayer?: boolean
  sprayerType?: string
  sprayerTypeId?: string
  sprayerQuantity?: number
  sprayerLocation?: string
  sprayerLocations?: string[]
  controlBoxId?: string
}

export interface SelectedAccessory {
  assemblyId: string
  accessoryId?: string
  name?: string
  partNumber?: string
  quantity: number
  buildNumbers?: string[]
}

export interface OrderCreateState {
  // Current step
  currentStep: number
  
  // Form data
  customerInfo: CustomerInfo
  sinkSelection: SinkSelection
  configurations: Record<string, SinkConfiguration>
  accessories: Record<string, SelectedAccessory[]>
  
  // Actions
  setCurrentStep: (step: number) => void
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void
  updateSinkSelection: (selection: Partial<SinkSelection>) => void
  updateSinkConfiguration: (buildNumber: string, config: Partial<SinkConfiguration>) => void
  updateAccessories: (buildNumber: string, accessories: SelectedAccessory[]) => void
  resetForm: () => void
  
  // Validation
  isStepValid: (step: number) => boolean
}

const initialCustomerInfo: CustomerInfo = {
  poNumber: '',
  customerName: '',
  projectName: '',
  salesPerson: '',
  wantDate: null,
  language: 'EN',
  notes: ''
}

const initialSinkSelection: SinkSelection = {
  sinkModelId: '',
  quantity: 0,
  buildNumbers: []
}

export const useOrderCreateStore = create<OrderCreateState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      customerInfo: initialCustomerInfo,
      sinkSelection: initialSinkSelection,
      configurations: {},
      accessories: {},

      setCurrentStep: (step) => set({ currentStep: step }),

      updateCustomerInfo: (info) => 
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info }
        })),

      updateSinkSelection: (selection) =>
        set((state) => ({
          sinkSelection: { ...state.sinkSelection, ...selection }
        })),

      updateSinkConfiguration: (buildNumber, config) =>
        set((state) => ({
          configurations: {
            ...state.configurations,
            [buildNumber]: {
              ...state.configurations[buildNumber],
              ...config
            }
          }
        })),

      updateAccessories: (buildNumber, accessories) =>
        set((state) => ({
          accessories: {
            ...state.accessories,
            [buildNumber]: accessories
          }
        })),

      resetForm: () => set({
        currentStep: 1,
        customerInfo: initialCustomerInfo,
        sinkSelection: initialSinkSelection,
        configurations: {},
        accessories: {}
      }),

      isStepValid: (step) => {
        const state = get()
        
        switch (step) {
          case 1:            const { poNumber, customerName, salesPerson, wantDate } = state.customerInfo
            return !!(poNumber && customerName && salesPerson && wantDate)
          
          case 2:
            const { sinkFamily, quantity, buildNumbers } = state.sinkSelection
            // Check that family is selected, quantity is set, and all build numbers are valid
            const hasValidBuildNumbers = buildNumbers.length === quantity && 
              buildNumbers.every(bn => bn && bn.length >= 3) &&
              new Set(buildNumbers).size === buildNumbers.length // Check uniqueness
            return !!(sinkFamily && quantity > 0 && hasValidBuildNumbers)
          
          case 3:
            // Check if all sinks are configured
            return state.sinkSelection.buildNumbers.every(buildNumber => 
              state.configurations[buildNumber]?.sinkModelId
            )
          
          case 4:
            // Accessories are optional, so always valid
            return true
          
          case 5:
            // Review step, check if all previous steps are valid
            return [1, 2, 3, 4].every(s => get().isStepValid(s))
          
          default:
            return false
        }
      }
    }),
    {
      name: 'order-create-state',
      // Only persist form data, not current step
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        sinkSelection: state.sinkSelection,
        configurations: state.configurations,
        accessories: state.accessories
      })
    }
  )
)
