'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { clientQueryClient } from '@/lib/client-cache'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={clientQueryClient}>
      {children}
    </QueryClientProvider>
  )
}
