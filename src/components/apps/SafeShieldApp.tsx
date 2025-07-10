import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  ArrowLeft,
  Eye,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Monitor,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SafeShieldDashboard } from "@/components/shield/SafeShieldDashboard";
import { SafeMDRDashboard } from "@/components/shield/SafeMDRDashboard";
import { AntivirusDashboard } from "@/components/dashboards/AntivirusDashboard";

export const SafeShieldApp = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('edr');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              SafeShield AI
            </h1>
            <p className="text-muted-foreground">
              Comprehensive AI-powered endpoint security platform
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Endpoint Detection</CardTitle>
            <Shield className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Real-time</div>
            <p className="text-xs text-blue-600 mt-2">
              AI behavioral analysis
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Response</CardTitle>
            <Eye className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">24/7</div>
            <p className="text-xs text-green-600 mt-2">
              Expert SOC monitoring
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Antivirus Protection</CardTitle>
            <ShieldCheck className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Active</div>
            <p className="text-xs text-purple-600 mt-2">
              Multi-layer defense
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            SafeShield EDR
          </TabsTrigger>
          <TabsTrigger value="mdr" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            SafeMDR
          </TabsTrigger>
          <TabsTrigger value="antivirus" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            SafeAV
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SafeShield EDR - Endpoint Detection & Response
              </CardTitle>
              <CardDescription>
                AI-powered behavioral analysis and automated threat response for comprehensive endpoint protection
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <SafeShieldDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mdr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                SafeMDR - Managed Detection & Response
              </CardTitle>
              <CardDescription>
                24/7 SOC services with expert security analysts and automated incident response
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <SafeMDRDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antivirus" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                SafeAV - Advanced Antivirus Protection
              </CardTitle>
              <CardDescription>
                Multi-layered malware protection with real-time scanning and threat intelligence
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="-mt-6">
                <AntivirusDashboard />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};