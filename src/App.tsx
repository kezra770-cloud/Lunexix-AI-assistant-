import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Music, 
  Code, 
  PenTool, 
  Mic, 
  User, 
  Bot,
  ChevronRight,
  Settings,
  Trash2,
  Plus,
  Share2,
  Youtube,
  Facebook,
  MessageCircle,
  Video,
  ExternalLink,
  GraduationCap,
  Dumbbell,
  Briefcase,
  Plane,
  Utensils,
  Heart
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { cn } from './lib/utils';
import { ChatMode, Message, Song } from './types';
import { generateChatResponse } from './services/gemini';
import LiveVoiceChat from './components/LiveVoiceChat';
import MusicPlayer from './components/MusicPlayer';
import VideoFeed from './components/VideoFeed';
import MusicSearchFilters from './components/MusicSearchFilters';
import AuthButton from './components/AuthButton';
import AdminDashboard from './components/AdminDashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import { Shield } from 'lucide-react';

const MODES: { id: ChatMode | 'admin'; label: string; icon: any; color: string }[] = [
  { id: 'general', label: 'General', icon: Sparkles, color: 'text-lunexix-primary' },
  { id: 'dj', label: 'DJ Bot', icon: Music, color: 'text-pink-500' },
  { id: 'social', label: 'Social', icon: Share2, color: 'text-blue-500' },
  { id: 'academic', label: 'Academic', icon: GraduationCap, color: 'text-indigo-500' },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-red-500' },
  { id: 'business', label: 'Business', icon: Briefcase, color: 'text-slate-300' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'text-cyan-500' },
  { id: 'chef', label: 'Chef', icon: Utensils, color: 'text-orange-500' },
  { id: 'support', label: 'Support', icon: Heart, color: 'text-rose-400' },
  { id: 'creative', label: 'Creative', icon: PenTool, color: 'text-amber-500' },
  { id: 'technical', label: 'Technical', icon: Code, color: 'text-emerald-500' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<{ id?: string, name: string, songs: Song[] }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is admin
        try {
          const userDoc = await getDocs(collection(db, 'users'));
          const userData = userDoc.docs.find(d => d.id === currentUser.uid)?.data();
          setIsAdmin(userData?.role === 'admin' || currentUser.email === 'kezra770@gmail.com');
        } catch (e) {
          console.error("Error checking admin status", e);
        }
      } else {
        setIsAdmin(false);
        setShowAdmin(false);
        // Fallback to local storage if not logged in
        const stored = localStorage.getItem('lunexix_playlists');
        if (stored) {
          try {
            setSavedPlaylists(JSON.parse(stored));
          } catch (e) {
            console.error('Failed to parse saved playlists', e);
          }
        }
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync playlists from Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(collection(db, 'users', user.uid, 'playlists'), (snapshot) => {
      const playlistsData = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        songs: doc.data().songs
      }));
      setSavedPlaylists(playlistsData);
    }, (error) => {
      console.error("Error fetching playlists:", error);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync chat history from Firestore when mode changes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid, 'chats', mode), (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      } else {
        setMessages([]);
      }
    }, (error) => {
      console.error("Error fetching chat history:", error);
    });
    return () => unsubscribe();
  }, [user, mode]);

  const savePlaylist = async (name: string) => {
    if (user) {
      const playlistId = Math.random().toString(36).substr(2, 9);
      try {
        await setDoc(doc(db, 'users', user.uid, 'playlists', playlistId), {
          uid: user.uid,
          name,
          songs: playlist,
          createdAt: Date.now()
        });
      } catch (error) {
        console.error("Error saving playlist:", error);
      }
    } else {
      const newSaved = [...savedPlaylists, { name, songs: playlist }];
      setSavedPlaylists(newSaved);
      localStorage.setItem('lunexix_playlists', JSON.stringify(newSaved));
    }
  };

  const renamePlaylist = async (index: number, newName: string) => {
    if (user) {
      const playlistToRename = savedPlaylists[index];
      if (playlistToRename.id) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'playlists', playlistToRename.id), {
            name: newName
          }, { merge: true });
        } catch (error) {
          console.error("Error renaming playlist:", error);
        }
      }
    } else {
      const newSaved = [...savedPlaylists];
      newSaved[index].name = newName;
      setSavedPlaylists(newSaved);
      localStorage.setItem('lunexix_playlists', JSON.stringify(newSaved));
    }
  };

  const deletePlaylist = async (index: number) => {
    if (user) {
      const playlistToDelete = savedPlaylists[index];
      if (playlistToDelete.id) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'playlists', playlistToDelete.id));
        } catch (error) {
          console.error("Error deleting playlist:", error);
        }
      }
    } else {
      const newSaved = savedPlaylists.filter((_, i) => i !== index);
      setSavedPlaylists(newSaved);
      localStorage.setItem('lunexix_playlists', JSON.stringify(newSaved));
    }
  };

  const exportPlaylist = (index: number) => {
    const playlistToExport = savedPlaylists[index];
    const dataStr = JSON.stringify(playlistToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${playlistToExport.name.replace(/\s+/g, '_')}_playlist.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const loadPlaylist = (songs: Song[]) => {
    setPlaylist(songs);
  };

  const handleMusicSearch = (filters: { genre: string; mood: string; year: string }) => {
    let prompt = "Find some music for me.";
    const parts = [];
    if (filters.genre !== 'Any Genre') parts.push(`genre: ${filters.genre}`);
    if (filters.mood !== 'Any Mood') parts.push(`mood: ${filters.mood}`);
    if (filters.year !== 'Any Year') parts.push(`released in: ${filters.year}`);
    
    if (parts.length > 0) {
      prompt = `Suggest some ${parts.join(', ')} music tracks. Please include specific song titles and artists.`;
    }
    handleSend(prompt);
  };

  const handleFindSimilar = (song: Song) => {
    handleSend(`Find some tracks similar to "${song.title}" by ${song.artist}. Please include specific song titles and artists.`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (overrideInput?: string | React.MouseEvent) => {
    const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'chats', mode), {
          uid: user.uid,
          mode: mode,
          messages: newMessages,
          updatedAt: Date.now()
        });
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    }

    if (typeof overrideInput !== 'string') setInput('');
    setIsTyping(true);

    try {
      const responseText = await generateChatResponse(mode, newMessages, textToSend);
      const modelMessage: Message = {
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);
      
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'chats', mode), {
            uid: user.uid,
            mode: mode,
            messages: finalMessages,
            updatedAt: Date.now()
          });
        } catch (error) {
          console.error("Error saving chat:", error);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'chats', mode));
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
    }
  };

  const addToPlaylist = (songStr: string) => {
    // Format: Title - Artist | URL or Title - Artist
    const [mainPart, urlPart] = songStr.split(' | ');
    const [title, artist] = mainPart.split(' - ');
    
    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      artist: artist?.trim() || 'Unknown Artist',
      url: urlPart?.trim(),
    };
    setPlaylist(prev => [...prev, newSong]);
  };

  const removeFromPlaylist = (id: string) => {
    setPlaylist(prev => prev.filter(s => s.id !== id));
  };

  const clearPlaylist = () => {
    setPlaylist([]);
  };

  const shareToWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToFacebook = (url: string) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const renderMessageText = (text: string, role: 'user' | 'model') => {
    if (role === 'user') return <ReactMarkdown>{text}</ReactMarkdown>;

    // Parse [SONG: ...] and [MEDIA: ...] tags
    const parts = text.split(/(\[SONG:.*?\]|\[MEDIA:.*?\])/g);
    return (
      <div className="space-y-4">
        {parts.map((part, i) => {
          const songMatch = part.match(/\[SONG:(.*?)\]/);
          const mediaMatch = part.match(/\[MEDIA:(.*?)\]/);

          if (songMatch) {
            const songStr = songMatch[1];
            const [displayPart] = songStr.split(' | ');
            const isAlreadyInPlaylist = playlist.some(s => `${s.title} - ${s.artist}` === displayPart.trim());
            return (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                    <Music className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm font-medium text-white">{displayPart}</span>
                </div>
                <button 
                  onClick={() => addToPlaylist(songStr)}
                  disabled={isAlreadyInPlaylist}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    isAlreadyInPlaylist 
                      ? "text-emerald-500 bg-emerald-500/10 cursor-default" 
                      : "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20"
                  )}
                >
                  {isAlreadyInPlaylist ? <Bot className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          }

          if (mediaMatch) {
            const mediaUrl = mediaMatch[1].trim();
            const Player = ReactPlayer as any;
            return (
              <div key={i} className="space-y-2">
                <div className="aspect-video rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  <Player 
                    url={mediaUrl} 
                    width="100%" 
                    height="100%" 
                    controls 
                    config={{
                      youtube: { playerVars: { showinfo: 1 } },
                      facebook: { appId: '123456789' }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => shareToWhatsApp(`Check out this video: ${mediaUrl}`)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => shareToFacebook(mediaUrl)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    Facebook
                  </button>
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          }

          return <ReactMarkdown key={i}>{part}</ReactMarkdown>;
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-lunexix-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 glass-panel border-r border-white/5 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lunexix-primary to-lunexix-secondary flex items-center justify-center shadow-lg shadow-lunexix-primary/20">
            <Bot className="text-white w-6 h-6" />
          </div>
          <h1 className="hidden md:block font-display font-bold text-xl tracking-tight text-white">
            Lunexix <span className="text-lunexix-primary">AI</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 hidden md:block">
            Modes
          </div>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as ChatMode); setShowAdmin(false); }}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                mode === m.id && !showAdmin
                  ? "bg-white/10 text-white" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <m.icon className={cn("w-5 h-5", mode === m.id && !showAdmin ? m.color : "group-hover:text-slate-200")} />
              <span className="hidden md:block font-medium">{m.label}</span>
              {mode === m.id && !showAdmin && <ChevronRight className="hidden md:block ml-auto w-4 h-4 text-slate-500" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          {isAdmin && (
            <button 
              onClick={() => setShowAdmin(true)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                showAdmin ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500"
              )}
            >
              <Shield className="w-5 h-5" />
              <span className="hidden md:block font-medium">Admin</span>
            </button>
          )}
          <button 
            onClick={() => setIsLiveOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-lunexix-primary/10 text-lunexix-primary hover:bg-lunexix-primary/20 transition-all"
          >
            <Mic className="w-5 h-5" />
            <span className="hidden md:block font-medium">Live Voice</span>
          </button>
          <button 
            onClick={clearChat}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-5 h-5" />
            <span className="hidden md:block font-medium">Clear Chat</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className={cn("p-2 rounded-lg bg-white/5", showAdmin ? "text-emerald-500" : MODES.find(m => m.id === mode)?.color)}>
              {React.createElement(showAdmin ? Shield : (MODES.find(m => m.id === mode)?.icon || Sparkles), { className: "w-5 h-5" })}
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                {showAdmin ? 'Admin Dashboard' : `${MODES.find(m => m.id === mode)?.label} Assistant`}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Lunexix Engine v3.1
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
            <AuthButton />
          </div>
        </header>

        {showAdmin ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AdminDashboard />
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-lunexix-primary/10 flex items-center justify-center animate-bounce">
                <Bot className="w-10 h-10 text-lunexix-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">Welcome to Lunexix</h3>
                <p className="text-slate-400 leading-relaxed">
                  Your multi-functional AI assistant. Choose a mode on the left and start chatting, or try the Live Voice mode for real-time interaction.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {mode === 'dj' ? (
                  <div className="col-span-2 w-full space-y-6">
                    <MusicSearchFilters onSearch={handleMusicSearch} />
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleSend("What are the top 5 trending tracks right now?")}
                        className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                      >
                        <Music className="w-4 h-4 text-pink-500" />
                        "Trending tracks right now?"
                      </button>
                      <button 
                        onClick={() => handleSend("Suggest some music based on my preference for electronic and house music.")}
                        className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                      >
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        "Suggest tracks for my vibe"
                      </button>
                    </div>
                  </div>
                ) : mode === 'social' ? (
                  <div className="col-span-2 w-full">
                    <VideoFeed />
                    <div className="grid grid-cols-2 gap-3 w-full mt-6">
                      <button 
                        onClick={() => handleSend("Find the most popular YouTube livestreams right now.")}
                        className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                      >
                        <Youtube className="w-4 h-4 text-red-500" />
                        "Popular YouTube livestreams?"
                      </button>
                      <button 
                        onClick={() => handleSend("What's trending on Facebook today?")}
                        className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                      >
                        <Facebook className="w-4 h-4 text-blue-500" />
                        "Trending on Facebook?"
                      </button>
                    </div>
                  </div>
                ) : mode === 'academic' ? (
                  <>
                    <button 
                      onClick={() => handleSend("Explain quantum entanglement in simple terms.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      "Explain quantum entanglement"
                    </button>
                    <button 
                      onClick={() => handleSend("Help me create a study schedule for my finals.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      "Create a study schedule"
                    </button>
                  </>
                ) : mode === 'fitness' ? (
                  <>
                    <button 
                      onClick={() => handleSend("Give me a 15-minute home workout routine.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Dumbbell className="w-4 h-4 text-red-500" />
                      "15-min home workout"
                    </button>
                    <button 
                      onClick={() => handleSend("What are some healthy high-protein snacks?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-red-500" />
                      "High-protein snacks"
                    </button>
                  </>
                ) : mode === 'business' ? (
                  <>
                    <button 
                      onClick={() => handleSend("Draft a professional follow-up email after a job interview.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Briefcase className="w-4 h-4 text-slate-300" />
                      "Draft a follow-up email"
                    </button>
                    <button 
                      onClick={() => handleSend("How can I improve my team's productivity?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-slate-300" />
                      "Improve team productivity"
                    </button>
                  </>
                ) : mode === 'travel' ? (
                  <>
                    <button 
                      onClick={() => handleSend("Plan a 3-day itinerary for Tokyo.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Plane className="w-4 h-4 text-cyan-500" />
                      "3-day Tokyo itinerary"
                    </button>
                    <button 
                      onClick={() => handleSend("What are some hidden gems in Italy?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      "Hidden gems in Italy"
                    </button>
                  </>
                ) : mode === 'chef' ? (
                  <>
                    <button 
                      onClick={() => handleSend("Suggest a quick 20-minute dinner recipe.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Utensils className="w-4 h-4 text-orange-500" />
                      "20-min dinner recipe"
                    </button>
                    <button 
                      onClick={() => handleSend("How do I properly sear a steak?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      "How to sear a steak"
                    </button>
                  </>
                ) : mode === 'support' ? (
                  <>
                    <button 
                      onClick={() => handleSend("I'm feeling a bit overwhelmed today. Can we talk?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Heart className="w-4 h-4 text-rose-400" />
                      "I'm feeling overwhelmed"
                    </button>
                    <button 
                      onClick={() => handleSend("Guide me through a 5-minute mindfulness exercise.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left flex items-center gap-3"
                    >
                      <Sparkles className="w-4 h-4 text-rose-400" />
                      "5-min mindfulness"
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleSend("What's trending in music today?")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left"
                    >
                      "What's trending in music today?"
                    </button>
                    <button 
                      onClick={() => handleSend("Write a futuristic poem about space.")}
                      className="p-4 glass-panel rounded-2xl text-sm text-slate-300 hover:bg-white/10 transition-all text-left"
                    >
                      "Write a futuristic poem about space."
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={m.timestamp + i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-3xl",
                  m.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center",
                  m.role === 'user' ? "bg-lunexix-secondary/20" : "bg-lunexix-primary/20"
                )}>
                  {m.role === 'user' ? <User className="w-5 h-5 text-lunexix-secondary" /> : <Bot className="w-5 h-5 text-lunexix-primary" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl glass-panel",
                  m.role === 'user' ? "bg-lunexix-secondary/10 border-lunexix-secondary/20" : "bg-white/5"
                )}>
                  <div className="markdown-body">
                    {renderMessageText(m.text, m.role)}
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 uppercase tracking-widest">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-4 mr-auto">
              <div className="w-10 h-10 rounded-xl bg-lunexix-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-lunexix-primary" />
              </div>
              <div className="p-4 rounded-2xl glass-panel flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-lunexix-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-lunexix-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-lunexix-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 bg-gradient-to-t from-lunexix-bg via-lunexix-bg to-transparent">
          <div className="max-w-4xl mx-auto relative flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Message Lunexix (${mode} mode)...`}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-lunexix-primary/50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-2 p-2.5 bg-lunexix-primary hover:bg-lunexix-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-lunexix-primary/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {mode === 'dj' && (
              <button
                onClick={() => handleSend("Suggest some popular music tracks based on current trends and my preferences. Please include specific song titles and artists.")}
                disabled={isTyping}
                className="hidden md:flex items-center gap-2 px-6 py-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/20 rounded-2xl font-semibold transition-all whitespace-nowrap"
              >
                <Music className="w-5 h-5" />
                Suggest Tracks
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4 uppercase tracking-[0.2em]">
            Powered by Gemini 3.1 Pro • Lunexix AI Assistant
          </p>
        </div>
        </>
        )}
      </main>

      {/* Music Player */}
      {mode === 'dj' && !showAdmin && playlist.length > 0 && (
        <MusicPlayer 
          playlist={playlist} 
          onRemoveFromPlaylist={removeFromPlaylist}
          onClearPlaylist={clearPlaylist}
          onSavePlaylist={savePlaylist}
          onLoadPlaylist={loadPlaylist}
          onRenamePlaylist={renamePlaylist}
          onDeletePlaylist={deletePlaylist}
          onExportPlaylist={exportPlaylist}
          onFindSimilar={handleFindSimilar}
          savedPlaylists={savedPlaylists}
        />
      )}

      {/* Live Voice Modal */}
      <LiveVoiceChat isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} />
    </div>
  );
}
