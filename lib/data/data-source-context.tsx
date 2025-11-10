/**
 * Data Source Context
 * Provides global state for switching between subgraph and contract data sources
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type DataSource = 'subgraph' | 'contract'

interface DataSourceContextValue {
  dataSource: DataSource
  setDataSource: (source: DataSource) => void
  isSubgraph: boolean
  isContract: boolean
  toggleDataSource: () => void
}

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined)

const STORAGE_KEY = 'basepulse-data-source'

interface DataSourceProviderProps {
  children: ReactNode
  defaultSource?: DataSource
}

export function DataSourceProvider({ children, defaultSource }: DataSourceProviderProps) {
  // Get default from env or prop
  const envDefault = (process.env.NEXT_PUBLIC_DEFAULT_DATA_SOURCE as DataSource) || 'subgraph'
  const initialDefault = defaultSource || envDefault

  const [dataSource, setDataSourceState] = useState<DataSource>(initialDefault)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DataSource | null
    if (stored && (stored === 'subgraph' || stored === 'contract')) {
      setDataSourceState(stored)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when changed
  const setDataSource = (source: DataSource) => {
    setDataSourceState(source)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, source)
    }
  }

  // Toggle between sources
  const toggleDataSource = () => {
    setDataSource(dataSource === 'subgraph' ? 'contract' : 'subgraph')
  }

  const value: DataSourceContextValue = {
    dataSource,
    setDataSource,
    isSubgraph: dataSource === 'subgraph',
    isContract: dataSource === 'contract',
    toggleDataSource,
  }

  // Prevent hydration mismatch by showing consistent initial state
  if (!isHydrated) {
    const initialValue: DataSourceContextValue = {
      dataSource: initialDefault,
      setDataSource,
      isSubgraph: initialDefault === 'subgraph',
      isContract: initialDefault === 'contract',
      toggleDataSource,
    }
    return <DataSourceContext.Provider value={initialValue}>{children}</DataSourceContext.Provider>
  }

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>
}

// Hook to use the data source context
export function useDataSource() {
  const context = useContext(DataSourceContext)
  if (context === undefined) {
    throw new Error('useDataSource must be used within a DataSourceProvider')
  }
  return context
}

// Export type for external use
export type { DataSourceContextValue }
