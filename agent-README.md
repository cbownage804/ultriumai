# Ultrium RMM Agent

A lightweight Python agent for remote monitoring and management through Supabase edge functions.

## Quick Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Agent**:
   Edit `ultrium_agent.py` and update:
   ```python
   API_KEY = "your-actual-ultrium-secret-key"  # Replace with your API key
   ```

3. **Test Configuration**:
   ```bash
   python ultrium_agent.py --test
   ```

4. **Run Agent**:
   ```bash
   python ultrium_agent.py
   ```

## Features

- ✅ **System Monitoring**: CPU, RAM, disk usage tracking
- ✅ **PowerShell Execution**: Secure command execution with timeout
- ✅ **Cross-Platform**: Windows (full), Linux/macOS (monitoring only)
- ✅ **RustDesk Integration**: Automatic ID detection
- ✅ **Logging**: Comprehensive logging with rotation
- ✅ **Error Handling**: Graceful error recovery and retry logic

## Windows Service Installation

To run as a Windows service:

```bash
python ultrium_agent.py --install-service
# Then run install_service.bat as Administrator
```

## Security Features

- API key authentication (`x-ultrium-key` header)
- Command timeout protection (5 min default)
- PowerShell execution policy bypass
- Comprehensive audit logging

## Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `POLL_INTERVAL` | 60 seconds | How often to check for commands |
| `COMMAND_TIMEOUT` | 300 seconds | Max time per command execution |
| `API_KEY` | Required | Your Ultrium API key |

## Logs

Logs are stored in the `logs/` directory with daily rotation:
- `ultrium_agent_YYYYMMDD.log`

## PowerShell Commands

The agent supports PowerShell script execution with:
- Execution policy bypass
- UTF-8 encoding support
- Stdout/stderr capture
- Exit code tracking
- Timeout protection

## Troubleshooting

1. **401 Unauthorized**: Check your API key
2. **No commands received**: Verify device hostname registration
3. **PowerShell errors**: Check execution policy and script syntax
4. **Connection issues**: Verify Supabase URL and network connectivity

## Support

For issues and support, check the edge function logs in your Supabase dashboard.