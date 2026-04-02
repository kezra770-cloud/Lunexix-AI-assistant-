import React, { useState, useEffect } from 'react';
import { Youtube, Play, TrendingUp, BarChart2, Eye, ThumbsUp, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
import { cn } from '../lib/utils';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  views: string;
  likes: string;
  comments: string;
  channel: string;
  publishedAt: string;
}

const MOCK_TRENDING_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'Top 10 AI Breakthroughs in 2026',
    thumbnail: 'https://picsum.photos/seed/ai/640/360',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
    views: '1.2M',
    likes: '45K',
    comments: '3.2K',
    channel: 'TechInsider',
    publishedAt: '2 hours ago'
  },
  {
    id: '2',
    title: 'How to Build a Full-Stack App with Gemini 3.1',
    thumbnail: 'https://picsum.photos/seed/code/640/360',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    views: '850K',
    likes: '32K',
    comments: '1.5K',
    channel: 'CodeMaster',
    publishedAt: '5 hours ago'
  },
  {
    id: '3',
    title: 'SpaceX Mars Mission: Live Update',
    thumbnail: 'https://picsum.photos/seed/space/640/360',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    views: '2.5M',
    likes: '120K',
    comments: '12K',
    channel: 'SpaceX',
    publishedAt: 'Live'
  }
];

export default function VideoFeed() {
  const [activeTab, setActiveTab] = useState<'trending' | 'studio'>('trending');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const Player = ReactPlayer as any;

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
      {/* Tabs */}
      <div className="flex items-center gap-4 p-1 bg-white/5 rounded-2xl w-fit mx-auto border border-white/10">
        <button 
          onClick={() => setActiveTab('trending')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'trending' ? "bg-lunexix-primary text-white shadow-lg shadow-lunexix-primary/20" : "text-slate-400 hover:text-white"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Trending
        </button>
        <button 
          onClick={() => setActiveTab('studio')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
            activeTab === 'studio' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-400 hover:text-white"
          )}
        >
          <BarChart2 className="w-4 h-4" />
          YouTube Studio
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'trending' ? (
          <motion.div 
            key="trending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {MOCK_TRENDING_VIDEOS.map((video) => (
              <div 
                key={video.id}
                className="glass-panel rounded-2xl overflow-hidden border-white/5 hover:border-lunexix-primary/30 transition-all group"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setSelectedVideo(video)}
                      className="w-12 h-12 rounded-full bg-lunexix-primary flex items-center justify-center text-white shadow-xl"
                    >
                      <Play className="w-6 h-6 ml-1" />
                    </button>
                  </div>
                  {video.publishedAt === 'Live' && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded uppercase tracking-wider animate-pulse">
                      Live
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <h4 className="text-sm font-bold text-white line-clamp-2 leading-tight">{video.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-medium text-slate-400">{video.channel}</span>
                    <span>{video.publishedAt}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Eye className="w-3 h-3" /> {video.views}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ThumbsUp className="w-3 h-3" /> {video.likes}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MessageCircle className="w-3 h-3" /> {video.comments}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="studio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col items-center text-center space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total Views</span>
                <span className="text-3xl font-display font-bold text-white">4.8M</span>
                <span className="text-[10px] text-emerald-500">+12% vs last month</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col items-center text-center space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Watch Time</span>
                <span className="text-3xl font-display font-bold text-white">125K</span>
                <span className="text-[10px] text-emerald-500">+5% vs last month</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col items-center text-center space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Subscribers</span>
                <span className="text-3xl font-display font-bold text-white">85.2K</span>
                <span className="text-[10px] text-emerald-500">+2.4K this month</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col items-center text-center space-y-2">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Revenue</span>
                <span className="text-3xl font-display font-bold text-white">$12.4K</span>
                <span className="text-[10px] text-emerald-500">+8% vs last month</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-white/5">
              <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-lunexix-primary" />
                Recent Video Performance
              </h4>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                    <div className="w-24 aspect-video rounded-lg bg-slate-800 overflow-hidden">
                      <img src={`https://picsum.photos/seed/vid${i}/200/112`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-white truncate">My Latest Masterpiece #{i}</h5>
                      <p className="text-xs text-slate-500">Published 2 days ago</p>
                    </div>
                    <div className="flex items-center gap-8 text-right">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">45.2K</span>
                        <span className="text-[10px] text-slate-500 uppercase">Views</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">2.1K</span>
                        <span className="text-[10px] text-slate-500 uppercase">Likes</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-4xl aspect-video relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <Share2 className="w-5 h-5 rotate-45" /> {/* Using share icon rotated as X for simplicity since I don't want to import more icons if not needed, but I have X in lucide-react */}
              </button>
              <Player 
                url={selectedVideo.url} 
                width="100%" 
                height="100%" 
                playing 
                controls 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
