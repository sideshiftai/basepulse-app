/**
 * Layout Content Component
 * Handles the sidebar + main content layout structure
 */

"use client"

import { useAccount, useReadContract } from "wagmi"
import { usePollsContractAddress } from "@/lib/contracts/polls-contract-utils"
import { POLLS_CONTRACT_ABI } from "@/lib/contracts/polls-contract"
import { SidebarNavigation } from "@/components/sidebar-navigation"
import { Navigation } from "@/components/navigation"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { address, isConnected } = useAccount()
  const contractAddress = usePollsContractAddress()

  // Check if current user is owner
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: "owner",
  })

  const isOwner =
    isConnected &&
    address &&
    owner &&
    address.toLowerCase() === owner.toLowerCase()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNavigation isOwner={isOwner} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-60">
        {/* Top Navigation (for theme toggle and wallet connect) */}
        <Navigation />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
