// =============================================================================
// Script Analyzer - Advanced Script Threat Detection
// =============================================================================
// Sandbox and analyze PowerShell, VBS, macros before execution
// Uses static analysis, behavior prediction, and deobfuscation

using System.Text.RegularExpressions;

namespace VanguardAgent.Services.AV;

public class ScriptAnalyzer
{
    private readonly ApiClient _apiClient;
    private readonly List<ScriptRule> _rules = new();
    private readonly Dictionary<string, int> _suspiciousPatternWeights = new();

    // Analysis statistics
    private long _scriptsAnalyzed;
    private long _threatsBlocked;
    private long _suspiciousScripts;

    public event EventHandler<ScriptThreatEventArgs>? OnThreatDetected;

    public ScriptAnalyzer(ApiClient apiClient)
    {
        _apiClient = apiClient;
        InitializePatternWeights();
        LoadBuiltInRules();
    }

    private void InitializePatternWeights()
    {
        // PowerShell suspicious patterns
        _suspiciousPatternWeights["Invoke-Expression"] = 15;
        _suspiciousPatternWeights["iex"] = 15;
        _suspiciousPatternWeights["-enc"] = 25;
        _suspiciousPatternWeights["-encodedcommand"] = 25;
        _suspiciousPatternWeights["FromBase64String"] = 20;
        _suspiciousPatternWeights["ToBase64String"] = 10;
        _suspiciousPatternWeights["DownloadString"] = 25;
        _suspiciousPatternWeights["DownloadFile"] = 25;
        _suspiciousPatternWeights["Net.WebClient"] = 15;
        _suspiciousPatternWeights["Invoke-WebRequest"] = 10;
        _suspiciousPatternWeights["Start-BitsTransfer"] = 15;
        _suspiciousPatternWeights["-WindowStyle Hidden"] = 20;
        _suspiciousPatternWeights["bypass"] = 20;
        _suspiciousPatternWeights["unrestricted"] = 15;
        _suspiciousPatternWeights["ExecutionPolicy"] = 10;
        _suspiciousPatternWeights["Add-MpPreference"] = 30;
        _suspiciousPatternWeights["Set-MpPreference"] = 25;
        _suspiciousPatternWeights["-ExclusionPath"] = 30;
        _suspiciousPatternWeights["Invoke-Mimikatz"] = 50;
        _suspiciousPatternWeights["Invoke-ReflectivePEInjection"] = 50;
        _suspiciousPatternWeights["Invoke-Shellcode"] = 50;
        _suspiciousPatternWeights["VirtualAlloc"] = 25;
        _suspiciousPatternWeights["CreateThread"] = 20;
        _suspiciousPatternWeights["WScript.Shell"] = 15;
        _suspiciousPatternWeights["cmd /c"] = 10;
        _suspiciousPatternWeights["powershell -"] = 10;
        _suspiciousPatternWeights["AMSI"] = 25;
        _suspiciousPatternWeights["AmsiScanBuffer"] = 35;
        _suspiciousPatternWeights["AmsiUtils"] = 35;
        _suspiciousPatternWeights["Reflection.Assembly"] = 20;
        _suspiciousPatternWeights["[System.Runtime.InteropServices.Marshal]"] = 20;
        _suspiciousPatternWeights["GetDelegateForFunctionPointer"] = 30;
        _suspiciousPatternWeights["kernel32"] = 20;
        _suspiciousPatternWeights["ntdll"] = 25;
        _suspiciousPatternWeights["VirtualProtect"] = 25;
        _suspiciousPatternWeights["WriteProcessMemory"] = 30;
        _suspiciousPatternWeights["CreateRemoteThread"] = 35;
        _suspiciousPatternWeights["NtCreateThreadEx"] = 35;
        _suspiciousPatternWeights["RtlCreateUserThread"] = 35;
        _suspiciousPatternWeights["QueueUserAPC"] = 30;
        _suspiciousPatternWeights["SetWindowsHookEx"] = 25;
        _suspiciousPatternWeights["Invoke-Command"] = 10;
        _suspiciousPatternWeights["New-PSSession"] = 15;
        _suspiciousPatternWeights["Enter-PSSession"] = 15;
        _suspiciousPatternWeights["Get-Credential"] = 10;
        _suspiciousPatternWeights["ConvertTo-SecureString"] = 10;
        _suspiciousPatternWeights["Get-WmiObject"] = 5;
        _suspiciousPatternWeights["Invoke-WmiMethod"] = 15;
        _suspiciousPatternWeights["New-ScheduledTask"] = 15;
        _suspiciousPatternWeights["Register-ScheduledTask"] = 15;
        _suspiciousPatternWeights["New-Service"] = 20;
        _suspiciousPatternWeights["sc create"] = 20;
        _suspiciousPatternWeights["reg add"] = 15;
        _suspiciousPatternWeights["HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"] = 25;
    }

