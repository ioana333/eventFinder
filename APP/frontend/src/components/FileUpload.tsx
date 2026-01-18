"use client";

import { useState, useRef, createContext, useContext, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/button'
import { AnimatePresence, motion } from 'framer-motion'
import { Trash, X, CircleAlert, Play, Pause, Upload, FileText, Image as ImageIcon } from 'lucide-react'

// Înlocuim enum cu un obiect constant pentru a evita eroarea 'erasableSyntaxOnly'
export const FileStatus = {
  Uploading: 'Uploading',
  Paused: 'Paused',
  Completed: 'Completed',
  Error: 'Error',
  Cancelled: 'Cancelled',
  Pending: 'Pending'
} as const;

export type FileStatusType = typeof FileStatus[keyof typeof FileStatus];

export interface FileInfo {
  id: string
  name: string
  size: number
  type: string
  file: File
  progress: number
  status: FileStatusType
  error?: string
}

interface FileUploadContextType {
  files: FileInfo[]
  error: string | null
  setError: (error: string | null) => void
  maxCount?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  validateFiles: (files: File[]) => { valid: boolean; errorMessage?: string }
  onFileSelect?: (files: File[]) => void
  onFileSelectChange?: (files: FileInfo[]) => void
  onUpload?: () => void
  onPause?: (fileId: string) => void
  onResume?: (fileId: string) => void
  onRemove?: (fileId: string) => void
  disabled?: boolean
}

const FileUploadContext = createContext<FileUploadContextType | undefined>(undefined)

export const useFileUpload = () => {
  const context = useContext(FileUploadContext)
  if (!context) {
    throw new Error('useFileUpload must be used within a FileUploadProvider')
  }
  return context
}

// Helper pentru ID unic fără a depinde de @/lib/utils
const getUniqueId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export interface FileErrorProps {
  message?: string
  onClose?: () => void
  className?: string
  autoHideDuration?: number
}

export const FileError: React.FC<FileErrorProps> = ({ message, onClose, className }) => {
  const { error } = useFileUpload()
  const [isVisible, setIsVisible] = useState(true)
  const displayMessage = message || error

  if (!displayMessage) return null

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {isVisible && displayMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn("flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md", className)}
        >
          <div className="flex items-center gap-2">
            <CircleAlert size={18} />
            <p className="text-sm">{displayMessage}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
            <X size={14} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  else return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export const FileTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  return type.includes('image') ? <ImageIcon size={18} /> : <FileText size={18} />
}

export const FileItem: React.FC<{ file: FileInfo, onRemove?: (id: string) => void }> = ({ file, onRemove }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white shadow-sm">
      <FileTypeIcon type={file.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{file.name}</p>
        <p className="text-[10px] text-gray-400 font-bold uppercase">{formatFileSize(file.size)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:bg-red-50 rounded-lg"
        onClick={() => onRemove?.(file.id)}
      >
        <Trash size={16} />
      </Button>
    </div>
  )
}

export const FileList: React.FC<{ onRemove?: (id: string) => void }> = ({ onRemove }) => {
  const { files, setError } = useFileUpload()
  if (files.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Selected File</span>
      </div>
      {files.map(file => (
        <FileItem key={file.id} file={file} onRemove={onRemove} />
      ))}
    </div>
  )
}

export const DropZone: React.FC<{ prompt?: string }> = ({ prompt = "Click or drop photo here" }) => {
  const { disabled, files, maxSize, accept, setError, onFileSelectChange, validateFiles } = useFileUpload()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (incomingFiles: File[]) => {
    const validation = validateFiles(incomingFiles)
    if (!validation.valid) {
      setError(validation.errorMessage || "Invalid file")
      return
    }

    const fileInfos: FileInfo[] = incomingFiles.map(file => ({
      id: getUniqueId(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      progress: 0,
      status: FileStatus.Pending
    }))

    onFileSelectChange?.(fileInfos)
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all',
        isDragging ? 'border-brand-purple bg-brand-purple/5' : 'border-gray-200 bg-gray-50/50 hover:border-brand-purple/30',
        files.length > 0 && "opacity-50 pointer-events-none"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(Array.from(e.dataTransfer.files)); }}
    >
      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
      <p className="text-[11px] font-black uppercase tracking-widest text-gray-700">{prompt}</p>
      {maxSize && <p className="text-[9px] text-gray-400 uppercase mt-1">Limit: {maxSize}MB</p>}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
        disabled={disabled || files.length > 0}
      />
    </div>
  )
}

export const FileUploadProvider: React.FC<any> = ({ children, files = [], accept, maxSize = 1, onFileSelectChange }) => {
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length > 1) return { valid: false, errorMessage: "Only one file allowed" }
    const file = incomingFiles[0]
    if (maxSize && file.size > maxSize * 1024 * 1024) return { valid: false, errorMessage: `Exceeds ${maxSize}MB` }
    if (accept && !file.type.startsWith('image/')) return { valid: false, errorMessage: "Only images allowed" }
    return { valid: true }
  }

  return (
    <FileUploadContext.Provider value={{ files, error, setError, maxSize, accept, validateFiles, onFileSelectChange }}>
      {children}
    </FileUploadContext.Provider>
  )
}

const FileUpload: React.FC<any> = ({ children, ...props }) => (
  <FileUploadProvider {...props}>
    <div className="flex flex-col gap-4">{children}</div>
  </FileUploadProvider>
)

export default FileUpload