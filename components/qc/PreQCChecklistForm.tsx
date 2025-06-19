"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PreQCChecklistItem } from "./PreQCChecklistItem"
import { DocumentsReferenceSection } from "./DocumentsReferenceSection"
import { 
  Save,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ClipboardCheck,
  FileText,
  Image,
  Download,
  Eye,
  ExternalLink,
  ArrowLeft
} from "lucide-react"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { QcFormTemplate, OrderQcResult } from "@/types/qc"

interface PreQCChecklistFormProps {
  orderId: string
  orderData: {
    poNumber: string
    customerName: string
    productFamily: string
    buildNumbers: string[]
    configurations?: any
  }
  template: QcFormTemplate
  existingResult?: OrderQcResult
  onSubmit?: (data: any) => void
}

interface FormData {
  [itemId: string]: {
    value?: any
    notes?: string
    isConformant?: boolean
    isNotApplicable?: boolean
    mediaFileIds?: string[]
  }
}

export function PreQCChecklistForm({
  orderId,
  orderData,
  template,
  existingResult,
  onSubmit
}: PreQCChecklistFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({})
  const [jobId, setJobId] = useState('')
  const [numBasins, setNumBasins] = useState(1)
  const [initials, setInitials] = useState('')
  const [overallNotes, setOverallNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Initialize form data from existing result
  useEffect(() => {
    if (existingResult) {
      const initialData: FormData = {}
      existingResult.itemResults?.forEach(result => {
        initialData[result.qcFormTemplateItemId] = {
          value: result.resultValue,
          notes: result.notes || '',
          isConformant: result.isConformant,
          isNotApplicable: result.isNotApplicable,
          mediaFileIds: result.mediaAttachments?.map(m => m.fileUpload?.id || '') || []
        }
      })
      setFormData(initialData)
      setOverallNotes(existingResult.notes || '')
      
      // Extract metadata if stored
      const jobIdItem = existingResult.itemResults?.find(r => 
        r.qcFormTemplateItem?.checklistItem === 'Job ID#'
      )
      if (jobIdItem?.resultValue) setJobId(jobIdItem.resultValue)
      
      const basinsItem = existingResult.itemResults?.find(r => 
        r.qcFormTemplateItem?.checklistItem === '# of Basins'
      )
      if (basinsItem?.resultValue) setNumBasins(parseInt(basinsItem.resultValue))
      
      const initialsItem = existingResult.itemResults?.find(r => 
        r.qcFormTemplateItem?.checklistItem === 'Initials'
      )
      if (initialsItem?.resultValue) setInitials(initialsItem.resultValue)
    }
  }, [existingResult])

  // Group items by section
  const itemsBySection = template.items?.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, typeof template.items>) || {}

  const handleItemChange = (itemId: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [itemId]: data
    }))
  }

  const validateForm = () => {
    const errors: string[] = []
    
    // Check required fields
    template.items?.forEach(item => {
      if (item.isRequired && !formData[item.id]?.isNotApplicable) {
        const value = formData[item.id]?.value
        if (!value || value === '') {
          errors.push(`"${item.checklistItem}" is required`)
        }
      }
    })

    // Check metadata fields
    if (!jobId) errors.push('Job ID# is required')
    if (!numBasins || numBasins < 1 || numBasins > 3) errors.push('Number of basins must be between 1-3')
    if (!initials) errors.push('Initials are required')

    return errors
  }

  const determineOverallStatus = () => {
    // Check if any items failed
    const hasFailures = Object.values(formData).some(
      item => item.isConformant === false || item.value === 'FAIL'
    )
    return hasFailures ? 'FAILED' : 'PASSED'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save as draft or in-progress
      await saveFormData('IN_PROGRESS')
      toast({
        title: "Progress saved",
        description: "Your checklist progress has been saved"
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Save failed",
        description: "Failed to save progress",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: "Validation errors",
        description: errors.join(', '),
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const overallStatus = determineOverallStatus()
      await saveFormData(overallStatus)
      
      toast({
        title: "Pre-QC Complete",
        description: `Pre-QC inspection completed with result: ${overallStatus}`,
        variant: overallStatus === 'PASSED' ? 'default' : 'destructive'
      })
      
      // Navigate back to order page
      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: "Submit failed",
        description: "Failed to submit Pre-QC inspection",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const saveFormData = async (overallStatus: string) => {
    // Update metadata items with current values
    const metadataUpdates: Record<string, any> = {
      'Job ID#': jobId,
      '# of Basins': numBasins.toString(),
      'Initials': initials
    }

    // Find metadata items and update form data
    template.items?.forEach(item => {
      if (metadataUpdates[item.checklistItem]) {
        formData[item.id] = {
          ...formData[item.id],
          value: metadataUpdates[item.checklistItem]
        }
      }
    })

    // Prepare item results
    const itemResults = Object.entries(formData).map(([itemId, data]) => ({
      qcFormTemplateItemId: itemId,
      resultValue: data.value?.toString() || '',
      isConformant: data.isConformant,
      notes: data.notes,
      isNotApplicable: data.isNotApplicable,
      mediaFileIds: data.mediaFileIds || []
    }))

    const payload = {
      templateId: template.id,
      overallStatus,
      inspectorNotes: overallNotes,
      digitalSignature: initials,
      itemResults
    }

    if (onSubmit) {
      await onSubmit(payload)
    } else {
      await nextJsApiClient.post(`/orders/${orderId}/qc`, payload)
    }
  }

  // Render basin-specific items
  const renderBasinItems = (items: typeof template.items) => {
    const basinItems = items?.filter(item => item.repeatPer === 'BASIN') || []
    const basins = Array.from({ length: numBasins }, (_, i) => i + 1)

    return (
      <div className="space-y-6">
        {basins.map(basinNum => (
          <div key={basinNum}>
            <h4 className="font-medium mb-3">Basin {basinNum}</h4>
            <div className="space-y-3 pl-4">
              {basinItems.map(item => {
                const itemKey = `${item.id}_basin_${basinNum}`
                return (
                  <PreQCChecklistItem
                    key={itemKey}
                    item={item}
                    value={formData[itemKey]?.value}
                    notes={formData[itemKey]?.notes}
                    isConformant={formData[itemKey]?.isConformant}
                    isNotApplicable={formData[itemKey]?.isNotApplicable}
                    mediaFiles={formData[itemKey]?.mediaFileIds?.map(id => ({ id })) || []}
                    orderId={orderId}
                    basinNumber={basinNum}
                    onChange={(data) => handleItemChange(itemKey, data)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Pre-Production Check MDRD Sink
          </CardTitle>
          <CardDescription>
            Complete this checklist before starting production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="jobId">Job ID#</Label>
              <Input
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter Job ID"
              />
            </div>
            <div>
              <Label htmlFor="numBasins"># of Basins</Label>
              <Input
                id="numBasins"
                type="number"
                min="1"
                max="3"
                value={numBasins}
                onChange={(e) => setNumBasins(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="initials">Initials</Label>
              <Input
                id="initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase())}
                placeholder="Your initials"
                maxLength={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist sections */}
      <Tabs defaultValue="pre-production" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pre-production">Pre-Production Check</TabsTrigger>
          <TabsTrigger value="basin-specific">Basin Specific</TabsTrigger>
          <TabsTrigger value="documents">Documents & References</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-production" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {itemsBySection['PRE-PRODUCTION CHECK']
                ?.filter(item => !item.repeatPer)
                .map(item => (
                  <PreQCChecklistItem
                    key={item.id}
                    item={item}
                    value={formData[item.id]?.value}
                    notes={formData[item.id]?.notes}
                    isConformant={formData[item.id]?.isConformant}
                    isNotApplicable={formData[item.id]?.isNotApplicable}
                    mediaFiles={formData[item.id]?.mediaFileIds?.map(id => ({ id })) || []}
                    orderId={orderId}
                    onChange={(data) => handleItemChange(item.id, data)}
                  />
                ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="basin-specific" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            {renderBasinItems(itemsBySection['PRE-PRODUCTION CHECK'])}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentsReferenceSection orderId={orderId} orderData={orderData} />
        </TabsContent>
      </Tabs>

      {/* Overall notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Add any overall notes or observations..."
            className="h-24"
          />
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 justify-between">
        <Link href="/qc/cockpit">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to QC Cockpit
          </Button>
        </Link>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving || submitting}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Progress
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Complete Pre-QC
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}