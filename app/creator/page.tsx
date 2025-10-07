"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, User, Clock, Users, Coins, X, DollarSign } from "lucide-react"
import { useAccount } from "wagmi"
import { useActivePolls, usePoll, useClosePoll, useFundPollWithETH } from "@/lib/contracts/polls-contract-utils"
import { toast } from "sonner"

export default function CreatorPage() {
  const [fundAmount, setFundAmount] = useState("")
  const [selectedPollId, setSelectedPollId] = useState("")
  const [selectedCoin, setSelectedCoin] = useState("ETH")
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum")
  const [showSideShift, setShowSideShift] = useState(false)
  
  const { address, isConnected } = useAccount()
  const { data: activePollIds, isLoading: pollsLoading, error: pollsError } = useActivePolls()
  const { closePoll, isPending: isClosing } = useClosePoll()
  const { fundPoll, isPending: isFunding } = useFundPollWithETH()

  const supportedAssets = [
    { coin: "BTC", network: "bitcoin", name: "Bitcoin" },
    { coin: "ETH", network: "ethereum", name: "Ethereum" },
    { coin: "USDT", network: "ethereum", name: "USDT (Ethereum)" },
    { coin: "USDT", network: "polygon", name: "USDT (Polygon)" },
    { coin: "USDC", network: "ethereum", name: "USDC (Ethereum)" },
    { coin: "USDC", network: "polygon", name: "USDC (Polygon)" },
    { coin: "LTC", network: "litecoin", name: "Litecoin" },
    { coin: "DOGE", network: "dogecoin", name: "Dogecoin" },
    { coin: "ADA", network: "cardano", name: "Cardano" },
    { coin: "DOT", network: "polkadot", name: "Polkadot" },
  ]

  // Get poll data for each active poll ID
  const pollQueries = [
    usePoll(activePollIds?.[0] ? Number(activePollIds[0]) : 0),
    usePoll(activePollIds?.[1] ? Number(activePollIds[1]) : 0),
    usePoll(activePollIds?.[2] ? Number(activePollIds[2]) : 0),
    usePoll(activePollIds?.[3] ? Number(activePollIds[3]) : 0),
    usePoll(activePollIds?.[4] ? Number(activePollIds[4]) : 0),
  ]

  // Filter polls created by current user
  const myPolls = activePollIds?.slice(0, 5).map((pollId: bigint, index: number) => {
    const pollData = pollQueries[index]
    if (!pollData.data) return null
    
    const [id, question, options, votes, endTime, isActive, creator, totalFunding] = pollData.data
    
    // Only include polls created by current user
    if (creator.toLowerCase() !== address?.toLowerCase()) return null
    
    return {
      id: id.toString(),
      title: question,
      creator: creator,
      createdAt: new Date().toISOString(),
      endsAt: new Date(Number(endTime) * 1000).toISOString(),
      totalVotes: votes.reduce((sum: number, vote: bigint) => sum + Number(vote), 0),
      totalReward: Number(totalFunding) / 1e18,
      status: isActive ? "active" as const : "closed" as const,
      options: options.map((option: string, index: number) => ({
        id: `${id}-${index}`,
        text: option,
        votes: Number(votes[index]),
        percentage: votes.length > 0 ? Math.round((Number(votes[index]) / votes.reduce((sum: number, vote: bigint) => sum + Number(vote), 0)) * 100) : 0
      }))
    }
  }).filter(Boolean) || []

  const handleClosePoll = async (pollId: string) => {
    try {
      await closePoll(parseInt(pollId))
      toast.success("Poll close transaction submitted")
    } catch (error) {
      console.error("Close poll failed:", error)
      toast.error("Failed to close poll")
    }
  }

  const handleFundPoll = async () => {
    if (!fundAmount || !selectedPollId) return
    
    try {
      if (selectedCoin === "ETH" && selectedNetwork === "ethereum") {
        // Direct ETH funding
        await fundPoll(parseInt(selectedPollId), fundAmount)
        toast.success("Poll funding transaction submitted")
      } else {
        // SideShift conversion + funding
        await handleSideShiftConversion()
      }
      
      setFundAmount("")
      setSelectedPollId("")
      setSelectedCoin("ETH")
      setSelectedNetwork("ethereum")
    } catch (error) {
      console.error("Fund poll failed:", error)
      toast.error("Failed to fund poll")
    }
  }

  const handleSideShiftConversion = async () => {
    try {
      // Create SideShift shift directly - they handle the swap
      const shiftResponse = await fetch('https://sideshift.ai/api/v1/shifts/fixed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          depositCoin: selectedCoin.toLowerCase(),
          settleCoin: 'eth',
          depositAmount: fundAmount,
          settleAddress: address,
          affiliateId: 'basepulse'
        })
      })

      const shift = await shiftResponse.json()
      
      if (!shiftResponse.ok) {
        throw new Error(shift.error?.message || 'Failed to create shift')
      }

      // Show user the deposit address
      toast.success(`Send ${fundAmount} ${selectedCoin} to: ${shift.depositAddress}`)
      
      // Copy deposit address to clipboard
      navigator.clipboard.writeText(shift.depositAddress)
      toast.info("Deposit address copied to clipboard!")

    } catch (error) {
      console.error("SideShift conversion failed:", error)
      toast.error(`Conversion failed: ${error.message}`)
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-amber-800 mb-2">Wallet Not Connected</h2>
            <p className="text-amber-700">Please connect your wallet to view your created polls.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Polls</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage polls you've created
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{myPolls.length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Created Polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{myPolls.filter(p => p.status === "active").length}</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Polls</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold">{myPolls.reduce((sum, poll) => sum + poll.totalVotes, 0)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Votes</p>
            </CardContent>
          </Card>
        </div>

        {/* Polls List */}
        {pollsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : myPolls.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              You haven't created any polls yet.
            </p>
            <Button asChild>
              <a href="/dapp/create">Create Your First Poll</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myPolls.map((poll) => {
              const daysRemaining = Math.max(0, Math.ceil((new Date(poll.endsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              
              return (
                <Card key={poll.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">{poll.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={poll.status === "active" ? "default" : "secondary"}>
                            {poll.status}
                          </Badge>
                        </div>
                      </div>
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

                    {poll.status === "active" && (
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => setSelectedPollId(poll.id)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Fund
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Convert & Fund Poll</DialogTitle>
                              <DialogDescription>
                                Convert your tokens to ETH and fund your poll in one transaction.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="asset">Convert From</Label>
                                <select
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={selectedCoin}
                                  onChange={(e) => setSelectedCoin(e.target.value)}
                                >
                                  <option value="USDC">USDC (Base)</option>
                                  <option value="USDT">USDT (Base)</option>
                                  <option value="ETH">ETH (Base)</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="amount">Amount ({selectedCoin})</Label>
                                <Input
                                  id="amount"
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  placeholder="1.0"
                                  value={fundAmount}
                                  onChange={(e) => setFundAmount(e.target.value)}
                                />
                              </div>
                              
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <h4 className="font-medium text-blue-800 mb-2">SideShift Direct Swap:</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                  <p>• Send {selectedCoin} to SideShift deposit address</p>
                                  <p>• SideShift converts to ETH automatically</p>
                                  <p>• ETH arrives in your wallet</p>
                                  <p>• Then fund your poll with received ETH</p>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => {
                                setFundAmount("")
                                setSelectedCoin("ETH")
                                setSelectedNetwork("ethereum")
                              }}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleFundPoll}
                                disabled={!fundAmount || isFunding}
                              >
                                {isFunding ? "Processing..." : 
                                 selectedCoin === "ETH" && selectedNetwork === "ethereum" ? "Fund Poll" : "Convert & Fund"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleClosePoll(poll.id)}
                          disabled={isClosing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {isClosing ? "Closing..." : "Close"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
