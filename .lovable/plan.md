

# Vanguard Recon Unit: Commercialization & Admin Provisioning System

## Overview

This plan outlines the full system for turning your Recon Unit (Raspberry Pi security appliance) into a purchasable product with real pentesting and vulnerability scanning capabilities. It includes an internal admin portal for pre-configuration and order fulfillment.

---

## Business Model

**Product: Vanguard Recon™**
- **Hardware**: Pre-configured Raspberry Pi with security scanning software
- **Pricing**: One-time hardware + monthly subscription
  - Hardware: $299-$499 (depending on model)
  - Monthly: $49/unit (includes scanning, monitoring, updates)
- **Target**: SMBs and MSP customers who want on-premise network security

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN PORTAL (Internal Only)                 │
│                  /admin/recon-provisioning                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Orders    │  │  Inventory  │  │  Provision  │              │
│  │  Management │  │   Tracking  │  │   & Ship    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  • View/manage incoming orders                                  │
│  • Pre-configure units with customer credentials                │
│  • Generate activation keys                                     │
│  • Track shipping & deployment status                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER PURCHASE FLOW                       │
│                  /vanguard/recon (Public)                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Product landing page with capabilities                      │
│  2. Configuration options (coverage area, add-ons)              │
│  3. Stripe checkout (hardware + subscription)                   │
│  4. Order confirmation → triggers admin workflow                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SHIPPED RECON UNIT                           │
├─────────────────────────────────────────────────────────────────┤
│  • Pre-loaded with customer's activation key                    │
│  • Connects to Vanguard API on first boot                       │
│  • Auto-registers with customer's account                       │
│  • Begins network scanning immediately                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database Schema (Recon Orders & Inventory)

**New Tables Required:**

1. **`recon_orders`** - Customer orders for Recon Units
   - `id`, `user_id`, `msp_client_id`, `order_status`, `hardware_tier`
   - `quantity`, `shipping_address`, `stripe_payment_id`
   - `created_at`, `shipped_at`, `activated_at`

2. **`recon_inventory`** - Physical unit tracking
   - `id`, `serial_number`, `mac_address`, `hardware_tier`
   - `status` (available, assigned, shipped, active, retired)
   - `assigned_order_id`, `activation_key`
   - `provisioned_at`, `provisioned_by`

3. **`recon_subscriptions`** - Monthly billing for active units
   - `id`, `user_id`, `recon_unit_id`, `stripe_subscription_id`
   - `tier`, `status`, `started_at`, `ends_at`

---

### Phase 2: Admin Provisioning Portal

**Route**: `/admin/recon-provisioning` (Internal Only)

**Features:**

1. **Orders Dashboard**
   - View all pending orders
   - Filter by status: Pending → Provisioning → Shipped → Active
   - Customer details, shipping info, order date

2. **Inventory Management**
   - Add new units (enter serial number, MAC address)
   - Track available vs assigned units
   - View activation status

3. **Provisioning Workflow**
   - Select order → Assign unit from inventory
   - Generate unique activation key (tied to customer + unit)
   - One-click generate config file for flashing
   - Mark as shipped with tracking number

4. **Unit Configuration Generator**
   - Download pre-configured SD card image or config bundle
   - Includes: customer ID, activation key, API endpoints
   - Zero-touch deployment ready

---

### Phase 3: Customer Purchase Flow

**Route**: `/vanguard/recon` (Public Product Page)

**Page Sections:**

1. **Hero** - "Network Security, On Your Terms"
2. **Capabilities**
   - Network Discovery & Asset Mapping
   - Vulnerability Scanning (CVE detection)
   - Live Traffic Monitoring
   - Threat Detection & Alerting
   - Compliance Reporting

3. **Hardware Tiers**
   - **Recon Lite** ($299): Pi 4, suitable for <50 devices
   - **Recon Pro** ($499): Pi 5 w/ AI accelerator, <200 devices
   
4. **Subscription Tiers**
   - **Essential** ($29/mo): Basic scanning, monthly reports
   - **Professional** ($49/mo): Full scanning, real-time alerts, API access
   - **Enterprise** ($99/mo): Multi-site, custom rules, white-label reports

5. **Checkout Flow**
   - Hardware selection + subscription tier
   - Shipping address collection
   - Stripe checkout integration
   - Confirmation email with ETA

---

### Phase 4: Agent Enhancements (Pi-Side)

**Current State**: The Python agent sends heartbeats and basic metrics.

**Enhancements for Real Scanning:**

