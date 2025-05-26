import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { CheckCircle2, Eye } from "lucide-react";
import { useState } from "react";
import { ResultsModal } from "./ResultsModal";

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
  reactions: Record<string, Record<string, number>>;
  onReactionClick: (option: string, emoji: string) => void;
  onUpdateResultsIndex: (index: number) => void;
  currentResultsIndex?: number;
  promptPlayerId?: string;
}

export const ResultsPhase = ({
  prompt,
  options,
  results,
  players,
  submissions,
  currentPlayerId,
  onPlayerReady,
  readyPlayers,
  reactions,
  onReactionClick,
  onUpdateResultsIndex,
  currentResultsIndex = 0,
  promptPlayerId,
}: ResultsPhaseProps) => {
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0);
  const DEBOUNCE_DELAY = 200;

  const isPlayerReady = readyPlayers.includes(currentPlayerId);
  const canControlResults = currentPlayerId === promptPlayerId;

  const currentOption = options[currentResultsIndex];
  const matchedPlayerId = results[currentOption];
  const matchedPlayer = players.find((p) => p.id === matchedPlayerId);

  const playerVotes = players.map((player) => {
    const playerSubmission = submissions[player.id];
    const votedForPlayerId = playerSubmission?.[currentOption];
    const votedForPlayer = players.find((p) => p.id === votedForPlayerId);
    return {
      voterName: player.name,
      votedForName: votedForPlayer?.name || "No vote",
    };
  });

  const handlePreviousOption = () => {
    if (!canControlResults) return;
    const now = Date.now();
    if (now - lastClickTime < DEBOUNCE_DELAY) return;
    setLastClickTime(now);
    onUpdateResultsIndex(Math.max(0, currentResultsIndex - 1));
  };

  const handleNextOption = () => {
    if (!canControlResults) return;
    const now = Date.now();
    if (now - lastClickTime < DEBOUNCE_DELAY) return;
    setLastClickTime(now);
    onUpdateResultsIndex(Math.min(options.length - 1, currentResultsIndex + 1));
  };

  const handleOpenChange = (isOpen: boolean) => {
    setIsResultsModalOpen(isOpen);
  };

  const handleReactionClick = (emoji: string) => {
    onReactionClick(currentOption, emoji);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-game-primary">Round Results</h2>
          <p className="text-xl font-semibold text-game-neutral">Category: {prompt}</p>
          {!isResultsModalOpen && (
            <Button
              onClick={() => setIsResultsModalOpen(true)}
              variant="outline"
              className="mt-2 hover:scale-105 transition-transform"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
          )}
        </div>

        <ResultsModal
          isOpen={isResultsModalOpen}
          option={currentOption}
          matchedPlayer={matchedPlayer}
          playerVotes={playerVotes}
          currentIndex={currentResultsIndex}
          totalOptions={options.length}
          optionReactions={reactions[currentOption] ?? {}}
          onPrevious={handlePreviousOption}
          onNext={handleNextOption}
          onOpenChange={handleOpenChange}
          onReactionClick={handleReactionClick}
          canControlResults={canControlResults}
        />

        <div className="space-y-2 animate-fade-in">
          <h3 className="text-lg font-bold text-game-primary text-center">Leaderboard</h3>
          <div className="grid grid-cols-1 gap-2">
            {(() => {
              const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
              const highestScore = sortedPlayers[0]?.score;
              return sortedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="p-4 bg-[#F1F0FB] rounded-xl shadow-lego-sm hover:scale-[1.02] transition-transform"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-md font-bold text-game-neutral">
                        {player.name}
                        {player.score === highestScore && (
                          <span className="ml-1 animate-bounce">👑</span>
                        )}
                      </span>
                      {readyPlayers.includes(player.id) && (
                        <CheckCircle2 className="h-6 w-6 text-game-success animate-scale-in" />
                      )}
                    </div>
                    <span className="text-md font-bold text-game-primary">Total: {player.score}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {player.pointsHistory.map((points, index) => (
                      <div
                        key={index}
                        className="px-2.5 py-1 bg-white rounded-full font-semibold text-sm text-game-neutral border-2 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {points}
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
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
