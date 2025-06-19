"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MediaCaptureHandler } from "./MediaCaptureHandler"
import { 
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Camera
} from "lucide-react"
import type { QcFormTemplateItem } from "@/types/qc"

interface PreQCChecklistItemProps {
  item: QcFormTemplateItem
  value: any
  notes?: string
  isConformant?: boolean
  isNotApplicable?: boolean
  mediaFiles?: any[]
  orderId?: string
  basinNumber?: number
  onChange: (data: {
    value?: any
    notes?: string
    isConformant?: boolean
    isNotApplicable?: boolean
    mediaFileIds?: string[]
  }) => void
}

export function PreQCChecklistItem({
  item,
  value,
  notes = '',
  isConformant,
  isNotApplicable = false,
  mediaFiles = [],
  orderId,
  basinNumber,
  onChange
}: PreQCChecklistItemProps) {
  const [showMedia, setShowMedia] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes)
  const [localMediaFiles, setLocalMediaFiles] = useState(mediaFiles)

  // Format label with basin number if applicable
  const getItemLabel = () => {
    let label = item.checklistItem
    if (item.repeatPer === 'BASIN' && basinNumber) {
      label = `Basin ${basinNumber}: ${label}`
    }
    return label
  }

  const handleValueChange = (newValue: any) => {
    // For PASS_FAIL type, set isConformant based on value
    if (item.itemType === 'PASS_FAIL') {
      onChange({
        value: newValue,
        isConformant: newValue === 'PASS',
        notes: localNotes,
        mediaFileIds: localMediaFiles.map(f => f.id)
      })
    } else {
      onChange({
        value: newValue,
        notes: localNotes,
        mediaFileIds: localMediaFiles.map(f => f.id)
      })
    }
  }

  const handleNotesChange = (newNotes: string) => {
    setLocalNotes(newNotes)
    onChange({
      value,
      isConformant,
      notes: newNotes,
      mediaFileIds: localMediaFiles.map(f => f.id)
    })
  }

  const handleMediaChange = (files: any[]) => {
    setLocalMediaFiles(files)
    onChange({
      value,
      isConformant,
      notes: localNotes,
      mediaFileIds: files.map(f => f.id)
    })
  }

  const handleNotApplicableChange = (checked: boolean) => {
    onChange({
      value: checked ? 'N/A' : '',
      isConformant: checked ? true : undefined,
      isNotApplicable: checked,
      notes: localNotes,
      mediaFileIds: localMediaFiles.map(f => f.id)
    })
  }

  const renderInput = () => {
    if (isNotApplicable) {
      return (
        <div className="text-gray-500 italic">Not Applicable</div>
      )
    }

    switch (item.itemType) {
      case 'PASS_FAIL':
        return (
          <RadioGroup value={value || ''} onValueChange={handleValueChange}>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PASS" id={`${item.id}-pass`} />
                <Label htmlFor={`${item.id}-pass`} className="flex items-center cursor-pointer">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                  Pass
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FAIL" id={`${item.id}-fail`} />
                <Label htmlFor={`${item.id}-fail`} className="flex items-center cursor-pointer">
                  <XCircle className="w-4 h-4 mr-1 text-red-600" />
                  Fail
                </Label>
              </div>
            </div>
          </RadioGroup>
        )

      case 'CHECKBOX':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={item.id}
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => handleValueChange(checked ? 'true' : 'false')}
            />
            <Label htmlFor={item.id}>Checked</Label>
          </div>
        )

      case 'TEXT_INPUT':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={item.notesPrompt || 'Enter text...'}
          />
        )

      case 'NUMERIC_INPUT':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={item.notesPrompt || 'Enter number...'}
          />
        )

      case 'SINGLE_SELECT':
        let options = []
        try {
          const parsedOptions = typeof item.options === 'string' ? JSON.parse(item.options) : item.options
          options = parsedOptions?.choices || []
        } catch (e) {
          console.error('Error parsing options for item:', item.checklistItem, e)
          options = []
        }
        return (
          <Select value={value || ''} onValueChange={handleValueChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'MULTI_SELECT':
        // Implement multi-select if needed
        return <div>Multi-select not implemented</div>

      case 'DATE_INPUT':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        )

      default:
        return <div>Unknown input type</div>
    }
  }

  return (
    <Card className={isConformant === false ? 'border-red-500' : ''}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {getItemLabel()}
              {item.isRequired && <Badge variant="secondary" className="text-xs">Required</Badge>}
              {isConformant === false && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </CardTitle>
            {item.notesPrompt && (
              <p className="text-sm text-gray-500 mt-1">{item.notesPrompt}</p>
            )}
          </div>
          
          {/* Not Applicable checkbox */}
          {!item.isRequired && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${item.id}-na`}
                checked={isNotApplicable}
                onCheckedChange={handleNotApplicableChange}
              />
              <Label htmlFor={`${item.id}-na`} className="text-sm">N/A</Label>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Main input */}
        <div>{renderInput()}</div>

        {/* Notes field */}
        <div>
          <Label htmlFor={`${item.id}-notes`} className="text-sm">Notes</Label>
          <Textarea
            id={`${item.id}-notes`}
            value={localNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add any additional notes..."
            className="mt-1 h-20"
            disabled={isNotApplicable}
          />
        </div>

        {/* Media capture section */}
        <Collapsible open={showMedia} onOpenChange={setShowMedia}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Media Attachments ({localMediaFiles.length})
              {showMedia ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <MediaCaptureHandler
              itemId={item.id}
              orderId={orderId}
              existingMedia={localMediaFiles}
              onMediaChange={handleMediaChange}
              maxFiles={5}
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}