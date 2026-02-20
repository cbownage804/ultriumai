// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { usePageBuilder } from '@/hooks/usePageBuilder';
import { useThemeStudio } from '@/hooks/useThemeStudio';
import { useFormBuilder } from '@/hooks/useFormBuilder';
import { useChartDashboardBuilder } from '@/hooks/useChartDashboardBuilder';
import { useLayoutGridEditor } from '@/hooks/useLayoutGridEditor';
import { PageBuilderPanel, ThemeStudioPanel, FormBuilderPanel, ChartDashboardPanel, LayoutGridPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showPageBuilder: boolean; setShowPageBuilder: (v: boolean) => void;
  showThemeStudio: boolean; setShowThemeStudio: (v: boolean) => void;
  showFormBuilder: boolean; setShowFormBuilder: (v: boolean) => void;
  showChartDashboard: boolean; setShowChartDashboard: (v: boolean) => void;
  showLayoutGrid: boolean; setShowLayoutGrid: (v: boolean) => void;
}

export function UIBuildingPanelGroup(props: Props) {
  const pageBuilder = usePageBuilder();
  const themeStudio = useThemeStudio();
  const formBuilder = useFormBuilder();
  const chartDashboard = useChartDashboardBuilder();
  const layoutGrid = useLayoutGridEditor();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showPageBuilder} name="Page Builder">
        <PageBuilderPanel open={props.showPageBuilder} onClose={() => props.setShowPageBuilder(false)} pages={pageBuilder.pages} onAdd={pageBuilder.addPage} onRemove={pageBuilder.removePage} onGenerateCode={(id: string) => { const files = pageBuilder.generateCode(id); files.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showThemeStudio} name="Theme Studio">
        <ThemeStudioPanel open={props.showThemeStudio} onClose={() => props.setShowThemeStudio(false)} theme={themeStudio.theme} presets={themeStudio.presets} onUpdateTheme={themeStudio.updateTheme} onApplyPreset={themeStudio.applyPreset} onExportCSS={() => { const css = themeStudio.exportCSS(); if (css) props.upsertFile('theme.css', css); }} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showFormBuilder} name="Form Builder">
        <FormBuilderPanel open={props.showFormBuilder} onClose={() => props.setShowFormBuilder(false)} fields={formBuilder.fields} onAdd={formBuilder.addField} onRemove={formBuilder.removeField} onReorder={formBuilder.reorderFields} onGenerateCode={formBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showChartDashboard} name="Chart Dashboard">
        <ChartDashboardPanel open={props.showChartDashboard} onClose={() => props.setShowChartDashboard(false)} charts={chartDashboard.charts} onAdd={chartDashboard.addChart} onRemove={chartDashboard.removeChart} onGenerateCode={chartDashboard.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showLayoutGrid} name="Layout Grid">
        <LayoutGridPanel open={props.showLayoutGrid} onClose={() => props.setShowLayoutGrid(false)} layout={layoutGrid.layout} onUpdateLayout={layoutGrid.updateLayout} onGenerateCode={layoutGrid.generateCode} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}
