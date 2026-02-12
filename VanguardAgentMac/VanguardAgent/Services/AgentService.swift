//
//  AgentService.swift
//  VanguardAgent
//
//  Core agent service handling telemetry, heartbeats, and command execution
//

import Foundation
import Combine
import IOKit
import SystemConfiguration

class AgentService: ObservableObject {
    @Published var isRunning = false
    @Published var lastHeartbeat: Date?
    @Published var connectionStatus: ConnectionStatus = .disconnected
    
    private var heartbeatTimer: Timer?
    private var telemetryTimer: Timer?
    private var commandPollTimer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    private let config = AgentConfig.shared
    private let telemetryCollector = TelemetryCollector()
    private let commandExecutor = CommandExecutor()
    
    enum ConnectionStatus {
        case connected, disconnected, connecting
    }
    
    func start() {
        guard !isRunning else { return }
        isRunning = true
        
        // Initial registration
        Task {
            await register()
        }
        
        // Start heartbeat timer (every 60 seconds)
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { await self?.sendHeartbeat() }
        }
        
        // Start telemetry collection (every 5 minutes)
        telemetryTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task { await self?.collectAndSendTelemetry() }
        }
        
        // Poll for commands (every 30 seconds)
        commandPollTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            Task { await self?.pollForCommands() }
        }
        
        // Initial telemetry send
        Task {
            await collectAndSendTelemetry()
        }
    }
    
    func stop() {
        isRunning = false
        heartbeatTimer?.invalidate()
        telemetryTimer?.invalidate()
        commandPollTimer?.invalidate()
        heartbeatTimer = nil
        telemetryTimer = nil
        commandPollTimer = nil
    }
    
    // MARK: - API Calls
    
    private func register() async {
        connectionStatus = .connecting
        
        let payload: [String: Any] = [
            "user_id": config.userId,
            "device_name": config.deviceName,
            "os_type": "macos",
            "os_version": ProcessInfo.processInfo.operatingSystemVersionString,
            "hostname": Host.current().localizedName ?? "Unknown",
            "agent_version": "1.0.0"
        ]
        
        do {
            let _ = try await apiRequest(action: "register", payload: payload)
            connectionStatus = .connected
        } catch {
            print("Registration failed: \(error)")
            connectionStatus = .disconnected
        }
    }
    
    private func sendHeartbeat() async {
        let payload: [String: Any] = [
            "status": "online",
            "uptime": ProcessInfo.processInfo.systemUptime
        ]
        
        do {
            let _ = try await apiRequest(action: "heartbeat", payload: payload)
            lastHeartbeat = Date()
            connectionStatus = .connected
        } catch {
            connectionStatus = .disconnected
        }
    }
    
    private func collectAndSendTelemetry() async {
        let telemetry = telemetryCollector.collect()
        
        let payload: [String: Any] = [
            "telemetry": telemetry
        ]
        
        do {
            let _ = try await apiRequest(action: "telemetry", payload: payload)
        } catch {
            print("Telemetry send failed: \(error)")
        }
    }
    
    private func pollForCommands() async {
        do {
            let response = try await apiRequest(action: "poll_commands", payload: [:])
            
            if let commands = response["commands"] as? [[String: Any]] {
                for command in commands {
                    await executeCommand(command)
                }
            }
        } catch {
            print("Command poll failed: \(error)")
        }
    }
    
    private func executeCommand(_ command: [String: Any]) async {
        guard let commandId = command["id"] as? String,
              let commandType = command["command_type"] as? String else {
            return
        }
        
        let result = await commandExecutor.execute(type: commandType, payload: command["payload"] as? [String: Any] ?? [:])
        
        // Report result back
        let payload: [String: Any] = [
            "command_id": commandId,
            "status": result.success ? "completed" : "failed",
            "output": result.output,
            "error": result.error ?? ""
        ]
        
        do {
            let _ = try await apiRequest(action: "command_result", payload: payload)
        } catch {
            print("Failed to report command result: \(error)")
        }
    }
    
    // MARK: - API Request Helper
    
    private func apiRequest(action: String, payload: [String: Any]) async throws -> [String: Any] {
        guard let url = URL(string: "\(config.apiEndpoint)?action=\(action)") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(config.secretKey, forHTTPHeaderField: "X-VANGUARD-KEY")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
    }
}

// MARK: - Configuration

class AgentConfig {
    static let shared = AgentConfig()
    
    @UserDefaultsBacked(key: "apiEndpoint", defaultValue: "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api")
    var apiEndpoint: String
    
    @UserDefaultsBacked(key: "userId", defaultValue: "")
    var userId: String
    
    @UserDefaultsBacked(key: "secretKey", defaultValue: "")
    var secretKey: String
    
    @UserDefaultsBacked(key: "deviceName", defaultValue: Host.current().localizedName ?? "Mac")
    var deviceName: String
}

@propertyWrapper
struct UserDefaultsBacked<T> {
    let key: String
    let defaultValue: T
    
    var wrappedValue: T {
        get { UserDefaults.standard.object(forKey: key) as? T ?? defaultValue }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }
}
