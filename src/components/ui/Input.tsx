import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, error, ...props }, ref) => (
  <div className="w-full">
    <input ref={ref} type={type}
      className={cn('flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150', error && 'border-red-500 focus-visible:ring-red-500', className)}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
  </div>
))
Input.displayName = 'Input'
export { Input }
