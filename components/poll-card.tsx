"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, Users, Coins, Vote } from "lucide-react"
import { cn } from "@/lib/utils"

interface PollOption {
  id: string
  text: string
  votes: number
  percentage: number
}

interface Poll {
  id: string
  title: string
  description: string
  creator: string
  createdAt: string
  endsAt: string
  totalVotes: number
  totalReward: number
  status: "active" | "ended" | "upcoming"
  category: string
  options: PollOption[]
  fundingType: "self" | "community" | "none"
}

interface PollCardProps {
  poll: Poll
  onVote?: (pollId: string, optionId: string) => void
  onViewDetails?: (pollId: string) => void
}

export function PollCard({ poll, onVote, onViewDetails }: PollCardProps) {
  const timeRemaining = new Date(poll.endsAt).getTime() - new Date().getTime()
  const daysRemaining = Math.max(0, Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)))

  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    ended: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  }

  const fundingColors = {
    self: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    community: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    none: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 gradient-card border-border/50">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">{poll.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{poll.description}</p>
          </div>
          <Badge className={cn("ml-2 shrink-0", statusColors[poll.status])}>{poll.status}</Badge>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{poll.creator.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
            </span>
          </div>
          <Badge variant="outline" className={fundingColors[poll.fundingType]}>
            {poll.fundingType === "self" && "Self-funded"}
            {poll.fundingType === "community" && "Community"}
            {poll.fundingType === "none" && "No rewards"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {poll.options.slice(0, 2).map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="line-clamp-1">{option.text}</span>
                <span className="text-muted-foreground">{option.percentage}%</span>
              </div>
              <Progress value={option.percentage} className="h-2" />
            </div>
          ))}
          {poll.options.length > 2 && (
            <p className="text-xs text-muted-foreground">+{poll.options.length - 2} more options</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{poll.totalVotes}</span>
            </div>
            <p className="text-xs text-muted-foreground">Votes</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{poll.totalReward} ETH</span>
            </div>
            <p className="text-xs text-muted-foreground">Reward</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{daysRemaining}d</span>
            </div>
            <p className="text-xs text-muted-foreground">Left</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onViewDetails?.(poll.id)}>
          View Details
        </Button>
        {poll.status === "active" && (
          <Button size="sm" className="flex-1" onClick={() => onVote?.(poll.id, poll.options[0].id)}>
            <Vote className="h-4 w-4 mr-2" />
            Vote
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
