
import { useEffect, useState } from 'react';
import { useGame } from '@/hooks/useGame';
import { LobbyCreation } from '@/components/LobbyCreation';
import { GameLobby } from '@/components/GameLobby';
import { PromptPhase } from '@/components/PromptPhase';
import { MatchingPhase } from '@/components/MatchingPhase';
import { ResultsPhase } from '@/components/ResultsPhase';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'recast_player_id';

const Index = () => {
  const { state, actions } = useGame();
  const [playerId] = useState(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) return storedId;
    const newId = uuidv4();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { lobbyCode } = useParams();

  useEffect(() => {
    if (lobbyCode) {
      actions.fetchLobby(lobbyCode).then(() => {
        // Check if player was already in the game
        const existingPlayer = state.players.find(p => p.id === playerId);
        if (existingPlayer) {
          console.log('Player already in game, auto-joining...', existingPlayer);
          handleJoin(existingPlayer.name);
        }
      });
    }
  }, [lobbyCode, actions, playerId]);

  const handleJoin = async (name: string) => {
    await actions.joinGame({
      id: playerId,
      name,
      score: 0,
      isHost: state.players.length === 0,
      pointsHistory: [],
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

  const handleCreateGame = async () => {
    const newLobbyCode = await actions.createLobby();
    if (newLobbyCode) {
      navigate(`/join/${newLobbyCode}`);
    }
  };

  const handlePromptSubmit = (prompt: string, options: string[]) => {
    actions.setPrompt(prompt);
    actions.setOptions(options);
  };

  const handleMatchSubmit = (matches: Record<string, string>) => {
    actions.submitMatches(playerId, matches);
  };

  const handleNextRound = () => {
    actions.nextRound();
  };

  const currentPlayer = state.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isJoiningGame = location.pathname.includes('/join/');
  const promptPlayer = state.players.find(p => p.id === state.promptPlayerId);
  const isPlayerTurn = playerId === state.promptPlayerId;

  return (
    <div className="min-h-screen bg-gray-50">
      {state.phase === 'lobby' && !state.players.find(p => p.id === playerId) && (
        isJoiningGame ? (
          <LobbyCreation
            onJoin={handleJoin}
            lobbyCode={lobbyCode || state.lobbyCode}
            playerId={playerId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-game-primary/10 to-game-secondary/10">
            <div className="w-full max-w-md p-6 space-y-6 backdrop-blur-sm bg-white/80 rounded-lg shadow-lg">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-game-neutral">Re:cast</h1>
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
          isHost={isHost}
        />
      )}

      {state.phase === 'prompt' && promptPlayer && (
        <PromptPhase
          currentPlayer={promptPlayer}
          onPromptSubmit={handlePromptSubmit}
          playerCount={state.players.length}
          isPlayerTurn={isPlayerTurn}
        />
      )}

      {state.phase === 'matching' && promptPlayer && state.currentPrompt && state.options && (
        <MatchingPhase
          currentPrompt={state.currentPrompt}
          options={state.options}
          players={state.players}
          currentPlayer={currentPlayer!}
          timeRemaining={state.timeRemaining}
          onSubmit={handleMatchSubmit}
          submissions={state.submissions}
        />
      )}

      {state.phase === 'results' && state.currentPrompt && state.options && state.results && (
        <ResultsPhase
          prompt={state.currentPrompt}
          options={state.options}
          results={state.results}
          players={state.players}
          onNextRound={handleNextRound}
          isHost={isHost}
          submissions={state.submissions}
        />
      )}
    </div>
  );
};

export default Index;
