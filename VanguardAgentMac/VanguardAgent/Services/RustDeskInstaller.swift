//
//  RustDeskInstaller.swift
//  VanguardAgent
//
//  RustDesk Auto-Installer Service for macOS
//  Automatically installs and configures RustDesk for built-in remote access
//  Supports dual-relay failover for high availability
//

import Foundation
import AppKit

/// Individual relay server configuration
struct RelayServerConfig: Codable {
    let server: String
    let publicKey: String
    let priority: Int
    let region: String
    
    enum CodingKeys: String, CodingKey {
        case server
        case publicKey = "public_key"
        case priority
        case region
    }
}

/// Relay configuration response from Vanguard API
struct RelayConfigResponse: Codable {
    // Legacy single-server format
    let relayServer: String?
    let publicKey: String?
    let apiServer: String?
    
    // New dual-relay format
    let relayServers: [RelayServerConfig]?
    let failoverEnabled: Bool?
    
    // Metadata
    let autoInstall: Bool?
    let rustdeskVersion: String?
    
    enum CodingKeys: String, CodingKey {
        case relayServer = "relay_server"
        case publicKey = "public_key"
        case apiServer = "api_server"
        case relayServers = "relay_servers"
        case failoverEnabled = "failover_enabled"
        case autoInstall = "auto_install"
        case rustdeskVersion = "rustdesk_version"
    }
}

class RustDeskInstaller {
    static let shared = RustDeskInstaller()
    
    // Relay server configuration (supports dual-relay)
    private var relayServers: [RelayServerConfig] = []
    private var failoverEnabled = false
    
    private let rustdeskVersion = "1.2.6"
    private var rustdeskDmgUrl: String {
        "https://github.com/rustdesk/rustdesk/releases/download/\(rustdeskVersion)/rustdesk-\(rustdeskVersion)-x86_64.dmg"
    }
    private var rustdeskArmDmgUrl: String {
        "https://github.com/rustdesk/rustdesk/releases/download/\(rustdeskVersion)/rustdesk-\(rustdeskVersion)-aarch64.dmg"
    }
    
    private init() {}
    
    // MARK: - Installation Check
    
    /// Check if RustDesk is installed
    func isRustDeskInstalled() -> Bool {
        let installPaths = [
            "/Applications/RustDesk.app",
            "\(NSHomeDirectory())/Applications/RustDesk.app"
        ]
        
        for path in installPaths {
            if FileManager.default.fileExists(atPath: path) {
                print("[RustDesk] Found installation at: \(path)")
                return true
            }
        }
        
        // Check if running
        let runningApps = NSWorkspace.shared.runningApplications
        if runningApps.contains(where: { $0.bundleIdentifier == "com.carriez.rustdesk" }) {
            print("[RustDesk] Found running application")
            return true
        }
        
        return false
    }
    
    /// Check if RustDesk is configured for Vanguard relay
    func isConfiguredForVanguard() -> Bool {
        guard !relayServers.isEmpty else { return false }
        
        let configPath = "\(NSHomeDirectory())/Library/Application Support/RustDesk/config/RustDesk.toml"
        
        guard let content = try? String(contentsOfFile: configPath, encoding: .utf8) else {
            return false
        }
        
        // Check if any of our relay servers are configured
        return relayServers.contains { content.lowercased().contains($0.server.lowercased()) }
    }
    
    // MARK: - Relay Configuration
    
