
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjects } from "@/hooks/use-projects"
import { toast } from "sonner"

const templates = [
  {
    id: "ai-agent",
    name: "AI Agent",
    description: "Build intelligent conversational agents",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "knowledge-base",
    name: "Knowledge Base",
    description: "Organize and search your information",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "workflow",
    name: "Workflow",
    description: "Automate business processes",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "integration",
    name: "Integration",
    description: "Connect your favorite tools",
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Track and analyze performance",
    gradient: "from-indigo-500 to-blue-500",
  },
]

const plans = [
  { id: "free", name: "Free", description: "Get started with basic features" },
  {
    id: "pro",
    name: "Pro",
    description: "Advanced features and higher limits",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Full power with custom solutions",
  },
]

interface QuickCreateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTemplate?: string
}

export function QuickCreate({ open, onOpenChange, defaultTemplate }: QuickCreateProps) {
  const [step, setStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate || "")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plan: "free",
  })
  const [isCreating, setIsCreating] = useState(false)
  const { createProject } = useProjects()

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: template.description,
      }))
    }
    setStep(2)
  }

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a project name")
      return
    }

    setIsCreating(true)
    try {
      const result = await createProject({
        name: formData.name,
        description: formData.description,
        plan: formData.plan,
      })

      if (result?.error) {
        toast.error(result.error.message || "Failed to create project")
      } else {
        toast.success("Project created successfully!")
        onOpenChange(false)
        // Reset form
        setStep(1)
        setSelectedTemplate("")
        setFormData({
          name: "",
          description: "",
          plan: "free",
        })
      }
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const resetAndClose = () => {
    setStep(1)
    setSelectedTemplate("")
    setFormData({
      name: "",
      description: "",
      plan: "free",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Quick Create" : "Project Details"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Choose a template to get started quickly"
              : "Configure your new project"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div
                  className={`mb-3 h-12 w-12 rounded-lg bg-gradient-to-r ${template.gradient} flex items-center justify-center`}
                >
                  <div className="h-6 w-6 rounded bg-white/20"></div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe your project"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select
                value={formData.plan}
                onValueChange={(value) =>
                  setFormData(prev => ({ ...prev, plan: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
