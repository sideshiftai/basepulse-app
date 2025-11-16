/**
 * New Sidebar Navigation Component
 * Collapsible sidebar matching screenshot structure with Projects, Surveys, Polls, Quick Actions
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  FolderKanban,
  ClipboardList,
  BarChart3,
  Coins,
  Droplet,
  TrendingUp,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  FileEdit,
  ArrowLeftRight,
} from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  count?: number
  isCollapsed: boolean
  isActive?: boolean
}

function SidebarItem({
  icon: Icon,
  label,
  href,
  count,
  isCollapsed,
  isActive,
}: SidebarItemProps) {
  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
        isActive && "bg-accent text-accent-foreground font-medium",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isCollapsed && "h-6 w-6")} />
      {!isCollapsed && (
        <>
          <span className="flex-1">{label}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="ml-auto">
              {count}
            </Badge>
          )}
        </>
      )}
    </Link>
  )

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {label}
            {count !== undefined && <Badge variant="secondary">{count}</Badge>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}

export function NewSidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebar()

  // TODO: Replace with real data
  const projectsCount = 1
  const surveysCount = 0
  const pollsCount = 20

  const mainSections = [
    {
      icon: FolderKanban,
      label: "Projects",
      href: "/projects",
      count: projectsCount,
    },
    {
      icon: ClipboardList,
      label: "Surveys",
      href: "/surveys",
      count: surveysCount,
    },
    {
      icon: BarChart3,
      label: "Polls",
      href: "/dapp",
      count: pollsCount,
    },
  ]

  const creatorSections = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/creator",
    },
    {
      icon: FileEdit,
      label: "Manage Polls",
      href: "/creator/manage",
    },
    {
      icon: ArrowLeftRight,
      label: "Distributions",
      href: "/creator/distributions",
    },
  ]

  const quickActions = [
    {
      icon: Coins,
      label: "Token Stats",
      href: "/token-stats",
    },
    {
      icon: Droplet,
      label: "Liquidity Pool",
      href: "/liquidity",
    },
    {
      icon: TrendingUp,
      label: "Analytics",
      href: "/analytics",
    },
    {
      icon: Download,
      label: "Export Data",
      href: "/export",
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/settings",
    },
  ]

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Sidebar Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-3">
          {/* Main Sections */}
          <div className="space-y-1">
            {mainSections.map((item) => (
              <SidebarItem
                key={item.href}
                {...item}
                isCollapsed={isCollapsed}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Creator Section */}
          {!isCollapsed && (
            <div>
              <div className="px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Creator
                </h2>
              </div>
              <div className="space-y-1">
                {creatorSections.map((item) => (
                  <SidebarItem
                    key={item.href}
                    {...item}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            {!isCollapsed && (
              <div className="px-3 py-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick Actions
                </h2>
              </div>
            )}
            <div className="space-y-1">
              {quickActions.map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  isCollapsed={isCollapsed}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="border-t p-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("w-full", isCollapsed && "px-2")}
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
