//
//  VanguardPortalApp.swift
//  VanguardPortal
//
//  Vanguard Customer Portal for macOS
//  White-labeled system tray support portal
//

import SwiftUI
import WebKit

@main
struct VanguardPortalApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            EmptyView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var popover: NSPopover?
    var config: PortalConfig?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        loadConfig()
        setupStatusItem()
        
        // Hide dock icon
        NSApp.setActivationPolicy(.accessory)
    }
    
    private func loadConfig() {
        // Try to load config from bundle or UserDefaults
        if let configPath = Bundle.main.path(forResource: "config", ofType: "json"),
           let data = FileManager.default.contents(atPath: configPath) {
            config = try? JSONDecoder().decode(PortalConfig.self, from: data)
        }
        
        // Fallback to defaults
        if config == nil {
            config = PortalConfig(
                portalKey: UserDefaults.standard.string(forKey: "portalKey") ?? "",
                portalUrl: UserDefaults.standard.string(forKey: "portalUrl") ?? "https://ultriumai.com/portal",
                companyName: UserDefaults.standard.string(forKey: "companyName") ?? "IT Support",
                brandColor: UserDefaults.standard.string(forKey: "brandColor") ?? "#3B82F6"
            )
        }
    }
    
    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "lifepreserver", accessibilityDescription: config?.companyName ?? "Support")
            button.toolTip = config?.companyName ?? "IT Support Portal"
            button.action = #selector(togglePopover)
        }
    }
    
    @objc func togglePopover() {
        if let popover = popover, popover.isShown {
            popover.close()
        } else {
            showPopover()
        }
    }
    
    private func showPopover() {
        let popover = NSPopover()
        popover.contentSize = NSSize(width: 380, height: 500)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(
            rootView: PortalContentView(config: config ?? PortalConfig.default)
        )
        
        if let button = statusItem?.button {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
        
        self.popover = popover
    }
}

// MARK: - Configuration

struct PortalConfig: Codable {
    let portalKey: String
    let portalUrl: String
    let companyName: String
    let brandColor: String
    
    static let `default` = PortalConfig(
        portalKey: "",
        portalUrl: "https://ultriumai.com/portal",
        companyName: "IT Support",
        brandColor: "#3B82F6"
    )
}

// MARK: - Portal Content View

struct PortalContentView: View {
    let config: PortalConfig
    @State private var selectedTab = 0
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "lifepreserver.fill")
                    .foregroundColor(Color(hex: config.brandColor))
                    .font(.title2)
                
                Text(config.companyName)
                    .font(.headline)
                
                Spacer()
                
                Button(action: { NSApplication.shared.terminate(nil) }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }
            .padding()
            .background(Color(NSColor.windowBackgroundColor))
            
            Divider()
            
            // Tab Content
            TabView(selection: $selectedTab) {
                QuickActionsView(config: config)
                    .tabItem { Label("Quick Actions", systemImage: "bolt.fill") }
                    .tag(0)
                
                TicketView(config: config)
                    .tabItem { Label("Support Ticket", systemImage: "ticket.fill") }
                    .tag(1)
                
                SystemInfoView()
                    .tabItem { Label("System Info", systemImage: "info.circle.fill") }
                    .tag(2)
            }
        }
        .frame(width: 380, height: 500)
    }
}

// MARK: - Quick Actions

struct QuickActionsView: View {
    let config: PortalConfig
    
    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ActionButton(
                    title: "Open Support Portal",
                    icon: "globe",
                    color: Color(hex: config.brandColor)
                ) {
                    if let url = URL(string: "\(config.portalUrl)?key=\(config.portalKey)") {
                        NSWorkspace.shared.open(url)
                    }
                }
                
                ActionButton(
                    title: "Create Support Ticket",
                    icon: "plus.circle.fill",
                    color: .green
                ) {
                    // Navigate to ticket tab
                }
                
                ActionButton(
                    title: "View Knowledge Base",
                    icon: "book.fill",
                    color: .orange
                ) {
                    if let url = URL(string: "\(config.portalUrl)/kb?key=\(config.portalKey)") {
                        NSWorkspace.shared.open(url)
                    }
                }
                
                ActionButton(
                    title: "System Diagnostics",
                    icon: "wrench.and.screwdriver.fill",
                    color: .purple
                ) {
                    runDiagnostics()
                }
            }
            .padding()
        }
    }
    
    private func runDiagnostics() {
        // Run basic diagnostics
        let task = Process()
        task.launchPath = "/usr/sbin/system_profiler"
        task.arguments = ["SPHardwareDataType", "-json"]
        try? task.run()
    }
}

struct ActionButton: View {
    let title: String
    let icon: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 24)
                
                Text(title)
                    .foregroundColor(.primary)
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Ticket View

struct TicketView: View {
    let config: PortalConfig
    @State private var subject = ""
    @State private var description = ""
    @State private var priority = "Medium"
    @State private var isSubmitting = false
    
    var body: some View {
        Form {
            Section("New Support Ticket") {
                TextField("Subject", text: $subject)
                
                Picker("Priority", selection: $priority) {
                    Text("Low").tag("Low")
                    Text("Medium").tag("Medium")
                    Text("High").tag("High")
                    Text("Critical").tag("Critical")
                }
                
                TextEditor(text: $description)
                    .frame(height: 120)
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(Color.secondary.opacity(0.3), lineWidth: 1)
                    )
            }
            
            Button(action: submitTicket) {
                if isSubmitting {
                    ProgressView()
                        .scaleEffect(0.8)
                } else {
                    Text("Submit Ticket")
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(subject.isEmpty || description.isEmpty || isSubmitting)
        }
        .formStyle(.grouped)
        .padding()
    }
    
    private func submitTicket() {
        isSubmitting = true
        
        // Submit ticket to API
        Task {
            // API call would go here
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            
            await MainActor.run {
                isSubmitting = false
                subject = ""
                description = ""
            }
        }
    }
}

// MARK: - System Info View

struct SystemInfoView: View {
    @State private var systemInfo: [String: String] = [:]
    
    var body: some View {
        List {
            ForEach(Array(systemInfo.sorted(by: { $0.key < $1.key })), id: \.key) { key, value in
                HStack {
                    Text(key)
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(value)
                        .fontWeight(.medium)
                }
            }
        }
        .onAppear(perform: loadSystemInfo)
    }
    
    private func loadSystemInfo() {
        systemInfo = [
            "macOS": ProcessInfo.processInfo.operatingSystemVersionString,
            "Hostname": Host.current().localizedName ?? "Unknown",
            "Processors": "\(ProcessInfo.processInfo.processorCount) cores",
            "Memory": formatBytes(ProcessInfo.processInfo.physicalMemory),
            "Uptime": formatUptime(ProcessInfo.processInfo.systemUptime)
        ]
    }
    
    private func formatBytes(_ bytes: UInt64) -> String {
        let gb = Double(bytes) / 1_073_741_824
        return String(format: "%.1f GB", gb)
    }
    
    private func formatUptime(_ seconds: TimeInterval) -> String {
        let days = Int(seconds) / 86400
        let hours = (Int(seconds) % 86400) / 3600
        return "\(days)d \(hours)h"
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
