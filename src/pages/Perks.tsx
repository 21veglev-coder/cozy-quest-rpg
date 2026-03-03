import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { GameCharacter, CharacterPerk, PERKS, PerkDef } from '@/types/game';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';

const Perks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [character, setCharacter] = useState<GameCharacter | null>(null);
  const [ownedPerks, setOwnedPerks] = useState<CharacterPerk[]>([]);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    const charRes = await supabase.from('characters').select('*').eq('user_id', user!.id).single();
    if (!charRes.data) return;
    setCharacter(charRes.data);
    const perksRes = await supabase.from('character_perks').select('*').eq('character_id', charRes.data.id);
    if (perksRes.data) setOwnedPerks(perksRes.data);
  };

  const getOwnedTier = (perkId: string) => ownedPerks.find(p => p.perk_id === perkId)?.tier || 0;

  const upgradePerk = async (perk: PerkDef) => {
    if (!character || character.perk_points <= 0) { toast.error('Nincs elég perk pontod!'); return; }
    const currentTier = getOwnedTier(perk.id);
    if (currentTier >= perk.maxTier) { toast.error('Max szint!'); return; }

    const existing = ownedPerks.find(p => p.perk_id === perk.id);
    if (existing) {
      await supabase.from('character_perks').update({ tier: currentTier + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('character_perks').insert({ character_id: character.id, perk_id: perk.id, tier: 1 });
    }
    await supabase.from('characters').update({ perk_points: character.perk_points - 1 }).eq('id', character.id);
    toast.success(`${perk.name} fejlesztve!`);
    loadData();
  };

  const availablePerks = PERKS.filter(p => !p.classReq || p.classReq === character?.class);
  const classPerks = availablePerks.filter(p => p.classReq);
  const universalPerks = availablePerks.filter(p => !p.classReq);

  if (!character) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold font-display animate-pulse-glow">Betöltés...</div></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/lobby')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Vissza
        </Button>
        <h1 className="font-display text-lg text-gold text-glow-gold"><Star className="w-5 h-5 inline mr-1" />Képességek</h1>
        <div className="ml-auto font-display text-sm">
          <span className="text-gold">⭐ {character.perk_points}</span>
          <span className="text-muted-foreground ml-1">pont</span>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Class Perks */}
        <h2 className="font-display text-sm text-gold mb-3">Osztály Képességek</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {classPerks.map(perk => {
            const tier = getOwnedTier(perk.id);
            const maxed = tier >= perk.maxTier;
            return (
              <motion.div key={perk.id} whileHover={{ scale: 1.02 }}
                className={`rpg-panel p-4 ${tier > 0 ? 'border-glow' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{perk.icon}</span>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{perk.name}</p>
                    <p className="text-[10px] text-muted-foreground">{perk.description}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: perk.maxTier }, (_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < tier ? 'bg-gold' : 'bg-secondary'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{tier}/{perk.maxTier}</span>
                  <Button size="sm" disabled={maxed || character.perk_points <= 0}
                    onClick={() => upgradePerk(perk)} className="text-[10px] font-display h-7 px-3">
                    {maxed ? 'MAX' : '⭐ Fejlesztés'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Universal Perks */}
        <h2 className="font-display text-sm text-gold mb-3">Általános Képességek</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {universalPerks.map(perk => {
            const tier = getOwnedTier(perk.id);
            const maxed = tier >= perk.maxTier;
            return (
              <motion.div key={perk.id} whileHover={{ scale: 1.02 }}
                className={`rpg-panel p-4 ${tier > 0 ? 'border-glow' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{perk.icon}</span>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{perk.name}</p>
                    <p className="text-[10px] text-muted-foreground">{perk.description}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: perk.maxTier }, (_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < tier ? 'bg-gold' : 'bg-secondary'}`} />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{tier}/{perk.maxTier}</span>
                  <Button size="sm" disabled={maxed || character.perk_points <= 0}
                    onClick={() => upgradePerk(perk)} className="text-[10px] font-display h-7 px-3">
                    {maxed ? 'MAX' : '⭐ Fejlesztés'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Perks;
