import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Building2, Users, Mail, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const demoRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().min(1, "Company name is required").max(100),
  companySize: z.string().min(1, "Please select company size"),
  product: z.string().min(1, "Please select a product"),
  message: z.string().trim().max(1000).optional(),
});

type DemoRequestData = z.infer<typeof demoRequestSchema>;

interface RequestDemoFormProps {
  defaultProduct?: 'safesuite' | 'ai_studio' | 'vanguard';
  triggerLabel?: string;
  variant?: 'button' | 'inline';
}

export const RequestDemoForm = ({ 
  defaultProduct, 
  triggerLabel = "Request a Demo",
  variant = 'button'
}: RequestDemoFormProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DemoRequestData>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      product: defaultProduct || '',
    },
  });

  const onSubmit = async (data: DemoRequestData) => {
    setIsSubmitting(true);
    try {
      // Use type assertion for the new lead_captures table
      const { error } = await (supabase as any).from('lead_captures').insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        company_name: data.company,
        company_size: data.companySize,
        product_interest: data.product,
        message: data.message || null,
        lead_source: 'demo_request',
        status: 'new',
      });

      if (error) throw error;

      toast.success("Demo request submitted!", {
        description: "Our team will contact you within 24 hours.",
      });
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Demo request error:', error);
      toast.error("Something went wrong", {
        description: "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register("firstName")}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register("lastName")}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" /> Work Email *
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="john@company.com"
          {...register("email")}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" /> Phone (Optional)
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 000-0000"
          {...register("phone")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Company *
        </Label>
        <Input
          id="company"
          placeholder="Company Name"
          {...register("company")}
          className={errors.company ? "border-destructive" : ""}
        />
        {errors.company && (
          <p className="text-xs text-destructive">{errors.company.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" /> Company Size *
        </Label>
        <Select onValueChange={(value) => setValue("companySize", value)}>
          <SelectTrigger className={errors.companySize ? "border-destructive" : ""}>
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1-10 employees</SelectItem>
            <SelectItem value="11-50">11-50 employees</SelectItem>
            <SelectItem value="51-200">51-200 employees</SelectItem>
            <SelectItem value="201-500">201-500 employees</SelectItem>
            <SelectItem value="501+">501+ employees</SelectItem>
          </SelectContent>
        </Select>
        {errors.companySize && (
          <p className="text-xs text-destructive">{errors.companySize.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Product Interest *</Label>
        <Select 
          defaultValue={defaultProduct}
          onValueChange={(value) => setValue("product", value)}
        >
          <SelectTrigger className={errors.product ? "border-destructive" : ""}>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="safesuite">SafeSuite - Security Tools</SelectItem>
            <SelectItem value="ai_studio">AI Studio - Custom AI Assistants</SelectItem>
            <SelectItem value="vanguard">Vanguard - MSP Platform</SelectItem>
            <SelectItem value="enterprise">Enterprise - Full Platform</SelectItem>
          </SelectContent>
        </Select>
        {errors.product && (
          <p className="text-xs text-destructive">{errors.product.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Message (Optional)
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us about your needs..."
          rows={3}
          {...register("message")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        <Calendar className="h-4 w-4 mr-2" />
        {isSubmitting ? "Submitting..." : "Schedule Demo"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By submitting, you agree to our privacy policy. We'll contact you within 24 hours.
      </p>
    </form>
  );

  if (variant === 'inline') {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Calendar className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Request a Demo
          </DialogTitle>
          <DialogDescription>
            See how Ultrium can transform your business. Our team will reach out within 24 hours.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};
