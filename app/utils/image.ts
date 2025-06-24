/**
 * 이미지 압축 및 최적화 유틸리티
 */

export interface ImageCompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}

/**
 * 이미지 파일을 압축합니다
 */
export function compressImage(
  file: File, 
  options: ImageCompressOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    format = 'jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // 비율 유지하면서 크기 조정
      const { width, height } = calculateDimensions(
        img.width, 
        img.height, 
        maxWidth, 
        maxHeight
      )

      canvas.width = width
      canvas.height = height

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height)

      // 압축된 이미지를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축에 실패했습니다'))
            return
          }

          // File 객체로 변환
          const compressedFile = new File(
            [blob], 
            `compressed_${file.name}`, 
            {
              type: `image/${format}`,
              lastModified: Date.now()
            }
          )

          resolve(compressedFile)
        },
        `image/${format}`,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다'))
    }

    // 이미지 로드
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 비율을 유지하면서 최대 크기에 맞게 조정
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight }

  // 최대 너비 초과 시 조정
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }

  // 최대 높이 초과 시 조정
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 이미지 파일인지 확인
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * 이미지 미리보기 URL 생성
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * 이미지 미리보기 URL 해제
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url)
} 