    private void LoadBuiltInRules()
    {
        // AMSI Bypass detection
        _rules.Add(new ScriptRule
        {
            Id = "amsi_bypass_1",
            Name = "AMSI Bypass Attempt",
            Description = "Detected attempt to disable or bypass AMSI",
            Pattern = @"amsiInitFailed|amsiContext|AmsiScanBuffer|AmsiUtils|Reflection.*amsi",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1562.001"
        });

        // Cradle techniques
        _rules.Add(new ScriptRule
        {
            Id = "cradle_1",
            Name = "Download Cradle",
            Description = "Script downloads and executes remote code",
            Pattern = @"(IEX|Invoke-Expression).*\((New-Object\s+Net\.WebClient\)|Invoke-WebRequest|curl|wget)",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1059.001"
        });

        // Credential theft
        _rules.Add(new ScriptRule
        {
            Id = "cred_1",
            Name = "Credential Dumping",
            Description = "Script attempts to dump credentials",
            Pattern = @"sekurlsa|lsass|SAM|SYSTEM|mimikatz|Invoke-Mimikatz|Get-GPPPassword",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1003"
        });

        // Defender tampering
        _rules.Add(new ScriptRule
        {
            Id = "defender_1",
            Name = "Defender Tampering",
            Description = "Script modifies Windows Defender settings",
            Pattern = @"(Set|Add)-MpPreference.*(-Exclusion|-DisableRealtimeMonitoring|-DisableIOAVProtection)",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1562.001"
        });

        // Encoded command execution
        _rules.Add(new ScriptRule
        {
            Id = "encoded_1",
            Name = "Encoded Command Execution",
            Description = "PowerShell executes encoded commands",
            Pattern = @"powershell.*-e(nc|ncodedcommand)?\s+[A-Za-z0-9+/=]{50,}",
            IsRegex = true,
            Severity = ScriptSeverity.High,
            MitreId = "T1027"
        });

        // Shellcode injection
        _rules.Add(new ScriptRule
        {
            Id = "shellcode_1",
            Name = "Shellcode Injection Pattern",
            Description = "Script contains shellcode injection patterns",
            Pattern = @"VirtualAlloc.*PAGE_EXECUTE_READWRITE|WriteProcessMemory.*CreateThread",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1055.001"
        });

        // Persistence via registry
        _rules.Add(new ScriptRule
        {
            Id = "persist_1",
            Name = "Registry Persistence",
            Description = "Script adds registry-based persistence",
            Pattern = @"(New-ItemProperty|Set-ItemProperty|reg\s+add).*Run",
            IsRegex = true,
            Severity = ScriptSeverity.High,
            MitreId = "T1547.001"
        });

        // Scheduled task persistence
        _rules.Add(new ScriptRule
        {
            Id = "persist_2",
            Name = "Scheduled Task Persistence",
            Description = "Script creates scheduled tasks for persistence",
            Pattern = @"(schtasks|Register-ScheduledTask|New-ScheduledTask).*(/create|-Action)",
            IsRegex = true,
            Severity = ScriptSeverity.High,
            MitreId = "T1053.005"
        });

        // WMI event subscription
        _rules.Add(new ScriptRule
        {
            Id = "persist_3",
            Name = "WMI Event Persistence",
            Description = "Script uses WMI for persistence",
            Pattern = @"__EventFilter|CommandLineEventConsumer|__FilterToConsumerBinding",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1546.003"
        });

        // Lateral movement
        _rules.Add(new ScriptRule
        {
            Id = "lateral_1",
            Name = "Lateral Movement Attempt",
            Description = "Script attempts lateral movement",
            Pattern = @"(Invoke-WmiMethod|Invoke-Command|Enter-PSSession|New-PSSession|wmic.*process.*call.*create).*(-ComputerName|/node:)",
            IsRegex = true,
            Severity = ScriptSeverity.Critical,
            MitreId = "T1021"
        });
    }

