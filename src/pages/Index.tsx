
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LobbyCreation } from '@/components/LobbyCreation';
import { GameLobby } from '@/components/GameLobby';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { state, actions } = useGame();
  const [playerId] = useState(uuidv4());
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleJoin = (name: string) => {
    actions.joinGame({
      id: playerId,
      name,
      score: 0,
      isHost: state.players.length === 0,
    });
  };

  const handleStart = () => {
    if (state.players.length < 2) {
      toast({
        title: 'Not enough players',
        description: 'You need at least 2 players to start the game',
        variant: 'destructive',
      });
      return;
    }
    actions.startGame();
  };

  const handleCreateGame = () => {
    navigate(`/join/${state.lobbyCode}`);
  };

  const isHost = state.players.find(p => p.id === playerId)?.isHost;
  const isJoiningGame = location.pathname.includes('/join/');

  return (
    <div className="min-h-screen bg-gray-50">
      {state.phase === 'lobby' && !state.players.find(p => p.id === playerId) && (
        isJoiningGame ? (
          <LobbyCreation
            onJoin={handleJoin}
            lobbyCode={state.lobbyCode}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-game-primary/10 to-game-secondary/10">
            <div className="w-full max-w-md p-6 space-y-6 backdrop-blur-sm bg-white/80 rounded-lg shadow-lg">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-game-neutral">Party Game</h1>
                <p className="text-gray-600">Create a new game to get started!</p>
              </div>
              <Button
                className="w-full bg-game-primary hover:bg-game-primary/90 text-white"
                onClick={handleCreateGame}
              >
                Create Game
              </Button>
            </div>
          </div>
        )
      )}
      
      {state.phase === 'lobby' && state.players.find(p => p.id === playerId) && (
        <GameLobby
          players={state.players}
          onStart={handleStart}
          isHost={isHost ?? false}
        />
      )}
      
      {/* We'll implement other game phases in the next iteration */}
    </div>
  );
};

export default Index;
