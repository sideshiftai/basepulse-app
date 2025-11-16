/**
 * Layout Content Component
 * Handles the fixed header + sidebar + main content layout structure
 */

"use client"

import { FixedHeader } from "@/components/fixed-header"
import { NewSidebar } from "@/components/new-sidebar"
import { useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed Header */}
      <FixedHeader />

      {/* Content Area (Sidebar + Main) */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <NewSidebar />

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            isCollapsed ? "ml-16" : "ml-64"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
