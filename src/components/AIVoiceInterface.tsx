import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  MessageCircle,
  Activity,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  Languages,
  FileAudio,
  Headphones
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceSession {
  id: string;
  transcript: string;
  duration: number;
  timestamp: string;
  language: string;
  confidence: number;
  audioUrl?: string;
}

interface AudioWaveformProps {
  isRecording: boolean;
  audioLevels: number[];
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, audioLevels }) => {
  return (
    <div className="flex items-center justify-center h-16 gap-1">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-primary rounded-full transition-all duration-100 ${
            isRecording ? 'animate-pulse' : ''
          }`}
          style={{
            height: isRecording 
              ? `${Math.max(4, (audioLevels[i] || 0) * 60)}px`
              : '4px'
          }}
        />
      ))}
    </div>
  );
};

export function AIVoiceInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceSessions, setVoiceSessions] = useState<VoiceSession[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [voiceSettings, setVoiceSettings] = useState({
    model: 'whisper-1',
    voice: 'alloy',
    speed: 1.0,
    temperature: 0.3
  });
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Mock some existing sessions
    setVoiceSessions([
      {
        id: '1',
        transcript: 'Show me the security dashboard and any critical alerts from the last 24 hours.',
        duration: 3.2,
        timestamp: '2024-01-15 14:30:00',
        language: 'en-US',
        confidence: 0.95,
        audioUrl: '/mock-audio-1.mp3'
      },
      {
        id: '2',
        transcript: 'Generate a report for client Acme Corp including their monthly security metrics.',
        duration: 4.1,
        timestamp: '2024-01-15 13:15:00',
        language: 'en-US',
        confidence: 0.92,
        audioUrl: '/mock-audio-2.mp3'
      }
    ]);
  }, []);

  const initializeAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleRecordingStop;

      return true;
    } catch (error) {
      console.error('Error initializing audio:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice features.",
        variant: "destructive",
      });
      return false;
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Convert to normalized levels for visualization
    const levels = Array.from({ length: 20 }, (_, i) => {
      const start = Math.floor((i * bufferLength) / 20);
      const end = Math.floor(((i + 1) * bufferLength) / 20);
      const average = dataArray.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
      return average / 255;
    });

    setAudioLevels(levels);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }
  };

  const startRecording = async () => {
    const initialized = await initializeAudioContext();
    if (!initialized) return;

    audioChunksRef.current = [];
    mediaRecorderRef.current?.start(100); // Collect data every 100ms
    setIsRecording(true);
    setCurrentTranscript('');
    
    visualizeAudio();

    toast({
      title: "Recording Started",
      description: "Speak naturally, AI is listening...",
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up audio levels
      setAudioLevels([]);
    }
  };

  const handleRecordingStop = async () => {
    setProcessingAudio(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Convert blob to base64 for API
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
          // Call Supabase edge function for transcription
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64Audio }
          });

          if (error) throw error;

          const transcript = data.text || 'Could not transcribe audio';
          setCurrentTranscript(transcript);

          // Add to sessions
          const newSession: VoiceSession = {
            id: Date.now().toString(),
            transcript,
            duration: audioChunksRef.current.length * 0.1, // Rough duration estimate
            timestamp: new Date().toISOString(),
            language: selectedLanguage,
            confidence: 0.9, // Mock confidence
            audioUrl
          };

          setVoiceSessions(prev => [newSession, ...prev]);

          toast({
            title: "Transcription Complete",
            description: "Voice converted to text successfully",
          });

        } catch (apiError) {
          console.error('Transcription error:', apiError);
          toast({
            title: "Transcription Failed",
            description: "Could not process audio. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Recording processing error:', error);
      toast({
        title: "Processing Error",
        description: "Could not process recording.",
        variant: "destructive",
      });
    } finally {
      setProcessingAudio(false);
    }
  };

  const generateSpeech = async (text: string) => {
    if (!text.trim()) return;

    setProcessingAudio(true);

    try {
      // Call text-to-speech API
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text,
          voice: voiceSettings.voice,
          speed: voiceSettings.speed
        }
      });

      if (error) throw error;

      if (data.audioUrl) {
        setGeneratedAudio(data.audioUrl);
        toast({
          title: "Speech Generated",
          description: "AI voice generation complete",
        });
      }

    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: "Speech Generation Failed",
        description: "Could not generate speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingAudio(false);
    }
  };

  const playGeneratedAudio = () => {
    if (generatedAudio) {
      const audio = new Audio(generatedAudio);
      audio.play();
      setIsPlaying(true);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Could not play generated audio.",
          variant: "destructive",
        });
      };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-primary" />
            AI Voice Interface
          </h2>
          <p className="text-muted-foreground">
            Advanced voice-to-text and text-to-speech AI capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Headphones className="h-3 w-3 mr-1" />
            Voice Ready
          </Badge>
        </div>
      </div>

      {/* Voice Control Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Sessions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{voiceSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total recordings processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Average transcription accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Supported languages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Voice Interface */}
      <Tabs defaultValue="record" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="record">Voice Recording</TabsTrigger>
          <TabsTrigger value="generate">Text-to-Speech</TabsTrigger>
          <TabsTrigger value="history">Voice History</TabsTrigger>
          <TabsTrigger value="settings">Voice Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Voice Recorder</CardTitle>
                <CardDescription>
                  Record voice commands and get instant AI transcription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-4">
                  <AudioWaveform isRecording={isRecording} audioLevels={audioLevels} />
                  
                  <div className="flex justify-center gap-4">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={processingAudio}
                      className="min-w-[120px]"
                    >
                      {processingAudio ? (
                        <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isRecording ? (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                  </div>

                  {isRecording && (
                    <Alert>
                      <Mic className="h-4 w-4" />
                      <AlertDescription>
                        Recording in progress... Speak clearly for best results.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Live Transcription</CardTitle>
                <CardDescription>
                  Real-time voice-to-text conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentTranscript ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm">{currentTranscript}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send to AI
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start recording to see transcription here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Text-to-Speech Generator</CardTitle>
                <CardDescription>
                  Convert text to natural AI voice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter text to convert to speech..."
                  className="min-h-[120px]"
                  id="tts-input"
                />
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const textarea = document.getElementById('tts-input') as HTMLTextAreaElement;
                      generateSpeech(textarea.value);
                    }}
                    disabled={processingAudio}
                    className="flex-1"
                  >
                    {processingAudio ? (
                      <>
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                  
                  {generatedAudio && (
                    <Button
                      variant="outline"
                      onClick={playGeneratedAudio}
                      disabled={isPlaying}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voice Preview</CardTitle>
                <CardDescription>
                  Listen to generated speech
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedAudio ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        <Volume2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">Audio ready to play</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={playGeneratedAudio}
                        disabled={isPlaying}
                        className="flex-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Playing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Play Audio
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate speech to preview audio here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Session History</CardTitle>
              <CardDescription>
                Review past voice recordings and transcriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {voiceSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {session.timestamp} • {session.duration.toFixed(1)}s
                        </span>
                      </div>
                      <Badge variant="outline">
                        {Math.round(session.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    
                    <p className="text-sm">{session.transcript}</p>
                    
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send to AI
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Voice Recognition Settings</CardTitle>
                <CardDescription>
                  Configure speech-to-text parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">AI Model</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={voiceSettings.model}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, model: e.target.value }))}
                  >
                    <option value="whisper-1">Whisper v1 (Recommended)</option>
                    <option value="whisper-large">Whisper Large</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Text-to-Speech Settings</CardTitle>
                <CardDescription>
                  Configure AI voice generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Voice</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={voiceSettings.voice}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                  >
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Speech Speed</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0.25"
                      max="4.0"
                      step="0.25"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-muted-foreground">
                      {voiceSettings.speed}x speed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}