// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useAIRefactoring } from '@/hooks/useAIRefactoring';
import { useNLToRegex } from '@/hooks/useNLToRegex';
import { useAICommitMessages } from '@/hooks/useAICommitMessages';
import { useSmartAutoImport } from '@/hooks/useSmartAutoImport';
import { useAIDocWriter } from '@/hooks/useAIDocWriter';
import { useCLICompanion } from '@/hooks/useCLICompanion';
import { useGitHubActionsGenerator } from '@/hooks/useGitHubActionsGenerator';
import { useSlackDiscordBot } from '@/hooks/useSlackDiscordBot';
import { useWhiteLabelExport } from '@/hooks/useWhiteLabelExport';
import { usePluginSDK } from '@/hooks/usePluginSDK';
import {
  AIRefactoringPanel, NLRegexPanel, CommitMessagePanel, AutoImportPanel,
  AIDocWriterPanel, CLICompanionPanel, GitHubActionsPanel, SlackDiscordPanel,
  WhiteLabelPanel, PluginSDKPanel,
} from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showRefactoring: boolean; setShowRefactoring: (v: boolean) => void;
  showNLRegex: boolean; setShowNLRegex: (v: boolean) => void;
  showCommitMsg: boolean; setShowCommitMsg: (v: boolean) => void;
  showAutoImport: boolean; setShowAutoImport: (v: boolean) => void;
  showDocWriter: boolean; setShowDocWriter: (v: boolean) => void;
  showCLICompanion: boolean; setShowCLICompanion: (v: boolean) => void;
  showGHActions: boolean; setShowGHActions: (v: boolean) => void;
  showSlackDiscord: boolean; setShowSlackDiscord: (v: boolean) => void;
  showWhiteLabel: boolean; setShowWhiteLabel: (v: boolean) => void;
  showPluginSDK: boolean; setShowPluginSDK: (v: boolean) => void;
}

export function IntegrationPanelGroup(props: Props) {
  const aiRefactoring = useAIRefactoring();
  const nlToRegex = useNLToRegex();
  const aiCommitMessages = useAICommitMessages();
  const smartAutoImport = useSmartAutoImport();
  const aiDocWriter = useAIDocWriter();
  const cliCompanion = useCLICompanion();
  const githubActionsGen = useGitHubActionsGenerator();
  const slackDiscordBot = useSlackDiscordBot();
  const whiteLabelExport = useWhiteLabelExport();
  const pluginSDK = usePluginSDK();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showRefactoring} name="AI Refactoring">
        <AIRefactoringPanel open={props.showRefactoring} onClose={() => props.setShowRefactoring(false)} suggestions={aiRefactoring.suggestions} isAnalyzing={aiRefactoring.isAnalyzing} onAnalyze={() => aiRefactoring.analyze(props.project.files)} onApply={(id: string) => { const result = aiRefactoring.apply(id, props.project.files); if (result) result.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showNLRegex} name="NL to Regex">
        <NLRegexPanel open={props.showNLRegex} onClose={() => props.setShowNLRegex(false)} input={nlToRegex.input} regex={nlToRegex.regex} onInputChange={nlToRegex.setInput} onConvert={nlToRegex.convert} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCommitMsg} name="Commit Messages">
        <CommitMessagePanel open={props.showCommitMsg} onClose={() => props.setShowCommitMsg(false)} message={aiCommitMessages.message} onGenerate={() => aiCommitMessages.generate(props.project.files)} />
      </SafePanel>
      <SafePanel show={props.showAutoImport} name="Auto Import">
        <AutoImportPanel open={props.showAutoImport} onClose={() => props.setShowAutoImport(false)} suggestions={smartAutoImport.suggestions} onAnalyze={() => smartAutoImport.analyze(props.project.files)} onApply={(id: string) => { const result = smartAutoImport.apply(id, props.project.files); if (result) result.forEach((f: any) => props.upsertFile(f.path, f.content)); }} />
      </SafePanel>
      <SafePanel show={props.showDocWriter} name="AI Doc Writer">
        <AIDocWriterPanel open={props.showDocWriter} onClose={() => props.setShowDocWriter(false)} docs={aiDocWriter.docs} onGenerate={() => aiDocWriter.generate(props.project.files)} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCLICompanion} name="CLI Companion">
        <CLICompanionPanel open={props.showCLICompanion} onClose={() => props.setShowCLICompanion(false)} commands={cliCompanion.commands} output={cliCompanion.output} onRun={cliCompanion.runCommand} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showGHActions} name="GitHub Actions">
        <GitHubActionsPanel open={props.showGHActions} onClose={() => props.setShowGHActions(false)} workflows={githubActionsGen.workflows} onAdd={githubActionsGen.addWorkflow} onRemove={githubActionsGen.removeWorkflow} onGenerate={(id: string) => { const code = githubActionsGen.generateCode(id); if (code) props.upsertFile(`.github/workflows/${id}.yml`, code); }} />
      </SafePanel>
      <SafePanel show={props.showSlackDiscord} name="Slack/Discord">
        <SlackDiscordPanel open={props.showSlackDiscord} onClose={() => props.setShowSlackDiscord(false)} bots={slackDiscordBot.bots} onAdd={slackDiscordBot.addBot} onRemove={slackDiscordBot.removeBot} onGenerateCode={(id: string) => { const code = slackDiscordBot.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
      <SafePanel show={props.showWhiteLabel} name="White Label">
        <WhiteLabelPanel open={props.showWhiteLabel} onClose={() => props.setShowWhiteLabel(false)} config={whiteLabelExport.config} onUpdateConfig={whiteLabelExport.updateConfig} onExport={() => whiteLabelExport.exportProject(props.project.files)} />
      </SafePanel>
      <SafePanel show={props.showPluginSDK} name="Plugin SDK">
        <PluginSDKPanel open={props.showPluginSDK} onClose={() => props.setShowPluginSDK(false)} plugins={pluginSDK.plugins} onAdd={pluginSDK.addPlugin} onRemove={pluginSDK.removePlugin} onGenerateCode={(id: string) => { const code = pluginSDK.generateCode(id); if (code) insertCode(code); }} />
      </SafePanel>
    </>
  );
}
