// =============================================================================
// Network Security Monitor - XDR Threat Detection
// =============================================================================
// Monitors network connections, DNS queries, and detects C2 communication

using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Text.RegularExpressions;

namespace VanguardAgent.Services.XDR;

public class NetworkMonitor : IDisposable
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly ThreatIntelligenceService? _threatIntel;
    private System.Threading.Timer? _scanTimer;
    private System.Threading.Timer? _dnsTimer;
    private readonly HashSet<string> _knownConnections = new();
    private readonly HashSet<string> _blockedDomains = new();
    private readonly HashSet<string> _blockedIPs = new();
    private bool _isRunning;
    private readonly object _lock = new();

    // Event for suspicious connections
    public event EventHandler<NetworkAlertEventArgs>? OnSuspiciousConnection;

    // Suspicious ports commonly used by malware/C2
    private static readonly int[] SuspiciousPorts = new[]
    {
        4444, 4445, 5555, 6666, 7777, 8888, 9999, 1337, 31337,
        4443, 8443, 8080, 3389, 5900, 5938, 
        1234, 2222, 6969, 12345, 54321
    };

    // Known C2 port patterns
    private static readonly int[] C2Ports = new[]
    {
        4444, 5555, 6666, 7777, 8888, 9999, 1337
    };

    // Suspicious domain patterns
    private static readonly string[] SuspiciousDomainPatterns = new[]
    {
        @"\.onion$", @"\.i2p$", @"\.bit$",
        @"pastebin\.com", @"ngrok\.io", @"serveo\.net",
        @"[a-z0-9]{30,}\..*", // Very long random subdomain
        @"^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$", // Direct IP in DNS
    };

    // Known malicious TLDs
    private static readonly string[] SuspiciousTLDs = new[]
    {
        ".tk", ".ml", ".ga", ".cf", ".gq", // Free TLDs often abused
        ".xyz", ".top", ".loan", ".work", ".click"
    };

    public NetworkMonitor(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
    }

    public NetworkMonitor(ConfigService configService, ApiClient apiClient, ThreatIntelligenceService threatIntel)
    {
        _configService = configService;
        _apiClient = apiClient;
        _threatIntel = threatIntel;
    }

    public void Start()
    {
        lock (_lock)
        {
            if (_isRunning) return;
            _isRunning = true;
        }

        try
        {
            // Load blocklists
            LoadBlocklists();

            // Baseline current connections
            BaselineConnections();

            // Monitor connections every 15 seconds
            _scanTimer = new System.Threading.Timer(ScanConnections, null, TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(15));

            // Monitor DNS cache every 30 seconds
            _dnsTimer = new System.Threading.Timer(ScanDnsCache, null, TimeSpan.FromSeconds(30), TimeSpan.FromSeconds(30));

            Console.WriteLine("[XDR Network] Network monitoring started");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Network] Failed to start: {ex.Message}");
        }
    }

    public Task StartAsync()
    {
        Start();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Block an IP address via Windows Firewall
    /// </summary>
    public async Task BlockIPAsync(string ipAddress)
    {
        try
        {
            _blockedIPs.Add(ipAddress);
            
            // Add firewall rule to block the IP
            var psi = new ProcessStartInfo
            {
                FileName = "netsh",
                Arguments = $"advfirewall firewall add rule name=\"Vanguard Block {ipAddress}\" dir=out action=block remoteip={ipAddress}",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true
            };

            using var process = Process.Start(psi);
            if (process != null)
            {
                await process.WaitForExitAsync();
            }

            Console.WriteLine($"[XDR Network] Blocked IP: {ipAddress}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Network] Failed to block IP {ipAddress}: {ex.Message}");
        }
    }

    public void Stop()
    {
        lock (_lock)
        {
            _isRunning = false;
        }

        _scanTimer?.Dispose();
        _scanTimer = null;
        _dnsTimer?.Dispose();
        _dnsTimer = null;

        Console.WriteLine("[XDR Network] Monitoring stopped");
    }

    private void LoadBlocklists()
    {
        // Add some known malicious IPs/domains
        // In production, these would be fetched from threat intelligence feeds
        _blockedDomains.Add("malware.testcategory.com");
        _blockedIPs.Add("45.33.32.156"); // Scanme (example)
    }

    public void AddBlockedDomain(string domain)
    {
        _blockedDomains.Add(domain.ToLowerInvariant());
    }

    public void AddBlockedIP(string ip)
    {
        _blockedIPs.Add(ip);
    }

    private void BaselineConnections()
    {
        try
        {
            var connections = GetActiveConnections();
            foreach (var conn in connections)
            {
                _knownConnections.Add(GetConnectionKey(conn));
            }
            Console.WriteLine($"[XDR Network] Baseline: {_knownConnections.Count} connections");
        }
        catch { }
    }

    private async void ScanConnections(object? state)
    {
        if (!_isRunning) return;

        try
        {
            var connections = GetActiveConnections();
            var currentKeys = new HashSet<string>();

            foreach (var conn in connections)
            {
                var key = GetConnectionKey(conn);
                currentKeys.Add(key);

                // Skip already known connections
                if (_knownConnections.Contains(key)) continue;

                // Analyze new connection
                var analysis = AnalyzeConnection(conn);

                if (analysis.ThreatScore > 30)
                {
                    await ReportSuspiciousConnectionAsync(conn, analysis);
                }

                // Check blocklists
                if (_blockedIPs.Contains(conn.RemoteAddress))
                {
                    await ReportBlockedConnectionAsync(conn, "Blocked IP");
                }
            }

            // Update known connections
            _knownConnections.Clear();
            foreach (var key in currentKeys)
                _knownConnections.Add(key);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Network] Scan error: {ex.Message}");
        }
    }

    private async void ScanDnsCache(object? state)
    {
        if (!_isRunning) return;

        try
        {
            var dnsEntries = GetDnsCacheEntries();

            foreach (var entry in dnsEntries)
            {
                var analysis = AnalyzeDnsEntry(entry);

                if (analysis.IsSuspicious)
                {
                    await ReportSuspiciousDnsAsync(entry, analysis);
                }

                if (_blockedDomains.Any(d => entry.ToLowerInvariant().Contains(d)))
                {
                    await ReportBlockedDnsAsync(entry);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Network] DNS scan error: {ex.Message}");
        }
    }

    private List<ConnectionInfo> GetActiveConnections()
    {
        var connections = new List<ConnectionInfo>();

        try
        {
            var properties = IPGlobalProperties.GetIPGlobalProperties();

            // TCP connections
            foreach (var tcp in properties.GetActiveTcpConnections())
            {
                if (tcp.State != TcpState.Established) continue;

                string processName = "Unknown";
                int processId = 0;

                try
                {
                    // Get process info via netstat
                    var portInfo = GetProcessForPort(tcp.LocalEndPoint.Port);
                    processName = portInfo.ProcessName;
                    processId = portInfo.ProcessId;
                }
                catch { }

                connections.Add(new ConnectionInfo
                {
                    Protocol = "TCP",
                    LocalAddress = tcp.LocalEndPoint.Address.ToString(),
                    LocalPort = tcp.LocalEndPoint.Port,
                    RemoteAddress = tcp.RemoteEndPoint.Address.ToString(),
                    RemotePort = tcp.RemoteEndPoint.Port,
                    State = tcp.State.ToString(),
                    ProcessName = processName,
                    ProcessId = processId
                });
            }

            // TCP listeners
            foreach (var listener in properties.GetActiveTcpListeners())
            {
                var portInfo = GetProcessForPort(listener.Port);
                
                connections.Add(new ConnectionInfo
                {
                    Protocol = "TCP",
                    LocalAddress = listener.Address.ToString(),
                    LocalPort = listener.Port,
                    State = "LISTENING",
                    ProcessName = portInfo.ProcessName,
                    ProcessId = portInfo.ProcessId
                });
            }
        }
        catch { }

        return connections;
    }

    private (string ProcessName, int ProcessId) GetProcessForPort(int port)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "netstat",
                Arguments = "-ano",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return ("Unknown", 0);

            var output = process.StandardOutput.ReadToEnd();
            
            var regex = new Regex($@":\s*{port}\s+.*?\s+(\d+)$", RegexOptions.Multiline);
            var match = regex.Match(output);

            if (match.Success && int.TryParse(match.Groups[1].Value, out int pid))
            {
                try
                {
                    using var proc = Process.GetProcessById(pid);
                    return (proc.ProcessName, pid);
                }
                catch { }
            }
        }
        catch { }

        return ("Unknown", 0);
    }

    private List<string> GetDnsCacheEntries()
    {
        var entries = new List<string>();

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "ipconfig",
                Arguments = "/displaydns",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process == null) return entries;

            var output = process.StandardOutput.ReadToEnd();
            
            var regex = new Regex(@"Record Name\s*:\s*(.+)$", RegexOptions.Multiline);
            foreach (Match match in regex.Matches(output))
            {
                var domain = match.Groups[1].Value.Trim();
                if (!string.IsNullOrEmpty(domain))
                    entries.Add(domain);
            }
        }
        catch { }

        return entries.Distinct().ToList();
    }

    private string GetConnectionKey(ConnectionInfo conn)
    {
        return $"{conn.LocalAddress}:{conn.LocalPort}->{conn.RemoteAddress}:{conn.RemotePort}";
    }

    private ConnectionAnalysis AnalyzeConnection(ConnectionInfo conn)
    {
        var analysis = new ConnectionAnalysis();

        // Check for suspicious ports
        if (SuspiciousPorts.Contains(conn.RemotePort))
        {
            analysis.ThreatScore += 30;
            analysis.Indicators.Add("Suspicious remote port");
        }

        if (C2Ports.Contains(conn.RemotePort))
        {
            analysis.ThreatScore += 40;
            analysis.Indicators.Add("Known C2 port");
            analysis.MitreTechnique = "T1571"; // Non-Standard Port
        }

        // Check for non-standard listening ports
        if (conn.State == "LISTENING" && conn.LocalPort > 49152)
        {
            analysis.ThreatScore += 20;
            analysis.Indicators.Add("High ephemeral listening port");
        }

        // Check for outbound from suspicious processes
        var suspiciousProcesses = new[] { "powershell", "cmd", "wscript", "cscript", "mshta" };
        if (suspiciousProcesses.Any(p => conn.ProcessName.ToLowerInvariant().Contains(p)))
        {
            if (!string.IsNullOrEmpty(conn.RemoteAddress) && conn.RemoteAddress != "127.0.0.1")
            {
                analysis.ThreatScore += 35;
                analysis.Indicators.Add("Script interpreter with network connection");
                analysis.MitreTechnique = "T1059"; // Command and Scripting Interpreter
            }
        }

        // Determine severity
        analysis.Severity = analysis.ThreatScore switch
        {
            >= 70 => "critical",
            >= 50 => "high",
            >= 30 => "medium",
            _ => "low"
        };

        return analysis;
    }

    private DnsAnalysis AnalyzeDnsEntry(string domain)
    {
        var analysis = new DnsAnalysis();
        var domainLower = domain.ToLowerInvariant();

        // Check suspicious patterns
        foreach (var pattern in SuspiciousDomainPatterns)
        {
            if (Regex.IsMatch(domainLower, pattern))
            {
                analysis.IsSuspicious = true;
                analysis.Reason = $"Pattern match: {pattern}";
                analysis.MitreTechnique = "T1071.001"; // Web Protocols
                break;
            }
        }

        // Check suspicious TLDs
        foreach (var tld in SuspiciousTLDs)
        {
            if (domainLower.EndsWith(tld))
            {
                analysis.IsSuspicious = true;
                analysis.Reason = $"Suspicious TLD: {tld}";
                break;
            }
        }

        // Check for high entropy (DGA detection)
        if (HasHighEntropy(domainLower))
        {
            analysis.IsSuspicious = true;
            analysis.Reason = "High entropy domain (possible DGA)";
            analysis.MitreTechnique = "T1568.002"; // Domain Generation Algorithms
        }

        return analysis;
    }

    private bool HasHighEntropy(string domain)
    {
        // Simple entropy check - count unique chars vs length
        var parts = domain.Split('.');
        if (parts.Length < 2) return false;

        var subdomain = parts[0];
        if (subdomain.Length < 10) return false;

        var uniqueChars = subdomain.Distinct().Count();
        var ratio = (double)uniqueChars / subdomain.Length;

        // High ratio of unique chars suggests random generation
        return ratio > 0.7 && subdomain.Length > 15;
    }

    private async Task ReportSuspiciousConnectionAsync(ConnectionInfo conn, ConnectionAnalysis analysis)
    {
        try
        {
            Console.WriteLine($"[XDR Network] {analysis.Severity.ToUpper()}: Suspicious connection {conn.ProcessName} -> {conn.RemoteAddress}:{conn.RemotePort}");

            // Raise event for AVEngine
            OnSuspiciousConnection?.Invoke(this, new NetworkAlertEventArgs
            {
                Severity = analysis.Severity,
                ThreatType = analysis.Indicators.FirstOrDefault(),
                ProcessId = conn.ProcessId,
                ProcessName = conn.ProcessName,
                RemoteAddress = conn.RemoteAddress,
                RemotePort = conn.RemotePort,
                MitreId = analysis.MitreTechnique
            });

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "network_alert",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "suspicious_connection",
                    severity = analysis.Severity,
                    process_name = conn.ProcessName,
                    process_id = conn.ProcessId,
                    local_address = conn.LocalAddress,
                    local_port = conn.LocalPort,
                    remote_address = conn.RemoteAddress,
                    remote_port = conn.RemotePort,
                    threat_score = analysis.ThreatScore,
                    indicators = analysis.Indicators,
                    mitre_technique = analysis.MitreTechnique,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR Network] Failed to report: {ex.Message}");
        }
    }

    private async Task ReportBlockedConnectionAsync(ConnectionInfo conn, string reason)
    {
        try
        {
            Console.WriteLine($"[XDR Network] BLOCKED: {conn.RemoteAddress} - {reason}");

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "network_block",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "blocked_connection",
                    severity = "high",
                    remote_address = conn.RemoteAddress,
                    remote_port = conn.RemotePort,
                    reason = reason,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch { }
    }

    private async Task ReportSuspiciousDnsAsync(string domain, DnsAnalysis analysis)
    {
        try
        {
            Console.WriteLine($"[XDR Network] Suspicious DNS: {domain} - {analysis.Reason}");

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "dns_alert",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "suspicious_dns",
                    severity = "medium",
                    domain = domain,
                    reason = analysis.Reason,
                    mitre_technique = analysis.MitreTechnique,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch { }
    }

    private async Task ReportBlockedDnsAsync(string domain)
    {
        try
        {
            Console.WriteLine($"[XDR Network] BLOCKED DNS: {domain}");

            await _apiClient.SendSecurityEventAsync(new
            {
                action = "dns_block",
                alert = new
                {
                    agent_id = _configService.Config.DeviceId,
                    user_id = _configService.Config.UserId,
                    event_type = "blocked_dns",
                    severity = "high",
                    domain = domain,
                    timestamp = DateTime.UtcNow
                }
            });
        }
        catch { }
    }

    public void Dispose()
    {
        Stop();
    }
}

public class ConnectionInfo
{
    public string Protocol { get; set; } = "";
    public string LocalAddress { get; set; } = "";
    public int LocalPort { get; set; }
    public string RemoteAddress { get; set; } = "";
    public int RemotePort { get; set; }
    public string State { get; set; } = "";
    public string ProcessName { get; set; } = "";
    public int ProcessId { get; set; }
}

public class ConnectionAnalysis
{
    public int ThreatScore { get; set; }
    public string Severity { get; set; } = "low";
    public List<string> Indicators { get; set; } = new();
    public string? MitreTechnique { get; set; }
}

public class DnsAnalysis
{
    public bool IsSuspicious { get; set; }
    public string Reason { get; set; } = "";
    public string? MitreTechnique { get; set; }
}

public class NetworkAlertEventArgs : EventArgs
{
    public string Severity { get; set; } = "medium";
    public string? ThreatType { get; set; }
    public int ProcessId { get; set; }
    public string ProcessName { get; set; } = "";
    public string RemoteAddress { get; set; } = "";
    public int RemotePort { get; set; }
    public string? MitreId { get; set; }
}
