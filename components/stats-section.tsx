"use client"

import { Card } from "@/components/ui/card"
import { ScrollReveal } from "@/components/scroll-reveal"

const stats = [
  {
    value: "10K+",
    label: "Active Polls",
    description: "Community decisions made daily",
  },
  {
    value: "98%",
    label: "Transparency",
    description: "On-chain verification",
  },
  {
    value: "500+",
    label: "Communities",
    description: "Using PulsePoll",
  },
  {
    value: "24/7",
    label: "Uptime",
    description: "Decentralized reliability",
  },
]

export function StatsSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        <ScrollReveal>
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Trusted by communities worldwide
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground text-lg">
              Join thousands of communities making decisions transparently on Base
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <Card className="p-6 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="font-semibold">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
