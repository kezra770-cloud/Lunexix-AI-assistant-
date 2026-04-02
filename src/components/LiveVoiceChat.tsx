import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, X, Volume2, VolumeX, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LiveVoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveVoiceChat({ isOpen, onClose }: LiveVoiceChatProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [modelTranscription, setModelTranscription] = useState<string>("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      stopSession();
    }
    return () => stopSession();
  }, [isOpen]);

  const startSession = async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || "";
      const ai = new GoogleGenAI({ apiKey });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Lunexix, a real-time voice assistant. Keep your responses conversational and brief, as this is a live voice interaction.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            console.log("Live session opened");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64Data);
              const bytes = new Int16Array(binaryString.length / 2);
              for (let i = 0; i < bytes.length; i++) {
                bytes[i] = (binaryString.charCodeAt(i * 2) & 0xFF) | (binaryString.charCodeAt(i * 2 + 1) << 8);
              }
              audioQueue.current.push(bytes);
              if (!isPlayingRef.current) playNextInQueue();
            }

            if (message.serverContent?.interrupted) {
              audioQueue.current = [];
              isPlayingRef.current = false;
              setIsAiSpeaking(false);
            }

            if (message.serverContent?.turnComplete) {
              // Turn finished
            }
          },
          onerror: (err) => console.error("Live error:", err),
          onclose: () => {
            setIsActive(false);
            console.log("Live session closed");
          }
        }
      });

      sessionRef.current = session;

      processorRef.current.onaudioprocess = (e) => {
        if (isMicMuted) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const buffer = pcmData.buffer;
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        
        session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

    } catch (err) {
      console.error("Failed to start live session:", err);
    }
  };

  const playNextInQueue = async () => {
    if (audioQueue.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setIsAiSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsAiSpeaking(true);
    const pcmData = audioQueue.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 16000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }

    const source = audioContextRef.current.createBufferSource();
    const gainNode = audioContextRef.current.createGain();
    
    source.buffer = buffer;
    gainNode.gain.value = volume;
    
    source.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    source.onended = playNextInQueue;
    source.start();
  };

  const stopSession = () => {
    setIsActive(false);
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueue.current = [];
    isPlayingRef.current = false;
    setIsAiSpeaking(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <div className="w-full max-w-md glass-panel rounded-3xl p-8 flex flex-col items-center gap-8 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-display font-bold gradient-text mb-2">Lunexix Live</h2>
              <p className="text-slate-400">Real-time voice conversation</p>
            </div>

            <div className="relative">
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
                isActive ? (isAiSpeaking ? "bg-lunexix-secondary/20 scale-110" : "bg-lunexix-primary/20 scale-105") : "bg-slate-800"
              )}>
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                  isActive ? (isAiSpeaking ? "bg-lunexix-secondary shadow-[0_0_40px_rgba(236,72,153,0.5)]" : "bg-lunexix-primary shadow-[0_0_40px_rgba(139,92,246,0.5)]") : "bg-slate-700"
                )}>
                  {isAiSpeaking ? <Bot className="w-10 h-10 text-white" /> : (isActive ? <Mic className="w-10 h-10 text-white" /> : <MicOff className="w-10 h-10 text-slate-400" />)}
                </div>
                
                {isActive && (
                  <motion.div
                    animate={{ 
                      scale: isAiSpeaking ? [1, 1.6, 1] : [1, 1.3, 1], 
                      opacity: isAiSpeaking ? [0.6, 0, 0.6] : [0.4, 0, 0.4] 
                    }}
                    transition={{ duration: isAiSpeaking ? 1.5 : 2.5, repeat: Infinity }}
                    className={cn(
                      "absolute inset-0 rounded-full border-2",
                      isAiSpeaking ? "border-lunexix-secondary" : "border-lunexix-primary"
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col w-full gap-6">
              <div className="flex items-center gap-4 w-full">
                <Volume2 className="w-5 h-5 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lunexix-primary"
                />
                <span className="text-xs font-mono text-slate-500 w-8">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              <div className="flex gap-4 justify-center">
                {!isActive ? (
                  <button
                    onClick={startSession}
                    className="px-8 py-3 bg-lunexix-primary hover:bg-lunexix-primary/90 text-white rounded-full font-semibold transition-all shadow-lg shadow-lunexix-primary/20"
                  >
                    Start Conversation
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsMicMuted(!isMicMuted)}
                      title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                      className={cn(
                        "p-4 rounded-full transition-all",
                        isMicMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                      onClick={stopSession}
                      className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all shadow-lg shadow-red-500/20"
                    >
                      End Call
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-full h-24 overflow-y-auto text-center text-sm text-slate-400 italic flex flex-col items-center justify-center">
              {isActive ? (
                isAiSpeaking ? (
                  <span className="text-lunexix-secondary font-medium animate-pulse">Lunexix is speaking...</span>
                ) : (
                  <span className="text-lunexix-primary">Lunexix is listening...</span>
                )
              ) : (
                "Click start to begin"
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
