//
//  VanguardAgentApp.swift
//  VanguardAgent
//
//  Ultrium Vanguard Agent for macOS
//  Enterprise RMM agent providing telemetry, monitoring, and remote management
//

import SwiftUI
import ServiceManagement

@main
struct VanguardAgentApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            SettingsView()
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var agentService: AgentService?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Setup menu bar icon
        setupStatusItem()
        
        // Initialize agent service
        agentService = AgentService()
        agentService?.start()
        
        // Hide dock icon - runs as background agent
        NSApp.setActivationPolicy(.accessory)
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        agentService?.stop()
    }
    
    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "shield.checkered", accessibilityDescription: "Vanguard Agent")
        }
        
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Vanguard Agent", action: nil, keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Status: Running", action: nil, keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Settings...", action: #selector(openSettings), keyEquivalent: ","))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem?.menu = menu
    }
    
    @objc func openSettings() {
        NSApp.sendAction(Selector(("showSettingsWindow:")), to: nil, from: nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}

struct SettingsView: View {
    @AppStorage("apiEndpoint") private var apiEndpoint = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api"
    @AppStorage("userId") private var userId = ""
    @AppStorage("secretKey") private var secretKey = ""
    @AppStorage("deviceName") private var deviceName = Host.current().localizedName ?? "Mac"
    
    var body: some View {
        Form {
            Section("Connection") {
                TextField("API Endpoint", text: $apiEndpoint)
                TextField("User ID", text: $userId)
                SecureField("Secret Key", text: $secretKey)
                TextField("Device Name", text: $deviceName)
            }
            
            Section("Status") {
                HStack {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 10, height: 10)
                    Text("Connected")
                }
            }
        }
        .formStyle(.grouped)
        .frame(width: 400, height: 300)
        .padding()
    }
}
