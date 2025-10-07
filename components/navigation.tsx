"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { cn } from "@/lib/utils"
import { useAccount, useReadContract } from "wagmi"
import { usePollsContractAddress } from "@/lib/contracts/polls-contract-utils"
import { POLLS_CONTRACT_ABI } from "@/lib/contracts/polls-contract"
import { Menu } from "lucide-react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const contractAddress = usePollsContractAddress()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Check if current user is owner
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: POLLS_CONTRACT_ABI,
    functionName: 'owner',
  })

  const isOwner = isConnected && address && owner && address.toLowerCase() === owner.toLowerCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        {/* Mobile Logo */}
        <Link className="flex md:hidden items-center space-x-2" href="/">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl">PulsePoll</span>
        </Link>

        {/* Mobile Menu - Right Side */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="px-6">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-6 px-6">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-lg transition-colors hover:text-foreground/80",
                  pathname === "/" ? "text-foreground font-semibold" : "text-foreground/60",
                )}
              >
                Home
              </Link>
              <Link
                href="/dapp"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-lg transition-colors hover:text-foreground/80",
                  pathname === "/dapp" ? "text-foreground font-semibold" : "text-foreground/60",
                )}
              >
                Dapp
              </Link>
              {isConnected && (
                <Link
                  href="/creator"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-lg transition-colors hover:text-foreground/80",
                    pathname === "/creator" ? "text-foreground font-semibold" : "text-foreground/60",
                  )}
                >
                  Creator
                </Link>
              )}
              {isOwner && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-lg transition-colors hover:text-foreground/80",
                    pathname === "/admin" ? "text-foreground font-semibold" : "text-foreground/60",
                  )}
                >
                  Admin
                </Link>
              )}
              <div className="pt-4 border-t">
                <ConnectWalletButton />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        </div>

        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <Link className="mr-6 flex items-center space-x-2" href="/">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="hidden font-bold sm:inline-block text-xl">PulsePoll</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/" ? "text-foreground" : "text-foreground/60",
              )}
            >
              Home
            </Link>
            <Link
              href="/dapp"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/dapp" ? "text-foreground" : "text-foreground/60",
              )}
            >
              Dapp
            </Link>
            {isConnected && (
              <Link
                href="/creator"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/creator" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Creator
              </Link>
            )}
            {isOwner && (
              <Link
                href="/admin"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/admin" ? "text-foreground" : "text-foreground/60",
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
          <ConnectWalletButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
