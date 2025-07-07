import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Terminal } from "lucide-react";

interface RemoteTerminalProps {
  commandOutput: string[];
  onExecuteCommand: (command: string) => void;
}

export const RemoteTerminal = ({ commandOutput, onExecuteCommand }: RemoteTerminalProps) => {
  const [commandInput, setCommandInput] = useState('');

  const handleExecute = () => {
    if (!commandInput.trim()) return;
    onExecuteCommand(commandInput);
    setCommandInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecute();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
        {commandOutput.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter PowerShell command..."
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="font-mono"
        />
        <Button onClick={handleExecute}>
          <Terminal className="h-4 w-4 mr-2" />
          Execute
        </Button>
      </div>
    </div>
  );
};