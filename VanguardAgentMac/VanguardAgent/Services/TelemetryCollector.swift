//
//  TelemetryCollector.swift
//  VanguardAgent
//
//  Collects system telemetry: CPU, RAM, disk, network, processes
//

import Foundation
import IOKit
import Darwin

class TelemetryCollector {
    
    func collect() -> [String: Any] {
        return [
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "cpu": collectCPU(),
            "memory": collectMemory(),
            "disk": collectDisk(),
            "network": collectNetwork(),
            "processes": collectTopProcesses(),
            "system": collectSystemInfo()
        ]
    }
    
    // MARK: - CPU
    
    private func collectCPU() -> [String: Any] {
        var cpuInfo = host_cpu_load_info()
        var count = mach_msg_type_number_t(MemoryLayout<host_cpu_load_info>.stride / MemoryLayout<integer_t>.stride)
        let host = mach_host_self()
        
        let result = withUnsafeMutablePointer(to: &cpuInfo) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics(host, HOST_CPU_LOAD_INFO, $0, &count)
            }
        }
        
        if result == KERN_SUCCESS {
            let user = Double(cpuInfo.cpu_ticks.0)
            let system = Double(cpuInfo.cpu_ticks.1)
            let idle = Double(cpuInfo.cpu_ticks.2)
            let total = user + system + idle
            
            return [
                "usage_percent": total > 0 ? ((user + system) / total) * 100 : 0,
                "user_percent": total > 0 ? (user / total) * 100 : 0,
                "system_percent": total > 0 ? (system / total) * 100 : 0,
                "core_count": ProcessInfo.processInfo.processorCount
            ]
        }
        
        return ["usage_percent": 0, "core_count": ProcessInfo.processInfo.processorCount]
    }
    
    // MARK: - Memory
    
    private func collectMemory() -> [String: Any] {
        let physicalMemory = ProcessInfo.processInfo.physicalMemory
        
        var vmStats = vm_statistics64()
        var count = mach_msg_type_number_t(MemoryLayout<vm_statistics64>.stride / MemoryLayout<integer_t>.stride)
        let host = mach_host_self()
        
        let result = withUnsafeMutablePointer(to: &vmStats) {
            $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
                host_statistics64(host, HOST_VM_INFO64, $0, &count)
            }
        }
        
        if result == KERN_SUCCESS {
            let pageSize = UInt64(vm_kernel_page_size)
            let freeMemory = UInt64(vmStats.free_count) * pageSize
            let usedMemory = physicalMemory - freeMemory
            
            return [
                "total_bytes": physicalMemory,
                "used_bytes": usedMemory,
                "free_bytes": freeMemory,
                "usage_percent": Double(usedMemory) / Double(physicalMemory) * 100
            ]
        }
        
        return [
            "total_bytes": physicalMemory,
            "used_bytes": 0,
            "free_bytes": 0,
            "usage_percent": 0
        ]
    }
    
    // MARK: - Disk
    
    private func collectDisk() -> [[String: Any]] {
        var disks: [[String: Any]] = []
        
        let fileManager = FileManager.default
        let homeURL = fileManager.homeDirectoryForCurrentUser
        
        do {
            let values = try homeURL.resourceValues(forKeys: [.volumeTotalCapacityKey, .volumeAvailableCapacityKey])
            
            if let total = values.volumeTotalCapacity,
               let available = values.volumeAvailableCapacity {
                let used = total - available
                disks.append([
                    "mount_point": "/",
                    "total_bytes": total,
                    "used_bytes": used,
                    "free_bytes": available,
                    "usage_percent": Double(used) / Double(total) * 100
                ])
            }
        } catch {
            print("Failed to get disk info: \(error)")
        }
        
        return disks
    }
    
    // MARK: - Network
    
    private func collectNetwork() -> [[String: Any]] {
        var interfaces: [[String: Any]] = []
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        
        guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else {
            return interfaces
        }
        
        defer { freeifaddrs(ifaddr) }
        
        var currentAddr: UnsafeMutablePointer<ifaddrs>? = firstAddr
        
        while let addr = currentAddr {
            let name = String(cString: addr.pointee.ifa_name)
            
            // Skip loopback and virtual interfaces
            if name != "lo0" && !name.hasPrefix("utun") {
                if addr.pointee.ifa_addr?.pointee.sa_family == UInt8(AF_INET) {
                    var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    getnameinfo(addr.pointee.ifa_addr, socklen_t(addr.pointee.ifa_addr.pointee.sa_len),
                               &hostname, socklen_t(hostname.count), nil, 0, NI_NUMERICHOST)
                    
                    let ipAddress = String(cString: hostname)
                    
                    // Only add if not already in list
                    if !interfaces.contains(where: { $0["name"] as? String == name }) {
                        interfaces.append([
                            "name": name,
                            "ip_address": ipAddress,
                            "is_up": (addr.pointee.ifa_flags & UInt32(IFF_UP)) != 0
                        ])
                    }
                }
            }
            
            currentAddr = addr.pointee.ifa_next
        }
        
        return interfaces
    }
    
    // MARK: - Processes
    
    private func collectTopProcesses() -> [[String: Any]] {
        let task = Process()
        task.launchPath = "/bin/ps"
        task.arguments = ["-axo", "pid,pcpu,pmem,comm", "-r"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8) ?? ""
            
            var processes: [[String: Any]] = []
            let lines = output.components(separatedBy: "\n").dropFirst() // Skip header
            
            for (index, line) in lines.prefix(10).enumerated() {
                let parts = line.split(separator: " ", maxSplits: 3, omittingEmptySubsequences: true)
                if parts.count >= 4 {
                    processes.append([
                        "pid": Int(parts[0]) ?? 0,
                        "cpu_percent": Double(parts[1]) ?? 0,
                        "memory_percent": Double(parts[2]) ?? 0,
                        "name": String(parts[3])
                    ])
                }
            }
            
            return processes
        } catch {
            return []
        }
    }
    
    // MARK: - System Info
    
    private func collectSystemInfo() -> [String: Any] {
        return [
            "hostname": Host.current().localizedName ?? "Unknown",
            "os_version": ProcessInfo.processInfo.operatingSystemVersionString,
            "uptime_seconds": ProcessInfo.processInfo.systemUptime,
            "boot_time": Date(timeIntervalSinceNow: -ProcessInfo.processInfo.systemUptime).ISO8601Format()
        ]
    }
}
