import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.51e5cd045f19440aa7bade30fc766877',
  appName: 'ultriumai',
  webDir: 'dist',
  server: {
    url: "https://51e5cd04-5f19-440a-a7ba-de30fc766877.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Camera: {
      permissions: ["camera", "photos"]
    },
    Geolocation: {
      permissions: ["location"]
    }
  }
};

export default config;