1. **Network Discovery Module**
   - ARP scanning for device enumeration
   - Service detection (nmap-style)
   - OS fingerprinting

2. **Vulnerability Scanning**
   - OpenVAS or custom CVE scanner integration
   - Scheduled scans (daily/weekly)
   - Results reported to `vanguard_discovered_devices`

3. **Traffic Analysis**
   - Packet capture for anomaly detection
   - Protocol distribution logging
   - Bandwidth monitoring per device

4. **Threat Detection**
   - Known malicious IP/domain checking
   - Port scan detection
   - Unusual traffic pattern alerts

---

### Phase 5: Stripe Integration

**Products to Create:**

1. **Hardware Products**
   - `prod_recon_lite` - Vanguard Recon Lite ($299)
   - `prod_recon_pro` - Vanguard Recon Pro ($499)

2. **Subscription Products**
   - `price_recon_essential` - $29/mo
   - `price_recon_professional` - $49/mo  
   - `price_recon_enterprise` - $99/mo

**Checkout Flow:**
- Single checkout for hardware + first month subscription
- Subscription auto-renews monthly
- Unit activation required for subscription to start billing

---

## Technical Implementation Details

### New Files to Create

```text
src/
├── pages/
│   └── admin/
│       └── ReconProvisioningPage.tsx        # Admin portal
│   └── vanguard/
│       └── ReconProductPage.tsx             # Customer-facing product page
│       └── ReconCheckoutPage.tsx            # Purchase flow
├── components/
│   └── admin/
│       └── recon/
│           ├── ReconOrdersTable.tsx         # Orders management
│           ├── ReconInventoryTable.tsx      # Inventory tracking
│           ├── ReconProvisioningForm.tsx    # Unit provisioning
│           └── ReconConfigGenerator.tsx     # Config file generator
│   └── vanguard/
│       └── recon/
│           ├── ReconHeroSection.tsx         # Product hero
│           ├── ReconCapabilities.tsx        # Features showcase
│           ├── ReconPricingCards.tsx        # Hardware + subscription tiers
│           └── ReconOrderForm.tsx           # Purchase form
├── hooks/
│   └── useReconOrders.ts                    # Order management hook
│   └── useReconInventory.ts                 # Inventory management hook
├── config/
│   └── reconPricing.ts                      # Pricing configuration
supabase/
├── migrations/
│   └── xxx_create_recon_tables.sql          # New tables
├── functions/
│   └── recon-order-webhook/                 # Stripe webhook handler
│   └── recon-activate/                      # Unit activation endpoint
```

### Database Migration Example

```sql
-- Recon Orders
CREATE TABLE recon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  msp_client_id UUID REFERENCES msp_clients(id),
  order_status TEXT DEFAULT 'pending',
  hardware_tier TEXT NOT NULL,
  subscription_tier TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  shipping_address JSONB NOT NULL,
  stripe_payment_intent TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  shipped_at TIMESTAMPTZ,
  tracking_number TEXT,
  activated_at TIMESTAMPTZ
);

-- Recon Inventory
CREATE TABLE recon_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  mac_address TEXT UNIQUE,
  hardware_tier TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  assigned_order_id UUID REFERENCES recon_orders(id),
  activation_key TEXT UNIQUE,
  provisioned_at TIMESTAMPTZ,
  provisioned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (admin-only access)
ALTER TABLE recon_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recon_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to orders"
  ON recon_orders FOR ALL
  USING (is_admin_user());

CREATE POLICY "Admin full access to inventory"
  ON recon_inventory FOR ALL
  USING (is_admin_user());
```

---

## Recommended Implementation Order

1. **Database tables & RLS** - Foundation for everything
2. **Admin provisioning portal** - So you can start managing units
3. **Inventory management** - Track your physical units
4. **Product pricing config** - Define tiers in code
5. **Customer product page** - Public-facing sales page
6. **Stripe integration** - Checkout flow
7. **Agent enhancements** - Real scanning capabilities (can be done in parallel)
8. **Activation flow** - Zero-touch deployment

---

## Summary

This system creates a complete product lifecycle:
1. **Customer purchases** → Order created, Stripe charged
2. **Admin provisions** → Assigns inventory, generates config
3. **Unit shipped** → Customer receives pre-configured device
4. **First boot** → Auto-activates, begins scanning
5. **Monthly billing** → Subscription continues while active

The admin portal at `/admin/recon-provisioning` gives you complete control over inventory, orders, and provisioning - visible only to UltriumAI employees.

