// =============================================================================
// Threat Intelligence Service - XDR
// =============================================================================
// Provides threat intelligence lookups including:
// - IOC (Indicators of Compromise) checking
// - Hash reputation lookups
// - Domain/IP blocklists
// - YARA rule support

using System.Security.Cryptography;
using System.Text.Json;
using Newtonsoft.Json;

namespace VanguardAgent.Services.XDR;

public class ThreatIntelligenceService
{
    private readonly ConfigService _configService;
    private readonly ApiClient _apiClient;
    private readonly HttpClient _httpClient;
    
    // Local caches
    private readonly HashSet<string> _maliciousHashes = new();
    private readonly HashSet<string> _maliciousDomains = new();
    private readonly HashSet<string> _maliciousIPs = new();
    private readonly Dictionary<string, ThreatInfo> _hashCache = new();
    
    private DateTime _lastFeedUpdate = DateTime.MinValue;
    private readonly TimeSpan _feedUpdateInterval = TimeSpan.FromHours(4);
    private readonly string _feedCachePath;

    public ThreatIntelligenceService(ConfigService configService, ApiClient apiClient)
    {
        _configService = configService;
        _apiClient = apiClient;
        _httpClient = new HttpClient();
        _feedCachePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "VanguardAgent", "threat_feeds.json"
        );
    }

    public async Task InitializeAsync()
    {
        // Load cached feeds
        LoadCachedFeeds();

        // Update feeds if stale
        if (DateTime.UtcNow - _lastFeedUpdate > _feedUpdateInterval)
        {
            await UpdateThreatFeedsAsync();
        }

        Console.WriteLine($"[XDR TI] Initialized with {_maliciousHashes.Count} hashes, {_maliciousDomains.Count} domains, {_maliciousIPs.Count} IPs");
    }

    private void LoadCachedFeeds()
    {
        try
        {
            if (File.Exists(_feedCachePath))
            {
                var json = File.ReadAllText(_feedCachePath);
                var cache = JsonConvert.DeserializeObject<ThreatFeedCache>(json);

                if (cache != null)
                {
                    foreach (var hash in cache.Hashes ?? Array.Empty<string>())
                        _maliciousHashes.Add(hash.ToUpperInvariant());
                    foreach (var domain in cache.Domains ?? Array.Empty<string>())
                        _maliciousDomains.Add(domain.ToLowerInvariant());
                    foreach (var ip in cache.IPs ?? Array.Empty<string>())
                        _maliciousIPs.Add(ip);

                    _lastFeedUpdate = cache.LastUpdate;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR TI] Failed to load cached feeds: {ex.Message}");
        }
    }

    private void SaveCachedFeeds()
    {
        try
        {
            var cache = new ThreatFeedCache
            {
                Hashes = _maliciousHashes.ToArray(),
                Domains = _maliciousDomains.ToArray(),
                IPs = _maliciousIPs.ToArray(),
                LastUpdate = _lastFeedUpdate
            };

            var dir = Path.GetDirectoryName(_feedCachePath);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                Directory.CreateDirectory(dir);

            var json = JsonConvert.SerializeObject(cache, Formatting.Indented);
            File.WriteAllText(_feedCachePath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR TI] Failed to save cached feeds: {ex.Message}");
        }
    }

    public async Task UpdateThreatFeedsAsync()
    {
        try
        {
            Console.WriteLine("[XDR TI] Updating threat feeds...");

            // Fetch from Vanguard backend which aggregates multiple sources
            var response = await _apiClient.GetThreatFeedsAsync();

            if (response != null)
            {
                if (response.Hashes != null)
                {
                    foreach (var hash in response.Hashes)
                        _maliciousHashes.Add(hash.ToUpperInvariant());
                }

                if (response.Domains != null)
                {
                    foreach (var domain in response.Domains)
                        _maliciousDomains.Add(domain.ToLowerInvariant());
                }

                if (response.IPs != null)
                {
                    foreach (var ip in response.IPs)
                        _maliciousIPs.Add(ip);
                }

                _lastFeedUpdate = DateTime.UtcNow;
                SaveCachedFeeds();

                Console.WriteLine($"[XDR TI] Feeds updated: {_maliciousHashes.Count} hashes, {_maliciousDomains.Count} domains, {_maliciousIPs.Count} IPs");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR TI] Feed update failed: {ex.Message}");
        }
    }

    public async Task<ThreatInfo?> CheckFileHashAsync(string filePath)
    {
        try
        {
            // Compute SHA256
            string hash;
            using (var sha256 = SHA256.Create())
            using (var stream = File.OpenRead(filePath))
            {
                var hashBytes = await Task.Run(() => sha256.ComputeHash(stream));
                hash = Convert.ToHexString(hashBytes);
            }

            return await CheckHashAsync(hash, filePath);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR TI] Hash check failed for {filePath}: {ex.Message}");
            return null;
        }
    }

    public async Task<ThreatInfo?> CheckHashAsync(string hash, string? context = null)
    {
        hash = hash.ToUpperInvariant();

        // Check local cache first
        if (_hashCache.TryGetValue(hash, out var cachedInfo))
            return cachedInfo;

        // Check local blocklist
        if (_maliciousHashes.Contains(hash))
        {
            var threatInfo = new ThreatInfo
            {
                Hash = hash,
                IsMalicious = true,
                Confidence = 90,
                Source = "Local Feed",
                ThreatType = "Known Malware",
                Context = context
            };

            _hashCache[hash] = threatInfo;
            return threatInfo;
        }

        // Query backend for extended lookup (includes VirusTotal, etc.)
        try
        {
            var response = await _apiClient.LookupHashAsync(hash);
            
            if (response != null)
            {
                var threatInfo = new ThreatInfo
                {
                    Hash = hash,
                    IsMalicious = response.IsMalicious,
                    Confidence = response.Confidence,
                    Source = response.Source ?? "Vanguard TI",
                    ThreatType = response.ThreatType,
                    ThreatFamily = response.ThreatFamily,
                    FirstSeen = response.FirstSeen,
                    Context = context
                };

                _hashCache[hash] = threatInfo;

                // Add to local blocklist if confirmed malicious
                if (response.IsMalicious && response.Confidence > 70)
                {
                    _maliciousHashes.Add(hash);
                }

                return threatInfo;
            }
        }
        catch { }

        return null;
    }

    public bool IsDomainMalicious(string domain)
    {
        domain = domain.ToLowerInvariant();
        
        // Direct match
        if (_maliciousDomains.Contains(domain))
            return true;

        // Check parent domains
        var parts = domain.Split('.');
        for (int i = 1; i < parts.Length - 1; i++)
        {
            var parentDomain = string.Join(".", parts.Skip(i));
            if (_maliciousDomains.Contains(parentDomain))
                return true;
        }

        return false;
    }

    public bool IsIPMalicious(string ip)
    {
        return _maliciousIPs.Contains(ip);
    }

    public void AddToBlocklist(string indicator, IndicatorType type)
    {
        switch (type)
        {
            case IndicatorType.Hash:
                _maliciousHashes.Add(indicator.ToUpperInvariant());
                break;
            case IndicatorType.Domain:
                _maliciousDomains.Add(indicator.ToLowerInvariant());
                break;
            case IndicatorType.IP:
                _maliciousIPs.Add(indicator);
                break;
        }
    }

    public async Task<List<ThreatInfo>> ScanDirectoryAsync(string path, bool recursive = false)
    {
        var threats = new List<ThreatInfo>();
        var searchOption = recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;

        try
        {
            var extensions = new[] { ".exe", ".dll", ".ps1", ".bat", ".cmd", ".vbs", ".js", ".msi" };

            foreach (var file in Directory.EnumerateFiles(path, "*.*", searchOption))
            {
                var ext = Path.GetExtension(file).ToLowerInvariant();
                if (!extensions.Contains(ext)) continue;

                var info = await CheckFileHashAsync(file);
                if (info != null && info.IsMalicious)
                {
                    threats.Add(info);
                    Console.WriteLine($"[XDR TI] THREAT: {file} - {info.ThreatType}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[XDR TI] Directory scan failed: {ex.Message}");
        }

        return threats;
    }

    public ThreatIntelStats GetStats()
    {
        return new ThreatIntelStats
        {
            MaliciousHashes = _maliciousHashes.Count,
            MaliciousDomains = _maliciousDomains.Count,
            MaliciousIPs = _maliciousIPs.Count,
            LastUpdate = _lastFeedUpdate,
            CacheSize = _hashCache.Count
        };
    }
}

public class ThreatInfo
{
    public string Hash { get; set; } = "";
    public bool IsMalicious { get; set; }
    public int Confidence { get; set; }
    public string Source { get; set; } = "";
    public string? ThreatType { get; set; }
    public string? ThreatFamily { get; set; }
    public DateTime? FirstSeen { get; set; }
    public string? Context { get; set; }
}

public class ThreatFeedCache
{
    public string[]? Hashes { get; set; }
    public string[]? Domains { get; set; }
    public string[]? IPs { get; set; }
    public DateTime LastUpdate { get; set; }
}

public class ThreatIntelStats
{
    public int MaliciousHashes { get; set; }
    public int MaliciousDomains { get; set; }
    public int MaliciousIPs { get; set; }
    public DateTime LastUpdate { get; set; }
    public int CacheSize { get; set; }
}

public enum IndicatorType
{
    Hash,
    Domain,
    IP
}

// Extension to ApiClient for TI methods
public class ThreatFeedResponse
{
    public string[]? Hashes { get; set; }
    public string[]? Domains { get; set; }
    public string[]? IPs { get; set; }
}

public class HashLookupResponse
{
    public bool IsMalicious { get; set; }
    public int Confidence { get; set; }
    public string? Source { get; set; }
    public string? ThreatType { get; set; }
    public string? ThreatFamily { get; set; }
    public DateTime? FirstSeen { get; set; }
}
