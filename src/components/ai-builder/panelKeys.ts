/**
 * Panel Keys — All panel visibility state keys for usePanelManager.
 * Extracted from AIAppBuilderWorkspace to consolidate ~160 useState(false) into one reducer.
 */

export const PANEL_KEYS = [
  'showVersionHistory', 'showConsole', 'showEnvVars', 'showRLSTester', 'showAssets',
  'showPackages', 'showDatabase', 'showAuth', 'showKnowledge', 'showStorage',
  'showEdgeFunctions', 'showActivity', 'showBilling', 'showShareDialog', 'showSEOEditor',
  'showSettingsPanel', 'showExportGuide', 'showCodeIntel', 'showDbExplorer', 'showComponentLib',
  'showTestingSuite', 'showDiffReview', 'showDomainPanel', 'showTerminal', 'showBuildLog',
  'showTimeline', 'showDiffViewer', 'showDeployPipeline', 'showComponentPalette', 'showHelpCenter',
  'showGPTConnector', 'showPerformanceProfiler', 'showBuildAnalytics', 'showDesignSystem',
  'showChangelog', 'showSetupWizard', 'showSchemaDesigner', 'showOneClickDeploy', 'showEditHistory',
  'showBugReport', 'showEnhancedPalette', 'showMultiSearch', 'showTestRunner', 'showExtensions',
  'showCollaboration', 'showAPIBuilder', 'showSupabaseIDE', 'showGitHubPanel', 'showMigrationPanel',
  'showEdgeFnEditor', 'showBuildWorkflow', 'showDevTools', 'showNPMManager', 'showPublishPanel',
  'showImageGen', 'showSymbolSearch', 'showSecretsManager', 'showModelSwitcher', 'showPromptChains',
  'showCodeReview', 'showTestGenerator', 'showNLQuery', 'showSnippetLibrary', 'showSplitDiff',
  'showComments', 'showTeamActivity', 'showApprovals', 'showForking', 'showFigmaImport',
  'showColorExtractor', 'showIconPicker', 'showBreakpointEditor', 'showAnimationBuilder',
  'showVisualSchema', 'showSeedData', 'showAPITester', 'showWebhookBuilder', 'showCronScheduler',
  'showEnvManager', 'showRollback', 'showUptimeMonitor', 'showBuildCache', 'showBuildScripts',
  'showCMSMode', 'showBlogEngine', 'showImageOptimizer', 'showVideoEmbed', 'showI18n',
  'showAnalyticsDashboard', 'showErrorTracking', 'showSessionReplay', 'showABTesting', 'showAIUsage',
  'showDepScanner', 'showCSPGenerator', 'showGDPR', 'showRateLimiter', 'showSecretRotation',
  'showCLICompanion', 'showGHActions', 'showSlackDiscord', 'showWhiteLabel', 'showPluginSDK',
  'showRefactoring', 'showNLRegex', 'showCommitMsg', 'showAutoImport', 'showDocWriter',
  'showCoEditing', 'showVoiceChat', 'showScreenShare', 'showCodeReactions', 'showWhiteboard',
  'showVisualRegression', 'showA11yScore', 'showCoverage', 'showMutationTest', 'showLoadTest',
  'showPageBuilder', 'showThemeStudio', 'showFormBuilder', 'showChartDashboard', 'showLayoutGrid',
  'showGraphQL', 'showWSManager', 'showFileUpload', 'showPayments', 'showEmailTemplates',
  'showTutorialCreator', 'showCodePlayground', 'showCustomLinting', 'showDepGraph', 'showGitBlame',
  'showMultiRegion', 'showFeatureFlags', 'showCanaryDeploy', 'showSSG', 'showDockerExport',
  'showSubscriptions', 'showInvoices', 'showUsageMetering', 'showAffiliates', 'showRevenue',
  'showCapacitor', 'showPushNotifications', 'showOfflineFirst', 'showGestureBuilder', 'showAppStoreAssets',
  'showCodeTranslator', 'showSmartScaffold', 'showWorkflowAutomation', 'showPerfOptimizer', 'showSecurityAuditor',
  'showStateMachine', 'showDataValidation', 'showCacheStrategy', 'showReactiveStore', 'showDataMigration',
  'showRegexPlayground', 'showJsonYamlConverter', 'showColorContrast', 'showTailwindSorter', 'showMarkdownPreview',
  'showToastDesigner', 'showNotifCenter', 'showChatWidget', 'showEmailSequence', 'showSMSTemplate',
  'showStepperWizard', 'showCommandMenuBuilder', 'showBreadcrumbGen', 'showMegaMenu', 'showContextMenu',
  'showDockerCompose', 'showK8s', 'showCICDPipeline', 'showStructuredLogger', 'showHealthCheck',
  'showOAuthSetup', 'showMFAFlow', 'showSessionMgr', 'showAPIKeyMgmt', 'showPermMatrix',
  'showRichTextConfig', 'showFilePreviewGen', 'showAvatarGen', 'showCarouselBuilder', 'showGalleryLightbox',
  'showFTS', 'showFacetedFilter', 'showAutocomplete', 'showTagSystem', 'showSEOMeta',
  'showKPIDashboard', 'showAlertingRules', 'showAuditTrail', 'showClickHeatmap', 'showBudgetMonitor',
  'showChangelogAuto', 'showREADMEGen', 'showLicensePicker', 'showOpenAPISpec', 'showProjectHealth',
  // Non-panel-group panels managed inline
  'showPromptHistory', 'showFileSearch', 'showFileTree', 'showTemplates', 'showShortcuts',
  'showQuickSwitcher', 'showCloudView', 'showDesignView',
] as const;

export type PanelKey = typeof PANEL_KEYS[number];

/** Panel group used for exclusive open (only one of these can be open at a time) */
export const EXCLUSIVE_PANEL_GROUP = [
  'showVersionHistory', 'showEnvVars', 'showAssets', 'showPackages', 'showDatabase',
  'showAuth', 'showKnowledge', 'showStorage', 'showEdgeFunctions', 'showActivity',
  'showCodeIntel', 'showComponentLib', 'showTestingSuite', 'showExportGuide', 'showHelpCenter',
  'showGPTConnector', 'showSetupWizard', 'showSchemaDesigner', 'showOneClickDeploy', 'showDesignSystem',
];