    /// Fetch relay server configuration from Vanguard API (supports dual-relay)
    func fetchRelayConfig(apiBaseUrl: String) async -> Bool {
        let urlString = "\(apiBaseUrl)/functions/v1/vanguard-relay-config"
        
        guard let url = URL(string: urlString) else {
            print("[RustDesk] Invalid relay config URL")
            return false
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("[RustDesk] Failed to fetch relay config: bad response")
                return false
            }
            
            let decoder = JSONDecoder()
            let config = try decoder.decode(RelayConfigResponse.self, from: data)
            
            relayServers.removeAll()
            
            // Check for new dual-relay format
            if let servers = config.relayServers, !servers.isEmpty {
                relayServers = servers.sorted { $0.priority < $1.priority }
                failoverEnabled = config.failoverEnabled ?? false
                print("[RustDesk] Dual-relay config loaded: \(relayServers.count) servers, failover: \(failoverEnabled)")
            }
            // Fall back to legacy single-server format
            else if let server = config.relayServer, !server.isEmpty {
                relayServers.append(RelayServerConfig(
                    server: server,
                    publicKey: config.publicKey ?? "",
                    priority: 1,
                    region: "primary"
                ))
                print("[RustDesk] Legacy relay config loaded: \(server)")
            }
            
            return !relayServers.isEmpty
            
        } catch {
            print("[RustDesk] Failed to fetch relay config: \(error)")
            return false
        }
    }
    
    /// Set relay configuration manually (for offline scenarios)
    func setRelayConfig(primary: (server: String, key: String), secondary: (server: String, key: String)? = nil) {
        relayServers.removeAll()
        
        relayServers.append(RelayServerConfig(
            server: primary.server,
            publicKey: primary.key,
            priority: 1,
            region: "primary"
        ))
        
        if let secondary = secondary {
            relayServers.append(RelayServerConfig(
                server: secondary.server,
                publicKey: secondary.key,
                priority: 2,
                region: "secondary"
            ))
            failoverEnabled = true
        }
    }
    
    // MARK: - Installation
    
    /// Download and install RustDesk
    func installRustDesk() async -> Bool {
        print("[RustDesk] Starting installation...")
        
        // Determine architecture
        let isArm = ProcessInfo.processInfo.machineHardwareName == "arm64"
        let dmgUrl = isArm ? rustdeskArmDmgUrl : rustdeskDmgUrl
        
        guard let url = URL(string: dmgUrl) else {
            print("[RustDesk] Invalid download URL")
            return false
        }
        
        let tempDir = FileManager.default.temporaryDirectory
        let dmgPath = tempDir.appendingPathComponent("rustdesk-\(rustdeskVersion).dmg")
        
        do {
            print("[RustDesk] Downloading from \(dmgUrl)...")
            
            // Download DMG
            let (data, response) = try await URLSession.shared.data(from: url)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  httpResponse.statusCode == 200 else {
                print("[RustDesk] Download failed: bad response")
                return false
            }
            
            try data.write(to: dmgPath)
            print("[RustDesk] Downloaded to \(dmgPath.path)")
            
            // Mount DMG
            print("[RustDesk] Mounting DMG...")
            let mountProcess = Process()
            mountProcess.executableURL = URL(fileURLWithPath: "/usr/bin/hdiutil")
            mountProcess.arguments = ["attach", dmgPath.path, "-nobrowse", "-quiet"]
            try mountProcess.run()
            mountProcess.waitUntilExit()
            
            guard mountProcess.terminationStatus == 0 else {
                print("[RustDesk] Failed to mount DMG")
                return false
            }
            
            // Find mounted volume
            let volumePath = "/Volumes/RustDesk"
            let appPath = "\(volumePath)/RustDesk.app"
            
            guard FileManager.default.fileExists(atPath: appPath) else {
                print("[RustDesk] App not found in mounted DMG")
                try? unmountDmg(volumePath: volumePath)
                return false
            }
            
            // Copy to Applications
            print("[RustDesk] Installing to /Applications...")
            let destPath = "/Applications/RustDesk.app"
            
            // Remove existing installation if present
            if FileManager.default.fileExists(atPath: destPath) {
                try FileManager.default.removeItem(atPath: destPath)
            }
            
            try FileManager.default.copyItem(atPath: appPath, toPath: destPath)
            
            // Unmount DMG
            try? unmountDmg(volumePath: volumePath)
            
            // Clean up
            try? FileManager.default.removeItem(at: dmgPath)
            
            print("[RustDesk] Installation completed successfully")
            
            // Wait for app to be ready
            try await Task.sleep(nanoseconds: 2_000_000_000)
            
            // Configure for Vanguard relay
            await configureForVanguard()
            
            return true
            
        } catch {
            print("[RustDesk] Installation error: \(error)")
            try? FileManager.default.removeItem(at: dmgPath)
            return false
        }
    }
    
    private func unmountDmg(volumePath: String) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/hdiutil")
        process.arguments = ["detach", volumePath, "-quiet"]
        try process.run()
        process.waitUntilExit()
    }
    
    // MARK: - Configuration
    
    /// Configure RustDesk to use Vanguard relay server(s)
    func configureForVanguard() async -> Bool {
        guard !relayServers.isEmpty else {
            print("[RustDesk] No relay servers configured, skipping configuration")
            return false
        }
        
        let primaryRelay = relayServers[0]
        let failoverInfo = failoverEnabled && relayServers.count > 1 ? " (failover to \(relayServers[1].server))" : ""
        print("[RustDesk] Configuring for Vanguard relay: \(primaryRelay.server)\(failoverInfo)")
        
        // Create config directory
        let configDir = "\(NSHomeDirectory())/Library/Application Support/RustDesk/config"
        
        do {
            try FileManager.default.createDirectory(atPath: configDir, withIntermediateDirectories: true)
            
            // Generate RustDesk.toml configuration
            let configPath = "\(configDir)/RustDesk.toml"
            let config = generateConfig()
            
            try config.write(toFile: configPath, atomically: true, encoding: .utf8)
            print("[RustDesk] Configuration written to \(configPath)")
            
            // Also write to RustDesk2.toml for newer versions
            let config2Path = "\(configDir)/RustDesk2.toml"
            try config.write(toFile: config2Path, atomically: true, encoding: .utf8)
            
            // Restart RustDesk if running
            await restartRustDesk()
            
            return true
            
        } catch {
            print("[RustDesk] Configuration error: \(error)")
            return false
        }
    }
    
    /// Generate RustDesk TOML configuration with dual-relay support
    private func generateConfig() -> String {
        let primaryRelay = relayServers[0]
        
        // Build comma-separated relay server list for failover
        let relayServerList = relayServers.map { $0.server }.joined(separator: ",")
        
        var config = """
        rendezvous_server = '\(primaryRelay.server)'
        nat_type = 1
        serial = 0
        
        [options]
        custom-rendezvous-server = '\(relayServerList)'
        relay-server = '\(relayServerList)'
        api-server = ''
        direct-server = ''
        """
        
        // Add public key from primary server
        if !primaryRelay.publicKey.isEmpty {
            config += "\nkey = '\(primaryRelay.publicKey)'"
        }
        
        // Enable unattended access and failover settings
        config += """
        
        allow-auto-disconnect = 'N'
        enable-lan-discovery = 'N'
        allow-remote-config-modification = 'N'
        """
        
        // Add failover-specific settings as comments
        if failoverEnabled && relayServers.count > 1 {
            config += """
            
            # Dual-relay failover configuration
            # Primary: \(relayServers[0].server) (\(relayServers[0].region))
            # Secondary: \(relayServers[1].server) (\(relayServers[1].region))
            """
        }
        
        return config
    }
    
    /// Restart RustDesk to apply configuration
    private func restartRustDesk() async {
        // Find and terminate running RustDesk
        let runningApps = NSWorkspace.shared.runningApplications
        for app in runningApps where app.bundleIdentifier == "com.carriez.rustdesk" {
            app.terminate()
        }
        
        // Wait for termination
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        
        // Relaunch
        if let appUrl = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.carriez.rustdesk") {
            do {
                try await NSWorkspace.shared.openApplication(at: appUrl, configuration: NSWorkspace.OpenConfiguration())
                print("[RustDesk] Application restarted")
            } catch {
                print("[RustDesk] Failed to restart: \(error)")
            }
        }
    }
    
    // MARK: - RustDesk ID
    
    /// Get the current RustDesk ID
    func getRustDeskId() -> String? {
        let configPaths = [
            "\(NSHomeDirectory())/Library/Application Support/RustDesk/config/RustDesk.toml",
            "\(NSHomeDirectory())/Library/Application Support/RustDesk/config/RustDesk2.toml"
        ]
        
        for path in configPaths {
            guard let content = try? String(contentsOfFile: path, encoding: .utf8) else {
                continue
            }
            
            // Parse ID from TOML
            let pattern = #"id\s*=\s*"?(\d{9,})"?"#
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: content, range: NSRange(content.startIndex..., in: content)),
               let range = Range(match.range(at: 1), in: content) {
                return String(content[range])
            }
        }
        
        return nil
    }
    
    /// Get relay server status for diagnostics
    func getRelayStatus() -> (serverCount: Int, failoverEnabled: Bool, primaryServer: String) {
        return (
            relayServers.count,
            failoverEnabled,
            relayServers.first?.server ?? "Not configured"
        )
    }
    
    // MARK: - Full Workflow
    
    /// Full installation and configuration workflow
    func ensureInstalledAndConfigured(apiBaseUrl: String) async -> (success: Bool, rustDeskId: String?) {
        // Fetch relay configuration
        let _ = await fetchRelayConfig(apiBaseUrl: apiBaseUrl)
        
        let status = getRelayStatus()
        print("[RustDesk] Relay status: \(status.serverCount) server(s), failover: \(status.failoverEnabled)")
        
        // Check if already installed
        if !isRustDeskInstalled() {
            print("[RustDesk] Not installed, initiating installation...")
            let installed = await installRustDesk()
            if !installed {
                return (false, nil)
            }
        } else {
            print("[RustDesk] Already installed")
            
            // Ensure it's configured for Vanguard
            if !isConfiguredForVanguard() && !relayServers.isEmpty {
                print("[RustDesk] Not configured for Vanguard, applying configuration...")
                let _ = await configureForVanguard()
            }
        }
        
        // Wait for RustDesk to generate ID
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        
        let rustDeskId = getRustDeskId()
        print("[RustDesk] Current ID: \(rustDeskId ?? "Not yet generated")")
        
        return (true, rustDeskId)
    }
}

// MARK: - ProcessInfo Extension

extension ProcessInfo {
    var machineHardwareName: String {
        var sysinfo = utsname()
        uname(&sysinfo)
        return withUnsafePointer(to: &sysinfo.machine) {
            $0.withMemoryRebound(to: CChar.self, capacity: Int(_SYS_NAMELEN)) {
                String(cString: $0)
            }
        }
    }
}
