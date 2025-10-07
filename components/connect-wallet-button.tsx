"use client"

import { useAppKit } from "@reown/appkit/react"
import { useAccount, useDisconnect, useSwitchChain, useChainId } from "wagmi"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Wallet, LogOut, User, Copy, ExternalLink, Network, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { base, baseSepolia } from "wagmi/chains"
import { usePollsContractAddress } from "@/lib/contracts/polls-contract-utils"

export function ConnectWalletButton() {
  const { open } = useAppKit()
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const contractAddress = usePollsContractAddress()
  const [isLoading, setIsLoading] = useState(false)
  
  // Check if contract is deployed on current network
  const hasContractOnNetwork = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000"
  
  // Supported networks
  const supportedNetworks = [
    { chain: base, name: "Base Mainnet", hasContract: chainId === 8453 && hasContractOnNetwork },
    { chain: baseSepolia, name: "Base Sepolia", hasContract: chainId === 84532 && hasContractOnNetwork },
  ]

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      await open()
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast.error("Failed to connect wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success("Wallet disconnected")
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    }
  }

  const openExplorer = () => {
    if (address && chain) {
      const explorerUrl = chain.blockExplorers?.default?.url
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${address}`, "_blank")
      }
    }
  }
  
  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId })
      toast.success(`Switched to ${targetChainId === 8453 ? 'Base Mainnet' : 'Base Sepolia'}`)
    } catch (error) {
      console.error("Failed to switch network:", error)
      toast.error("Failed to switch network")
    }
  }

  if (!isConnected || !address) {
    return (
      <Button onClick={handleConnect} disabled={isLoading} className="bg-primary hover:bg-primary/90">
        <Wallet className="h-4 w-4 mr-2" />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
  
  // Check if on supported network
  const isSupportedNetwork = chainId === 8453 || chainId === 84532
  const networkDisplayName = !isSupportedNetwork ? "Wrong Network" : (chain?.name || "Unknown")
  
  // Get network badge color
  const getNetworkBadgeColor = () => {
    if (!isSupportedNetwork) return "bg-red-500"
    if (!hasContractOnNetwork) return "bg-amber-500"
    return chainId === 84532 ? "bg-blue-500" : "bg-green-500"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-transparent gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">{address.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{shortAddress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${getNetworkBadgeColor()}`} />
            <span className={`text-xs hidden md:inline ${!isSupportedNetwork ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
              {networkDisplayName}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{address.slice(2, 4).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            <span className="text-sm font-medium">{shortAddress}</span>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${getNetworkBadgeColor()}`} />
              <span className={`text-xs ${!isSupportedNetwork ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                {networkDisplayName}
              </span>
            </div>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Wrong Network Warning */}
        {!isSupportedNetwork && (
          <>
            <div className="px-2 py-3 bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 mx-2 my-1 rounded">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                Unsupported Network
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80">
                Please switch to Base Mainnet or Base Sepolia
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Network Switcher Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Network
        </DropdownMenuLabel>
        {supportedNetworks.map((network) => (
          <DropdownMenuItem
            key={network.chain.id}
            onClick={() => handleSwitchNetwork(network.chain.id)}
            disabled={chainId === network.chain.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span>{network.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {network.hasContract && (
                <span className="text-xs text-green-600 dark:text-green-400">✓</span>
              )}
              {chainId === network.chain.id && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => open({ view: "Account" })}>
          <User className="h-4 w-4 mr-2" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
