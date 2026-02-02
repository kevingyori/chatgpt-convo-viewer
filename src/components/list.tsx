import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

type ListContextValue = {
  itemButtonClass: string
}

const ListContext = createContext<ListContextValue | null>(null)

function useListContext() {
  const context = useContext(ListContext)
  if (!context) {
    throw new Error('List components must be used within <List>.')
  }
  return context
}

type ListProps = {
  children: ReactNode
  className?: string
  itemButtonClass?: string
}

type ListButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

function ListRoot({
  children,
  className,
  itemButtonClass =
    'w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-slate-900/60 transition',
}: ListProps) {
  return (
    <ListContext.Provider value={{ itemButtonClass }}>
      <div className={className}>{children}</div>
    </ListContext.Provider>
  )
}

function ListButton({ className, ...props }: ListButtonProps) {
  const { itemButtonClass } = useListContext()
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={className ? `${itemButtonClass} ${className}` : itemButtonClass}
    />
  )
}

export const List = Object.assign(ListRoot, {
  Button: ListButton,
})
