# Fernando Rojo's Composition Pattern Guide

> Build components that compose like LEGO blocks with shared context

## Table of Contents
1. [Quick Start](#quick-start)
2. [The Philosophy](#the-philosophy)
3. [Core Concepts](#core-concepts)
4. [Building Your First Component](#building-your-first-component)
5. [Real-World Examples](#real-world-examples)
6. [Composition Recipes](#composition-recipes)
7. [Best Practices](#best-practices)

---

## Quick Start

**The 30-Second Overview:**

```typescript
// 1. Create a Provider with state/actions/meta
<Counter.Provider>
  
  {/* 2. Use components that access shared context */}
  <Counter.Display />
  <Counter.Increment />
  <Counter.Decrement />
  
</Counter.Provider>
```

That's it! Components share state through context, no prop drilling needed.

---

## The Philosophy

### Think in LEGO Blocks 🧱

Traditional components are like pre-built houses—you get what you get. This pattern gives you LEGO blocks that you combine however you want.

**Traditional Approach:**
```tsx
<Settings
  title="Settings"
  showUsername={true}
  showEmail={true}
  showNotifications={true}
  onSave={handleSave}
  // 20 more props...
/>
```

**LEGO Approach:**
```tsx
<Settings.Provider onSave={handleSave}>
  <Settings.Dialog>
    <Settings.Header title="Settings" />
    <Settings.Body>
      <Settings.TextField name="username" />
      <Settings.TextField name="email" />
      <Settings.Toggle name="notifications" />
    </Settings.Body>
    <Settings.Footer>
      <Settings.SaveButton />
    </Settings.Footer>
  </Settings.Dialog>
</Settings.Provider>
```

Each piece is independent. Add, remove, rearrange—it's YOUR LEGO set.

---

## Core Concepts

### 1. State/Actions/Meta Organization

The heart of the pattern is organizing your context into three clear sections:

```typescript
const value = {
  // STATE: Component data
  state: {
    input: "",
    isSubmitting: false,
  },
  
  // ACTIONS: Functions that modify state
  actions: {
    update: (value) => setState({ input: value }),
    submit: async () => { /* ... */ },
  },
  
  // META: Refs, config, non-reactive data
  meta: {
    inputRef: useRef<HTMLInputElement>(null),
    maxLength: 100,
  },
}
```

**Why this structure?**
- **Clear boundaries**: Know exactly where everything goes
- **Easy to find**: No searching through props
- **Self-documenting**: Structure tells you what's what
- **Type-safe**: TypeScript loves this organization

### 2. Dot Notation Exports

Export components as properties of a single object:

```typescript
export const Counter = {
  Provider: CounterProvider,
  Display: CounterDisplay,
  Increment: CounterIncrement,
  Decrement: CounterDecrement,
}
```

**Benefits:**
- **Namespaced**: `Counter.Display` is clearly related to Counter
- **Discoverable**: IDE autocomplete shows all pieces
- **Organized**: All related components in one place

### 3. Shared Context

Components access context directly—no props needed:

```typescript
function CounterDisplay() {
  const { state } = useCounter() // Access shared context
  return <div>{state.count}</div>
}
```

**No prop drilling ever.** Every component gets exactly what it needs from context.

---

## Building Your First Component

Let's build a **Counter** component step by step.

### Step 1: Define the Context Interface

```typescript
// counter-context.tsx
"use client"

import { createContext, useContext } from "react"

export interface CounterState {
  count: number
}

export interface CounterActions {
  increment: () => void
  decrement: () => void
  reset: () => void
}

export interface CounterMeta {
  min: number
  max: number
}

export interface CounterContextValue {
  state: CounterState
  actions: CounterActions
  meta: CounterMeta
}

export const CounterContext = createContext<CounterContextValue | undefined>(
  undefined
)

export function useCounter(): CounterContextValue {
  const context = useContext(CounterContext)
  if (!context) {
    throw new Error("Counter.* must be within Counter.Provider")
  }
  return context
}
```

### Step 2: Create the Provider

```typescript
// counter-provider.tsx
"use client"

import { useState, type ReactNode } from "react"
import { CounterContext } from "./counter-context"

interface CounterProviderProps {
  children: ReactNode
  initialCount?: number
  min?: number
  max?: number
}

export function CounterProvider({
  children,
  initialCount = 0,
  min = 0,
  max = 100,
}: CounterProviderProps) {
  const [count, setCount] = useState(initialCount)

  // React Compiler optimizes these automatically!
  const increment = () => {
    setCount((c) => Math.min(c + 1, max))
  }

  const decrement = () => {
    setCount((c) => Math.max(c - 1, min))
  }

  const reset = () => {
    setCount(initialCount)
  }

  return (
    <CounterContext.Provider
      value={{
        state: { count },
        actions: { increment, decrement, reset },
        meta: { min, max },
      }}
    >
      {children}
    </CounterContext.Provider>
  )
}
```

### Step 3: Create Sub-Components

```typescript
// counter-display.tsx
"use client"

import { useCounter } from "./counter-context"

export function CounterDisplay() {
  const { state } = useCounter()
  return (
    <div className="text-4xl font-bold">
      {state.count}
    </div>
  )
}

// counter-buttons.tsx
"use client"

import { Button } from "@/components/ui/button"
import { useCounter } from "./counter-context"

export function CounterIncrement() {
  const { state, actions, meta } = useCounter()
  return (
    <Button 
      onClick={actions.increment} 
      disabled={state.count >= meta.max}
    >
      +
    </Button>
  )
}

export function CounterDecrement() {
  const { state, actions, meta } = useCounter()
  return (
    <Button 
      onClick={actions.decrement} 
      disabled={state.count <= meta.min}
    >
      -
    </Button>
  )
}

export function CounterReset() {
  const { actions } = useCounter()
  return <Button onClick={actions.reset}>Reset</Button>
}
```

### Step 4: Export with Dot Notation

```typescript
// index.ts
export { useCounter } from "./counter-context"
export { CounterProvider } from "./counter-provider"
export { CounterDisplay } from "./counter-display"
export { CounterIncrement, CounterDecrement, CounterReset } from "./counter-buttons"

import { CounterProvider } from "./counter-provider"
import { CounterDisplay } from "./counter-display"
import { CounterIncrement, CounterDecrement, CounterReset } from "./counter-buttons"

export const Counter = {
  Provider: CounterProvider,
  Display: CounterDisplay,
  Increment: CounterIncrement,
  Decrement: CounterDecrement,
  Reset: CounterReset,
}
```

### Step 5: Use It!

```tsx
<Counter.Provider initialCount={0} min={0} max={10}>
  <div className="flex items-center gap-4">
    <Counter.Decrement />
    <Counter.Display />
    <Counter.Increment />
  </div>
  <Counter.Reset />
</Counter.Provider>
```

**Want it horizontal instead?** Just rearrange:
```tsx
<Counter.Provider>
  <Counter.Display />
  <div className="flex gap-2">
    <Counter.Decrement />
    <Counter.Increment />
    <Counter.Reset />
  </div>
</Counter.Provider>
```

**That's the power of composition!**

---

## Real-World Examples

### Examples in This Project

1. **Message Composer** (`/components/composer/`)
   - Text input with attachments
   - Character count
   - Send button with loading state
   - File upload and preview

2. **Settings Dialog** (`/components/settings-dialog/`)
   - 12 composable pieces
   - Text fields, toggles, sections
   - Can be used as dialog or inline

View them at `/app/examples/`

---

## Composition Recipes

### Recipe 1: Conditional Rendering

```tsx
<Todo.Provider>
  {showFilters && <Todo.Filters />}
  <Todo.List />
  {hasItems && <Todo.ClearButton />}
</Todo.Provider>
```

### Recipe 2: Multiple Configurations

```tsx
// Simple version
<Settings.Provider>
  <Settings.TextField name="name" />
  <Settings.SaveButton />
</Settings.Provider>

// Full version
<Settings.Provider>
  <Settings.Dialog>
    <Settings.Content>
      <Settings.Header />
      <Settings.Body>
        <Settings.Section title="Account">
          <Settings.TextField name="name" />
          <Settings.TextField name="email" />
        </Settings.Section>
      </Settings.Body>
      <Settings.Footer>
        <Settings.ResetButton />
        <Settings.SaveButton />
      </Settings.Footer>
    </Settings.Content>
  </Settings.Dialog>
</Settings.Provider>
```

### Recipe 3: Nesting Patterns

```tsx
<Form.Provider>
  <Form.Field name="search">
    {/* Nest a Search component inside */}
    <Search.Provider>
      <Search.Input />
      <Search.Results />
    </Search.Provider>
  </Form.Field>
  <Form.SubmitButton />
</Form.Provider>
```

---

## React Compiler Optimization

This project uses React 19's compiler for automatic optimization. **No manual memoization needed!**

### No More useCallback/useMemo

```typescript
// ❌ Old way (manual optimization)
const increment = useCallback(() => {
  setCount(c => c + 1)
}, [])

const value = useMemo(() => ({
  state: { count },
  actions: { increment }
}), [count, increment])

// ✅ New way (compiler handles it)
const increment = () => {
  setCount(c => c + 1)  // Just write normal code!
}

const value = {
  state: { count },
  actions: { increment },
  meta: { min: 0, max: 100 }
}
```

### Selective Re-rendering

Components only re-render based on what they destructure:

```typescript
// Component A: Only re-renders when state changes
function DisplayComponent() {
  const { state } = useCounter()
  return <div>{state.count}</div>
}

// Component B: NEVER re-renders (actions are stable)
function ResetButton() {
  const { actions } = useCounter()
  return <button onClick={actions.reset}>Reset</button>
}

// Component C: Re-renders when state OR meta changes
function ValidationButton() {
  const { state, actions, meta } = useCounter()
  const isMaxed = state.count >= meta.max
  return <button onClick={actions.increment} disabled={isMaxed}>+</button>
}
```

**Key insight:** The compiler tracks dependencies automatically. Components consuming only `actions` never re-render when `state` changes!

### Why Tripartite Structure Matters

The `state/actions/meta` organization enables selective optimization:

```typescript
const value = {
  state,      // Mutable data → triggers re-renders
  actions,    // Functions → compiler-stable, never trigger re-renders  
  meta        // Constants → stable, never trigger re-renders
}
```

**See it in action:** Visit `/re-render-demo` for live visualization.

---

## Server Component Integration (Next.js 15)

Standard pattern for integrating server data with client components:

### Server Component (Fetches Data)

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetchFromDatabase() // Server-only
  
  return (
    <Pattern.Provider initialData={data}> {/* Pass as prop */}
      <Pattern.Component />
    </Pattern.Provider>
  )
}
```

### Client Provider (Receives Prop)

```typescript
// components/pattern-provider.tsx
"use client"

interface PatternProviderProps {
  children: ReactNode
  initialData?: DataType // From server
}

export function PatternProvider({ 
  children,
  initialData = defaultValue // Simple default
}: PatternProviderProps) {
  // Initialize state from prop - no useEffect needed!
  const [state, setState] = useState(initialData)
  
  // Actions (compiler optimizes automatically)
  const update = (value) => setState(value)
  
  // Tripartite structure
  return (
    <Context.Provider value={{ state, actions: { update }, meta }}>
      {children}
    </Context.Provider>
  )
}
```

**Key points:**
- ✅ Server Component fetches data
- ✅ Passes data as prop to Client Provider
- ✅ Provider initializes state from prop
- ✅ No bridge abstraction needed
- ✅ Standard Next.js 15 pattern

---

## Best Practices

### ✅ Do

- **One purpose per component**: `<Counter.Display />` only displays
- **Use clear names**: `TextField` not `Input1`
- **Export everything**: Consumers choose what to use
- **Keep components small**: 20-30 lines max
- **Trust React Compiler**: No manual `useCallback` needed
- **Selective destructuring**: Only take what you need from context
- **Direct prop passing**: Pass server data as props, no bridge needed

### ❌ Don't

- **Don't couple components**: Each should work independently
- **Don't add logic to small components**: Keep them simple
- **Don't forget error handling**: Check if context exists
- **Don't over-engineer**: Start simple, add complexity only when needed
- **Don't use useCallback/useMemo**: Let compiler handle it
- **Don't destructure entire context**: Be selective for optimization

---

## Learn More

- **Re-render Demo**: Visit `/re-render-demo` for live optimization visualization
- **Examples**: Check `/app/counter/` and `/app/composer/` for complete patterns
- **Comparisons**: See `/app/comparison/` for before/after code
- **Source Code**: Explore `/components/counter/` and `/components/composer/`

Start building your own patterns today! 🚀
