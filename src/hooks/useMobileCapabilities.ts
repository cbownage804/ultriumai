import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { Device } from '@capacitor/device'
import { Network } from '@capacitor/network'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { devLog } from '@/lib/logger'

export const useMobileCapabilities = () => {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
  }, [])

  const pushNotifications = {
    requestPermissions: async () => {
      if (!isNative) return
      
      try {
        const permission = await PushNotifications.requestPermissions()
        return permission
      } catch (error) {
        console.error('Error requesting push notification permissions:', error)
        return null
      }
    },

    register: async () => {
      if (!isNative) return
      
      try {
        await PushNotifications.register()
        
        // Listen for registration success
        PushNotifications.addListener('registration', (token) => {
          devLog.log('Push registration success, token: ' + token.value)
        })

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error))
        })

        // Listen for push notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          devLog.log('Push notification received: ', notification)
        })

        // Handle notification taps
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          devLog.log('Push notification action performed', notification.actionId, notification.inputValue)
        })
      } catch (error) {
        console.error('Error registering for push notifications:', error)
      }
    }
  }

  const camera = {
    getPhoto: async (options = {}) => {
      if (!isNative) {
        // Web fallback - create file input
        return new Promise((resolve, reject) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.capture = 'environment'
          
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (event) => {
                resolve({
                  webPath: event.target?.result as string,
                  format: 'jpeg'
                })
              }
              reader.readAsDataURL(file)
            } else {
              reject(new Error('No file selected'))
            }
          }
          
          input.click()
        })
      }

      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          ...options
        })
        return image
      } catch (error) {
        console.error('Error taking photo:', error)
        throw error
      }
    }
  }

  const geolocation = {
    getCurrentPosition: async () => {
      if (!isNative) {
        // Web fallback
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })
      }

      try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        })
        return coordinates
      } catch (error) {
        console.error('Error getting location:', error)
        throw error
      }
    },

    watchPosition: async (callback: (position: any) => void) => {
      if (!isNative) {
        return navigator.geolocation.watchPosition(callback, console.error, {
          enableHighAccuracy: true
        })
      }

      try {
        const watchId = await Geolocation.watchPosition({
          enableHighAccuracy: true,
          timeout: 10000
        }, callback)
        return watchId
      } catch (error) {
        console.error('Error watching position:', error)
        throw error
      }
    }
  }

  const device = {
    getInfo: async () => {
      if (!isNative) {
        return {
          platform: 'web',
          osVersion: navigator.userAgent,
          model: 'Web Browser',
          manufacturer: 'Browser'
        }
      }

      try {
        const info = await Device.getInfo()
        return info
      } catch (error) {
        console.error('Error getting device info:', error)
        return null
      }
    }
  }

  const network = {
    getStatus: async () => {
      if (!isNative) {
        return {
          connected: navigator.onLine,
          connectionType: 'unknown'
        }
      }

      try {
        const status = await Network.getStatus()
        return status
      } catch (error) {
        console.error('Error getting network status:', error)
        return null
      }
    },

    addListener: (callback: (status: any) => void) => {
      if (!isNative) {
        window.addEventListener('online', () => callback({ connected: true }))
        window.addEventListener('offline', () => callback({ connected: false }))
        return
      }

      Network.addListener('networkStatusChange', callback)
    }
  }

  const haptics = {
    impact: async (options: { style?: ImpactStyle } = {}) => {
      if (!isNative) return

      try {
        await Haptics.impact({ style: options.style || ImpactStyle.Medium })
      } catch (error) {
        console.error('Error with haptic feedback:', error)
      }
    },

    notification: async (options: { type?: NotificationType } = {}) => {
      if (!isNative) return

      try {
        await Haptics.notification({ type: options.type || NotificationType.Success })
      } catch (error) {
        console.error('Error with haptic notification:', error)
      }
    }
  }

  return {
    isNative,
    pushNotifications,
    camera,
    geolocation,
    device,
    network,
    haptics
  }
}