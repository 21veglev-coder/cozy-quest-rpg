import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Lobby from "./pages/Lobby";
import CharacterCreate from "./pages/CharacterCreate";
import Shop from "./pages/Shop";
import WorldMap from "./pages/WorldMap";
import Combat from "./pages/Combat";
import Dungeon from "./pages/Dungeon";
import Perks from "./pages/Perks";
import Prestige from "./pages/Prestige";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/create" element={<CharacterCreate />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/map" element={<WorldMap />} />
            <Route path="/combat/:locationId?" element={<Combat />} />
            <Route path="/dungeon/:locationId" element={<Dungeon />} />
            <Route path="/perks" element={<Perks />} />
            <Route path="/prestige" element={<Prestige />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
