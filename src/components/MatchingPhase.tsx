import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/types/game";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface MatchingPhaseProps {
  currentPrompt: string;
  options: string[];
  players: Player[];
  currentPlayer: Player;
  onSubmit: (matches: Record<string, string>) => void;
  submissions: Record<string, Record<string, string>>;
  startTime: string;
}

export const MatchingPhase = ({
  currentPrompt,
  options,
  players,
  currentPlayer,
  onSubmit,
  submissions,
  startTime,
}: MatchingPhaseProps) => {
  const maxTime = players.length * 25;
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(maxTime);

  const hasSubmitted = submissions[currentPlayer.id] !== undefined;

  const handleSubmit = useCallback(() => {
    if (!hasSubmitted) {
      setIsLoading(true);
      onSubmit(matches);
      setIsLoading(false);
    }
  }, [hasSubmitted, matches, onSubmit]);

  useEffect(() => {
    if (secondsRemaining === 0 && !hasSubmitted) {
      handleSubmit();
    }
  }, [secondsRemaining, hasSubmitted, handleSubmit]);

  useEffect(() => {
    const calculateRemainingTime = () => {
      if (!startTime) return maxTime;

      const startTimeMs = new Date(startTime).getTime();
      const currentTimeMs = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTimeMs - startTimeMs) / 1000);
      return Math.max(0, maxTime - elapsedSeconds);
    };

    const timer = setInterval(() => {
      setSecondsRemaining(calculateRemainingTime());
    }, 1000);

    setSecondsRemaining(calculateRemainingTime());

    return () => clearInterval(timer);
  }, [startTime]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    // If dragging from players list to a category
    if (source.droppableId === "players-list") {
      const alreadyAssignedOption = Object.entries(matches).find(
        ([_, playerId]) => playerId === draggableId
      );
      if (alreadyAssignedOption) {
        const [previousOption] = alreadyAssignedOption;
        const updatedMatches = { ...matches };
        delete updatedMatches[previousOption];

        updatedMatches[destination.droppableId] = draggableId;
        setMatches(updatedMatches);
      } else {
        setMatches((prev) => ({
          ...prev,
          [destination.droppableId]: draggableId,
        }));
      }
    }
    // If dragging from a category back to players list
    else if (destination.droppableId === "players-list") {
      const updatedMatches = { ...matches };
      delete updatedMatches[source.droppableId];
      setMatches(updatedMatches);
    }
    // If dragging between categories
    else {
      setMatches((prev) => ({
        ...prev,
        [destination.droppableId]: draggableId,
      }));
      if (source.droppableId !== destination.droppableId) {
        setMatches((prev) => {
          const updated = { ...prev };
          delete updated[source.droppableId];
          return updated;
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const promptPlayer = players.find((p) => p.id === players[0]?.id);

  if (!options.length || !promptPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7CD]">
        <Card className="p-8 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
          <p className="text-xl font-semibold text-game-neutral">Loading game...</p>
        </Card>
      </div>
    );
  }

  const unassignedPlayers = players.filter((player) => !Object.values(matches).includes(player.id));

  const remainingPlayerNames = players
    .filter((p) => !submissions[p.id])
    .map((p) => p.name)
    .join(", ");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
      <Card className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-game-primary">
            Match players to: "{currentPrompt.toLocaleLowerCase()}"
          </h2>
          <p className="text-sm text-game-neutral mb-4">
            Drag and drop player names to match them.
          </p>
          <p className="text-l font-bold text-game-neutral">{formatTime(secondsRemaining)}</p>
          {hasSubmitted && (
            <p className="text-xl font-semibold text-game-neutral">
              Waiting for {remainingPlayerNames} to submit...
            </p>
          )}
        </div>

        {!hasSubmitted && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-l font-bold text-game-neutral">Players</h3>
                <Droppable droppableId="players-list">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {unassignedPlayers.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-3 bg-white rounded-lg shadow-lego-sm border-2 border-game-neutral cursor-move transform transition-transform hover:-translate-y-1"
                            >
                              {player.name}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="space-y-3">
                <h3 className="text-l font-bold text-game-neutral">Categories</h3>
                {options.map((option) => (
                  <Droppable key={option} droppableId={option}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-3 bg-[#F1F0FB] rounded-xl border-2 border-game-neutral shadow-lego-sm min-h-[60px]"
                      >
                        <div className="font-semibold text-md text-game-neutral mb-2">{option}</div>
                        {matches[option] && (
                          <Draggable draggableId={matches[option]} index={0}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="p-3 bg-white rounded-lg shadow-lego-sm border-2 border-game-neutral cursor-move transform transition-transform hover:-translate-y-1"
                              >
                                {players.find((p) => p.id === matches[option])?.name}
                              </div>
                            )}
                          </Draggable>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
          </DragDropContext>
        )}

        {!hasSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={isLoading || Object.values(matches).length === 0}
            className="w-full h-12 text-lg font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? "Submitting..." : "Submit Matches"}
          </Button>
        )}
      </Card>
    </div>
  );
};
