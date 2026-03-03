import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessage } from '@/types/game';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ChatPanel = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel('chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages(prev => [...prev.slice(-49), payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !user) return;
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Ismeretlen';
    await supabase.from('chat_messages').insert({
      user_id: user.id,
      username,
      message: newMsg.trim(),
    });
    setNewMsg('');
  };

  return (
    <div className="rpg-panel flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm text-gold">💬 Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold text-gold">{msg.username}: </span>
            <span className="text-foreground/80">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Üzenet..."
          className="bg-background border-border text-sm"
        />
        <button onClick={sendMessage} className="text-gold hover:text-gold/80 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
