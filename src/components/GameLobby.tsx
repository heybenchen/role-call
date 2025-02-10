
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-game-neutral">Waiting for Players</h2>
          <p className="text-xl font-semibold text-game-primary">
            {players.length} {players.length === 1 ? 'player' : 'players'} in lobby
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-lg font-bold text-game-secondary">
              <span>Players</span>
              <span>{players.length}/8</span>
            </div>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-[#F1F0FB] rounded-lg shadow-lego-sm transform transition-transform hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-6 w-6 text-game-secondary" />
                    <span className="font-bold text-lg text-game-neutral">{player.name}</span>
                  </div>
                  {player.isHost && (
                    <span className="text-sm font-bold px-4 py-2 bg-game-primary text-white rounded-full shadow-lego-sm">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <Button
              className="w-full h-12 text-lg font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
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
