import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token' } },
      })),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import type { VanguardAgent, VanguardMetric, VanguardCommand } from './useVanguardAgents';

describe('useVanguardAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VanguardAgent type validation', () => {
    it('should have correct agent interface structure', () => {
      const mockAgent: VanguardAgent = {
        id: 'agent-123',
        device_id: 'device-456',
        name: 'Test Agent',
        location: 'Office',
        ip_address: '192.168.1.100',
        vpn_ip: null,
        api_endpoint: null,
        agent_version: '1.0.0',
        firmware_version: null,
        hailo_board_name: null,
        hailo_status: {},
        status: 'online',
        last_heartbeat: new Date().toISOString(),
        config: {},
        client_id: null,
        os_info: 'Windows 11',
        cpu_usage: 45,
        memory_usage: 60,
        disk_usage: 70,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        agent_type: 'windows',
      };

      expect(mockAgent.id).toBeDefined();
      expect(mockAgent.device_id).toBeDefined();
      expect(mockAgent.name).toBeDefined();
      expect(mockAgent.status).toMatch(/online|offline|warning|critical/);
      expect(mockAgent.agent_type).toMatch(/windows|pi_appliance/);
    });

    it('should support pi_appliance agent type with scanner fields', () => {
      const mockPiAgent: VanguardAgent = {
        id: 'pi-agent-123',
        device_id: 'pi-device-456',
        name: 'Pi Scanner',
        location: 'Network Closet',
        ip_address: '192.168.1.50',
        vpn_ip: null,
        api_endpoint: null,
        agent_version: '2.0.0',
        firmware_version: '1.5.0',
        hailo_board_name: 'Hailo-8',
        hailo_status: { active: true },
        status: 'online',
        last_heartbeat: new Date().toISOString(),
        config: {},
        client_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        agent_type: 'pi_appliance',
        is_network_scanner: true,
        scanner_subnets: ['192.168.1.0/24', '10.0.0.0/8'],
        last_scan_at: new Date().toISOString(),
        scan_interval_seconds: 300,
        firewall_rules: [],
        traffic_stats: {},
        threat_detections: [],
        ml_model_version: '3.0.0',
        inference_stats: {},
      };

      expect(mockPiAgent.agent_type).toBe('pi_appliance');
      expect(mockPiAgent.is_network_scanner).toBe(true);
      expect(mockPiAgent.scanner_subnets).toHaveLength(2);
    });
  });

  describe('VanguardMetric type validation', () => {
    it('should have correct metric interface structure', () => {
      const mockMetric: VanguardMetric = {
        id: 'metric-123',
        agent_id: 'agent-456',
        cpu_percent: 45.5,
        memory_percent: 62.3,
        disk_percent: 78.9,
        network_rx_bytes: 1024000,
        network_tx_bytes: 512000,
        temperature: 55,
        hailo_status: {},
        custom_metrics: {},
        recorded_at: new Date().toISOString(),
      };

      expect(mockMetric.cpu_percent).toBeGreaterThanOrEqual(0);
      expect(mockMetric.cpu_percent).toBeLessThanOrEqual(100);
      expect(mockMetric.memory_percent).toBeGreaterThanOrEqual(0);
      expect(mockMetric.disk_percent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('VanguardCommand type validation', () => {
    it('should have correct command interface structure', () => {
      const mockCommand: VanguardCommand = {
        id: 'cmd-123',
        agent_id: 'agent-456',
        command_type: 'restart_service',
        payload: { service_name: 'nginx' },
        status: 'pending',
        response: null,
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: null,
      };

      expect(mockCommand.status).toMatch(/pending|sent|completed|failed/);
      expect(mockCommand.command_type).toBeDefined();
    });

    it('should handle completed command with response', () => {
      const completedCommand: VanguardCommand = {
        id: 'cmd-123',
        agent_id: 'agent-456',
        command_type: 'get_system_info',
        payload: {},
        status: 'completed',
        response: { os: 'Windows 11', hostname: 'WORKSTATION-01' },
        error_message: null,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      expect(completedCommand.status).toBe('completed');
      expect(completedCommand.response).not.toBeNull();
      expect(completedCommand.completed_at).not.toBeNull();
    });

    it('should handle failed command with error', () => {
      const failedCommand: VanguardCommand = {
        id: 'cmd-123',
        agent_id: 'agent-456',
        command_type: 'invalid_command',
        payload: {},
        status: 'failed',
        response: null,
        error_message: 'Unknown command type',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };

      expect(failedCommand.status).toBe('failed');
      expect(failedCommand.error_message).toBeDefined();
    });
  });

  describe('agent status logic', () => {
    it('should correctly identify online agents', () => {
      const agents: VanguardAgent[] = [
        { id: '1', status: 'online' } as VanguardAgent,
        { id: '2', status: 'offline' } as VanguardAgent,
        { id: '3', status: 'warning' } as VanguardAgent,
        { id: '4', status: 'online' } as VanguardAgent,
      ];

      const onlineAgents = agents.filter(a => a.status === 'online');
      expect(onlineAgents).toHaveLength(2);
    });

    it('should correctly identify critical agents', () => {
      const agents: VanguardAgent[] = [
        { id: '1', status: 'critical' } as VanguardAgent,
        { id: '2', status: 'online' } as VanguardAgent,
        { id: '3', status: 'critical' } as VanguardAgent,
      ];

      const criticalAgents = agents.filter(a => a.status === 'critical');
      expect(criticalAgents).toHaveLength(2);
    });
  });
});
