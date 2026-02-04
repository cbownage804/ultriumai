# Memory: vanguard/agent/tray-icon-behavior

The Vanguard Agent tray icon is **always visible** in the Windows system tray regardless of login state. The right-click context menu dynamically updates based on authentication:

**Logged Out State:**
- "Login to Portal" (bold, primary action)
- "View System Info"
- "About Vanguard"
- "Exit"

**Logged In State:**
- User email displayed
- "Open Support Portal" (bold)
- Quick actions: New Ticket, View Tickets, Check Health
- SafeSuite submenu (only shows tools the user has access to)
- "Open in Browser"
- "Logout"
- "About Vanguard"
- "Exit"

**Interactions:**
- Left-click or double-click: Opens login form if logged out, opens portal window if logged in
- Right-click: Shows context menu with all options
- Session restoration: On startup, attempts to restore previous session from stored token

**Implementation:**
- `PortalTrayContext.cs` manages the tray icon lifecycle and menu rebuilding
- `PortalAuthService.cs` handles login/logout and session management
- `PortalLoginForm.cs` provides the login UI
- `PortalWindow.cs` renders the embedded WebView2 portal
