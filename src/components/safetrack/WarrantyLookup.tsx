/**
 * SafeTrack Warranty Lookup Component
 * AI-powered serial number warranty lookup with full details
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Phone,
  Globe,
  MessageCircle,
  Wrench,
  RefreshCw,
  Trash2,
  ChevronRight,
  Sparkles,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { useSafeTrackWarranties, WarrantyData } from '@/hooks/useSafeTrackWarranties';
import { format, formatDistanceToNow, isPast, isFuture, addDays } from 'date-fns';
import { GlowContainer } from '@/components/safesuite/SafeSuiteEffects';

function WarrantyStatusBadge({ status, endDate }: { status: string; endDate?: string | null }) {
  const isExpiringSoon = endDate && isFuture(new Date(endDate)) && 
    new Date(endDate) <= addDays(new Date(), 30);

  if (status === 'active' && isExpiringSoon) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        <Clock className="h-3 w-3 mr-1" />
        Expiring Soon
      </Badge>
    );
  }

  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 'expired':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Unknown
        </Badge>
      );
  }
}

function WarrantyCard({ 
  warranty, 
  onRefresh, 
  onDelete,
  onSelect 
}: { 
  warranty: WarrantyData;
  onRefresh: () => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card 
        className="bg-[#141414] border-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer group"
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-emerald-400" />
                <h4 className="font-semibold text-white truncate">
                  {warranty.device_name || warranty.model || 'Unknown Device'}
                </h4>
              </div>
              
              <div className="space-y-1 text-sm">
                <p className="text-gray-400">
                  <span className="text-gray-500">S/N:</span> {warranty.serial_number}
                </p>
                {warranty.manufacturer && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Manufacturer:</span> {warranty.manufacturer}
                  </p>
                )}
                {warranty.warranty_end_date && (
                  <p className="text-gray-400">
                    <span className="text-gray-500">Expires:</span>{' '}
                    {format(new Date(warranty.warranty_end_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <WarrantyStatusBadge 
                status={warranty.warranty_status} 
                endDate={warranty.warranty_end_date}
              />
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-emerald-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-gray-400 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WarrantyDetailModal({ 
  warranty, 
  open, 
  onClose 
}: { 
  warranty: WarrantyData | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!warranty) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a] border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            Warranty Details
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Serial Number: {warranty.serial_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Device</p>
              <p className="text-white font-medium">
                {warranty.device_name || warranty.model || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Manufacturer</p>
              <p className="text-white font-medium">
                {warranty.manufacturer || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <WarrantyStatusBadge 
                status={warranty.warranty_status}
                endDate={warranty.warranty_end_date}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Coverage Type</p>
              <p className="text-white font-medium">
                {warranty.coverage_type || 'Standard'}
              </p>
            </div>
            {warranty.warranty_end_date && (
              <>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Warranty End Date</p>
                  <p className="text-white font-medium">
                    {format(new Date(warranty.warranty_end_date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                  <p className={`font-medium ${
                    isPast(new Date(warranty.warranty_end_date)) 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {isPast(new Date(warranty.warranty_end_date))
                      ? 'Expired ' + formatDistanceToNow(new Date(warranty.warranty_end_date)) + ' ago'
                      : formatDistanceToNow(new Date(warranty.warranty_end_date)) + ' remaining'
                    }
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Repair Options */}
          {warranty.repair_options && warranty.repair_options.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Repair Options
              </p>
              <div className="flex flex-wrap gap-2">
                {warranty.repair_options.map((option, i) => (
                  <Badge key={i} variant="secondary" className="bg-[#1a1a1a] text-gray-300">
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Support Contacts */}
          {warranty.support_contacts && Object.keys(warranty.support_contacts).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Support Contacts</p>
              <div className="flex flex-wrap gap-3">
                {warranty.support_contacts.phone && (
                  <a 
                    href={`tel:${warranty.support_contacts.phone}`}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <Phone className="h-4 w-4" />
                    {warranty.support_contacts.phone}
                  </a>
                )}
                {warranty.support_contacts.website && (
                  <a 
                    href={warranty.support_contacts.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <Globe className="h-4 w-4" />
                    Support Website
                  </a>
                )}
                {warranty.support_contacts.chat && (
                  <a 
                    href={warranty.support_contacts.chat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Live Chat
                  </a>
                )}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {warranty.ai_analysis && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400 mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Analysis
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {warranty.ai_analysis}
              </p>
            </div>
          )}

          {/* Source */}
          {warranty.source_url && (
            <div className="text-xs text-gray-500">
              <a 
                href={warranty.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                View Source →
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function WarrantyLookup() {
  const { 
    warranties, 
    isLoading, 
    isLookingUp, 
    stats,
    lookupWarranty, 
    deleteWarranty,
    refreshWarranty 
  } = useSafeTrackWarranties();

  const [serialNumber, setSerialNumber] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyData | null>(null);
  const [lookupResult, setLookupResult] = useState<WarrantyData | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) return;

    setLookupError(null);
    setLookupResult(null);

    const result = await lookupWarranty(serialNumber, deviceName);
    
    if (result.success && result.data) {
      setLookupResult(result.data);
      setSerialNumber('');
      setDeviceName('');
    } else {
      setLookupError(result.error || 'Lookup failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Lookup Form */}
      <GlowContainer theme="safetrack" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Search className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Warranty Lookup</h3>
            <p className="text-sm text-gray-400">
              Enter a serial number to check warranty status using AI
            </p>
          </div>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Serial Number *
              </label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g., ABC1234567"
                className="bg-[#0a0a0a] border-gray-700 text-white"
                disabled={isLookingUp}
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Device Name (optional)
              </label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Dell Latitude 5540"
                className="bg-[#0a0a0a] border-gray-700 text-white"
                disabled={isLookingUp}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLookingUp || !serialNumber.trim()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            {isLookingUp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Looking up warranty...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Lookup Warranty
              </>
            )}
          </Button>
        </form>

        {/* Lookup Error */}
        <AnimatePresence>
          {lookupError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm text-red-400">{lookupError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lookup Result */}
        <AnimatePresence>
          {lookupResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <WarrantyCard
                warranty={lookupResult}
                onRefresh={() => refreshWarranty(lookupResult)}
                onDelete={() => {
                  if (lookupResult.id) deleteWarranty(lookupResult.id);
                  setLookupResult(null);
                }}
                onSelect={() => setSelectedWarranty(lookupResult)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </GlowContainer>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracked', value: stats.total, color: 'emerald' },
          { label: 'Active', value: stats.active, color: 'emerald' },
          { label: 'Expired', value: stats.expired, color: 'red' },
          { label: 'Expiring Soon', value: stats.expiringSoon, color: 'amber' }
        ].map((stat) => (
          <Card key={stat.label} className="bg-[#141414] border-gray-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Warranty History */}
      <Card className="bg-[#0d0d0d] border-emerald-500/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            Warranty History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Loading warranties...</p>
            </div>
          ) : !warranties || warranties.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No warranties tracked yet</p>
              <p className="text-sm text-gray-500">
                Use the lookup form above to check a device warranty
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-[#1a1a1a] mb-4">
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
                <TabsTrigger value="expiring">Expiring ({stats.expiringSoon})</TabsTrigger>
              </TabsList>

              {['all', 'active', 'expired', 'expiring'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-3">
                  <AnimatePresence>
                    {warranties
                      .filter((w) => {
                        if (tab === 'all') return true;
                        if (tab === 'active') return w.warranty_status === 'active';
                        if (tab === 'expired') return w.warranty_status === 'expired';
                        if (tab === 'expiring') {
                          if (w.warranty_status !== 'active' || !w.warranty_end_date) return false;
                          const endDate = new Date(w.warranty_end_date);
                          return endDate <= addDays(new Date(), 30) && isFuture(endDate);
                        }
                        return true;
                      })
                      .map((warranty) => (
                        <WarrantyCard
                          key={warranty.id}
                          warranty={warranty}
                          onRefresh={() => refreshWarranty(warranty)}
                          onDelete={() => deleteWarranty(warranty.id)}
                          onSelect={() => setSelectedWarranty(warranty)}
                        />
                      ))
                    }
                  </AnimatePresence>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <WarrantyDetailModal
        warranty={selectedWarranty}
        open={!!selectedWarranty}
        onClose={() => setSelectedWarranty(null)}
      />
    </div>
  );
}
