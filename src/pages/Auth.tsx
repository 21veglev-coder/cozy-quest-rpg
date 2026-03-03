import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sword, Shield, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate('/lobby');
      } else {
        await signUp(email, password, username);
        toast.success('Fiók létrehozva! Ellenőrizd az email-ed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/30"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], y: [0, -30, -60] }}
            transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md px-6"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center gap-3 mb-4">
            <Sword className="w-6 h-6 text-gold animate-pulse-glow" />
            <Shield className="w-8 h-8 text-gold" />
            <Wand2 className="w-6 h-6 text-gold animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground text-glow-gold">
            Realm of Shadows
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? 'Lépj be a birodalomba' : 'Csatlakozz a kalandhoz'}
          </p>
        </div>

        {/* Form */}
        <div className="rpg-panel-gold p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-muted-foreground font-display mb-1 block">Felhasználónév</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="HeroName"
                  className="bg-background border-border"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground font-display mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hero@realm.com"
                className="bg-background border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground font-display mb-1 block">Jelszó</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-display hover:bg-primary/90 glow-gold-sm"
            >
              {loading ? '...' : isLogin ? 'Belépés' : 'Regisztráció'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {isLogin ? 'Nincs fiókod? Regisztrálj!' : 'Van már fiókod? Lépj be!'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
