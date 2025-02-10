
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserRound } from 'lucide-react';

interface GameLobbyProps {
  players: Player[];
  onStart: () => void;
  isHost: boolean;
}

export const GameLobby = ({ players, onStart, isHost }: GameLobbyProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#9b87f5] to-[#F97316] bg-clip-text text-transparent">
            Waiting for Players
          </h2>
          <p className="text-gray-600">
            {players.length} {players.length === 1 ? 'player' : 'players'} in lobby
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Players</span>
              <span>{players.length}/8</span>
            </div>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9b87f5] to-[#F97316] flex items-center justify-center">
                      <UserRound className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{player.name}</span>
                  </div>
                  {player.isHost && (
                    <span className="text-xs font-medium text-[#F97316] px-3 py-1 bg-orange-100 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <Button
              className="w-full bg-gradient-to-r from-[#9b87f5] to-[#F97316] hover:opacity-90 text-white font-medium py-3"
              onClick={onStart}
              disabled={players.length < 2}
            >
              Start Game
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
