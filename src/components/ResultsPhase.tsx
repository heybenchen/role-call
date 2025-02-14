import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { CheckCircle2 } from "lucide-react";

interface ResultsPhaseProps {
  prompt: string;
  options: string[];
  results: Record<string, string>;
  players: Player[];
  onNextRound: () => void;
  isHost: boolean;
  submissions: Record<string, Record<string, string>>;
  currentPlayerId: string;
  onPlayerReady: (playerId: string) => void;
  readyPlayers: string[];
}

export const ResultsPhase = ({
  prompt,
  options,
  results,
  players,
  onNextRound,
  isHost,
  submissions,
  currentPlayerId,
  onPlayerReady,
  readyPlayers,
}: ResultsPhaseProps) => {
  const isPlayerReady = readyPlayers.includes(currentPlayerId);
  const allPlayersReady = readyPlayers.length === players.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-game-primary">Round Results</h2>
          <p className="text-xl font-semibold text-game-neutral">Category: {prompt}</p>
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
              <div key={option} className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-game-neutral">{option}:</div>
                  {matchedPlayer ? (
                    <div className="text-lg font-semibold text-game-primary">
                      {matchedPlayer.name}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-game-primary">??</div>
                  )}
                </div>

                <div className="space-y-1">
                  {playerVotes.map((vote, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="font-semibold text-game-neutral">{vote.voterName}:</span>
                      <span className="text-game-secondary">{vote.votedForName}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-game-primary text-center">Points History</h3>
          <div className="grid grid-cols-1 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-md font-bold text-game-neutral">{player.name}</span>
                    {readyPlayers.includes(player.id) && (
                      <CheckCircle2 className="h-6 w-6 text-game-success" />
                    )}
                  </div>
                  <span className="text-md font-bold text-game-primary">Total: {player.score}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {player.pointsHistory.map((points, index) => (
                    <div
                      key={index}
                      className="px-2.5 py-1 bg-white rounded-full font-semibold text-sm text-game-neutral border-2"
                    >
                      {points}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center min-h-[50px]">
          {!isPlayerReady ? (
            <Button
              onClick={() => onPlayerReady(currentPlayerId)}
              className="h-12 px-6 text-lg font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1"
            >
              Ready for Next Round
            </Button>
          ) : (
            <p className="text-xl font-semibold text-game-neutral">
              Waiting for {players.length - readyPlayers.length} more player
              {players.length - readyPlayers.length === 1 ? "" : "s"}...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};
