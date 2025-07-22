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
    }
}