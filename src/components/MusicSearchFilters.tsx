import React, { useState } from 'react';
import { Search, Filter, Calendar, Music, Smile } from 'lucide-react';
import { cn } from '../lib/utils';

interface MusicSearchFiltersProps {
  onSearch: (filters: { genre: string; mood: string; year: string }) => void;
}

const GENRES = ['Any Genre', 'Electronic', 'House', 'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Lo-fi', 'R&B'];
const MOODS = ['Any Mood', 'Energetic', 'Chill', 'Happy', 'Sad', 'Focus', 'Romantic', 'Aggressive', 'Dreamy'];
const YEARS = ['Any Year', '2026', '2025', '2024', '2023', '2020s', '2010s', '2000s', '90s', '80s'];

export default function MusicSearchFilters({ onSearch }: MusicSearchFiltersProps) {
  const [genre, setGenre] = useState('Any Genre');
  const [mood, setMood] = useState('Any Mood');
  const [year, setYear] = useState('Any Year');

  const handleSearch = () => {
    onSearch({ genre, mood, year });
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 space-y-6 w-full">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-pink-500" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Advanced Music Search</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Genre */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
            <Music className="w-3 h-3" /> Genre
          </label>
          <select 
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all appearance-none"
          >
            {GENRES.map(g => <option key={g} value={g} className="bg-slate-900">{g}</option>)}
          </select>
        </div>

        {/* Mood */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
            <Smile className="w-3 h-3" /> Mood
          </label>
          <select 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all appearance-none"
          >
            {MOODS.map(m => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Release Year
          </label>
          <select 
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all appearance-none"
          >
            {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
          </select>
        </div>
      </div>

      <button 
        onClick={handleSearch}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-pink-500/20"
      >
        <Search className="w-4 h-4" />
        Find Tracks
      </button>
    </div>
  );
}
