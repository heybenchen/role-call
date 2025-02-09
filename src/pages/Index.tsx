
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LobbyCreation } from '@/components/LobbyCreation';
import { GameLobby } from '@/components/GameLobby';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const Index = () => {
  const { state, actions } = useGame();
  const [playerId] = useState(uuidv4());
  const { toast } = useToast();

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

  const isHost = state.players.find(p => p.id === playerId)?.isHost;

  return (
    <div className="min-h-screen bg-gray-50">
      {state.phase === 'lobby' && !state.players.find(p => p.id === playerId) && (
        <LobbyCreation
          onJoin={handleJoin}
          lobbyCode={state.lobbyCode}
        />
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
