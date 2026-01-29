import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.object({
  email: z.string().trim().email("Please enter a valid email").max(255),
});

type EmailData = z.infer<typeof emailSchema>;

interface LeadCaptureCardProps {
  title?: string;
  description?: string;
  buttonText?: string;
  product?: string;
  variant?: 'default' | 'minimal' | 'featured';
  source?: string;
}

export const LeadCaptureCard = ({
  title = "Stay Updated",
  description = "Get the latest security tips and product updates delivered to your inbox.",
  buttonText = "Subscribe",
  product = "general",
  variant = 'default',
  source = "newsletter",
}: LeadCaptureCardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailData) => {
    setIsSubmitting(true);
    try {
      // Use type assertion for the new lead_captures table
      const { error } = await (supabase as any).from('lead_captures').insert({
        email: data.email,
        product_interest: product,
        lead_source: source,
        status: 'new',
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("You're subscribed!", {
        description: "Watch your inbox for updates.",
      });
      reset();
    } catch (error) {
      console.error('Lead capture error:', error);
      toast.error("Something went wrong", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className={variant === 'featured' ? 'bg-primary/5 border-primary/20' : ''}>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-1">You're on the list!</h3>
          <p className="text-sm text-muted-foreground">
            Check your inbox for a welcome email.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="flex-1">
          <Input
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "..." : <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    );
  }

  return (
    <Card className={variant === 'featured' ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' : ''}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          {variant === 'featured' ? (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <Mail className="h-5 w-5 text-primary" />
          )}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email" className="sr-only">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              "Subscribing..."
            ) : (
              <>
                {buttonText}
                <Zap className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            No spam, unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
