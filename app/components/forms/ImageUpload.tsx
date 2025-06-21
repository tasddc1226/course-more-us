import { useState, useRef, useEffect } from 'react'
import { compressImage, formatFileSize, isImageFile, createImagePreview, revokeImagePreview } from '~/utils/image'
import { Button } from '~/components/ui'

interface ImageUploadProps {
  name: string
  label: string
  required?: boolean
  maxFiles?: number
  onFilesChange?: (files: File[]) => void
  className?: string
}

interface ImagePreview {
  file: File
  url: string
  compressed?: File
  compressing?: boolean
  error?: string
}

export default function ImageUpload({
  name,
  label,
  required = false,
  maxFiles = 3,
  onFilesChange,
  className = ''
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 파일 선택 시 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // 최대 파일 수 체크
    const totalFiles = previews.length + files.length
    if (totalFiles > maxFiles) {
      alert(`최대 ${maxFiles}장까지만 업로드할 수 있습니다.`)
      return
    }

    setIsCompressing(true)

    const newPreviews: ImagePreview[] = []

    for (const file of files) {
      if (!isImageFile(file)) {
        alert(`${file.name}은 이미지 파일이 아닙니다.`)
        continue
      }

      const preview: ImagePreview = {
        file,
        url: createImagePreview(file),
        compressing: true
      }

      newPreviews.push(preview)
    }

    setPreviews(prev => [...prev, ...newPreviews])

    // 이미지 압축 처리
    const compressedPreviews = await Promise.all(
      newPreviews.map(async (preview) => {
        try {
          const compressed = await compressImage(preview.file, {
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
            format: 'jpeg'
          })

          return {
            ...preview,
            compressed,
            compressing: false
          }
        } catch (error) {
          return {
            ...preview,
            compressing: false,
            error: '압축 실패'
          }
        }
      })
    )

    setPreviews(prev => {
      const updated = [...prev]
      compressedPreviews.forEach((compressedPreview, index) => {
        const targetIndex = updated.length - newPreviews.length + index
        if (targetIndex >= 0) {
          updated[targetIndex] = compressedPreview
        }
      })
      return updated
    })

    setIsCompressing(false)

    // 압축된 파일들을 부모 컴포넌트에 전달
    const allCompressedFiles = [
      ...previews.filter(p => p.compressed).map(p => p.compressed!),
      ...compressedPreviews.filter(p => p.compressed).map(p => p.compressed!)
    ]
    onFilesChange?.(allCompressedFiles)

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 이미지 제거
  const removeImage = (index: number) => {
    setPreviews(prev => {
      const updated = [...prev]
      const removed = updated.splice(index, 1)[0]
      
      // URL 해제
      revokeImagePreview(removed.url)
      
      return updated
    })

    // 압축된 파일들을 부모 컴포넌트에 전달
    const remainingFiles = previews
      .filter((_, i) => i !== index)
      .filter(p => p.compressed)
      .map(p => p.compressed!)
    
    onFilesChange?.(remainingFiles)
  }

  // 컴포넌트 언마운트 시 URL 정리
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        revokeImagePreview(preview.url)
      })
    }
  }, [])

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* 파일 선택 버튼 */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing || previews.length >= maxFiles}
          className="w-full sm:w-auto"
        >
          {isCompressing ? '압축 중...' : `이미지 선택 (${previews.length}/${maxFiles})`}
        </Button>
      </div>

      {/* 미리보기 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={preview.url}
                  alt={`미리보기 ${index + 1}`}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              {/* 압축 상태 표시 */}
              {preview.compressing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                    압축 중...
                  </div>
                </div>
              )}

              {/* 에러 표시 */}
              {preview.error && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-sm text-center">
                    <div className="mb-1">⚠️</div>
                    {preview.error}
                  </div>
                </div>
              )}

              {/* 파일 정보 */}
              <div className="p-3">
                <div className="text-xs text-gray-600 mb-2">
                  <div className="truncate">{preview.file.name}</div>
                  <div className="flex justify-between">
                    <span>원본: {formatFileSize(preview.file.size)}</span>
                    {preview.compressed && (
                      <span className="text-green-600">
                        압축: {formatFileSize(preview.compressed.size)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 제거 버튼 */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(index)}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  제거
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {previews.map((preview, index) => {
        if (!preview.compressed) return null
        
        return (
          <input
            key={`compressed-${index}`}
            type="file"
            name={name}
            className="hidden"
            ref={(input) => {
              if (input && preview.compressed) {
                try {
                  const dataTransfer = new DataTransfer()
                  dataTransfer.items.add(preview.compressed)
                  input.files = dataTransfer.files
                } catch (error) {
                  console.warn('Failed to set compressed file:', error)
                }
              }
            }}
          />
        )
      })}

      <p className="text-xs text-gray-500 mt-2">
        • 최대 {maxFiles}장까지 업로드 가능합니다<br/>
        • 이미지는 자동으로 압축되어 최적화됩니다<br/>
        • 권장 크기: 1200x800px 이하
      </p>
    </div>
  )
} 