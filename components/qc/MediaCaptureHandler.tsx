"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Camera, 
  Video, 
  Mic, 
  FileText, 
  Upload,
  X,
  Eye,
  Loader2,
  Download
} from "lucide-react"
import { nextJsApiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface MediaFile {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  path: string
  mediaType: string
  tempUrl?: string
}

interface MediaCaptureHandlerProps {
  itemId: string
  orderId?: string
  existingMedia?: MediaFile[]
  onMediaChange?: (mediaFiles: MediaFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function MediaCaptureHandler({
  itemId,
  orderId,
  existingMedia = [],
  onMediaChange,
  maxFiles = 10,
  acceptedTypes = ['photo', 'video', 'audio', 'document']
}: MediaCaptureHandlerProps) {
  const { toast } = useToast()
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(existingMedia)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('photo')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Check max files limit
    if (mediaFiles.length >= maxFiles) {
      toast({
        title: "Limit reached",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mediaType', selectedType)
      if (orderId) formData.append('orderId', orderId)
      formData.append('itemId', itemId)

      const response = await nextJsApiClient.post('/upload/qc-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        const newMedia: MediaFile = {
          ...response.data.fileUpload,
          tempUrl: URL.createObjectURL(file)
        }
        
        const updatedMedia = [...mediaFiles, newMedia]
        setMediaFiles(updatedMedia)
        onMediaChange?.(updatedMedia)
        
        toast({
          title: "Upload successful",
          description: `${selectedType} uploaded successfully`
        })
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveMedia = async (fileId: string) => {
    try {
      const response = await nextJsApiClient.delete(`/upload/qc-media?fileUploadId=${fileId}`)
      
      if (response.data.success) {
        const updatedMedia = mediaFiles.filter(f => f.id !== fileId)
        setMediaFiles(updatedMedia)
        onMediaChange?.(updatedMedia)
        
        toast({
          title: "File removed",
          description: "Media file removed successfully"
        })
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Failed to remove file",
        variant: "destructive"
      })
    }
  }

  const getAcceptString = () => {
    switch (selectedType) {
      case 'photo':
        return 'image/*'
      case 'video':
        return 'video/*'
      case 'audio':
        return 'audio/*'
      case 'document':
        return '.pdf,.doc,.docx,.txt'
      default:
        return '*/*'
    }
  }

  const renderMediaPreview = (media: MediaFile) => {
    if (media.mediaType === 'photo' || media.mimeType.startsWith('image/')) {
      return (
        <div className="relative w-full h-32">
          <Image
            src={media.tempUrl || media.path}
            alt={media.originalName}
            fill
            className="object-cover rounded"
          />
        </div>
      )
    }

    const iconMap: Record<string, React.ReactNode> = {
      video: <Video className="w-12 h-12" />,
      audio: <Mic className="w-12 h-12" />,
      document: <FileText className="w-12 h-12" />
    }

    return (
      <div className="flex items-center justify-center h-32 bg-gray-100 rounded">
        {iconMap[media.mediaType] || <FileText className="w-12 h-12" />}
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Media type selector */}
          <div className="flex gap-2 flex-wrap">
            {acceptedTypes.map(type => (
              <Button
                key={type}
                size="sm"
                variant={selectedType === type ? "default" : "outline"}
                onClick={() => setSelectedType(type)}
                disabled={uploading}
              >
                {type === 'photo' && <Camera className="w-4 h-4 mr-1" />}
                {type === 'video' && <Video className="w-4 h-4 mr-1" />}
                {type === 'audio' && <Mic className="w-4 h-4 mr-1" />}
                {type === 'document' && <FileText className="w-4 h-4 mr-1" />}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {/* Upload button */}
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              accept={getAcceptString()}
              onChange={handleFileSelect}
              disabled={uploading || mediaFiles.length >= maxFiles}
              className="hidden"
              id={`file-input-${itemId}`}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || mediaFiles.length >= maxFiles}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add {selectedType}
                </>
              )}
            </Button>
          </div>

          {/* Media files list */}
          {mediaFiles.length > 0 && (
            <ScrollArea className="h-64">
              <div className="grid grid-cols-2 gap-2">
                {mediaFiles.map((media) => (
                  <Card key={media.id} className="relative">
                    <CardContent className="p-2">
                      {renderMediaPreview(media)}
                      <div className="mt-2">
                        <p className="text-xs truncate">{media.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {(media.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 p-0"
                        onClick={() => handleRemoveMedia(media.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* File count */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{mediaFiles.length} / {maxFiles} files</span>
            {mediaFiles.length > 0 && (
              <Badge variant="secondary">
                {mediaFiles.filter(m => m.mediaType === 'photo').length} photos,
                {mediaFiles.filter(m => m.mediaType === 'video').length} videos,
                {mediaFiles.filter(m => m.mediaType === 'audio').length} audio,
                {mediaFiles.filter(m => m.mediaType === 'document').length} docs
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}