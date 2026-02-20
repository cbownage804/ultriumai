// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useRegexPlayground } from '@/hooks/useRegexPlayground';
import { useJsonYamlConverter } from '@/hooks/useJsonYamlConverter';
import { useColorContrastChecker } from '@/hooks/useColorContrastChecker';
import { useTailwindClassSorter } from '@/hooks/useTailwindClassSorter';
import { useMarkdownPreview } from '@/hooks/useMarkdownPreview';
import { RegexPlaygroundPanel, JsonYamlConverterPanel, ColorContrastPanel, TailwindSorterPanel, MarkdownPreviewPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showRegexPlayground: boolean; setShowRegexPlayground: (v: boolean) => void;
  showJsonYamlConverter: boolean; setShowJsonYamlConverter: (v: boolean) => void;
  showColorContrast: boolean; setShowColorContrast: (v: boolean) => void;
  showTailwindSorter: boolean; setShowTailwindSorter: (v: boolean) => void;
  showMarkdownPreview: boolean; setShowMarkdownPreview: (v: boolean) => void;
}

export function DevToolsPanelGroup(props: Props) {
  const regexPlayground = useRegexPlayground();
  const jsonYamlConverter = useJsonYamlConverter();
  const colorContrast = useColorContrastChecker();
  const tailwindSorter = useTailwindClassSorter();
  const markdownPreview = useMarkdownPreview();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showRegexPlayground} name="Regex Playground">
        <RegexPlaygroundPanel open={props.showRegexPlayground} onClose={() => props.setShowRegexPlayground(false)} pattern={regexPlayground.pattern} flags={regexPlayground.flags} testString={regexPlayground.testString} matches={regexPlayground.matches} onPatternChange={regexPlayground.setPattern} onFlagsChange={regexPlayground.setFlags} onTestStringChange={regexPlayground.setTestString} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showJsonYamlConverter} name="JSON/YAML Converter">
        <JsonYamlConverterPanel open={props.showJsonYamlConverter} onClose={() => props.setShowJsonYamlConverter(false)} input={jsonYamlConverter.input} output={jsonYamlConverter.output} format={jsonYamlConverter.format} onInputChange={jsonYamlConverter.setInput} onConvert={jsonYamlConverter.convert} onSwapFormat={jsonYamlConverter.swapFormat} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showColorContrast} name="Color Contrast">
        <ColorContrastPanel open={props.showColorContrast} onClose={() => props.setShowColorContrast(false)} foreground={colorContrast.foreground} background={colorContrast.background} ratio={colorContrast.ratio} passesAA={colorContrast.passesAA} passesAAA={colorContrast.passesAAA} onForegroundChange={colorContrast.setForeground} onBackgroundChange={colorContrast.setBackground} />
      </SafePanel>
      <SafePanel show={props.showTailwindSorter} name="Tailwind Sorter">
        <TailwindSorterPanel open={props.showTailwindSorter} onClose={() => props.setShowTailwindSorter(false)} input={tailwindSorter.input} sorted={tailwindSorter.sorted} onInputChange={tailwindSorter.setInput} onSort={tailwindSorter.sort} onApplyToProject={() => { const files = tailwindSorter.applyToProject(props.project.files); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showMarkdownPreview} name="Markdown Preview">
        <MarkdownPreviewPanel open={props.showMarkdownPreview} onClose={() => props.setShowMarkdownPreview(false)} content={props.activeFile?.content || ''} filePath={props.activeFile?.path || ''} />
      </SafePanel>
    </>
  );
}