    public async Task<ScriptAnalysisResult> AnalyzeScriptAsync(string content, string? filePath = null)
    {
        Interlocked.Increment(ref _scriptsAnalyzed);

        var result = new ScriptAnalysisResult
        {
            OriginalContent = content,
            FilePath = filePath,
            AnalysisTime = DateTime.UtcNow
        };

        // 1. Detect script type
        result.ScriptType = DetectScriptType(content, filePath);

        // 2. Attempt deobfuscation
        var deobfuscated = await DeobfuscateAsync(content, result.ScriptType);
        result.DeobfuscatedContent = deobfuscated;
        result.WasObfuscated = deobfuscated != content;

        // 3. Calculate suspicion score
        var analysisContent = result.WasObfuscated ? deobfuscated : content;
        result.SuspicionScore = CalculateSuspicionScore(analysisContent);

        // 4. Check against rules
        result.MatchedRules = CheckRules(analysisContent);

        // 5. Extract IOCs
        result.ExtractedIOCs = ExtractIOCs(analysisContent);

        // 6. Behavior prediction
        result.PredictedBehaviors = PredictBehaviors(analysisContent);

        // 7. Calculate entropy
        result.ContentEntropy = CalculateEntropy(content);
        result.HighEntropy = result.ContentEntropy > 5.5;

        // 8. Determine threat level
        result.ThreatLevel = DetermineThreatLevel(result);
        result.IsMalicious = result.ThreatLevel >= ScriptSeverity.High;
        result.IsSuspicious = result.ThreatLevel >= ScriptSeverity.Medium || result.SuspicionScore > 40;

        if (result.IsMalicious)
        {
            Interlocked.Increment(ref _threatsBlocked);
            OnThreatDetected?.Invoke(this, new ScriptThreatEventArgs { Result = result });

            // Report to backend
            await _apiClient.ReportScriptThreatAsync(result);
        }
        else if (result.IsSuspicious)
        {
            Interlocked.Increment(ref _suspiciousScripts);
        }

        return result;
    }

