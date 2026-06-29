/**
 * SafePass Security Architecture - Public Customer-Facing Page
 * Explains zero-knowledge encryption and security measures in detail
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Lock, 
  Key, 
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Zap,
  Database,
  Eye,
  EyeOff,
  Server,
  FileCheck,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import safepassLogo from '@/assets/safepass-logo.png';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';

const securityPillars = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Architecture',
    subtitle: 'We can never see your data',
    description: 'Your master password never leaves your device. All encryption and decryption happens locally in your browser. We cannot access, reset, or recover your vault — only you hold the key.',
    technical: [
      'Master password is never transmitted to our servers',
      'Encryption keys are derived client-side only',
      'Even under legal compulsion, we cannot provide your data',
      'Password recovery is impossible by design'
    ],
    color: 'amber'
  },
  {
    icon: Key,
    title: 'Military-Grade Encryption',
    subtitle: 'AES-256-GCM Standard',
    description: 'All vault data is encrypted using AES-256-GCM, the same authenticated encryption standard trusted by governments, military, and financial institutions worldwide for classified information.',
    technical: [
      '256-bit encryption keys (2^256 possible combinations)',
      'Galois/Counter Mode provides authentication',
      'Prevents tampering and unauthorized modifications',
      'NIST-approved cryptographic standard'
    ],
    color: 'amber'
  },
  {
    icon: Zap,
    title: 'Brute-Force Resistant',
    subtitle: '600,000 PBKDF2 Iterations',
    description: 'We use PBKDF2 with 600,000 iterations (OWASP 2023 recommendation) to derive your encryption key. This makes password guessing computationally infeasible, even with specialized hardware.',
    technical: [
      '600,000 iterations per key derivation',
      'Each guess requires ~0.3 seconds on modern hardware',
      'Makes GPU/ASIC attacks economically unviable',
      'Exceeds OWASP 2023 security guidelines'
    ],
    color: 'amber'
  },
  {
    icon: Database,
    title: 'Tamper-Proof Storage',
    subtitle: 'AAD Cryptographic Binding',
    description: 'Associated Authenticated Data (AAD) cryptographically binds each encrypted entry to your account and its location. Attackers cannot move, swap, or replay encrypted data between accounts.',
    technical: [
      'Ciphertext bound to userId, entryId, and vaultId',
      'Prevents database-level swap attacks',
      'Integrity verification on every decryption',
      'Detects any unauthorized modifications'
    ],
    color: 'amber'
  },
  {
    icon: ShieldCheck,
    title: 'Automatic Lockout Protection',
    subtitle: 'Server-Side Rate Limiting',
    description: 'Multiple failed login attempts trigger progressive security measures. After 3 failed attempts, CAPTCHA verification is required. After 5 failed attempts, a 15-minute lockout is enforced.',
    technical: [
      'Real-time failed attempt tracking',
      'CAPTCHA challenge after 3 failures',
      '15-minute lockout after 5 failures',
      'Protects against automated attacks'
    ],
    color: 'amber'
  },
  {
    icon: Fingerprint,
    title: 'Hardware Key Support',
    subtitle: 'WebAuthn/FIDO2 Ready',
    description: 'Use physical security keys like YubiKey or TouchID for the strongest possible authentication. Hardware keys provide phishing-resistant two-factor authentication.',
    technical: [
      'FIDO2/WebAuthn protocol support',
      'Compatible with YubiKey, TouchID, Windows Hello',
      'Phishing-resistant authentication',
      'No shared secrets to steal'
    ],
    color: 'amber'
  }
];

const comparisonPoints = [
  { feature: 'Zero-Knowledge Encryption', safepass: true, others: 'Some' },
  { feature: 'AES-256-GCM', safepass: true, others: true },
  { feature: '600K PBKDF2 Iterations', safepass: true, others: '100K-310K' },
  { feature: 'AAD Tamper Protection', safepass: true, others: 'Rare' },
  { feature: 'Server-Side Rate Limiting', safepass: true, others: 'Varies' },
  { feature: 'Open Security Documentation', safepass: true, others: 'Rarely' },
];

const browserComparison = [
  { feature: 'Encryption', safepass: 'AES-256-GCM', browser: 'AES (varies)' },
  { feature: 'Key Derivation', safepass: '600,000 PBKDF2 iterations', browser: '~10,000–100,000' },
  { feature: 'Zero-Knowledge', safepass: 'Yes', browser: 'No / Partial' },
  { feature: 'Tamper Protection (AAD)', safepass: 'Yes', browser: 'Rare' },
  { feature: 'Client-Side Encryption', safepass: 'Always', browser: 'Often mixed' },
  { feature: 'Vault Recovery Backdoor', safepass: 'None', browser: 'Common' },
];

const breachProtections = [
  'Database breaches',
  'Insider threats',
  'Legal or administrative data access',
  'Credential stuffing',
  'Phishing (via WebAuthn / FIDO2 support)',
  'Vault tampering or replay attacks',
];

const faqs = [
  {
    question: 'Can SafePass employees see my passwords?',
    answer: 'No. Your vault is encrypted with a key derived from your master password, which never leaves your device. We only store encrypted blobs that are mathematically impossible to decrypt without your master password.'
  },
  {
    question: 'What happens if SafePass gets hacked?',
    answer: 'Attackers would only obtain encrypted data that is useless without your master password. With 600,000 PBKDF2 iterations and AES-256-GCM encryption, brute-forcing a single vault would take longer than the age of the universe.'
  },
  {
    question: 'Can you reset my master password if I forget it?',
    answer: 'No. This is by design. If we could reset your password, it would mean we have access to your encryption keys — which would defeat the purpose of zero-knowledge architecture. We recommend setting up emergency access contacts.'
  },
  {
    question: 'How is SafePass different from browser password managers?',
    answer: 'Browser password managers often sync passwords to cloud servers in ways that may be accessible to the provider. SafePass encrypts everything locally before any data leaves your device, and uses stronger key derivation (600K iterations vs. Chrome\'s ~10K).'
  },
  {
    question: 'Is SafePass audited by third parties?',
    answer: 'Our security architecture is based on industry-standard, peer-reviewed cryptographic primitives (AES-256-GCM, PBKDF2). We follow OWASP guidelines and are working toward SOC 2 Type II certification.'
  }
];

export default function SafePassSecurityPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-amber-500/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/safesuite/products/safepass" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <img src={safepassLogo} alt="SafePass" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-lg font-semibold text-amber-400">SafePass Security</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/products/safepass">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to SafePass
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 bg-amber-500/10 text-amber-400 border-amber-500/30">
            Enterprise-Grade Security
          </Badge>
          
          <div className="flex justify-center mb-8">
            <div className="bg-black p-6 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.2)] border border-amber-500/20">
              <Shield className="h-16 w-16 text-amber-400" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How SafePass Protects Your Data
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            A transparent, in-depth look at our zero-knowledge security architecture. 
            Your passwords are protected by the same standards trusted by governments and Fortune 500 companies.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>600K PBKDF2</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Zero-Knowledge</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>OWASP 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <section className="py-8 px-4 border-y border-amber-500/10 bg-[#0d0d0d]">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-amber-400" />
              <span className="text-gray-300">We cannot see your passwords</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-700" />
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-amber-400" />
              <span className="text-gray-300">We cannot reset your vault</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-gray-700" />
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-amber-400" />
              <span className="text-gray-300">We cannot access your data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Six Pillars of SafePass Security
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Every layer is designed with the assumption that attackers will eventually breach our infrastructure. 
              Your data remains protected regardless.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {securityPillars.map((pillar, index) => (
              <Card key={index} className="bg-[#141414] border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <pillar.icon className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{pillar.title}</h3>
                      <p className="text-amber-400 text-sm mb-3">{pillar.subtitle}</p>
                      <p className="text-gray-400 text-sm mb-4">{pillar.description}</p>
                      
                      <div className="space-y-2">
                        {pillar.technical.map((point, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              How Zero-Knowledge Works
            </h2>
            <p className="text-gray-400">
              A step-by-step breakdown of what happens when you use SafePass
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'You Enter Your Master Password',
                description: 'Your master password is used to derive an encryption key using PBKDF2 with 600,000 iterations. This happens entirely in your browser — the password never leaves your device.'
              },
              {
                step: '2',
                title: 'Local Encryption',
                description: 'When you save a password, it\'s encrypted with AES-256-GCM using your derived key. The ciphertext is cryptographically bound to your account (AAD) to prevent tampering.'
              },
              {
                step: '3',
                title: 'Encrypted Storage',
                description: 'Only the encrypted blob is sent to our servers. We store ciphertext that is mathematically impossible to decrypt without your master password.'
              },
              {
                step: '4',
                title: 'Local Decryption',
                description: 'When you access your vault, encrypted data is downloaded and decrypted locally in your browser. Plaintext passwords never transit the network.'
              }
            ].map((item, index) => (
              <div key={index} className="flex gap-4 p-6 rounded-xl bg-[#141414] border border-amber-500/10">
                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Safer Than Browsers */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/30">
              Critical Difference
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              Why SafePass Is Safer Than Browser Password Managers
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Browser password managers are designed for ease of use, not for protecting your most sensitive credentials against modern threats. 
              SafePass is purpose-built as a zero-knowledge password manager with a breach-assume security model.
            </p>
          </div>
          
          {/* Core Difference */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="bg-[#141414] border-gray-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-4">Browser Password Managers</h3>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Passwords often encrypted server-side
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Providers may be able to access or reset vaults
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Encryption keys may be available to the platform
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                    Sync prioritizes convenience over isolation
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-[#141414] border-amber-500/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">SafePass</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Zero-knowledge by design
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    All encryption happens locally on your device
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    Master password never leaves your browser
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    We cannot see, reset, or recover your vault — ever
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Key Insight */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-amber-500/20 mb-12">
            <p className="text-center text-lg">
              <span className="text-red-400 font-semibold">If a system can reset your passwords, it can also access them.</span>
              <br />
              <span className="text-amber-400 font-bold">SafePass cannot.</span>
            </p>
          </div>
          
          {/* Detailed Comparison Table */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">
              Cryptography That Exceeds Industry Defaults
            </h3>
            <div className="rounded-xl overflow-hidden border border-amber-500/10">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#141414]">
                    <th className="text-left p-4 text-gray-400 font-medium">Security Feature</th>
                    <th className="text-center p-4 text-amber-400 font-medium">SafePass</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Typical Browser Manager</th>
                  </tr>
                </thead>
                <tbody>
                  {browserComparison.map((point, index) => (
                    <tr key={index} className="border-t border-amber-500/10">
                      <td className="p-4 text-gray-300">{point.feature}</td>
                      <td className="p-4 text-center text-emerald-400 font-medium">{point.safepass}</td>
                      <td className="p-4 text-center text-gray-500">{point.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Breach Scenario */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-[#141414] border border-amber-500/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" />
                Designed for Breach Scenarios
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                SafePass is built under a simple assumption: <strong className="text-white">Attackers will eventually breach infrastructure.</strong>
              </p>
              <p className="text-gray-400 text-sm">If that happens, attackers obtain:</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-gray-500">
                  <Lock className="h-4 w-4 text-amber-400" />
                  Only encrypted blobs — useless without your password
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <Lock className="h-4 w-4 text-amber-400" />
                  No master passwords or encryption keys
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <Lock className="h-4 w-4 text-amber-400" />
                  No way to brute-force vaults at scale
                </li>
              </ul>
            </div>
            
            <div className="p-6 rounded-xl bg-[#141414] border border-amber-500/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-400" />
                Protection Against Real-World Attacks
              </h3>
              <ul className="space-y-2">
                {breachProtections.map((protection, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    {protection}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* No Backdoors */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 text-center">
            <h3 className="text-xl font-bold text-white mb-4">No Backdoors. No Exceptions.</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-black/50">
                <EyeOff className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">We cannot access your passwords</p>
              </div>
              <div className="p-4 rounded-lg bg-black/50">
                <Lock className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">We cannot reset your vault</p>
              </div>
              <div className="p-4 rounded-lg bg-black/50">
                <Key className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">We cannot decrypt your data</p>
              </div>
              <div className="p-4 rounded-lg bg-black/50">
                <Shield className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Even under legal compulsion</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              This is not a policy choice. <span className="text-amber-400">It is a cryptographic limitation — by design.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Industry Comparison Table */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Security Comparison vs Industry
            </h2>
            <p className="text-gray-400">
              How SafePass stacks up against other password managers
            </p>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-amber-500/10">
            <table className="w-full">
              <thead>
                <tr className="bg-[#141414]">
                  <th className="text-left p-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center p-4 text-amber-400 font-medium">SafePass</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Others</th>
                </tr>
              </thead>
              <tbody>
                {comparisonPoints.map((point, index) => (
                  <tr key={index} className="border-t border-amber-500/10">
                    <td className="p-4 text-gray-300">{point.feature}</td>
                    <td className="p-4 text-center">
                      {point.safepass === true ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-gray-400">{point.safepass}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {point.others === true ? (
                        <CheckCircle2 className="h-5 w-5 text-gray-500 mx-auto" />
                      ) : (
                        <span className="text-gray-500">{point.others}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Security FAQ
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 rounded-xl bg-[#141414] border border-amber-500/10">
                <h3 className="text-white font-semibold mb-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p className="text-gray-400 text-sm pl-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block bg-black px-8 py-4 rounded-lg mb-6 border border-emerald-500/20">
            <img src={safesuiteLogo} alt="Wrayth" className="h-16 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Secure Your Passwords?
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of users who trust SafePass with their most sensitive credentials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black gap-2">
                Start Free with Wrayth
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/products/safepass">
              <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                Learn More About SafePass
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} UltriumAI. SafePass is part of the Wrayth security bundle.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-gray-300">Privacy Policy</Link>
              <Link to="/security" className="hover:text-gray-300">Security</Link>
              <a 
                href="https://owasp.org/www-community/attacks/Password_Brute_Force" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-300 flex items-center gap-1"
              >
                OWASP Guidelines <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
