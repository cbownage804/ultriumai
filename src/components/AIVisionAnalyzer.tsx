import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye,
  Scan,
  Image as ImageIcon,
  FileText,
  Camera,
  Upload,
  Download,
  Zap,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Pause,
  RotateCcw,
  Crop,
  Filter,
  Layers,
  Target,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisResult {
  id: string;
  type: 'object_detection' | 'text_extraction' | 'facial_recognition' | 'document_analysis' | 'security_scan';
  confidence: number;
  results: any;
  timestamp: string;
  processingTime: number;
}

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  color: string;
}

interface ExtractedText {
  text: string;
  confidence: number;
  bbox: [number, number, number, number];
  language?: string;
}

export function AIVisionAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [extractedText, setExtractedText] = useState<ExtractedText[]>([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'all' | 'objects' | 'text' | 'faces' | 'security'>('all');
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setDetectedObjects([]);
        setExtractedText([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsWebcamActive(true);
        
        toast({
          title: "Webcam Activated",
          description: "Camera is ready for live analysis",
        });
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access to use live analysis",
        variant: "destructive",
      });
    }
  };

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsWebcamActive(false);
    }
  };

  const captureFromWebcam = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      stopWebcam();
    }
  };

  const analyzeImage = async (analysisType: string = selectedAnalysisType) => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload an image or capture from webcam first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      // Simulate different types of AI analysis
      await simulateAnalysis(analysisType, startTime);
      
      toast({
        title: "Analysis Complete",
        description: `AI vision analysis finished in ${Date.now() - startTime}ms`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulateAnalysis = async (type: string, startTime: number) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const processingTime = Date.now() - startTime;

    if (type === 'all' || type === 'objects') {
      // Mock object detection results
      const mockObjects: DetectedObject[] = [
        {
          label: 'Person',
          confidence: 0.95,
          bbox: [100, 50, 200, 300],
          color: '#ff6b6b'
        },
        {
          label: 'Computer',
          confidence: 0.87,
          bbox: [250, 100, 400, 250],
          color: '#4ecdc4'
        },
        {
          label: 'Phone',
          confidence: 0.92,
          bbox: [50, 200, 120, 280],
          color: '#45b7d1'
        }
      ];
      setDetectedObjects(mockObjects);
    }

    if (type === 'all' || type === 'text') {
      // Mock text extraction results
      const mockText: ExtractedText[] = [
        {
          text: 'CONFIDENTIAL DOCUMENT',
          confidence: 0.98,
          bbox: [150, 20, 350, 40],
          language: 'en'
        },
        {
          text: 'Security Protocols',
          confidence: 0.94,
          bbox: [100, 60, 280, 80],
          language: 'en'
        },
        {
          text: 'Access Level: Admin',
          confidence: 0.91,
          bbox: [200, 320, 380, 340],
          language: 'en'
        }
      ];
      setExtractedText(mockText);
    }

    // Add to analysis history
    const result: AnalysisResult = {
      id: Date.now().toString(),
      type: type as any,
      confidence: 0.93,
      results: {
        objects: detectedObjects.length,
        textBlocks: extractedText.length,
        faces: type.includes('face') ? Math.floor(Math.random() * 3) : 0,
        securityThreats: type.includes('security') ? Math.floor(Math.random() * 2) : 0
      },
      timestamp: new Date().toISOString(),
      processingTime
    };

    setAnalysisResults(prev => [result, ...prev]);
  };

  const getAnalysisTypeColor = (type: string) => {
    const colors = {
      object_detection: 'bg-blue-100 text-blue-800',
      text_extraction: 'bg-green-100 text-green-800',
      facial_recognition: 'bg-purple-100 text-purple-800',
      document_analysis: 'bg-orange-100 text-orange-800',
      security_scan: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            AI Vision Analyzer
          </h2>
          <p className="text-muted-foreground">
            Advanced computer vision and image analysis capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            <Brain className="h-3 w-3 mr-1" />
            Vision AI Active
          </Badge>
        </div>
      </div>

      {/* Analysis Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images Analyzed</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Total processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objects Detected</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{detectedObjects.length}</div>
            <p className="text-xs text-muted-foreground">
              In current image
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Text Extracted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extractedText.length}</div>
            <p className="text-xs text-muted-foreground">
              Text blocks found
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93%</div>
            <p className="text-xs text-muted-foreground">
              Detection confidence
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Vision Interface */}
      <Tabs defaultValue="analyze" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analyze">Image Analysis</TabsTrigger>
          <TabsTrigger value="live">Live Camera</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
          <TabsTrigger value="settings">Vision Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Image Upload & Analysis</CardTitle>
                <CardDescription>
                  Upload an image for AI-powered computer vision analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={startWebcam}
                    disabled={isWebcamActive}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {selectedImage && (
                  <div className="relative border-2 border-dashed border-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedImage} 
                      alt="Selected for analysis"
                      className="w-full h-64 object-contain bg-muted"
                    />
                    
                    {/* Overlay detected objects */}
                    {detectedObjects.map((obj, idx) => (
                      <div
                        key={idx}
                        className="absolute border-2 rounded"
                        style={{
                          left: `${(obj.bbox[0] / 640) * 100}%`,
                          top: `${(obj.bbox[1] / 480) * 100}%`,
                          width: `${((obj.bbox[2] - obj.bbox[0]) / 640) * 100}%`,
                          height: `${((obj.bbox[3] - obj.bbox[1]) / 480) * 100}%`,
                          borderColor: obj.color,
                        }}
                      >
                        <div 
                          className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded"
                          style={{ backgroundColor: obj.color }}
                        >
                          {obj.label} ({Math.round(obj.confidence * 100)}%)
                        </div>
                      </div>
                    ))}

                    {/* Overlay extracted text */}
                    {extractedText.map((text, idx) => (
                      <div
                        key={`text-${idx}`}
                        className="absolute border border-green-500 bg-green-500 bg-opacity-20"
                        style={{
                          left: `${(text.bbox[0] / 640) * 100}%`,
                          top: `${(text.bbox[1] / 480) * 100}%`,
                          width: `${((text.bbox[2] - text.bbox[0]) / 640) * 100}%`,
                          height: `${((text.bbox[3] - text.bbox[1]) / 480) * 100}%`,
                        }}
                        title={text.text}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Analysis Type</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded"
                      value={selectedAnalysisType}
                      onChange={(e) => setSelectedAnalysisType(e.target.value as any)}
                    >
                      <option value="all">Complete Analysis</option>
                      <option value="objects">Object Detection</option>
                      <option value="text">Text Extraction (OCR)</option>
                      <option value="faces">Facial Recognition</option>
                      <option value="security">Security Analysis</option>
                    </select>
                  </div>

                  <Button 
                    onClick={() => analyzeImage()}
                    disabled={!selectedImage || isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Scan className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detection Results</CardTitle>
                <CardDescription>
                  Objects, text, and features detected in the image
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedImage ? (
                  <div className="space-y-4">
                    {detectedObjects.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Detected Objects
                        </h4>
                        <div className="space-y-2">
                          {detectedObjects.map((obj, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: obj.color }}
                                />
                                <span className="text-sm font-medium">{obj.label}</span>
                              </div>
                              <Badge variant="outline">
                                {Math.round(obj.confidence * 100)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {extractedText.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Extracted Text
                        </h4>
                        <div className="space-y-2">
                          {extractedText.map((text, idx) => (
                            <div key={idx} className="p-2 border rounded">
                              <p className="text-sm">{text.text}</p>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Confidence: {Math.round(text.confidence * 100)}%</span>
                                {text.language && <span>Language: {text.language}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {detectedObjects.length === 0 && extractedText.length === 0 && !isAnalyzing && (
                      <div className="text-center text-muted-foreground py-4">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Click "Analyze Image" to detect objects and text</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload an image to see analysis results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Camera Analysis</CardTitle>
              <CardDescription>
                Real-time computer vision analysis using your camera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isWebcamActive ? (
                  <Button onClick={startWebcam}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={captureFromWebcam}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture & Analyze
                    </Button>
                    <Button variant="outline" onClick={stopWebcam}>
                      <X className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>

              {isWebcamActive && (
                <div className="relative border-2 border-dashed border-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-contain bg-muted"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {!isWebcamActive && !selectedImage && (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-muted rounded-lg">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Start Camera" to begin live analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                Previous vision analysis results and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Badge className={getAnalysisTypeColor(result.type)}>
                          {result.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {Math.round(result.confidence * 100)}% confidence
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.processingTime}ms
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Objects:</span>
                        <span className="ml-2 font-medium">{result.results.objects || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Text Blocks:</span>
                        <span className="ml-2 font-medium">{result.results.textBlocks || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Faces:</span>
                        <span className="ml-2 font-medium">{result.results.faces || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threats:</span>
                        <span className="ml-2 font-medium">{result.results.securityThreats || 0}</span>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}

                {analysisResults.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No analysis results yet. Upload and analyze images to see history here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vision AI Settings</CardTitle>
                <CardDescription>
                  Configure computer vision analysis parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Detection Threshold</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      defaultValue="0.5"
                      className="w-full"
                    />
                    <div className="text-center text-sm text-muted-foreground">
                      50% confidence minimum
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Max Objects</label>
                  <Input type="number" defaultValue="10" min="1" max="100" />
                </div>

                <div>
                  <label className="text-sm font-medium">OCR Language</label>
                  <select className="w-full p-2 border rounded">
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                    <option value="auto">Auto-detect</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>
                  Optimize analysis speed and accuracy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Processing Mode</label>
                  <select className="w-full p-2 border rounded">
                    <option value="balanced">Balanced (Recommended)</option>
                    <option value="fast">Fast Processing</option>
                    <option value="accurate">High Accuracy</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Image Resolution</label>
                  <select className="w-full p-2 border rounded">
                    <option value="original">Original Size</option>
                    <option value="720p">720p (Faster)</option>
                    <option value="480p">480p (Fastest)</option>
                  </select>
                </div>

                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    Higher accuracy settings may increase processing time but provide better results.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}