import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LogoUploadProps {
  currentLogoUrl?: string | null
  onLogoUpdate: (logoUrl: string | null) => void
  disabled?: boolean
}

export function LogoUpload({ currentLogoUrl, onLogoUpdate, disabled = false }: LogoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please drop an image file',
        variant: 'destructive',
      })
      return
    }

    if (imageFiles.length > 1) {
      toast({
        title: 'Multiple files',
        description: 'Please drop only one image file',
        variant: 'destructive',
      })
      return
    }

    handleFileUpload(imageFiles[0])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/user/profile/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setPreviewUrl(data.logoUrl)
        onLogoUpdate(data.logoUrl)
        toast({
          title: 'Success',
          description: 'Logo uploaded successfully',
        })
      } else {
        throw new Error(data.message || 'Failed to upload logo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload logo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    setIsUploading(true)

    try {
      const response = await fetch('/api/user/profile/logo', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setPreviewUrl(null)
        onLogoUpdate(null)
        toast({
          title: 'Success',
          description: 'Logo removed successfully',
        })
      } else {
        throw new Error(data.message || 'Failed to remove logo')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove logo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Logo Display */}
      {previewUrl && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Current Logo</label>
            {!disabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
          <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Organization Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!disabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {previewUrl ? 'Replace Logo' : 'Upload Logo'}
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="sr-only"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center">
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop your logo here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {disabled && !previewUrl && (
        <p className="text-sm text-gray-500 italic">No logo uploaded</p>
      )}
    </div>
  )
} 