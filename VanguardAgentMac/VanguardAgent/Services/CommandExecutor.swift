//
//  CommandExecutor.swift
//  VanguardAgent
//
//  Executes remote commands from the Vanguard platform
//

import Foundation

struct CommandResult {
    let success: Bool
    let output: Any?
    let error: String?
}

class CommandExecutor {
    
    func execute(type: String, payload: [String: Any]) async -> CommandResult {
        switch type {
        // Shell and scripting
        case "shell", "execute_command":
            return executeShell(payload)
        case "applescript":
            return executeAppleScript(payload)
        case "run_script":
            return executeShell(payload)
            
        // System info
        case "get_system_info":
            return getSystemInfo()
        case "get_metrics":
            return await getSystemMetrics()
            
        // Process management
        case "get_processes":
            return getProcesses()
        case "kill_process":
            return killProcess(pid: payload["pid"] as? Int ?? 0)
        case "kill_process_tree":
            return killProcessTree(pid: payload["pid"] as? Int ?? 0)
            
        // Service management (launchd)
        case "get_services":
            return getServices()
        case "service_control":
            return controlService(
                name: payload["service"] as? String ?? "",
                action: payload["action"] as? String ?? ""
            )
            
        // Software management
        case "list_apps", "get_software":
            return getInstalledSoftware()
        case "install_brew_package", "install_software":
            return installSoftware(payload)
        case "uninstall_software":
            return uninstallSoftware(name: payload["name"] as? String ?? "")
            
        // Event logs
        case "get_logs", "get_event_logs":
            return getSystemLogs(payload)
            
        // File operations
        case "list_directory":
            return listDirectory(path: payload["path"] as? String ?? "/")
        case "read_file":
            return readFile(path: payload["path"] as? String ?? "")
        case "write_file":
            return writeFile(path: payload["path"] as? String ?? "", content: payload["content"] as? String ?? "")
        case "delete_file":
            return deleteFile(path: payload["path"] as? String ?? "")
            
        // System control
        case "restart":
            return scheduleRestart(payload)
            
        default:
            return CommandResult(success: false, output: nil, error: "Unknown command type: \(type)")
        }
    }
    
    // MARK: - Shell Commands
    
