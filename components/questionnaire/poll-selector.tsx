"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Check, Clock } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { usePollsByCreator } from "@/hooks/use-polls-by-creator"
import { formatDistanceToNow } from "date-fns"

export interface SelectedPoll {
  chainId: number
  pollId: string
  question: string
  source: "new" | "existing"
  sortOrder: number
}

interface PollSelectorProps {
  selectedPolls: SelectedPoll[]
  onAddPoll: (poll: SelectedPoll) => void
  disabled?: boolean
}

export function PollSelector({ selectedPolls, onAddPoll, disabled }: PollSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { address } = useAccount()
  const chainId = useChainId()

  // Fetch creator's polls
  const { polls: creatorPolls, loading: isLoading } = usePollsByCreator(address)

  // Filter polls by search query and exclude already selected
  const availablePolls = useMemo(() => {
    if (!creatorPolls) return []

    const selectedIds = new Set(selectedPolls.map((p) => `${p.chainId}-${p.pollId}`))

    return creatorPolls.filter((poll) => {
      // Exclude already selected polls
      if (selectedIds.has(`${chainId}-${poll.id}`)) return false

      // Filter by search query
      if (searchQuery) {
        return poll.title.toLowerCase().includes(searchQuery.toLowerCase())
      }

      return true
    })
  }, [creatorPolls, selectedPolls, searchQuery, chainId])

  const handleAddPoll = (poll: { id: string; title: string }) => {
    onAddPoll({
      chainId,
      pollId: poll.id,
      question: poll.title,
      source: "existing",
      sortOrder: selectedPolls.length,
    })
  }

  const isSelected = (pollId: string) => {
    return selectedPolls.some(
      (p) => p.chainId === chainId && p.pollId === pollId
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your polls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Loading polls...</p>
          </div>
        ) : availablePolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? "No polls found matching your search"
                : creatorPolls?.length === 0
                ? "You haven't created any polls yet"
                : "All your polls have been added"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {availablePolls.map((poll) => (
              <Card
                key={poll.id}
                className={`cursor-pointer transition-all hover:bg-accent/50 ${
                  isSelected(poll.id) ? "border-primary bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{poll.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {poll.status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {poll.endsAt
                          ? formatDistanceToNow(new Date(poll.endsAt), {
                              addSuffix: true,
                            })
                          : "No end date"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={isSelected(poll.id) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAddPoll(poll)}
                    disabled={disabled || isSelected(poll.id)}
                  >
                    {isSelected(poll.id) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <p className="text-xs text-muted-foreground">
        Only your own polls can be added to a questionnaire
      </p>
    </div>
  )
}
