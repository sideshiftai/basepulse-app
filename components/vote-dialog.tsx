"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Vote, Clock, Users, Coins } from "lucide-react"

interface VoteDialogProps {
  poll: {
    id: string
    title: string
    description?: string
    options: Array<{
      id: string
      text: string
      votes: number
      percentage: number
    }>
    totalVotes: number
    totalReward: number
    endsAt: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onVote: (pollId: string, optionId: string) => void
  isVoting?: boolean
}

export function VoteDialog({ poll, open, onOpenChange, onVote, isVoting }: VoteDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("")

  const handleVote = () => {
    if (selectedOption) {
      onVote(poll.id, selectedOption)
      onOpenChange(false)
      setSelectedOption("")
    }
  }

  const daysRemaining = Math.ceil((new Date(poll.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left">{poll.title}</DialogTitle>
          <DialogDescription className="text-left">
            {poll.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{poll.totalVotes}</span>
              </div>
              <p className="text-xs text-muted-foreground">Votes</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Coins className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{poll.totalReward} ETH</span>
              </div>
              <p className="text-xs text-muted-foreground">Reward</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{daysRemaining}d</span>
              </div>
              <p className="text-xs text-muted-foreground">Left</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Choose your option:</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {poll.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{option.text}</span>
                      <span className="text-sm text-muted-foreground">{option.percentage}%</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleVote} 
            disabled={!selectedOption || isVoting}
          >
            <Vote className="h-4 w-4 mr-2" />
            {isVoting ? "Voting..." : "Submit Vote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
