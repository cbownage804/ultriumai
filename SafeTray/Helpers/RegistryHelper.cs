using System;
using Microsoft.Win32;

namespace SafeTray.Helpers
{
    public static class RegistryHelper
    {
        public static string? ReadValue(string keyPath, string valueName)
        {
            try
            {
                using var key = Registry.LocalMachine.OpenSubKey(keyPath.Replace(@"HKEY_LOCAL_MACHINE\", ""));
                return key?.GetValue(valueName)?.ToString();
            }
            catch
            {
                return null;
            }
        }

        public static void WriteValue(string keyPath, string valueName, string value)
        {
            try
            {
                using var key = Registry.LocalMachine.CreateSubKey(keyPath.Replace(@"HKEY_LOCAL_MACHINE\", ""));
                key?.SetValue(valueName, value);
            }
            catch
            {
                // Fail silently if no admin rights
            }
        }

        // Helper method to read device ID from registry with fallback
        public static string? ReadDeviceId()
        {
            const string keyPath = @"SOFTWARE\Ultrium\SafeNet";
            return ReadValue(keyPath, "DeviceId");
        }

        // Helper method to write device ID to registry
        public static void WriteDeviceId(string deviceId)
        {
            const string keyPath = @"SOFTWARE\Ultrium\SafeNet";
            WriteValue(keyPath, "DeviceId", deviceId);
        }
    }
}