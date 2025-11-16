/**
 * Poll Card Component
 * Card-based display for individual polls in manage view
 */

"use client"

import { Clock, MoreVertical } from "lucide-react"
import Link from "next/link"
import { formatEther } from "viem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PollCardProps {
  poll: {
    id: bigint
    question: string
    isActive: boolean
    totalVotes: bigint
    totalFunding: bigint
    endTime: bigint
    distributionMode: 0 | 1 | 2
    options: Array<{ text: string; votes: bigint }>
  }
  onClosePoll: (pollId: bigint) => void
  onSetDistributionMode: (pollId: bigint, mode: number) => void
}

export function PollCard({ poll, onClosePoll, onSetDistributionMode }: PollCardProps) {
  const endDate = new Date(Number(poll.endTime) * 1000)
  const now = new Date()
  const isExpired = endDate < now
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Count unique participants (approximation - actual count would need voter data)
  const participantsCount = Number(poll.totalVotes)

  // Get status text
  const getStatus = () => {
    if (!poll.isActive) return "Closed"
    if (isExpired) return "Expired"
    return "Active"
  }

  // Get funding type badge
  const getFundingType = () => {
    const fundingAmount = Number(formatEther(poll.totalFunding))
    if (fundingAmount === 0) return "No Funding"
    return "Self-Funded" // Could be enhanced to detect different funding sources
  }

  // Get distribution mode text
  const getDistributionMode = () => {
    switch (poll.distributionMode) {
      case 0:
        return "MANUAL_PULL"
      case 1:
        return "AUTO_PUSH"
      case 2:
        return "BURN"
      default:
        return "UNKNOWN"
    }
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-3">
              <Link
                href={`/dapp/poll/${poll.id}`}
                className="hover:text-primary transition-colors"
              >
                {poll.question}
              </Link>
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={poll.isActive && !isExpired ? "default" : "secondary"}>
                {getStatus()}
              </Badge>
              <Badge variant="outline">{getFundingType()}</Badge>
              {poll.distributionMode !== undefined && (
                <Badge variant="outline">{getDistributionMode()}</Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dapp/poll/${poll.id}`}>View Details</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{poll.options.length}</div>
            <div className="text-sm text-muted-foreground">Options</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{Number(poll.totalVotes)}</div>
            <div className="text-sm text-muted-foreground">Votes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{participantsCount}</div>
            <div className="text-sm text-muted-foreground">Participants</div>
          </div>
        </div>

        {/* Time Indicator */}
        {poll.isActive && !isExpired && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{daysLeft} days left</span>
          </div>
        )}

        {/* Dates */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>Poll #{Number(poll.id)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires</span>
            <span>{endDate.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reward Fund</span>
            <span className="font-medium">{Number(formatEther(poll.totalFunding)).toFixed(4)} PULSE</span>
          </div>
        </div>

        {/* Poll Status Management */}
        {poll.isActive && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium">Poll Status Management</h4>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" disabled>
                      Pause
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Contract upgrade required for pause functionality</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDistributionMode(poll.id, 0)}
              >
                Enable Claiming
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onClosePoll(poll.id)}
              >
                Close
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Poll is permanently closed
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" disabled>
            Edit
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dapp/poll/${poll.id}`}>Results</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
