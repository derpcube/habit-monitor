"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  removeAllToasts: () => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, ...toast }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const removeAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]
  removeToast: (id: string) => void 
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast
  onRemove: (id: string) => void 
}) {
  const variantStyles = {
    default: "bg-white border border-gray-200 text-gray-900",
    destructive: "bg-red-50 border border-red-200 text-red-900",
    success: "bg-green-50 border border-green-200 text-green-900",
    warning: "bg-yellow-50 border border-yellow-200 text-yellow-900",
  }

  return (
    <div className={cn(
      "relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-4 shadow-lg transition-all duration-300 ease-in-out",
      variantStyles[toast.variant || 'default']
    )}>
      <div className="flex-1 space-y-1">
        {toast.title && (
          <h3 className="text-sm font-medium">{toast.title}</h3>
        )}
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
      </div>
      
      {toast.action && (
        <div className="flex-shrink-0">
          {toast.action}
        </div>
      )}
      
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
} 