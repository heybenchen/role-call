
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface MatchingPhaseProps {
  currentPrompt: string;
  options: string[];
  players: Player[];
  currentPlayer: Player;
  timeRemaining: number;
  onSubmit: (matches: Record<string, string>) => void;
  submissions: Record<string, Record<string, string>>;
}

export const MatchingPhase = ({
  currentPrompt,
  options,
  players,
  currentPlayer,
  timeRemaining,
  onSubmit,
  submissions,
}: MatchingPhaseProps) => {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(timeRemaining);

  const hasSubmitted = submissions[currentPlayer.id] !== undefined;

  useEffect(() => {
    if (timer === 0 && !hasSubmitted) {
      handleSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, hasSubmitted]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    
    const alreadyAssignedOption = Object.entries(matches).find(([_, playerId]) => playerId === draggableId);
    if (alreadyAssignedOption) {
      const [previousOption] = alreadyAssignedOption;
      const updatedMatches = { ...matches };
      delete updatedMatches[previousOption];
      
      updatedMatches[destination.droppableId] = draggableId;
      setMatches(updatedMatches);
    } else {
      setMatches(prev => ({
        ...prev,
        [destination.droppableId]: draggableId,
      }));
    }
  };

  const handleSubmit = () => {
    if (!hasSubmitted) {
      setIsLoading(true);
      onSubmit(matches);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const otherPlayers = players.filter(p => p.id !== currentPlayer.id);
  const promptPlayer = players.find(p => p.id === players[0]?.id);

  if (!otherPlayers.length || !options.length || !promptPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p>Loading game...</p>
        </Card>
      </div>
    );
  }

  const submittedPlayersCount = Object.keys(submissions).length;
  const remainingPlayers = players.length - 1 - submittedPlayersCount;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-4xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-game-neutral">Match Players to {currentPrompt}</h2>
          <p className="text-xl font-semibold text-game-primary">{formatTime(timer)}</p>
          {hasSubmitted && (
            <p className="text-gray-600">
              Waiting for {remainingPlayers} {remainingPlayers === 1 ? 'player' : 'players'} to submit...
            </p>
          )}
        </div>

        {!hasSubmitted && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Players</h3>
                <Droppable droppableId="players-list">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {otherPlayers.map((player, index) => (
                        <Draggable key={player.id} draggableId={player.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-3 bg-white rounded-lg shadow-sm border border-gray-200 cursor-move"
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

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Categories</h3>
                {options.map((option) => (
                  <Droppable key={option} droppableId={option}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[60px]"
                      >
                        <div className="font-medium mb-2">{option}</div>
                        {matches[option] && (
                          <div className="p-2 bg-white rounded shadow">
                            {otherPlayers.find(p => p.id === matches[option])?.name}
                          </div>
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
            disabled={isLoading}
            className="w-full bg-game-primary hover:bg-game-primary/90 text-white mt-4"
          >
            {isLoading ? 'Submitting...' : 'Submit Matches'}
          </Button>
        )}
      </Card>
    </div>
  );
};

