"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X, Info, Coins, Users, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCreatePoll, usePollsContractAddress } from "@/lib/contracts/polls-contract-utils"
import { useAccount, useChainId } from "wagmi"
import { Address } from "viem"
import { MIN_POLL_DURATION, MAX_POLL_DURATION, FundingType } from "@/lib/contracts/polls-contract"
import { useRouter } from "next/navigation"
import { TOKEN_INFO, getSupportedTokens, getTokenAddress } from "@/lib/contracts/token-config"

const pollSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options required")
    .max(10, "Maximum 10 options allowed"),
  endDate: z.date().optional(),
  fundingType: z.enum(["none", "self", "community"]),
  fundingToken: z.string().optional(),
  rewardAmount: z.coerce.number().min(0).optional(),
})

type PollFormData = z.infer<typeof pollSchema>

const categories = ["Governance", "Community", "Product", "Events", "General", "Technical", "Marketing", "Partnership"]

export function PollCreationForm() {
  const [options, setOptions] = useState<string[]>(["", ""])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const { isConnected } = useAccount()
  const contractAddress = usePollsContractAddress()
  const chainId = useChainId()
  const { createPoll, isPending, isConfirming, isSuccess, error } = useCreatePoll()
  const router = useRouter()

  // Get supported tokens for the current chain
  const supportedTokens = getSupportedTokens(chainId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<PollFormData>({
    // resolver: zodResolver(pollSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      category: "",
      fundingType: "none",
      fundingToken: "ETH",
      options: ["", ""],
      rewardAmount: 0,
    },
  })

  const fundingType = watch("fundingType")
  const fundingToken = watch("fundingToken")
  const endDate = watch("endDate")
  const category = watch("category")

  const isSubmitting = isPending || isConfirming

  const addOption = () => {
    if (options.length < 10) {
      const newOptions = [...options, ""]
      setOptions(newOptions)
      setValue("options", newOptions, { shouldValidate: true })
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
      setValue("options", newOptions, { shouldValidate: true })
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
    setValue("options", newOptions, { shouldValidate: true })
  }

  const onSubmit = async (data: PollFormData) => {
    console.log("=== FORM DEBUG ===")
    console.log("Form submitted with data:", data)
    console.log("Watch title:", watch("title"))
    console.log("GetValues:", getValues())
    console.log("Form errors:", errors)
    console.log("Current options state:", options)

    if (!isConnected) {
      toast.error("Please connect your wallet to create a poll")
      return
    }

    if (!contractAddress) {
      toast.error("Contract not available on this network")
      return
    }

    // Validate required fields since we made them optional
    if (!data.title?.trim()) {
      toast.error("Poll title is required")
      return
    }

    if (!options || options.length < 2) {
      toast.error("At least 2 poll options are required")
      return
    }

    const validOptions = options.filter(opt => opt && opt.trim() !== "")
    if (validOptions.length < 2) {
      toast.error("At least 2 non-empty poll options are required")
      return
    }

    if (!data.endDate) {
      toast.error("End date is required")
      return
    }

    try {
      console.log("Creating poll:", data)

      // Calculate duration in hours
      const now = new Date()
      const durationInHours = Math.ceil((data.endDate.getTime() - now.getTime()) / (1000 * 60 * 60))

      console.log("Duration in hours:", durationInHours)
      console.log("Contract address:", contractAddress)
      console.log("Poll title:", data.title)
      console.log("Valid options:", validOptions)
      console.log("Funding token:", data.fundingToken)

      // Validate duration
      if (durationInHours <= 0) {
        toast.error("End date must be in the future")
        return
      }

      if (durationInHours < 1) {
        toast.error("Poll must run for at least 1 hour")
        return
      }

      if (durationInHours > 24 * 30) { // 30 days
        toast.error("Poll duration cannot exceed 30 days")
        return
      }

      // Determine the funding token address for the contract
      let fundingTokenAddress: Address
      if (data.fundingType === "none") {
        // No rewards - default to ETH (address(0))
        fundingTokenAddress = '0x0000000000000000000000000000000000000000' as Address
      } else if (data.fundingType === "community") {
        // Community funded - default to ETH
        fundingTokenAddress = '0x0000000000000000000000000000000000000000' as Address
      } else if (data.fundingToken === "ETH") {
        // ETH funding
        fundingTokenAddress = '0x0000000000000000000000000000000000000000' as Address
      } else {
        // ERC20 token funding
        const tokenAddress = getTokenAddress(chainId, data.fundingToken)
        if (!tokenAddress) {
          toast.error(`Token ${data.fundingToken} not available on this network`)
          return
        }
        fundingTokenAddress = tokenAddress
      }

      // Convert funding type string to enum
      let fundingTypeEnum: FundingType
      if (data.fundingType === "none") {
        fundingTypeEnum = FundingType.NONE
      } else if (data.fundingType === "self") {
        fundingTypeEnum = FundingType.SELF
      } else {
        fundingTypeEnum = FundingType.COMMUNITY
      }

      // Create poll on contract with funding token and funding type
      await createPoll(data.title, validOptions, durationInHours, fundingTokenAddress, fundingTypeEnum)

    } catch (error) {
      console.error("Error creating poll:", error)
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes("User rejected")) {
          toast.error("Transaction was rejected by user")
        } else if (error.message.includes("insufficient funds")) {
          toast.error("Insufficient funds for transaction")
        } else if (error.message.includes("gas")) {
          toast.error("Gas estimation failed. Check network connection.")
        } else {
          toast.error(`Transaction failed: ${error.message}`)
        }
      } else {
        toast.error("Failed to create poll. Please try again.")
      }
    }
  }

  // Handle success with useEffect
  useEffect(() => {
    if (isSuccess) {
      toast.success("Poll created successfully!")
      // Reset form
      setOptions(["", ""])
      reset({
        title: "",
        description: "",
        category: "",
        fundingType: "none",
        options: ["", ""],
      })
      // Redirect to dapp page
      router.push("/dapp")
    }
  }, [isSuccess, reset, router])

  // Handle error
  if (error) {
    console.error("Contract error:", error)
    toast.error(`Failed to create poll: ${error.message}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Create New Poll</h1>
        <p className="text-muted-foreground text-lg">
          Create a decentralized poll and let your community make decisions together
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the essential details for your poll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <input
                id="title"
                placeholder="What should we decide on?"
                {...register("title")}
                className={`w-full px-3 py-2 border rounded-md ${errors.title ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Provide more context about what this poll is about and why it matters..."
                rows={4}
                {...register("description")}
                className={`w-full px-3 py-2 border rounded-md ${errors.description ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={category} 
                  onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal text-foreground hover:text-foreground",
                        !endDate && "opacity-70 hover:opacity-100",
                        errors.endDate && "border-destructive",
                      )}
                      onClick={() => {
                        console.log("Calendar button clicked")
                        setIsCalendarOpen(!isCalendarOpen)
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick an end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        console.log("Date selected:", date)
                        if (date) {
                          setValue("endDate", date, { shouldValidate: true })
                          setIsCalendarOpen(false)
                        }
                      }}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Poll Options */}
        <Card>
          <CardHeader>
            <CardTitle>Poll Options</CardTitle>
            <CardDescription>Add the choices that people can vote on (2-10 options)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className={errors.options?.[index] ? "border-destructive" : ""}
                  />
                  {errors.options?.[index] && (
                    <p className="text-sm text-destructive mt-1">{errors.options[index]?.message}</p>
                  )}
                </div>
                {options.length > 2 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeOption(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            )}

            {errors.options && <p className="text-sm text-destructive">{errors.options.message}</p>}
          </CardContent>
        </Card>

        {/* Funding Options */}
        <Card>
          <CardHeader>
            <CardTitle>Funding & Incentives</CardTitle>
            <CardDescription>Choose how to incentivize participation in your poll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={fundingType}
              onValueChange={(value) => setValue("fundingType", value as "none" | "self" | "community", { shouldValidate: true })}
              className="space-y-4"
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="none" id="none" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="none" className="font-medium cursor-pointer">
                    No Rewards
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Free poll with no financial incentives. Great for simple community decisions.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <Users className="h-3 w-3 mr-1" />
                    Community Driven
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="self" id="self" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="self" className="font-medium cursor-pointer">
                    Self-Funded
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    You provide the reward pool. Participants share the rewards based on their contribution.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <Coins className="h-3 w-3 mr-1" />
                    Your Investment
                  </Badge>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="community" id="community" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="community" className="font-medium cursor-pointer">
                    Community Fund
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rewards come from the community treasury. Requires governance approval.
                  </p>
                  <Badge variant="secondary" className="mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    Approval Required
                  </Badge>
                </div>
              </div>
            </RadioGroup>

            {fundingType === "self" && (
              <div className="space-y-2">
                <Label htmlFor="fundingToken">Funding Token</Label>
                <Select
                  value={fundingToken}
                  onValueChange={(value) => setValue("fundingToken", value, { shouldValidate: true })}
                >
                  <SelectTrigger id="fundingToken">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(supportedTokens).map((symbol) => {
                      const tokenInfo = TOKEN_INFO[symbol]
                      return (
                        <SelectItem key={symbol} value={symbol}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{symbol}</span>
                            <span className="text-muted-foreground text-sm">- {tokenInfo?.name || symbol}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(fundingType === "self" || fundingType === "community") && (
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">
                  Reward Amount {fundingType === "self" && fundingToken ? `(${fundingToken})` : "(ETH)"}
                </Label>
                <Input
                  id="rewardAmount"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="0.1"
                  {...register("rewardAmount", { valueAsNumber: true })}
                />
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {fundingType === "self"
                      ? "You'll need to deposit this amount when creating the poll. Rewards are distributed to voters."
                      : "This amount will be requested from the community fund. Poll creation is subject to governance approval."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Status */}
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">Wallet not connected</span>
            </div>
            <p className="text-amber-700 mt-1">Please connect your wallet to create a poll on-chain</p>
          </div>
        )}

        {isConnected && !contractAddress && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Contract not available</span>
            </div>
            <p className="text-red-700 mt-1">The polls contract is not deployed on this network</p>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-800">Debug Info</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
              <p>Contract Address: {contractAddress || 'Not available'}</p>
              <p>Chain ID: {useChainId()}</p>
              <p>Transaction Status: {isPending ? 'Pending' : isConfirming ? 'Confirming' : 'Ready'}</p>
              {error && <p className="text-red-600">Error: {error.message}</p>}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" size="lg">
            Save as Draft
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !isConnected || !contractAddress}
          >
            {isPending && "Preparing transaction..."}
            {isConfirming && "Confirming transaction..."}
            {!isSubmitting && "Create Poll"}
          </Button>
        </div>
      </form>
    </div>
  )
}
