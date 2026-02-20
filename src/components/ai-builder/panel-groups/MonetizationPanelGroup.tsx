// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useInvoiceGenerator } from '@/hooks/useInvoiceGenerator';
import { useUsageMetering } from '@/hooks/useUsageMetering';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { useRevenueDashboard } from '@/hooks/useRevenueDashboard';
import { SubscriptionManagerPanel, InvoiceGeneratorPanel, UsageMeteringPanel, AffiliateTrackingPanel, RevenueDashboardPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showSubscriptions: boolean; setShowSubscriptions: (v: boolean) => void;
  showInvoices: boolean; setShowInvoices: (v: boolean) => void;
  showUsageMetering: boolean; setShowUsageMetering: (v: boolean) => void;
  showAffiliates: boolean; setShowAffiliates: (v: boolean) => void;
  showRevenue: boolean; setShowRevenue: (v: boolean) => void;
}

export function MonetizationPanelGroup(props: Props) {
  const subscriptionMgr = useSubscriptionManager();
  const invoiceGen = useInvoiceGenerator();
  const usageMetering = useUsageMetering();
  const affiliateTracking = useAffiliateTracking();
  const revenueDashboard = useRevenueDashboard();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showSubscriptions} name="Subscription Manager">
        <SubscriptionManagerPanel open={props.showSubscriptions} onClose={() => props.setShowSubscriptions(false)} plans={subscriptionMgr.plans} onAdd={subscriptionMgr.addPlan} onRemove={subscriptionMgr.removePlan} onGenerateCode={subscriptionMgr.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showInvoices} name="Invoice Generator">
        <InvoiceGeneratorPanel open={props.showInvoices} onClose={() => props.setShowInvoices(false)} invoices={invoiceGen.invoices} onGenerate={invoiceGen.generateInvoice} onExport={invoiceGen.exportPDF} />
      </SafePanel>
      <SafePanel show={props.showUsageMetering} name="Usage Metering">
        <UsageMeteringPanel open={props.showUsageMetering} onClose={() => props.setShowUsageMetering(false)} meters={usageMetering.meters} onAdd={usageMetering.addMeter} onRemove={usageMetering.removeMeter} onGenerateCode={usageMetering.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAffiliates} name="Affiliate Tracking">
        <AffiliateTrackingPanel open={props.showAffiliates} onClose={() => props.setShowAffiliates(false)} config={affiliateTracking.config} onUpdateConfig={affiliateTracking.updateConfig} onGenerateCode={affiliateTracking.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showRevenue} name="Revenue Dashboard">
        <RevenueDashboardPanel open={props.showRevenue} onClose={() => props.setShowRevenue(false)} metrics={revenueDashboard.metrics} onRefresh={revenueDashboard.refresh} />
      </SafePanel>
    </>
  );
}
