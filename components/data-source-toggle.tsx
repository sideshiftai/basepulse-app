/**
 * Quick toggle component for switching data sources
 * Displayed near the wallet address in navigation
 */

'use client'

import { useState } from 'react'
import { useDataSource } from '@/hooks/use-data-source'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Database, Network, Check } from 'lucide-react'

export function DataSourceToggle() {
  const { dataSource, setDataSource, isSubgraph, isContract } = useDataSource()
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (source: 'subgraph' | 'contract') => {
    setDataSource(source)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {isSubgraph ? (
            <>
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Subgraph</span>
            </>
          ) : (
            <>
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Contract</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Data Source</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleSelect('subgraph')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Subgraph</span>
                <span className="text-xs text-muted-foreground">Fast, no wallet needed</span>
              </div>
            </div>
            {isSubgraph && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSelect('contract')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Contract</span>
                <span className="text-xs text-muted-foreground">Direct from blockchain</span>
              </div>
            </div>
            {isContract && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
