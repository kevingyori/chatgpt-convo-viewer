import { forwardRef, type InputHTMLAttributes } from 'react'

type HiddenInputProps = InputHTMLAttributes<HTMLInputElement>

export const HiddenInput = forwardRef<HTMLInputElement, HiddenInputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} {...props} className={className ?? 'sr-only'} />
  },
)

HiddenInput.displayName = 'HiddenInput'
