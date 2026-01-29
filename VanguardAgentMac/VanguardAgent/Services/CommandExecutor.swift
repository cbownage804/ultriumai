//
//  CommandExecutor.swift
//  VanguardAgent
//
//  Executes remote commands from the Vanguard platform
//

import Foundation

struct CommandResult {
    let success: Bool
    let output: String
    let error: String?
}

class CommandExecutor {
    
    func execute(type: String, payload: [String: Any]) async -> CommandResult {
        switch type {
        case "shell":
            return executeShell(payload)
        case "applescript":
            return executeAppleScript(payload)
        case "get_system_info":
            return getSystemInfo()
        case "list_apps":
            return listInstalledApps()
        case "restart":
            return scheduleRestart(payload)
        case "install_brew_package":
            return installBrewPackage(payload)
        case "get_logs":
            return getSystemLogs(payload)
        default:
            return CommandResult(success: false, output: "", error: "Unknown command type: \(type)")
        }
    }
    
    // MARK: - Shell Commands
    
    private func executeShell(_ payload: [String: Any]) -> CommandResult {
        guard let command = payload["command"] as? String else {
            return CommandResult(success: false, output: "", error: "No command specified")
        }
        
        let task = Process()
        task.launchPath = "/bin/zsh"
        task.arguments = ["-c", command]
        
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        task.standardOutput = outputPipe
        task.standardError = errorPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
            
            let output = String(data: outputData, encoding: .utf8) ?? ""
            let error = String(data: errorData, encoding: .utf8)
            
            return CommandResult(
                success: task.terminationStatus == 0,
                output: output,
                error: error?.isEmpty == true ? nil : error
            )
        } catch {
            return CommandResult(success: false, output: "", error: error.localizedDescription)
        }
    }
    
    // MARK: - AppleScript
    
    private func executeAppleScript(_ payload: [String: Any]) -> CommandResult {
        guard let script = payload["script"] as? String else {
            return CommandResult(success: false, output: "", error: "No script specified")
        }
        
        let task = Process()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e", script]
        
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        task.standardOutput = outputPipe
        task.standardError = errorPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: outputData, encoding: .utf8) ?? ""
            
            return CommandResult(success: task.terminationStatus == 0, output: output, error: nil)
        } catch {
            return CommandResult(success: false, output: "", error: error.localizedDescription)
        }
    }
    
    // MARK: - System Info
    
    private func getSystemInfo() -> CommandResult {
        let info: [String: Any] = [
            "hostname": Host.current().localizedName ?? "Unknown",
            "os_version": ProcessInfo.processInfo.operatingSystemVersionString,
            "processor_count": ProcessInfo.processInfo.processorCount,
            "physical_memory": ProcessInfo.processInfo.physicalMemory,
            "uptime": ProcessInfo.processInfo.systemUptime
        ]
        
        if let data = try? JSONSerialization.data(withJSONObject: info, options: .prettyPrinted),
           let json = String(data: data, encoding: .utf8) {
            return CommandResult(success: true, output: json, error: nil)
        }
        
        return CommandResult(success: false, output: "", error: "Failed to serialize system info")
    }
    
    // MARK: - Installed Apps
    
    private func listInstalledApps() -> CommandResult {
        let applicationsPath = "/Applications"
        let fileManager = FileManager.default
        
        do {
            let apps = try fileManager.contentsOfDirectory(atPath: applicationsPath)
                .filter { $0.hasSuffix(".app") }
                .map { $0.replacingOccurrences(of: ".app", with: "") }
            
            let output = apps.joined(separator: "\n")
            return CommandResult(success: true, output: output, error: nil)
        } catch {
            return CommandResult(success: false, output: "", error: error.localizedDescription)
        }
    }
    
    // MARK: - Restart
    
    private func scheduleRestart(_ payload: [String: Any]) -> CommandResult {
        let delay = payload["delay_seconds"] as? Int ?? 60
        
        let script = "tell application \"System Events\" to restart"
        
        // Schedule with delay
        DispatchQueue.global().asyncAfter(deadline: .now() + .seconds(delay)) {
            let task = Process()
            task.launchPath = "/usr/bin/osascript"
            task.arguments = ["-e", script]
            try? task.run()
        }
        
        return CommandResult(success: true, output: "Restart scheduled in \(delay) seconds", error: nil)
    }
    
    // MARK: - Homebrew Package
    
    private func installBrewPackage(_ payload: [String: Any]) -> CommandResult {
        guard let packageName = payload["package"] as? String else {
            return CommandResult(success: false, output: "", error: "No package specified")
        }
        
        // Find brew path
        let brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        guard let brewPath = brewPaths.first(where: { FileManager.default.fileExists(atPath: $0) }) else {
            return CommandResult(success: false, output: "", error: "Homebrew not installed")
        }
        
        let task = Process()
        task.launchPath = brewPath
        task.arguments = ["install", packageName]
        
        let outputPipe = Pipe()
        task.standardOutput = outputPipe
        task.standardError = outputPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: outputData, encoding: .utf8) ?? ""
            
            return CommandResult(
                success: task.terminationStatus == 0,
                output: output,
                error: task.terminationStatus != 0 ? "Installation failed" : nil
            )
        } catch {
            return CommandResult(success: false, output: "", error: error.localizedDescription)
        }
    }
    
    // MARK: - System Logs
    
    private func getSystemLogs(_ payload: [String: Any]) -> CommandResult {
        let lines = payload["lines"] as? Int ?? 100
        let predicate = payload["predicate"] as? String
        
        var args = ["show", "--last", "1h", "--style", "compact"]
        
        if let pred = predicate {
            args.append(contentsOf: ["--predicate", pred])
        }
        
        let task = Process()
        task.launchPath = "/usr/bin/log"
        task.arguments = args
        
        let outputPipe = Pipe()
        task.standardOutput = outputPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: outputData, encoding: .utf8) ?? ""
            
            // Limit to requested lines
            let limitedOutput = output.components(separatedBy: "\n").suffix(lines).joined(separator: "\n")
            
            return CommandResult(success: true, output: limitedOutput, error: nil)
        } catch {
            return CommandResult(success: false, output: "", error: error.localizedDescription)
        }
    }
}