    private func executeShell(_ payload: [String: Any]) -> CommandResult {
        guard let command = payload["command"] as? String else {
            return CommandResult(success: false, output: nil, error: "No command specified")
        }
        
        let task = Process()
        task.launchPath = "/bin/zsh"
        task.arguments = ["-c", command]
        
        if let cwd = payload["cwd"] as? String {
            task.currentDirectoryURL = URL(fileURLWithPath: cwd)
        }
        
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        task.standardOutput = outputPipe
        task.standardError = errorPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
            
            let stdout = String(data: outputData, encoding: .utf8) ?? ""
            let stderr = String(data: errorData, encoding: .utf8) ?? ""
            
            return CommandResult(
                success: task.terminationStatus == 0,
                output: [
                    "stdout": stdout,
                    "stderr": stderr,
                    "exitCode": task.terminationStatus
                ],
                error: task.terminationStatus != 0 ? stderr : nil
            )
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    // MARK: - AppleScript
    
    private func executeAppleScript(_ payload: [String: Any]) -> CommandResult {
        guard let script = payload["script"] as? String else {
            return CommandResult(success: false, output: nil, error: "No script specified")
        }
        
        let task = Process()
        task.launchPath = "/usr/bin/osascript"
        task.arguments = ["-e", script]
        
        let outputPipe = Pipe()
        task.standardOutput = outputPipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: outputData, encoding: .utf8) ?? ""
            
            return CommandResult(success: task.terminationStatus == 0, output: output, error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
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
        return CommandResult(success: true, output: info, error: nil)
    }
    
    private func getSystemMetrics() async -> CommandResult {
        let collector = TelemetryCollector()
        let telemetry = collector.collect()
        return CommandResult(success: true, output: telemetry, error: nil)
    }
    
    // MARK: - Process Management
    
    private func getProcesses() -> CommandResult {
        let task = Process()
        task.launchPath = "/bin/ps"
        task.arguments = ["-axo", "pid,pcpu,pmem,rss,comm,user", "-r"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""
            
            var processes: [[String: Any]] = []
            let lines = output.components(separatedBy: "\n").dropFirst()
            
            for line in lines.prefix(100) {
                let parts = line.split(separator: " ", maxSplits: 5, omittingEmptySubsequences: true)
                if parts.count >= 5 {
                    let memoryKB = Int(parts[3]) ?? 0
                    processes.append([
                        "pid": Int(parts[0]) ?? 0,
                        "cpu": Double(parts[1]) ?? 0,
                        "memory": Double(parts[2]) ?? 0,
                        "memoryMB": memoryKB / 1024,
                        "name": String(parts[4]),
                        "user": parts.count > 5 ? String(parts[5]) : "",
                        "threads": 0,
                        "handles": 0,
                        "status": "running"
                    ])
                }
            }
            
            return CommandResult(success: true, output: ["processes": processes], error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func killProcess(pid: Int) -> CommandResult {
        let task = Process()
        task.launchPath = "/bin/kill"
        task.arguments = ["-9", String(pid)]
        
        do {
            try task.run()
            task.waitUntilExit()
            return CommandResult(success: task.terminationStatus == 0, output: nil, error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func killProcessTree(pid: Int) -> CommandResult {
        // Kill child processes first
        let pkillTask = Process()
        pkillTask.launchPath = "/usr/bin/pkill"
        pkillTask.arguments = ["-9", "-P", String(pid)]
        try? pkillTask.run()
        pkillTask.waitUntilExit()
        
        // Then kill parent
        return killProcess(pid: pid)
    }
    
    // MARK: - Service Management (launchd)
    
    private func getServices() -> CommandResult {
        let task = Process()
        task.launchPath = "/bin/launchctl"
        task.arguments = ["list"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""
            
            var services: [[String: Any]] = []
            let lines = output.components(separatedBy: "\n").dropFirst()
            
            for line in lines {
                let parts = line.split(separator: "\t", omittingEmptySubsequences: false)
                if parts.count >= 3 {
                    let pid = Int(parts[0]) ?? -1
                    let name = String(parts[2])
                    
                    services.append([
                        "name": name,
                        "displayName": name,
                        "status": pid > 0 ? "running" : "stopped",
                        "startType": "automatic",
                        "pid": pid > 0 ? pid : NSNull()
                    ])
                }
            }
            
            return CommandResult(success: true, output: ["services": services], error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func controlService(name: String, action: String) -> CommandResult {
        let task = Process()
        task.launchPath = "/bin/launchctl"
        
        switch action {
        case "start":
            task.arguments = ["start", name]
        case "stop":
            task.arguments = ["stop", name]
        case "restart":
            // Stop first
            let stopTask = Process()
            stopTask.launchPath = "/bin/launchctl"
            stopTask.arguments = ["stop", name]
            try? stopTask.run()
            stopTask.waitUntilExit()
            Thread.sleep(forTimeInterval: 1)
            task.arguments = ["start", name]
        default:
            return CommandResult(success: false, output: nil, error: "Unknown action: \(action)")
        }
        
        do {
            try task.run()
            task.waitUntilExit()
            return CommandResult(success: task.terminationStatus == 0, output: nil, error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    // MARK: - Software Management
    
    private func getInstalledSoftware() -> CommandResult {
        var software: [[String: Any]] = []
        let fileManager = FileManager.default
        let appsURL = URL(fileURLWithPath: "/Applications")
        
        do {
            let apps = try fileManager.contentsOfDirectory(at: appsURL, includingPropertiesForKeys: [.creationDateKey])
            
            for appURL in apps where appURL.pathExtension == "app" {
                let appName = appURL.deletingPathExtension().lastPathComponent
                let plistURL = appURL.appendingPathComponent("Contents/Info.plist")
                
                var version = "Unknown"
                var publisher = "Unknown"
                
                if let plist = NSDictionary(contentsOf: plistURL) {
                    version = plist["CFBundleShortVersionString"] as? String ?? plist["CFBundleVersion"] as? String ?? "Unknown"
                    if let bundleId = plist["CFBundleIdentifier"] as? String {
                        let parts = bundleId.components(separatedBy: ".")
                        if parts.count >= 2 {
                            publisher = parts[1].capitalized
                        }
                    }
                }
                
                let attrs = try? fileManager.attributesOfItem(atPath: appURL.path)
                let size = (attrs?[.size] as? Int ?? 0) / 1024 / 1024
                let creationDate = attrs?[.creationDate] as? Date
                
                software.append([
                    "name": appName,
                    "version": version,
                    "publisher": publisher,
                    "installDate": creationDate?.ISO8601Format() ?? "",
                    "size": size,
                    "type": "application",
                    "uninstallable": true
                ])
            }
        } catch {
            // Continue with empty list
        }
        
        // Check Homebrew packages
        let brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        if let brewPath = brewPaths.first(where: { fileManager.fileExists(atPath: $0) }) {
            let listTask = Process()
            listTask.launchPath = brewPath
            listTask.arguments = ["list", "--versions"]
            let listPipe = Pipe()
            listTask.standardOutput = listPipe
            
            do {
                try listTask.run()
                listTask.waitUntilExit()
                
                let data = listPipe.fileHandleForReading.readDataToEndOfFile()
                let output = String(data: data, encoding: .utf8) ?? ""
                
                for line in output.components(separatedBy: "\n") {
                    let parts = line.split(separator: " ")
                    if parts.count >= 2 {
                        software.append([
                            "name": String(parts[0]),
                            "version": String(parts[1]),
                            "publisher": "Homebrew",
                            "type": "application",
                            "uninstallable": true
                        ])
                    }
                }
            } catch {
                // Brew list failed
            }
        }
        
        return CommandResult(success: true, output: ["software": software], error: nil)
    }
    
    private func installSoftware(_ payload: [String: Any]) -> CommandResult {
        guard let packageName = payload["package"] as? String else {
            return CommandResult(success: false, output: nil, error: "No package specified")
        }
        
        let brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        guard let brewPath = brewPaths.first(where: { FileManager.default.fileExists(atPath: $0) }) else {
            return CommandResult(success: false, output: nil, error: "Homebrew not installed")
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
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func uninstallSoftware(name: String) -> CommandResult {
        // Try Homebrew first
        let brewPaths = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"]
        if let brewPath = brewPaths.first(where: { FileManager.default.fileExists(atPath: $0) }) {
            let brewTask = Process()
            brewTask.launchPath = brewPath
            brewTask.arguments = ["uninstall", name]
            
            do {
                try brewTask.run()
                brewTask.waitUntilExit()
                if brewTask.terminationStatus == 0 {
                    return CommandResult(success: true, output: nil, error: nil)
                }
            } catch {
                // Fall through to app removal
            }
        }
        
        // Try removing from Applications
        let appPath = "/Applications/\(name).app"
        if FileManager.default.fileExists(atPath: appPath) {
            do {
                try FileManager.default.trashItem(at: URL(fileURLWithPath: appPath), resultingItemURL: nil)
                return CommandResult(success: true, output: nil, error: nil)
            } catch {
                return CommandResult(success: false, output: nil, error: error.localizedDescription)
            }
        }
        
        return CommandResult(success: false, output: nil, error: "Software not found: \(name)")
    }
    
    // MARK: - System Logs
    
    private func getSystemLogs(_ payload: [String: Any]) -> CommandResult {
        let limit = payload["limit"] as? Int ?? 100
        let logName = payload["logName"] as? String
        
        let task = Process()
        task.launchPath = "/usr/bin/log"
        task.arguments = ["show", "--last", "1h", "--style", "compact"]
        
        let outputPipe = Pipe()
        task.standardOutput = outputPipe
        task.standardError = Pipe()
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
            let lines = (String(data: outputData, encoding: .utf8) ?? "").components(separatedBy: "\n")
            
            var events: [[String: Any]] = []
            for (index, line) in lines.suffix(limit).enumerated() {
                guard !line.isEmpty else { continue }
                
                let level: String
                if line.contains("error") || line.contains("Error") {
                    level = "error"
                } else if line.contains("warning") || line.contains("Warning") {
                    level = "warning"
                } else {
                    level = "information"
                }
                
                events.append([
                    "id": UUID().uuidString,
                    "level": level,
                    "source": "system",
                    "eventId": index,
                    "message": String(line.prefix(500)),
                    "timestamp": ISO8601DateFormatter().string(from: Date()),
                    "category": logName ?? "System"
                ])
            }
            
            return CommandResult(success: true, output: ["events": events], error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    // MARK: - File Operations
    
    private func listDirectory(path: String) -> CommandResult {
        let fileManager = FileManager.default
        
        do {
            let contents = try fileManager.contentsOfDirectory(atPath: path)
            var items: [[String: Any]] = []
            
            for item in contents {
                let fullPath = (path as NSString).appendingPathComponent(item)
                var isDir: ObjCBool = false
                fileManager.fileExists(atPath: fullPath, isDirectory: &isDir)
                
                let attrs = try? fileManager.attributesOfItem(atPath: fullPath)
                
                items.append([
                    "name": item,
                    "path": fullPath,
                    "isDirectory": isDir.boolValue,
                    "size": attrs?[.size] as? Int ?? 0,
                    "modified": (attrs?[.modificationDate] as? Date)?.ISO8601Format() ?? ""
                ])
            }
            
            return CommandResult(success: true, output: ["items": items], error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func readFile(path: String) -> CommandResult {
        do {
            let data = try Data(contentsOf: URL(fileURLWithPath: path))
            let content = data.base64EncodedString()
            return CommandResult(success: true, output: ["content": content, "size": data.count], error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func writeFile(path: String, content: String) -> CommandResult {
        do {
            guard let data = Data(base64Encoded: content) else {
                return CommandResult(success: false, output: nil, error: "Invalid base64 content")
            }
            try data.write(to: URL(fileURLWithPath: path))
            return CommandResult(success: true, output: nil, error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    private func deleteFile(path: String) -> CommandResult {
        do {
            try FileManager.default.removeItem(atPath: path)
            return CommandResult(success: true, output: nil, error: nil)
        } catch {
            return CommandResult(success: false, output: nil, error: error.localizedDescription)
        }
    }
    
    // MARK: - Restart
    
    private func scheduleRestart(_ payload: [String: Any]) -> CommandResult {
        let delay = payload["delay_seconds"] as? Int ?? 60
        
        DispatchQueue.global().asyncAfter(deadline: .now() + .seconds(delay)) {
            let task = Process()
            task.launchPath = "/usr/bin/osascript"
            task.arguments = ["-e", "tell application \"System Events\" to restart"]
            try? task.run()
        }
        
        return CommandResult(success: true, output: "Restart scheduled in \(delay) seconds", error: nil)
    }
}
