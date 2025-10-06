import { createAppKit } from "@reown/appkit/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { base, baseSepolia } from "viem/chains"
import { cookieStorage, createStorage } from "wagmi"

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "your-project-id-here"

if (!projectId) {
  throw new Error("Project ID is not defined")
}

// Create a metadata object
const metadata = {
  name: "PulsePoll",
  description: "Decentralized Incentivized Polls on Base",
  url: "https://pulsepoll.app", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
}

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  networks: [base, baseSepolia],
  projectId,
})

// Create the AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia],
  defaultNetwork: base,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // default to true
    socials: ["google", "x", "github", "discord", "apple"],
    emailShowWallets: true, // default to true
  },
})

export const config = wagmiAdapter.wagmiConfig
