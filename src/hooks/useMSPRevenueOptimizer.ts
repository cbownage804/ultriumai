import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RevenueOptimization {
  client_id: string;
  company_name: string;
  current_rate: number;
  suggested_rate: number;
  potential_increase: number;
  confidence_score: number;
  reasoning: string[];
  risk_level: 'low' | 'medium' | 'high';
  market_data: {
    avg_market_rate: number;
    competitor_rates: number[];
    demand_indicator: number;
  };
}

export const useMSPRevenueOptimizer = () => {
  const { user } = useAuth();
  const [optimizations, setOptimizations] = useState<RevenueOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPotential, setTotalPotential] = useState(0);

  const generateOptimizations = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Get MSP ID for current user
      const { data: msps } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!msps || msps.length === 0) {
        setOptimizations([]);
        setTotalPotential(0);
        return;
      }

      const mspId = msps[0].id;

      // Fetch clients with their real data
      const { data: clients } = await supabase
        .from('msp_clients')
        .select('id, company_name, monthly_rate, is_active, created_at, business_size')
        .eq('msp_id', mspId)
        .eq('is_active', true);

      if (!clients || clients.length === 0) {
        setOptimizations([]);
        setTotalPotential(0);
        return;
      }

      // Calculate market average from actual client rates
      const rates = clients.map(c => c.monthly_rate || 0).filter(r => r > 0);
      const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 2500;

      // Generate optimizations based on real client data
      const generatedOptimizations: RevenueOptimization[] = clients
        .filter(client => client.monthly_rate && client.monthly_rate > 0)
        .map(client => {
          const currentRate = client.monthly_rate || 2500;
          
          // Calculate tenure (longer tenure = lower risk for price increase)
          const createdAt = new Date(client.created_at);
          const tenureMonths = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
          
          // Business size affects pricing potential
          const sizeMultiplier = 
            client.business_size === 'enterprise' ? 1.3 :
            client.business_size === 'medium' ? 1.2 : 1.1;

          // Calculate suggested rate based on market position
          const marketPosition = currentRate / avgRate;
          let suggestedRate = currentRate;
          let reasoning: string[] = [];
          
          if (marketPosition < 0.9) {
            // Below market rate - significant opportunity
            suggestedRate = Math.round(avgRate * 0.95);
            reasoning = [
              'Currently priced below market average',
              'Opportunity to align with industry standards',
              tenureMonths > 12 ? 'Long-standing relationship reduces churn risk' : 'Building relationship value'
            ];
          } else if (marketPosition < 1.0) {
            // Slightly below market
            suggestedRate = Math.round(currentRate * sizeMultiplier);
            reasoning = [
              'Slight gap to market rates detected',
              `${client.business_size || 'Small'} business tier pricing adjustment`,
              'Value delivered justifies rate alignment'
            ];
          } else {
            // At or above market - smaller opportunity
            suggestedRate = Math.round(currentRate * 1.05);
            reasoning = [
              'Annual rate adjustment recommended',
              'Inflation and cost increases warrant review',
              'Premium service value can support increase'
            ];
          }

          const increase = suggestedRate - currentRate;
          
          // Skip if no meaningful increase
          if (increase <= 0) return null;

          // Calculate risk level based on tenure and increase percentage
          const increasePercent = (increase / currentRate) * 100;
          const riskLevel: 'low' | 'medium' | 'high' = 
            tenureMonths > 24 && increasePercent < 15 ? 'low' :
            tenureMonths > 12 || increasePercent < 20 ? 'medium' : 'high';

          // Confidence based on data quality
          const confidenceScore = Math.min(95, 70 + tenureMonths + (rates.length * 2));

          return {
            client_id: client.id,
            company_name: client.company_name,
            current_rate: currentRate,
            suggested_rate: suggestedRate,
            potential_increase: increase,
            confidence_score: Math.round(confidenceScore),
            reasoning,
            risk_level: riskLevel,
            market_data: {
              avg_market_rate: Math.round(avgRate),
              competitor_rates: [
                Math.round(avgRate * 0.9),
                Math.round(avgRate * 1.1),
                Math.round(avgRate * 1.05)
              ],
              demand_indicator: Math.min(95, 75 + tenureMonths)
            }
          };
        })
        .filter((opt): opt is RevenueOptimization => opt !== null);

      setOptimizations(generatedOptimizations);
      setTotalPotential(generatedOptimizations.reduce((sum, opt) => sum + opt.potential_increase, 0));

    } catch (error) {
      console.error('Error generating revenue optimizations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const applyPriceIncrease = async (optimization: RevenueOptimization) => {
    const { error } = await supabase
      .from('msp_clients')
      .update({ monthly_rate: optimization.suggested_rate })
      .eq('id', optimization.client_id);

    if (error) throw error;

    // Remove from list
    setOptimizations(prev => prev.filter(opt => opt.client_id !== optimization.client_id));
    setTotalPotential(prev => prev - optimization.potential_increase);
  };

  useEffect(() => {
    generateOptimizations();
  }, [generateOptimizations]);

  return {
    optimizations,
    loading,
    totalPotential,
    refresh: generateOptimizations,
    applyPriceIncrease
  };
};
