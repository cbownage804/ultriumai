import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PRODUCTS } from "@/types/contact";

interface ProductInterestsProps {
  selectedProducts: string[];
  onProductChange: (productId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

export const ProductInterests = ({ 
  selectedProducts, 
  onProductChange, 
  onSelectAll 
}: ProductInterestsProps) => {
  return (
    <div className="space-y-4">
      <Label>Products you're interested in</Label>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all"
            checked={selectedProducts.length === PRODUCTS.length}
            onCheckedChange={onSelectAll}
          />
          <Label 
            htmlFor="select-all" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Select All
          </Label>
        </div>
        <div className="border-t pt-3 space-y-3">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="flex items-start space-x-2">
              <Checkbox 
                id={product.id}
                checked={selectedProducts.includes(product.id)}
                onCheckedChange={(checked) => onProductChange(product.id, checked === true)}
                className="mt-0.5"
              />
              <div>
                <Label 
                  htmlFor={product.id} 
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {product.name}
                </Label>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