    public async Task<ScriptAnalysisResult> AnalyzeFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            return new ScriptAnalysisResult
            {
                FilePath = filePath,
                Error = "File not found"
            };
        }

        var content = await File.ReadAllTextAsync(filePath);
        return await AnalyzeScriptAsync(content, filePath);
    }

    private ScriptType DetectScriptType(string content, string? filePath)
    {
        var ext = filePath != null ? Path.GetExtension(filePath).ToLowerInvariant() : "";

        return ext switch
        {
            ".ps1" or ".psm1" or ".psd1" => ScriptType.PowerShell,
            ".vbs" or ".vbe" => ScriptType.VBScript,
            ".js" or ".jse" => ScriptType.JScript,
            ".bat" or ".cmd" => ScriptType.Batch,
            ".wsf" => ScriptType.WSF,
            ".hta" => ScriptType.HTA,
            _ => DetectByContent(content)
        };
    }

    private ScriptType DetectByContent(string content)
    {
        if (content.Contains("function ", StringComparison.OrdinalIgnoreCase) &&
            (content.Contains("param(") || content.Contains("$")))
            return ScriptType.PowerShell;

        if (content.Contains("WScript", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("CreateObject", StringComparison.OrdinalIgnoreCase))
            return content.Contains("Function ", StringComparison.OrdinalIgnoreCase) 
                ? ScriptType.VBScript 
                : ScriptType.JScript;

        if (content.StartsWith("@echo", StringComparison.OrdinalIgnoreCase) ||
            content.Contains("%", StringComparison.OrdinalIgnoreCase))
            return ScriptType.Batch;

        return ScriptType.Unknown;
    }

    private async Task<string> DeobfuscateAsync(string content, ScriptType type)
    {
        var result = content;

        try
        {
            switch (type)
            {
                case ScriptType.PowerShell:
                    result = await DeobfuscatePowerShellAsync(content);
                    break;
                case ScriptType.VBScript:
                    result = DeobfuscateVBScript(content);
                    break;
                case ScriptType.Batch:
                    result = DeobfuscateBatch(content);
                    break;
            }
        }
        catch { }

        return result;
    }

    private async Task<string> DeobfuscatePowerShellAsync(string content)
    {
        var result = content;

        // 1. Decode Base64 encoded commands
        var base64Match = Regex.Match(result, @"-e(nc|ncodedcommand)?\s+([A-Za-z0-9+/=]+)", RegexOptions.IgnoreCase);
        if (base64Match.Success)
        {
            try
            {
                var encoded = base64Match.Groups[2].Value;
                var decoded = System.Text.Encoding.Unicode.GetString(Convert.FromBase64String(encoded));
                result = result.Replace(base64Match.Value, $"# Decoded: {decoded}");
            }
            catch { }
        }

        // 2. Resolve string concatenation
        result = Regex.Replace(result, @"['""](\s*\+\s*)['""]", "", RegexOptions.IgnoreCase);

        // 3. Decode char array obfuscation
        var charMatch = Regex.Match(result, @"\[char\[\]\]\s*\(\s*(\d+(?:\s*,\s*\d+)*)\s*\)", RegexOptions.IgnoreCase);
        while (charMatch.Success)
        {
            try
            {
                var numbers = charMatch.Groups[1].Value.Split(',').Select(n => (char)int.Parse(n.Trim()));
                var decoded = new string(numbers.ToArray());
                result = result.Replace(charMatch.Value, $"\"{decoded}\"");
                charMatch = Regex.Match(result, @"\[char\[\]\]\s*\(\s*(\d+(?:\s*,\s*\d+)*)\s*\)", RegexOptions.IgnoreCase);
            }
            catch { break; }
        }

        // 4. Expand format string obfuscation
        var formatMatch = Regex.Match(result, @"\(\s*'([^']+)'\s*-f\s*'([^']+)'(?:\s*,\s*'([^']+)')*\s*\)");
        while (formatMatch.Success)
        {
            try
            {
                var format = formatMatch.Groups[1].Value;
                var args = formatMatch.Groups.Cast<Group>().Skip(2).Select(g => g.Value).ToArray();
                var formatted = string.Format(format, args);
                result = result.Replace(formatMatch.Value, $"'{formatted}'");
                formatMatch = Regex.Match(result, @"\(\s*'([^']+)'\s*-f\s*'([^']+)'(?:\s*,\s*'([^']+)')*\s*\)");
            }
            catch { break; }
        }

        // 5. Decode SecureString to plaintext if possible
        result = Regex.Replace(result, 
            @"ConvertTo-SecureString\s+-String\s+['""]([^'""]+)['""].*-AsPlainText", 
            "# Plaintext password: $1", 
            RegexOptions.IgnoreCase);

        return await Task.FromResult(result);
    }

    private string DeobfuscateVBScript(string content)
    {
        var result = content;

        // Decode Chr() obfuscation
        var chrMatch = Regex.Match(result, @"Chr\((\d+)\)(?:\s*&\s*Chr\((\d+)\))*", RegexOptions.IgnoreCase);
        while (chrMatch.Success)
        {
            try
            {
                var numbers = Regex.Matches(chrMatch.Value, @"\d+")
                    .Select(m => (char)int.Parse(m.Value));
                var decoded = new string(numbers.ToArray());
                result = result.Replace(chrMatch.Value, $"\"{decoded}\"");
                chrMatch = Regex.Match(result, @"Chr\((\d+)\)(?:\s*&\s*Chr\((\d+)\))*", RegexOptions.IgnoreCase);
            }
            catch { break; }
        }

        return result;
    }

    private string DeobfuscateBatch(string content)
    {
        var result = content;

        // Expand environment variables
        var envMatch = Regex.Match(result, @"%([^%]+)%");
        while (envMatch.Success)
        {
            var varName = envMatch.Groups[1].Value;
            var varValue = Environment.GetEnvironmentVariable(varName);
            if (!string.IsNullOrEmpty(varValue))
            {
                result = result.Replace(envMatch.Value, varValue);
            }
            envMatch = envMatch.NextMatch();
        }

        // Decode caret escaping
        result = result.Replace("^", "");

        return result;
    }

    private int CalculateSuspicionScore(string content)
    {
        int score = 0;

        foreach (var pattern in _suspiciousPatternWeights)
        {
            if (content.Contains(pattern.Key, StringComparison.OrdinalIgnoreCase))
            {
                score += pattern.Value;
            }
        }

        return Math.Min(score, 100);
    }

    private List<ScriptRule> CheckRules(string content)
    {
        var matched = new List<ScriptRule>();

        foreach (var rule in _rules)
        {
            bool isMatch;
            if (rule.IsRegex)
            {
                isMatch = Regex.IsMatch(content, rule.Pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline);
            }
            else
            {
                isMatch = content.Contains(rule.Pattern, StringComparison.OrdinalIgnoreCase);
            }

            if (isMatch)
            {
                matched.Add(rule);
            }
        }

        return matched;
    }

    private List<ExtractedIOC> ExtractIOCs(string content)
    {
        var iocs = new List<ExtractedIOC>();

        // Extract URLs
        var urlMatches = Regex.Matches(content, @"https?://[^\s'""\)]+", RegexOptions.IgnoreCase);
        foreach (Match match in urlMatches)
        {
            iocs.Add(new ExtractedIOC { Type = "url", Value = match.Value });
        }

        // Extract IP addresses
        var ipMatches = Regex.Matches(content, @"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b");
        foreach (Match match in ipMatches)
        {
            if (!match.Value.StartsWith("0.") && !match.Value.StartsWith("127."))
            {
                iocs.Add(new ExtractedIOC { Type = "ip", Value = match.Value });
            }
        }

        // Extract file paths
        var pathMatches = Regex.Matches(content, @"[a-zA-Z]:\\[^\s'""\)]+", RegexOptions.IgnoreCase);
        foreach (Match match in pathMatches)
        {
            iocs.Add(new ExtractedIOC { Type = "file_path", Value = match.Value });
        }

        // Extract registry keys
        var regMatches = Regex.Matches(content, @"(HKLM|HKCU|HKCR|HKU|HKCC)[:\\][^\s'""\)]+", RegexOptions.IgnoreCase);
        foreach (Match match in regMatches)
        {
            iocs.Add(new ExtractedIOC { Type = "registry", Value = match.Value });
        }

        return iocs;
    }

    private List<string> PredictBehaviors(string content)
    {
        var behaviors = new List<string>();

        // Download
        if (Regex.IsMatch(content, @"(WebClient|Invoke-WebRequest|curl|wget|BitsTransfer)", RegexOptions.IgnoreCase))
            behaviors.Add("Downloads files from internet");

        // Execute
        if (Regex.IsMatch(content, @"(IEX|Invoke-Expression|Start-Process|cmd\.exe|powershell\.exe)", RegexOptions.IgnoreCase))
            behaviors.Add("Executes commands or processes");

        // Persistence
        if (Regex.IsMatch(content, @"(Run|RunOnce|schtasks|Register-ScheduledTask|New-Service)", RegexOptions.IgnoreCase))
            behaviors.Add("Establishes persistence");

        // Credential theft
        if (Regex.IsMatch(content, @"(lsass|SAM|mimikatz|sekurlsa|Get-Credential)", RegexOptions.IgnoreCase))
            behaviors.Add("Attempts credential theft");

        // Defense evasion
        if (Regex.IsMatch(content, @"(MpPreference|Exclusion|AMSI|bypass|unrestricted)", RegexOptions.IgnoreCase))
            behaviors.Add("Evades security controls");

        // Network activity
        if (Regex.IsMatch(content, @"(TcpClient|UdpClient|Socket|Net\.Sockets)", RegexOptions.IgnoreCase))
            behaviors.Add("Network communication");

        // Registry modification
        if (Regex.IsMatch(content, @"(Set-ItemProperty|New-ItemProperty|reg\s+add)", RegexOptions.IgnoreCase))
            behaviors.Add("Modifies registry");

        // File operations
        if (Regex.IsMatch(content, @"(Copy-Item|Move-Item|Remove-Item|Out-File|Set-Content)", RegexOptions.IgnoreCase))
            behaviors.Add("Modifies files");

        // Process injection
        if (Regex.IsMatch(content, @"(VirtualAlloc|WriteProcessMemory|CreateRemoteThread)", RegexOptions.IgnoreCase))
            behaviors.Add("Process injection");

        return behaviors;
    }

    private double CalculateEntropy(string text)
    {
        if (string.IsNullOrEmpty(text)) return 0;

        var freq = new Dictionary<char, int>();
        foreach (var c in text)
        {
            if (!freq.ContainsKey(c)) freq[c] = 0;
            freq[c]++;
        }

        double entropy = 0;
        foreach (var f in freq.Values)
        {
            double p = (double)f / text.Length;
            entropy -= p * Math.Log2(p);
        }

        return entropy;
    }

    private ScriptSeverity DetermineThreatLevel(ScriptAnalysisResult result)
    {
        // Critical if matches critical rules
        if (result.MatchedRules.Any(r => r.Severity == ScriptSeverity.Critical))
            return ScriptSeverity.Critical;

        // High if matches high rules or very high suspicion score
        if (result.MatchedRules.Any(r => r.Severity == ScriptSeverity.High) || result.SuspicionScore > 70)
            return ScriptSeverity.High;

        // Medium if suspicious indicators
        if (result.MatchedRules.Any(r => r.Severity == ScriptSeverity.Medium) || 
            result.SuspicionScore > 40 || 
            result.WasObfuscated)
            return ScriptSeverity.Medium;

        // Low if minor concerns
        if (result.SuspicionScore > 20 || result.HighEntropy)
            return ScriptSeverity.Low;

        return ScriptSeverity.None;
    }

    public async Task<bool> BlockScriptExecutionAsync(string filePath)
    {
        try
        {
            // Set deny ACL to prevent execution
            var fileInfo = new FileInfo(filePath);
            var security = fileInfo.GetAccessControl();
            
            // Add deny rule for execute
            security.AddAccessRule(new System.Security.AccessControl.FileSystemAccessRule(
                "Everyone",
                System.Security.AccessControl.FileSystemRights.ExecuteFile,
                System.Security.AccessControl.AccessControlType.Deny
            ));

            fileInfo.SetAccessControl(security);

            Console.WriteLine($"[Script Analyzer] Blocked execution: {filePath}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Script Analyzer] Failed to block {filePath}: {ex.Message}");
            return false;
        }
    }

    public ScriptAnalyzerStats GetStats()
    {
        return new ScriptAnalyzerStats
        {
            ScriptsAnalyzed = _scriptsAnalyzed,
            ThreatsBlocked = _threatsBlocked,
            SuspiciousScripts = _suspiciousScripts,
            RulesLoaded = _rules.Count
        };
    }
}

