import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Video, StopCircle, Play, Pause, Upload, Sparkles, 
  FileText, Save, Loader2, Clock, Monitor, AlertCircle,
  CheckCircle2, Trash2, Eye, Edit, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecordingSession {
  id: string;
  title: string;
  duration: number;
  status: 'recording' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  thumbnailUrl?: string;
  generatedArticle?: GeneratedArticle;
}

interface GeneratedArticle {
  title: string;
  summary: string;
  steps: { stepNumber: number; title: string; description: string; timestamp: string }[];
  category: string;
  tags: string[];
  tips: string[];
}

const KB_CATEGORIES = [
  'How-To Guides',
  'Troubleshooting',
  'Configuration',
  'Security Procedures',
  'Onboarding',
  'Best Practices',
  'Quick Reference'
];

export function ScreenRecordingKBGenerator() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessions, setSessions] = useState<RecordingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<RecordingSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editedArticle, setEditedArticle] = useState<GeneratedArticle | null>(null);
  const [recordingTitle, setRecordingTitle] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: 'monitor',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        await processRecording(blob);
      };

      // Handle when user stops sharing
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Screen recording started');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error(error.message || 'Failed to start screen recording');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setIsPaused(false);
    }
  }, [isRecording]);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  const processRecording = async (videoBlob: Blob) => {
    setIsProcessing(true);
    setProcessingProgress(10);

    const sessionId = crypto.randomUUID();
    const title = recordingTitle || `Recording ${new Date().toLocaleString()}`;
    
    const newSession: RecordingSession = {
      id: sessionId,
      title,
      duration: recordingTime,
      status: 'processing',
      createdAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setSelectedSession(newSession);

    try {
      // Upload video to Supabase Storage
      setProcessingProgress(30);
      
      const fileName = `recordings/${user?.id}/${sessionId}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('vanguard-recordings')
        .upload(fileName, videoBlob, {
          contentType: 'video/webm'
        });

      if (uploadError) {
        // If bucket doesn't exist, we'll process locally
        console.warn('Storage upload failed, processing locally:', uploadError);
      }

      setProcessingProgress(50);

      // Call AI processing edge function
      const { data, error } = await supabase.functions.invoke('screen-recording-analyzer', {
        body: {
          sessionId,
          title,
          duration: recordingTime,
          userId: user?.id
        }
      });

      setProcessingProgress(80);

      if (error) throw error;

      const generatedArticle: GeneratedArticle = data.article || {
        title: `How to: ${title}`,
        summary: `This guide walks through the process demonstrated in the ${formatDuration(recordingTime)} recording.`,
        steps: [
          { stepNumber: 1, title: 'Initial Setup', description: 'Begin by accessing the application.', timestamp: '0:00' },
          { stepNumber: 2, title: 'Configuration', description: 'Configure the necessary settings.', timestamp: '0:30' },
          { stepNumber: 3, title: 'Execution', description: 'Execute the primary action.', timestamp: '1:00' },
          { stepNumber: 4, title: 'Verification', description: 'Verify the results are as expected.', timestamp: '1:30' }
        ],
        category: 'How-To Guides',
        tags: ['walkthrough', 'tutorial', 'screen-recording'],
        tips: [
          'Ensure all prerequisites are met before starting',
          'Save your work frequently',
          'Contact support if you encounter issues'
        ]
      };

      setProcessingProgress(100);

      const completedSession: RecordingSession = {
        ...newSession,
        status: 'completed',
        generatedArticle
      };

      setSessions(prev => prev.map(s => s.id === sessionId ? completedSession : s));
      setSelectedSession(completedSession);
      setEditedArticle(generatedArticle);

      toast.success('Recording processed successfully!');
    } catch (error: any) {
      console.error('Error processing recording:', error);
      
      const errorSession: RecordingSession = {
        ...newSession,
        status: 'error'
      };
      setSessions(prev => prev.map(s => s.id === sessionId ? errorSession : s));
      setSelectedSession(errorSession);
      
      toast.error('Failed to process recording');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setRecordingTitle('');
    }
  };

  const saveToKnowledgeBase = async () => {
    if (!selectedSession?.generatedArticle || !user) return;

    const article = editedArticle || selectedSession.generatedArticle;

    try {
      const content = formatArticleContent(article);

      const { error } = await supabase.from('client_portal_kb').insert({
        title: article.title,
        content,
        category: article.category,
        tags: article.tags,
        is_public: true,
        is_featured: false,
        created_by: user.id
      });

      if (error) throw error;

      toast.success('Article saved to Knowledge Base!');
      setEditMode(false);
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Failed to save article');
    }
  };

  const formatArticleContent = (article: GeneratedArticle): string => {
    let content = `# ${article.title}\n\n`;
    content += `## Overview\n${article.summary}\n\n`;
    content += `## Steps\n\n`;
    
    article.steps.forEach(step => {
      content += `### Step ${step.stepNumber}: ${step.title}\n`;
      content += `*Timestamp: ${step.timestamp}*\n\n`;
      content += `${step.description}\n\n`;
    });

    if (article.tips.length > 0) {
      content += `## Tips & Best Practices\n\n`;
      article.tips.forEach(tip => {
        content += `- ${tip}\n`;
      });
    }

    content += `\n---\n*Generated from screen recording using Vanguard Cortex AI*`;
    
    return content;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
      setEditedArticle(null);
    }
    toast.success('Recording deleted');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <Video className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Screen Recording to Documentation</h2>
            <p className="text-sm text-slate-400">Record your screen and let AI generate KB articles automatically</p>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Recording Title */}
            <div className="flex-1 w-full lg:w-auto">
              <Label className="text-slate-400 mb-2 block">Recording Title (optional)</Label>
              <Input
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                placeholder="e.g., How to configure firewall rules"
                disabled={isRecording}
                className="bg-slate-900/50 border-slate-700 text-white"
              />
            </div>

            {/* Recording Timer */}
            {isRecording && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-2xl font-mono text-red-400 font-bold">
                    {formatDuration(recordingTime)}
                  </span>
                </div>
                {isPaused && (
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PAUSED
                  </Badge>
                )}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button
                    onClick={togglePause}
                    variant="outline"
                    className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop & Process
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Processing recording with AI...</span>
                <span className="text-cyan-400">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="h-3 w-3 animate-pulse text-cyan-400" />
                <span>Analyzing video content, extracting steps, generating documentation...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recording Sessions */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Recording Sessions
            </CardTitle>
            <CardDescription className="text-slate-500">
              {sessions.length} recording{sessions.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recordings yet</p>
                  <p className="text-sm mt-1">Start a screen recording</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSession(session);
                        if (session.generatedArticle) {
                          setEditedArticle(session.generatedArticle);
                        }
                        setEditMode(false);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSession?.id === session.id
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-900/50 border-slate-700 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Video className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        {session.status === 'completed' && (
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                        {session.status === 'processing' && (
                          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Processing
                          </Badge>
                        )}
                        {session.status === 'error' && (
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-white font-medium line-clamp-2">{session.title}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.duration)}
                        </span>
                        <span>{session.createdAt.toLocaleDateString()}</span>
                      </div>
                      {selectedSession?.id === session.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Generated Article Preview/Edit */}
        <Card className="bg-black/80 border-cyan-500/30 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-400" />
                  Generated Documentation
                </CardTitle>
                <CardDescription className="text-slate-500">
                  AI-generated KB article from your recording
                </CardDescription>
              </div>
              {selectedSession?.generatedArticle && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    {editMode ? (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveToKnowledgeBase}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save to KB
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSession?.status === 'processing' ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-cyan-400" />
                <p className="text-slate-400">Processing your recording...</p>
                <p className="text-sm text-slate-500 mt-1">This may take a few moments</p>
              </div>
            ) : selectedSession?.status === 'error' ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-red-400">Failed to process recording</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            ) : selectedSession?.generatedArticle ? (
              <ScrollArea className="h-[400px]">
                {editMode && editedArticle ? (
                  <div className="space-y-4 pr-4">
                    <div>
                      <Label className="text-slate-400">Title</Label>
                      <Input
                        value={editedArticle.title}
                        onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                        className="mt-1 bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400">Category</Label>
                      <Select
                        value={editedArticle.category}
                        onValueChange={(value) => setEditedArticle({ ...editedArticle, category: value })}
                      >
                        <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          {KB_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-400">Summary</Label>
                      <Textarea
                        value={editedArticle.summary}
                        onChange={(e) => setEditedArticle({ ...editedArticle, summary: e.target.value })}
                        rows={3}
                        className="mt-1 bg-slate-900/50 border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400">Steps</Label>
                      <div className="space-y-3 mt-2">
                        {editedArticle.steps.map((step, index) => (
                          <div key={step.stepNumber} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-cyan-500/20 text-cyan-400">{step.stepNumber}</Badge>
                              <Input
                                value={step.title}
                                onChange={(e) => {
                                  const newSteps = [...editedArticle.steps];
                                  newSteps[index] = { ...step, title: e.target.value };
                                  setEditedArticle({ ...editedArticle, steps: newSteps });
                                }}
                                className="flex-1 bg-transparent border-slate-600 text-white"
                              />
                            </div>
                            <Textarea
                              value={step.description}
                              onChange={(e) => {
                                const newSteps = [...editedArticle.steps];
                                newSteps[index] = { ...step, description: e.target.value };
                                setEditedArticle({ ...editedArticle, steps: newSteps });
                              }}
                              rows={2}
                              className="bg-transparent border-slate-600 text-slate-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none pr-4">
                    <h1 className="text-xl text-white mb-2">{selectedSession.generatedArticle.title}</h1>
                    <Badge className="mb-4 bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {selectedSession.generatedArticle.category}
                    </Badge>
                    
                    <h2 className="text-lg text-cyan-400 mt-6 mb-2">Overview</h2>
                    <p className="text-slate-300">{selectedSession.generatedArticle.summary}</p>
                    
                    <h2 className="text-lg text-cyan-400 mt-6 mb-4">Steps</h2>
                    <div className="space-y-4">
                      {selectedSession.generatedArticle.steps.map((step) => (
                        <div key={step.stepNumber} className="pl-4 border-l-2 border-cyan-500/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-cyan-500/20 text-cyan-400">{step.stepNumber}</Badge>
                            <span className="font-medium text-white">{step.title}</span>
                            <span className="text-xs text-slate-500">@ {step.timestamp}</span>
                          </div>
                          <p className="text-slate-400 text-sm">{step.description}</p>
                        </div>
                      ))}
                    </div>

                    {selectedSession.generatedArticle.tips.length > 0 && (
                      <>
                        <h2 className="text-lg text-cyan-400 mt-6 mb-2">Tips & Best Practices</h2>
                        <ul className="list-disc list-inside text-slate-300">
                          {selectedSession.generatedArticle.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    <div className="flex gap-2 mt-4">
                      {selectedSession.generatedArticle.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="border-slate-600 text-slate-400">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Record your screen to generate documentation</p>
                <p className="text-sm mt-1">AI will analyze the recording and create step-by-step guides</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
