-- Internal IT Ticket Queues
CREATE TABLE public.comanaged_ticket_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.comanaged_organizations(id) ON DELETE CASCADE NOT NULL,
    queue_name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'inbox',
    is_default BOOLEAN DEFAULT false,
    auto_assign_rules JSONB DEFAULT '{}',
    sla_policy_id UUID,
    notification_settings JSONB DEFAULT '{"email": true, "in_app": true}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Queue membership for internal technicians
CREATE TABLE public.comanaged_queue_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.comanaged_ticket_queues(id) ON DELETE CASCADE NOT NULL,
    technician_id UUID REFERENCES public.comanaged_internal_technicians(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'member', 'viewer')),
    can_assign BOOLEAN DEFAULT true,
    can_close BOOLEAN DEFAULT true,
    receive_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(queue_id, technician_id)
);

-- Queue-based ticket routing
CREATE TABLE public.comanaged_queue_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.comanaged_ticket_queues(id) ON DELETE CASCADE NOT NULL,
    ticket_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID,
    previous_queue_id UUID,
    notes TEXT
);

-- Auto-routing rules for queues
CREATE TABLE public.comanaged_queue_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.comanaged_ticket_queues(id) ON DELETE CASCADE NOT NULL,
    rule_name TEXT NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.comanaged_ticket_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_queue_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_queue_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comanaged_queue_routing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view queues for their organizations"
ON public.comanaged_ticket_queues FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage queues"
ON public.comanaged_ticket_queues FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view queue members"
ON public.comanaged_queue_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage queue members"
ON public.comanaged_queue_members FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view queue tickets"
ON public.comanaged_queue_tickets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage queue tickets"
ON public.comanaged_queue_tickets FOR ALL
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view routing rules"
ON public.comanaged_queue_routing_rules FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage routing rules"
ON public.comanaged_queue_routing_rules FOR ALL
USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_queues_organization ON public.comanaged_ticket_queues(organization_id);
CREATE INDEX idx_queue_members_queue ON public.comanaged_queue_members(queue_id);
CREATE INDEX idx_queue_tickets_queue ON public.comanaged_queue_tickets(queue_id);
CREATE INDEX idx_queue_tickets_ticket ON public.comanaged_queue_tickets(ticket_id);