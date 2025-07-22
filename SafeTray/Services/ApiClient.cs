using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using SafeTray.Models;
using SafeTray.Helpers;

namespace SafeTray.Services
{
    public class ApiClient
    {
        private readonly HttpClient _http = new HttpClient();
        private const string BASE = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1";

        public async Task<string> GetTrayTokenAsync(string tool)
        {
            try
            {
                var body = new { tool = tool, device_id = DeviceContext.DeviceId };
                var json = JsonConvert.SerializeObject(body);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var resp = await _http.PostAsync($"{BASE}/issue-tray-token", content);
                resp.EnsureSuccessStatusCode();
                
                var responseJson = await resp.Content.ReadAsStringAsync();
                dynamic obj = JsonConvert.DeserializeObject(responseJson)!;
                return (string)obj.token;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get tray token: {ex.Message}", ex);
            }
        }

        public async Task<TrayStatus> GetTrayStatusAsync()
        {
            try
            {
                var body = new { device_id = DeviceContext.DeviceId };
                var json = JsonConvert.SerializeObject(body);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var resp = await _http.PostAsync($"{BASE}/tray-status", content);
                resp.EnsureSuccessStatusCode();
                
                var responseJson = await resp.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<TrayStatus>(responseJson)!;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to get tray status: {ex.Message}", ex);
            }
        }
    }

    public static class DeviceContext
    {
        private static string? _deviceId;

        public static string DeviceId
        {
            get
            {
                if (_deviceId == null)
                {
                    try
                    {
                        _deviceId = RegistryHelper.ReadValue(@"HKEY_LOCAL_MACHINE\Software\UltriumSafeNet", "DeviceId");
                    }
                    catch
                    {
                        // Fallback - could also try reading from JSON file
                        _deviceId = "unknown";
                    }
                }
                return _deviceId ?? "unknown";
            }
        }
    }
}