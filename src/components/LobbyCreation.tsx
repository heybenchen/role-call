
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Copy, UserRound } from 'lucide-react';

interface LobbyCreationProps {
  onJoin: (name: string) => void;
  lobbyCode: string;
}

export const LobbyCreation = ({ onJoin, lobbyCode }: LobbyCreationProps) => {
  const [name, setName] = useState('');

  const copyInviteLink = () => {
    const url = `${window.location.origin}/join/${lobbyCode}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Invite link copied!',
      description: 'Share this link with your friends to join the game.',
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#9b87f5] to-[#F97316] mb-4">
            <UserRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#F97316] bg-clip-text text-transparent">
            Join the Game
          </h1>
          <p className="text-gray-600">Enter your name to start playing!</p>
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
              className="w-full border-gray-200 focus:ring-[#9b87f5] focus:border-[#9b87f5]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Lobby Code
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg font-mono text-lg text-center text-gray-700">
                {lobbyCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                className="hover:bg-gray-50"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-[#9b87f5] to-[#F97316] hover:opacity-90 text-white"
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
