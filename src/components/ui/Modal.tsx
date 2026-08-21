'use client'

import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={cn(
          'relative w-full bg-surface rounded-2xl shadow-xl scale-in my-auto',
          'border border-border max-h-[85dvh] sm:max-h-[90dvh] flex flex-col',
          sizes[size]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-3.5 sm:p-5 pb-0 flex-shrink-0">
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-text-primary">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[11px] sm:text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Body */}
        {children && (
          <div className="p-3.5 sm:p-5 overflow-y-auto min-h-0 flex-1 overscroll-contain">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-4 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Convenience wrapper for delete confirmation modals
interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  isLoading?: boolean
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message = 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Supprimer
          </Button>
        </>
      }
    />
  )
}
