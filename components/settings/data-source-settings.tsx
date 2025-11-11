/**
 * Full data source settings section for the settings page
 * Allows users to choose their preferred data source with detailed explanations
 */

'use client'

import { useDataSource, type DataSource } from '@/hooks/use-data-source'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Database, Network, Zap, Shield, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function DataSourceSettings() {
  const { dataSource, setDataSource, isSubgraph } = useDataSource()

  const handleChange = (value: string) => {
    setDataSource(value as DataSource)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Source
        </CardTitle>
        <CardDescription>
          Choose where to fetch poll data from. This affects read performance but doesn't change voting or funding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={dataSource} onValueChange={handleChange}>
          {/* Subgraph Option */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="subgraph" id="subgraph" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="subgraph" className="cursor-pointer flex items-center gap-2 font-semibold">
                <Database className="h-4 w-4" />
                The Graph Subgraph (Recommended)
              </Label>
              <p className="text-sm text-muted-foreground">
                Query indexed blockchain data using GraphQL for instant results
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                  <Zap className="h-3 w-3" />
                  Lightning fast
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                  <Info className="h-3 w-3" />
                  No wallet required for viewing
                </div>
                <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded">
                  <Database className="h-3 w-3" />
                  Advanced queries & filtering
                </div>
              </div>
            </div>
          </div>

          {/* Contract Option */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="contract" id="contract" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="contract" className="cursor-pointer flex items-center gap-2 font-semibold">
                <Network className="h-4 w-4" />
                Smart Contract (Direct)
              </Label>
              <p className="text-sm text-muted-foreground">
                Read directly from the blockchain smart contract
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                  <Shield className="h-3 w-3" />
                  Direct source of truth
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded">
                  <Network className="h-3 w-3" />
                  May require wallet connection
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>How it works</AlertTitle>
          <AlertDescription className="text-sm space-y-2 mt-2">
            <p>
              <strong>Viewing polls:</strong> Uses your selected data source ({isSubgraph ? 'Subgraph' : 'Contract'})
            </p>
            <p>
              <strong>Voting & funding:</strong> Always requires wallet connection and sends transactions to the smart contract
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              You can switch between data sources anytime. Your preference is saved locally.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
