import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bell, MapPin, Camera, Wrench, Shield, Wifi, 
  AlertTriangle, CheckCircle, Clock, Phone,
  Navigation, Signal, Battery, RefreshCw
} from 'lucide-react'
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities'
import { ImpactStyle, NotificationType } from '@capacitor/haptics'

export default function TechnicianMobile() {
  const { 
    pushNotifications, 
    camera, 
    geolocation, 
    device, 
    network,
    haptics 
  } = useMobileCapabilities()

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'Critical', client: 'Acme Corp', issue: 'Network breach detected', location: '123 Main St', time: '2 min ago', priority: 'high' },
    { id: 2, type: 'Medium', client: 'TechStart Inc', issue: 'Email security alert', location: '456 Oak Ave', time: '15 min ago', priority: 'medium' },
    { id: 3, type: 'Low', client: 'Global Systems', issue: 'Routine scan needed', location: '789 Pine Rd', time: '1 hour ago', priority: 'low' }
  ])

  const [activeTickets, setActiveTickets] = useState([
    { id: 1, client: 'Acme Corp', task: 'Investigate security breach', status: 'in_progress', eta: '30 min' },
    { id: 2, client: 'DataFlow Ltd', task: 'Install endpoint protection', status: 'assigned', eta: '2 hours' }
  ])

  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [networkStatus, setNetworkStatus] = useState<any>(null)
  const [currentLocation, setCurrentLocation] = useState<any>(null)

  useEffect(() => {
    loadDeviceInfo()
    loadNetworkStatus()
    getCurrentLocation()
    requestNotificationPermissions()
  }, [])

  const loadDeviceInfo = async () => {
    const info = await device.getInfo()
    setDeviceInfo(info)
  }

  const loadNetworkStatus = async () => {
    const status = await network.getStatus()
    setNetworkStatus(status)
  }

  const getCurrentLocation = async () => {
    try {
      const position = await geolocation.getCurrentPosition()
      setCurrentLocation(position)
    } catch (error) {
      console.error('Location error:', error)
    }
  }

  const requestNotificationPermissions = async () => {
    await pushNotifications.requestPermissions()
    await pushNotifications.register()
  }

  const takePhoto = async () => {
    try {
      const image = await camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'uri'
      })
      // Handle photo upload
      console.log('Photo taken:', image)
      haptics.impact({ style: ImpactStyle.Medium })
    } catch (error) {
      console.error('Camera error:', error)
    }
  }

  const navigateToClient = async (address: string) => {
    if (currentLocation) {
      // Open maps app with directions
      const url = `maps://?daddr=${encodeURIComponent(address)}&saddr=${currentLocation.coords.latitude},${currentLocation.coords.longitude}`
      window.open(url, '_system')
      haptics.impact({ style: ImpactStyle.Light })
    }
  }

  const acceptAlert = async (alertId: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: 'accepted' } : alert
    ))
    haptics.notification({ type: NotificationType.Success })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-primary to-accent text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">UltriumAI Technician</CardTitle>
                <CardDescription className="text-white/80">Mobile Field Operations</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {networkStatus?.connected && (
                  <Signal className="w-5 h-5 text-green-300" />
                )}
                <Battery className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active Alerts</h3>
              <Button size="sm" variant="outline" onClick={loadNetworkStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {alerts.map((alert) => (
              <Card key={alert.id} className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.priority === 'high' ? 'text-red-500' : 
                        alert.priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <Badge variant={
                        alert.priority === 'high' ? 'destructive' : 
                        alert.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {alert.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{alert.time}</div>
                  </div>
                  <CardTitle className="text-base">{alert.client}</CardTitle>
                  <CardDescription>{alert.issue}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {alert.location}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      onClick={() => acceptAlert(alert.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigateToClient(alert.location)}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Navigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <h3 className="text-lg font-semibold">Active Tickets</h3>
            
            {activeTickets.map((ticket) => (
              <Card key={ticket.id} className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{ticket.client}</CardTitle>
                    <Badge variant={ticket.status === 'in_progress' ? 'default' : 'secondary'}>
                      {ticket.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                    </Badge>
                  </div>
                  <CardDescription>{ticket.task}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      ETA: {ticket.eta}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Wrench className="w-4 h-4 mr-2" />
                      Start Work
                    </Button>
                    <Button size="sm" variant="outline" onClick={takePhoto}>
                      <Camera className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <h3 className="text-lg font-semibold">Field Tools</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={takePhoto}>
                <CardContent className="p-6 text-center">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">Camera</div>
                  <div className="text-xs text-muted-foreground">Document Evidence</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={getCurrentLocation}>
                <CardContent className="p-6 text-center">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">Location</div>
                  <div className="text-xs text-muted-foreground">GPS Tracking</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">SafeNet</div>
                  <div className="text-xs text-muted-foreground">Network Scan</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <Wifi className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-medium">WiFi Analyzer</div>
                  <div className="text-xs text-muted-foreground">Signal Strength</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <h3 className="text-lg font-semibold">Device Status</h3>
            
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {deviceInfo && (
                  <>
                    <div className="flex justify-between">
                      <span>Platform:</span>
                      <span className="font-medium">{deviceInfo.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>OS Version:</span>
                      <span className="font-medium">{deviceInfo.osVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="font-medium">{deviceInfo.model}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Network Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {networkStatus && (
                  <>
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <Badge variant={networkStatus.connected ? 'default' : 'destructive'}>
                        {networkStatus.connected ? 'Connected' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{networkStatus.connectionType}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {currentLocation && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base">Current Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Latitude:</span>
                    <span className="font-medium">{currentLocation.coords.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longitude:</span>
                    <span className="font-medium">{currentLocation.coords.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span className="font-medium">{Math.round(currentLocation.coords.accuracy)}m</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}