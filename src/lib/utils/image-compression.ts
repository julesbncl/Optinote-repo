/**
 * Client-Side Image Compression & Optimization Utility
 * Reduces file payload sizes to prevent timeouts and payload limits
 */

export interface CompressedImageResult {
  dataUrl: string
  blob: Blob
  file: File
  width: number
  height: number
  originalSizeBytes: number
  compressedSizeBytes: number
}

export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'image/jpeg' | 'image/webp'
  } = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    format = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Le fichier sélectionné n\'est pas une image valide.'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'))
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Format d\'image non supporté.'))
      img.onload = () => {
        try {
          let { width, height } = img

          // Calculate aspect ratio constraints
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            } else {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            return reject(new Error('Impossible d\'initialiser le contexte graphique canvas.'))
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          // Export compressed Data URL
          const dataUrl = canvas.toDataURL(format, quality)

          // Convert to Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Échec de la compression de l\'image.'))
              }

              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: format,
                lastModified: Date.now(),
              })

              resolve({
                dataUrl,
                blob,
                file: compressedFile,
                width,
                height,
                originalSizeBytes: file.size,
                compressedSizeBytes: blob.size,
              })
            },
            format,
            quality
          )
        } catch (err) {
          reject(err)
        }
      }

      img.src = readerEvent.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
