import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Lock, 
  Key, 
  Server, 
  Eye,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Zap,
  Database
} from 'lucide-react';

interface SecurityFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  technical: string;
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Zero-Knowledge Architecture',
    description: 'Your master password never leaves your device. We cannot access, reset, or recover your vault — only you hold the key.',
    technical: 'Client-side encryption with end-to-end security'
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: 'Military-Grade Encryption',
    description: 'All vault data is encrypted using the same standard trusted by governments and financial institutions worldwide.',
    technical: 'AES-256-GCM authenticated encryption'
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Brute-Force Resistant',
    description: 'Advanced key derivation makes password guessing computationally infeasible, even with specialized hardware.',
    technical: '600,000 iteration key stretching (OWASP 2023)'
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: 'Tamper-Proof Storage',
    description: 'Cryptographic binding prevents attackers from moving or swapping encrypted data between accounts.',
    technical: 'Associated Authenticated Data (AAD) binding'
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Automatic Lockout Protection',
    description: 'Multiple failed attempts trigger progressive security measures including verification challenges and temporary lockouts.',
    technical: 'Server-side rate limiting with exponential backoff'
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: 'Hardware Key Support',
    description: 'Use physical security keys like YubiKey for the strongest possible authentication.',
    technical: 'WebAuthn/FIDO2 protocol support'
  }
];

interface SecurityArchitectureBadgeProps {
  className?: string;
  variant?: 'badge' | 'inline';
}

export function SecurityArchitectureBadge({ className = '', variant = 'badge' }: SecurityArchitectureBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <div className={`rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-primary/20 border border-primary/30">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Enterprise-Grade Security</h3>
            <p className="text-sm text-gray-400">Your data is protected by industry-leading standards</p>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-black/30 border border-white/5"
            >
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary shrink-0">
                {feature.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors ${className}`}>
          <Shield className="h-3.5 w-3.5" />
          <span>Zero-Knowledge Encrypted</span>
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg bg-background border-primary/30 max-h-[85vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <DialogHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/20 border border-primary/30">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-white text-lg">Security Architecture</DialogTitle>
              <p className="text-sm text-gray-400 mt-0.5">How we protect your data</p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative space-y-4 py-4">
          {/* Zero-knowledge highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-primary">We Can't See Your Data</h4>
                <p className="text-xs text-gray-400 mt-1">
                  All encryption and decryption happens on your device. Your master password is never transmitted or stored on our servers. 
                  Even if our servers were compromised, attackers would only find encrypted blobs that are mathematically impossible to decrypt.
                </p>
              </div>
            </div>
          </div>
          
          {/* Security features list */}
          <div className="space-y-3">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0">
                  {feature.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-white">{feature.title}</h4>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-mono bg-black/40 text-primary/80 border border-primary/20">
                    {feature.technical}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust statement */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Server className="h-4 w-4" />
              <span>Enterprise-grade security architecture with zero-knowledge encryption and hardware-backed key management.</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
