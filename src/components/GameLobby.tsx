
import { Player } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface GameLobbyProps {
  players: Player[];
  onStart: () => void;
  isHost: boolean;
}

export const GameLobby = ({ players, onStart, isHost }: GameLobbyProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-game-primary/10 to-game-secondary/10">
      <Card className="w-full max-w-md p-6 space-y-6 backdrop-blur-sm bg-white/80">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-game-neutral">Waiting for Players</h2>
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
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-game-secondary" />
                    <span className="font-medium">{player.name}</span>
                  </div>
                  {player.isHost && (
                    <span className="text-xs font-medium text-game-primary px-2 py-1 bg-game-primary/10 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <Button
              className="w-full bg-game-primary hover:bg-game-primary/90 text-white"
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
