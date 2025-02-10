import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";

interface ResultsPhaseProps {
  prompt: string;
  options: string[];
  results: Record<string, string>;
  players: Player[];
  onNextRound: () => void;
  isHost: boolean;
  submissions: Record<string, Record<string, string>>;
}

export const ResultsPhase = ({
  prompt,
  options,
  results,
  players,
  onNextRound,
  isHost,
  submissions,
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
            const matchedPlayer = players.find((p) => p.id === matchedPlayerId);
            const playerVotes = players.map((player) => {
              const playerSubmission = submissions[player.id];
              const votedForPlayerId = playerSubmission?.[option];
              const votedForPlayer = players.find((p) => p.id === votedForPlayerId);
              return {
                voterName: player.name,
                votedForName: votedForPlayer?.name || "No vote",
              };
            });

            return (
              <div key={option} className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="font-medium text-lg">{option}</div>
                {matchedPlayer && (
                  <div className="text-game-primary font-semibold mb-2">
                    Winner: {matchedPlayer.name}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 mb-1">Votes:</div>
                  {playerVotes.map((vote, index) => (
                    <div key={index} className="text-sm flex items-center space-x-2">
                      <span className="font-medium">{vote.voterName}:</span>
                      <span className="text-gray-600">{vote.votedForName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">Points History</h3>
          <div className="grid grid-cols-1 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-lg">{player.name}</span>
                  <span className="font-bold text-game-primary text-lg">Total: {player.score}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.pointsHistory.map((points, index) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium"
                    >
                      R{index + 1}: {points}
                    </div>
                  ))}
                </div>
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
