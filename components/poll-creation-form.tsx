"use client"

import { useState } from "react"
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
import { useAccount } from "wagmi"
import { MIN_POLL_DURATION, MAX_POLL_DURATION } from "@/lib/contracts/polls-contract"

const pollSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options required")
    .max(10, "Maximum 10 options allowed"),
  endDate: z.date().optional(),
  fundingType: z.enum(["none", "self", "community"]),
  rewardAmount: z.coerce.number().min(0).optional(),
})

type PollFormData = z.infer<typeof pollSchema>

const categories = ["Governance", "Community", "Product", "Events", "General", "Technical", "Marketing", "Partnership"]

export function PollCreationForm() {
  const [options, setOptions] = useState<string[]>(["", ""])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const { isConnected } = useAccount()
  const contractAddress = usePollsContractAddress()
  const { createPoll, isPending, isConfirming, isSuccess, error } = useCreatePoll()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<PollFormData>({
    resolver: zodResolver(pollSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      category: "",
      fundingType: "none",
      options: ["", ""],
      rewardAmount: 0,
    },
  })

  const fundingType = watch("fundingType")
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
    console.log("Form submitted with data:", data)
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

    try {
      console.log("Creating poll:", data)

      // Calculate duration in hours
      const now = new Date()
      const durationInHours = Math.ceil((data.endDate.getTime() - now.getTime()) / (1000 * 60 * 60))

      // Create poll on contract
      await createPoll(data.title, data.options, durationInHours)

    } catch (error) {
      console.error("Error creating poll:", error)
      toast.error("Failed to create poll. Please try again.")
    }
  }

  // Handle success
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
  }

  // Handle error
  if (error) {
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

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log("=== VALIDATION ERRORS ===")
        console.log("Form validation errors:", errors)
        console.log("Current form values:", watch())
        console.log("Current options state:", options)
        console.log("Form getValues():", getValues())
        
        // Check what fields are being validated
        console.log("Schema fields being validated:", Object.keys(pollSchema.shape))
        
        // Log each field error specifically
        Object.entries(errors).forEach(([field, error]) => {
          console.log(`Field "${field}" error:`, error?.message)
          console.log(`Field "${field}" current value:`, watch(field as keyof PollFormData))
        })
        
        toast.error("Please fix the validation errors before submitting")
      })} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Provide the essential details for your poll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="What should we decide on?"
                {...register("title")}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide more context about what this poll is about and why it matters..."
                rows={4}
                {...register("description")}
                className={errors.description ? "border-destructive" : ""}
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
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
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

            {(fundingType === "self" || fundingType === "community") && (
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">Reward Amount (ETH)</Label>
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
