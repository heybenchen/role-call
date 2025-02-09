
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';

interface ResultsPhaseProps {
  prompt: string;
  options: string[];
  results: Record<string, string>;
  players: Player[];
  onNextRound: () => void;
  isHost: boolean;
}

export const ResultsPhase = ({
  prompt,
  options,
  results,
  players,
  onNextRound,
  isHost,
}: ResultsPhaseProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-game-neutral">Round Results</h2>
          <p className="text-gray-600">Category: {prompt}</p>
        </div>

        <div className="space-y-4">
          {options.map((option) => {
            const matchedPlayerId = results[option];
            const matchedPlayer = players.find(p => p.id === matchedPlayerId);
            
            return (
              <div key={option} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="font-medium">{option}</div>
                {matchedPlayer && (
                  <div className="text-game-primary font-semibold">
                    Matched with: {matchedPlayer.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Current Scores</h3>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <div key={player.id} className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                <span>{player.name}</span>
                <span className="font-bold">{player.score} points</span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <Button
            onClick={onNextRound}
            className="w-full bg-game-primary hover:bg-game-primary/90 text-white"
          >
            Next Round
          </Button>
        )}
      </Card>
    </div>
  );
};