// Supporting classes

public enum ScriptType
{
    Unknown,
    PowerShell,
    VBScript,
    JScript,
    Batch,
    WSF,
    HTA
}

public enum ScriptSeverity
{
    None,
    Low,
    Medium,
    High,
    Critical
}

public class ScriptRule
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Pattern { get; set; } = "";
    public bool IsRegex { get; set; }
    public ScriptSeverity Severity { get; set; }
    public string? MitreId { get; set; }
}

public class ScriptAnalysisResult
{
    public string? FilePath { get; set; }
    public string OriginalContent { get; set; } = "";
    public string DeobfuscatedContent { get; set; } = "";
    public ScriptType ScriptType { get; set; }
    public DateTime AnalysisTime { get; set; }
    public bool WasObfuscated { get; set; }
    public int SuspicionScore { get; set; }
    public double ContentEntropy { get; set; }
    public bool HighEntropy { get; set; }
    public bool IsMalicious { get; set; }
    public bool IsSuspicious { get; set; }
    public ScriptSeverity ThreatLevel { get; set; }
    public List<ScriptRule> MatchedRules { get; set; } = new();
    public List<ExtractedIOC> ExtractedIOCs { get; set; } = new();
    public List<string> PredictedBehaviors { get; set; } = new();
    public string? Error { get; set; }
}

public class ExtractedIOC
{
    public string Type { get; set; } = "";
    public string Value { get; set; } = "";
}

public class ScriptAnalyzerStats
{
    public long ScriptsAnalyzed { get; set; }
    public long ThreatsBlocked { get; set; }
    public long SuspiciousScripts { get; set; }
    public int RulesLoaded { get; set; }
}

public class ScriptThreatEventArgs : EventArgs
{
    public ScriptAnalysisResult Result { get; set; } = new();
}
