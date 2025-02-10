
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LobbyCreationProps {
  onJoin: (name: string) => void;
  lobbyCode: string;
  playerId: string;
}

export const LobbyCreation = ({ onJoin, lobbyCode, playerId }: LobbyCreationProps) => {
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchExistingName = async () => {
      const { data } = await supabase
        .from('players')
        .select('name')
        .eq('id', playerId)
        .single();

      if (data?.name) {
        setName(data.name);
      }
    };

    fetchExistingName();
  }, [playerId]);

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join/${lobbyCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Invite link copied!',
      description: 'Share this link with your friends to join the game.',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-game-primary/10 to-game-secondary/10">
      <Card className="w-full max-w-md p-6 space-y-6 backdrop-blur-sm bg-white/80">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-game-neutral">Play Re:cast</h1>
          <p className="text-gray-600">Create or join a game to get started!</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Your Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lobby Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4 py-2 bg-gray-100 rounded-md font-mono text-lg text-center">
                {lobbyCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                className="hover:bg-gray-100"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full bg-game-primary hover:bg-game-primary/90 text-white"
            onClick={() => name && onJoin(name)}
            disabled={!name}
          >
            Join Game
          </Button>
        </div>
      </Card>
    </div>
  );
};
