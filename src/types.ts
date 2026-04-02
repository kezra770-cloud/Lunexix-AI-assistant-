export type ChatMode = 'general' | 'dj' | 'creative' | 'technical' | 'social' | 'academic' | 'fitness' | 'business' | 'travel' | 'chef' | 'support';

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  mode: ChatMode;
  isTyping: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl?: string;
  previewUrl?: string;
  url?: string;
}
