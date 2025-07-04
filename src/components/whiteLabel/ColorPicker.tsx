import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorResult, SketchPicker } from 'react-color';
import { ColorOption } from "@/types/whiteLabel";

interface ColorPickerProps {
  colorOption: ColorOption;
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = ({ colorOption, value, onChange }: ColorPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleColorChange = (color: ColorResult) => {
    onChange(color.hex);
  };

  return (
    <div className="space-y-2">
      <Label>{colorOption.label}</Label>
      <p className="text-sm text-muted-foreground">{colorOption.description}</p>
      <div className="flex items-center space-x-4">
        <div
          className="h-10 w-20 rounded border cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm w-32"
        />
      </div>
      {showPicker && (
        <div className="absolute z-50">
          <div
            className="fixed inset-0"
            onClick={() => setShowPicker(false)}
          />
          <SketchPicker
            color={value}
            onChange={handleColorChange}
          />
        </div>
      )}
    </div>
  );
};