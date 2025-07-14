import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RMMDemo } from "@/components/demos/RMMDemo";
import TicketingDemo from "@/components/demos/TicketingDemo";

const SafeCenterDemoPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        {/* Navigation Header */}
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/demos')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Demos
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Ultrium SafeCenter™ Demo
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
              Complete IT service management platform combining remote monitoring & management (RMM) 
              with integrated helpdesk ticketing for unified business IT operations.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>RMM & Asset Management</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Integrated Helpdesk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Unified Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Platform Overview</TabsTrigger>
              <TabsTrigger value="rmm">RMM & Monitoring</TabsTrigger>
              <TabsTrigger value="helpdesk">Helpdesk & Ticketing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card rounded-lg p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-green-600">
                    Remote Monitoring & Management
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Real-time device monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Automated patch management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Asset tracking & inventory</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Performance monitoring</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-blue-600">
                    Integrated Helpdesk
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Smart ticket routing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>SLA tracking & alerts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Multi-channel support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Knowledge base integration</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-4 text-center">
                  Unified IT Service Management
                </h3>
                <p className="text-center text-gray-700 mb-4">
                  SafeCenter brings together all your IT operations in one platform. Monitor your infrastructure, 
                  manage assets, and handle support tickets from a single, unified dashboard.
                </p>
                <div className="flex justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-gradient-to-r from-green-600 to-blue-600">
                    Request Full Platform Demo
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rmm" className="mt-8">
              <RMMDemo />
            </TabsContent>
            
            <TabsContent value="helpdesk" className="mt-8">
              <TicketingDemo />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SafeCenterDemoPage;