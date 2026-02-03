-- Seed built-in scripts if they don't exist
INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Clear Temp Files',
  'Clears Windows temporary files and browser caches',
  'Cleanup',
  'powershell',
  E'# Clear Windows Temp Files\n$TempFolders = @("$env:TEMP", "$env:WINDIR\\Temp")\nforeach ($folder in $TempFolders) {\n    Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue\n}\nWrite-Host "Temporary files cleared successfully"',
  'System',
  true,
  false,
  0,
  ARRAY['cleanup', 'disk', 'temp', 'maintenance']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'Clear Temp Files' AND is_builtin = true);

INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Windows Update Status',
  'Checks for pending Windows updates and reports status',
  'Monitoring',
  'powershell',
  E'# Check Windows Update Status\n$Session = New-Object -ComObject Microsoft.Update.Session\n$Searcher = $Session.CreateUpdateSearcher()\n$Updates = $Searcher.Search("IsInstalled=0")\n\nWrite-Host "Pending Updates: $($Updates.Updates.Count)"\nforeach ($Update in $Updates.Updates) {\n    Write-Host "  - $($Update.Title)"\n}',
  'System',
  true,
  false,
  0,
  ARRAY['updates', 'monitoring', 'windows']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'Windows Update Status' AND is_builtin = true);

INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'System Health Check',
  'Comprehensive system health check including CPU, memory, and disk usage',
  'Monitoring',
  'powershell',
  E'# System Health Check\n$cpu = (Get-Counter "\\Processor(_Total)\\% Processor Time" -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue\n$os = Get-CimInstance Win32_OperatingSystem\n$memUsed = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize * 100, 2)\n$disks = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select-Object DeviceID, @{N="Used%";E={[math]::Round(($_.Size - $_.FreeSpace) / $_.Size * 100, 2)}}\n\nWrite-Host "=== System Health ===" \nWrite-Host "CPU Usage: $([math]::Round($cpu,2))%"\nWrite-Host "Memory Usage: $memUsed%"\nforeach ($disk in $disks) {\n    Write-Host "Disk $($disk.DeviceID): $($disk.''Used%'')% used"\n}',
  'System',
  true,
  false,
  0,
  ARRAY['health', 'monitoring', 'diagnostics', 'cpu', 'memory', 'disk']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'System Health Check' AND is_builtin = true);

INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Get Installed Software',
  'Lists all installed software on the system',
  'Reporting',
  'powershell',
  E'# Get Installed Software\n$Software = Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue |\n    Where-Object { $_.DisplayName } |\n    Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |\n    Sort-Object DisplayName\n\nWrite-Host "Installed Software: $($Software.Count) items"\n$Software | Format-Table -AutoSize',
  'System',
  true,
  false,
  0,
  ARRAY['software', 'inventory', 'reporting']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'Get Installed Software' AND is_builtin = true);

INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Restart Windows Services',
  'Restarts specified Windows services',
  'Maintenance',
  'powershell',
  E'# Restart Windows Services\nparam(\n    [string[]]$ServiceNames = @("Spooler", "wuauserv")\n)\n\nforeach ($service in $ServiceNames) {\n    try {\n        Write-Host "Restarting $service..."\n        Restart-Service -Name $service -Force -ErrorAction Stop\n        Write-Host "$service restarted successfully" -ForegroundColor Green\n    } catch {\n        Write-Host "Failed to restart $service : $_" -ForegroundColor Red\n    }\n}',
  'System',
  true,
  false,
  0,
  ARRAY['services', 'maintenance', 'restart']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'Restart Windows Services' AND is_builtin = true);

INSERT INTO vanguard_fleet_scripts (user_id, name, description, category, script_type, content, author, is_builtin, is_favorite, execution_count, tags)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Network Diagnostics',
  'Runs network diagnostics including ping and DNS tests',
  'Network',
  'powershell',
  E'# Network Diagnostics\n$targets = @("8.8.8.8", "1.1.1.1", "google.com")\n\nWrite-Host "=== Network Diagnostics ==="\n\nforeach ($target in $targets) {\n    $ping = Test-Connection -ComputerName $target -Count 2 -ErrorAction SilentlyContinue\n    if ($ping) {\n        $avg = ($ping | Measure-Object -Property ResponseTime -Average).Average\n        Write-Host "Ping $target : $([math]::Round($avg,2))ms avg" -ForegroundColor Green\n    } else {\n        Write-Host "Ping $target : Failed" -ForegroundColor Red\n    }\n}\n\nWrite-Host "`nDNS Servers:"\nGet-DnsClientServerAddress -AddressFamily IPv4 | Where-Object ServerAddresses | Select-Object InterfaceAlias, ServerAddresses',
  'System',
  true,
  false,
  0,
  ARRAY['network', 'diagnostics', 'ping', 'dns']
WHERE NOT EXISTS (SELECT 1 FROM vanguard_fleet_scripts WHERE name = 'Network Diagnostics' AND is_builtin = true);

-- Update RLS policy to allow reading built-in scripts
DROP POLICY IF EXISTS "Users can view builtin scripts" ON vanguard_fleet_scripts;
CREATE POLICY "Users can view builtin scripts"
  ON vanguard_fleet_scripts
  FOR SELECT
  USING (is_builtin = true OR auth.uid() = user_id);