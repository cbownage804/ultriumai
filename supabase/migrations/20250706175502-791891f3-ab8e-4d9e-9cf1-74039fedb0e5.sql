-- Step 7: Enable RLS and add policies for all new tables
ALTER TABLE public.safe_av_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_av_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_mdr_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_shield_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence_feeds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own AV scans" ON public.safe_av_scans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own AV definitions" ON public.safe_av_definitions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own MDR alerts" ON public.safe_mdr_alerts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own MDR investigations" ON public.safe_mdr_investigations FOR ALL USING (user_id = auth.uid());
CREATE POLICY "MSPs can manage their service agreements" ON public.msp_service_agreements FOR ALL USING (user_id = auth.uid());
CREATE POLICY "MSPs can manage their billing records" ON public.msp_billing_records FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view their monitoring data" ON public.safe_shield_monitoring FOR ALL USING (user_id = auth.uid());
CREATE POLICY "System can manage threat intelligence" ON public.threat_intelligence_feeds FOR ALL USING (true);

-- Add performance indexes
CREATE INDEX idx_safe_av_scans_user_id ON public.safe_av_scans(user_id);
CREATE INDEX idx_safe_av_scans_endpoint_id ON public.safe_av_scans(endpoint_id);
CREATE INDEX idx_safe_av_scans_status ON public.safe_av_scans(status);
CREATE INDEX idx_safe_mdr_alerts_user_id ON public.safe_mdr_alerts(user_id);
CREATE INDEX idx_safe_mdr_alerts_severity ON public.safe_mdr_alerts(severity);
CREATE INDEX idx_safe_mdr_alerts_status ON public.safe_mdr_alerts(status);
CREATE INDEX idx_msp_billing_client_id ON public.msp_billing_records(client_id);
CREATE INDEX idx_safe_shield_monitoring_endpoint_id ON public.safe_shield_monitoring(endpoint_id);
CREATE INDEX idx_safe_shield_monitoring_timestamp ON public.safe_shield_monitoring(timestamp);

-- Add triggers for updated_at columns
CREATE TRIGGER update_safe_av_scans_updated_at
  BEFORE UPDATE ON public.safe_av_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_av_definitions_updated_at
  BEFORE UPDATE ON public.safe_av_definitions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_mdr_alerts_updated_at
  BEFORE UPDATE ON public.safe_mdr_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_safe_mdr_investigations_updated_at
  BEFORE UPDATE ON public.safe_mdr_investigations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_msp_service_agreements_updated_at
  BEFORE UPDATE ON public.msp_service_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();

CREATE TRIGGER update_msp_billing_records_updated_at
  BEFORE UPDATE ON public.msp_billing_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ultrium_updated_at_column();