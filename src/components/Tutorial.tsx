import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    title: 'Üdvözlünk a Cozy Quest-ben!',
    content: 'Ez egy multiplayer RPG, ahol az osztálytársaiddal kalandhatsz együtt. Hozz létre egy karaktert és csatlakozz a lobbihoz!',
    icon: '⚔️',
  },
  {
    title: 'Válassz Osztályt',
    content: 'Négy osztály közül választhatsz: Harcos, Mágus, Tolvaj vagy Gyógyító. Mindegyiknek egyedi képességei vannak.',
    icon: '🛡️',
  },
  {
    title: 'Inventory Rendszer',
    content: 'A felszerelésed a táskádban van. Viselheted vagy cserélheted a tárgyakat. Ritkaságuk színe mutatja az erejüket.',
    icon: '🎒',
  },
  {
    title: 'Chat & Lobby',
    content: 'A lobbiban látod az online játékosokat. A chatben kommunikálhatsz velük valós időben!',
    icon: '💬',
  },
  {
    title: 'Készen Állsz!',
    content: 'Most már indulhatsz kalandozni. Sok sikert, hős!',
    icon: '🌟',
  },
];

interface TutorialProps {
  onClose: () => void;
}

const Tutorial = ({ onClose }: TutorialProps) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rpg-panel-gold p-8 max-w-md w-full relative"
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="text-5xl mb-4 text-center animate-float">{current.icon}</div>
            <h2 className="text-xl font-display font-bold text-gold text-center mb-3">{current.title}</h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">{current.content}</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-gold' : 'bg-secondary'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 font-display border-border">
              Vissza
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} className="flex-1 font-display bg-primary text-primary-foreground">
              Tovább <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={onClose} className="flex-1 font-display bg-primary text-primary-foreground glow-gold-sm">
              Kalandozni! ⚔️
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Tutorial;
