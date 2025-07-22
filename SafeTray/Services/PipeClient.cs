using System;
using System.IO;
using System.IO.Pipes;
using System.Text;
using Newtonsoft.Json;

namespace SafeTray.Services
{
    public class PipeClient
    {
        private readonly string _name;

        public PipeClient(string name) => _name = name;

        public T? Send<T>(object payload)
        {
            try
            {
                using var client = new NamedPipeClientStream(".", _name, PipeDirection.InOut);
                client.Connect(1500); // 1.5 second timeout
                
                using var sw = new StreamWriter(client, Encoding.UTF8) { AutoFlush = true };
                using var sr = new StreamReader(client, Encoding.UTF8);

                sw.WriteLine(JsonConvert.SerializeObject(payload));
                var resp = sr.ReadLine();
                
                return resp != null ? JsonConvert.DeserializeObject<T>(resp) : default;
            }
            catch
            {
                return default;
            }
        }

        public void Send(object payload) => Send<object>(payload);
    }
}