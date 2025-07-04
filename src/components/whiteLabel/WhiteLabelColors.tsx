import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "./ColorPicker";
import { WhiteLabelConfig, ColorOption } from "@/types/whiteLabel";

interface WhiteLabelColorsProps {
  config: WhiteLabelConfig;
  setConfig: (config: WhiteLabelConfig | ((prev: WhiteLabelConfig) => WhiteLabelConfig)) => void;
}

const colorOptions: ColorOption[] = [
  { key: 'primary_color', label: 'Primary Color', description: 'Main brand color for buttons and accents' },
  { key: 'secondary_color', label: 'Secondary Color', description: 'Supporting color for highlights' },
  { key: 'background_color', label: 'Background Color', description: 'Main background color' },
  { key: 'text_color', label: 'Text Color', description: 'Primary text color' }
];

export const WhiteLabelColors = ({ config, setConfig }: WhiteLabelColorsProps) => {
  const handleColorChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Scheme</CardTitle>
        <CardDescription>Customize your brand colors and theme</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {colorOptions.map((colorOption) => (
          <ColorPicker
            key={colorOption.key}
            colorOption={colorOption}
            value={config[colorOption.key as keyof WhiteLabelConfig] as string}
            onChange={(value) => handleColorChange(colorOption.key, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
};