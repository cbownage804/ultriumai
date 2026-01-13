import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, Lock, Search, Network, Wrench, MessageSquare, Bot,
  CheckCircle, Play, ShoppingCart, Loader2, Minus, Plus, TrendingDown, Sparkles
} from "lucide-react";
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductPricing, formatPrice, getMonthlyPrice } from '@/config/productPricing';

interface ProductPurchaseCardProps {
  product: ProductPricing;
  features: string[];
  tags: string[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  safescan: Shield,
  safepass: Lock,
  rmm: Wrench,
  helpdesk: MessageSquare,
  safenet: Network,
  safeweb: Search,
  ultriumgpt: Bot,
};

const ProductPurchaseCard = ({ product, features, tags }: ProductPurchaseCardProps) => {
  const [quantity, setQuantity] = useState(product.unit === 'org' ? 1 : 5);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const Icon = iconMap[product.id] || Shield;

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-checkout', {
        body: { 
          productId: product.id, 
          quantity,
          billingInterval: 'monthly'
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyTotal = getMonthlyPrice(product, quantity);
  const unitLabel = product.unit === 'org' ? '' : `/${product.unit}`;

  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs capitalize">
              {product.category}
            </Badge>
            {product.inVanguard ? (
              <Badge variant="outline" className="text-xs text-cyan-500 border-cyan-500/30">
                In Vanguard
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-purple-500 border-purple-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                Standalone
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl mt-4">{product.name}</CardTitle>
        <CardDescription className="text-sm">{product.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Pricing */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-muted-foreground">
              {unitLabel}/mo
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">{product.savings}</span>
            <span className="text-muted-foreground">({product.competitorComparison})</span>
          </div>
        </div>

        {/* Quantity Selector */}
        {product.unit !== 'org' && (
          <div className="mb-4">
            <Label className="text-sm mb-2 block">
              Number of {product.unit}s
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center h-8"
                min={1}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Monthly Total */}
        <div className="flex justify-between items-center mb-4 py-2 border-t border-b border-border/50">
          <span className="text-sm text-muted-foreground">Monthly Total</span>
          <span className="text-xl font-bold">{formatPrice(monthlyTotal)}/mo</span>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-4 flex-1">
          {features.slice(0, 4).map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={handlePurchase} 
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="mr-2 h-4 w-4" />
            )}
            Subscribe
          </Button>
          <Link to={product.demoUrl}>
            <Button variant="outline" size="icon">
              <Play className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPurchaseCard;
