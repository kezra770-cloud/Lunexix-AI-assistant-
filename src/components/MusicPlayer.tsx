import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, ListMusic, Volume2, Trash2, Music, ExternalLink, Save, FolderOpen, Edit2, Download, X, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { cn } from '../lib/utils';
import { Song } from '../types';

interface MusicPlayerProps {
  playlist: Song[];
  onRemoveFromPlaylist: (id: string) => void;
  onClearPlaylist: () => void;
  onSavePlaylist: (name: string) => void;
  onLoadPlaylist: (songs: Song[]) => void;
  onRenamePlaylist: (index: number, newName: string) => void;
  onDeletePlaylist: (index: number) => void;
  onExportPlaylist: (index: number) => void;
  onFindSimilar: (song: Song) => void;
  savedPlaylists: { name: string, songs: Song[] }[];
}

export default function MusicPlayer({ 
  playlist, 
  onRemoveFromPlaylist, 
  onClearPlaylist,
  onSavePlaylist,
  onLoadPlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onExportPlaylist,
  onFindSimilar,
  savedPlaylists
}: MusicPlayerProps) {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [volume, setVolume] = useState(0.8);
  
  const currentSong = playlist[currentSongIndex];
  const playerRef = useRef<any>(null);
  const Player = ReactPlayer as any;

  useEffect(() => {
    if (playlist.length > 0 && currentSongIndex >= playlist.length) {
      setCurrentSongIndex(0);
    }
  }, [playlist.length, currentSongIndex]);

  const handlePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((currentSongIndex + 1) % playlist.length);
    setProgress(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentSongIndex((currentSongIndex - 1 + playlist.length) % playlist.length);
    setProgress(0);
    setIsPlaying(true);
  };

  const playSong = (index: number) => {
    setCurrentSongIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleProgress = (state: { played: number, playedSeconds: number }) => {
    setProgress(state.played * 100);
  };

  const handleDuration = (d: number) => {
    setDuration(d);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    playerRef.current.seekTo(percentage);
  };

  if (playlist.length === 0) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40"
    >
      <div className="hidden">
        {currentSong?.url ? (
          <Player
            ref={playerRef}
            url={currentSong.url}
            playing={isPlaying}
            volume={volume}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={handleNext}
            width="0"
            height="0"
          />
        ) : null}
      </div>

      <div className="glass-panel rounded-2xl p-4 shadow-2xl border-lunexix-primary/20">
        <div className="flex items-center gap-4">
          {/* Album Art */}
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lunexix-primary to-lunexix-secondary flex items-center justify-center shadow-lg relative overflow-hidden">
            {currentSong?.coverUrl ? (
              <img src={currentSong.coverUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Music className="w-6 h-6 text-white" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex gap-0.5 items-end h-4">
                  <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-white" />
                  <motion.div animate={{ height: [8, 4, 8] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 bg-white" />
                  <motion.div animate={{ height: [4, 10, 4] }} transition={{ duration: 0.4, repeat: Infinity }} className="w-1 bg-white" />
                </div>
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white truncate">
                {currentSong?.title || "No song selected"}
              </h4>
              {currentSong?.url && (
                <div className="flex items-center gap-2">
                  <a href={currentSong.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-lunexix-primary transition-colors">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button 
                    onClick={() => onFindSimilar(currentSong)}
                    className="text-[10px] bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-full hover:bg-pink-500/20 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-2 h-2" /> Similar
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              {currentSong?.artist || "Unknown Artist"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-4">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/10 rounded-full appearance-none accent-lunexix-primary cursor-pointer"
              />
            </div>
            <button onClick={handlePrev} className="p-2 text-slate-400 hover:text-white transition-all">
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-lunexix-primary flex items-center justify-center text-white shadow-lg shadow-lunexix-primary/20 hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={handleNext} className="p-2 text-slate-400 hover:text-white transition-all">
              <SkipForward className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              className={cn("p-2 transition-all", isPlaylistOpen ? "text-lunexix-primary" : "text-slate-400 hover:text-white")}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div 
          className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer group"
          onClick={handleSeek}
        >
          <motion.div 
            className="h-full bg-lunexix-primary relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        
        {/* Fallback Message for simulated playback */}
        {!currentSong?.url && isPlaying && (
          <div className="mt-2 text-[10px] text-center text-slate-500 animate-pulse">
            Simulating playback (no direct URL provided)
          </div>
        )}

        {/* Playlist Panel */}
        <AnimatePresence>
          {isPlaylistOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Playlist</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsSaveModalOpen(true)}
                      className="text-[10px] text-lunexix-primary hover:underline flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button 
                      onClick={() => setIsLoadModalOpen(true)}
                      className="text-[10px] text-amber-500 hover:underline flex items-center gap-1"
                    >
                      <FolderOpen className="w-3 h-3" /> Load
                    </button>
                    <button onClick={onClearPlaylist} className="text-[10px] text-red-500 hover:underline">Clear All</button>
                  </div>
                </div>

                {/* Save Modal */}
                {isSaveModalOpen && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
                    <input 
                      type="text" 
                      placeholder="Playlist Name" 
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white mb-2 focus:outline-none focus:border-lunexix-primary"
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (newPlaylistName.trim()) {
                            onSavePlaylist(newPlaylistName);
                            setNewPlaylistName('');
                            setIsSaveModalOpen(false);
                          }
                        }}
                        className="flex-1 bg-lunexix-primary text-white text-[10px] font-bold py-1.5 rounded-lg"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setIsSaveModalOpen(false)}
                        className="flex-1 bg-white/5 text-slate-400 text-[10px] font-bold py-1.5 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Load Modal */}
                {isLoadModalOpen && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 mb-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {savedPlaylists.length === 0 ? (
                      <div className="text-[10px] text-slate-500 text-center py-2">No saved playlists</div>
                    ) : (
                      <div className="space-y-2">
                        {savedPlaylists.map((pl, idx) => (
                          <div key={idx} className="flex flex-col gap-1 p-2 hover:bg-white/5 rounded-lg group transition-all">
                            {editingIndex === idx ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="flex-1 bg-black/40 border border-lunexix-primary/50 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
                                  autoFocus
                                />
                                <button 
                                  onClick={() => {
                                    if (editingName.trim()) {
                                      onRenamePlaylist(idx, editingName);
                                      setEditingIndex(null);
                                    }
                                  }}
                                  className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => setEditingIndex(null)}
                                  className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <button 
                                  onClick={() => {
                                    onLoadPlaylist(pl.songs);
                                    setIsLoadModalOpen(false);
                                  }}
                                  className="flex-1 text-left text-[10px] text-white font-medium truncate"
                                >
                                  {pl.name} <span className="text-slate-500 font-normal">({pl.songs.length})</span>
                                </button>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditingIndex(idx);
                                      setEditingName(pl.name);
                                    }}
                                    className="p-1 text-slate-400 hover:text-lunexix-primary hover:bg-white/10 rounded"
                                    title="Rename"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => onExportPlaylist(idx)}
                                    className="p-1 text-slate-400 hover:text-amber-500 hover:bg-white/10 rounded"
                                    title="Export"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => onDeletePlaylist(idx)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-white/10 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={() => setIsLoadModalOpen(false)}
                      className="w-full mt-2 bg-white/5 text-slate-400 text-[10px] font-bold py-1.5 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                )}
                {playlist.map((song, i) => (
                  <div 
                    key={song.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg group transition-all",
                      currentSongIndex === i ? "bg-lunexix-primary/10" : "hover:bg-white/5"
                    )}
                  >
                    <button 
                      onClick={() => playSong(i)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-sm font-medium text-white truncate">{song.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{song.artist}</div>
                    </button>
                    <button 
                      onClick={() => onRemoveFromPlaylist(song.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
