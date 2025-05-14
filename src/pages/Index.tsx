import { useEffect, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { LobbyCreation } from "@/components/LobbyCreation";
import { GameLobby } from "@/components/GameLobby";
import { PromptPhase } from "@/components/PromptPhase";
import { MatchingPhase } from "@/components/MatchingPhase";
import { ResultsPhase } from "@/components/ResultsPhase";
import { useToast } from "@/hooks/useToast";
import { v4 as uuidv4 } from "uuid";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { state, actions } = useGame();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { lobbyCode } = useParams();

  const [playerId] = useState(() => {
    const savedPlayerId = localStorage.getItem("playerId");
    if (savedPlayerId) return savedPlayerId;
    const newId = uuidv4();
    localStorage.setItem("playerId", newId);
    return newId;
  });

  useEffect(() => {
    if (lobbyCode) {
      actions.fetchLobby(lobbyCode);
    }
  }, [lobbyCode, actions]);

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
        title: "Not enough players",
        description: "You need at least 2 players to start the game",
        variant: "destructive",
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
    actions.setOptions(prompt, options);
  };

  const handleMatchSubmit = (matches: Record<string, string>) => {
    actions.submitMatches(playerId, matches);
  };

  const handlePlayerReady = (playerId: string) => {
    actions.markPlayerReady(playerId);
  };

  const currentPlayer = state.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;
  const isJoiningGame = location.pathname.includes("/join/");
  const promptPlayer = state.players.find((p) => p.id === state.promptPlayerId);
  const isPlayerTurn = playerId === state.promptPlayerId;

  return (
    <div className="min-h-screen bg-[#FEF7CD]">
      {state.phase === "lobby" &&
        !state.players.find((p) => p.id === playerId) &&
        (isJoiningGame ? (
          <LobbyCreation onJoin={handleJoin} lobbyCode={lobbyCode || state.lobbyCode} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7CD]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lego border-4 border-game-neutral transform transition-transform hover:-translate-y-1">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-game-primary">Role Models</h1>
                <p className="text-xl font-semibold text-game-neutral">
                  Typecast your friends. Match the crowd.
                </p>
              </div>
              <Button
                className="w-full h-14 text-xl font-bold bg-game-primary hover:bg-game-primary/90 text-white shadow-lego transform transition-all hover:-translate-y-1"
                onClick={handleCreateGame}
              >
                Create Game
              </Button>
            </div>
          </div>
        ))}

      {state.phase === "lobby" && state.players.find((p) => p.id === playerId) && (
        <GameLobby players={state.players} onStart={handleStart} isHost={isHost} />
      )}

      {state.phase === "prompt" && promptPlayer && (
        <PromptPhase
          currentPlayer={promptPlayer}
          onPromptSubmit={handlePromptSubmit}
          playerCount={state.players.length}
          isPlayerTurn={isPlayerTurn}
        />
      )}

      {state.phase === "matching" && promptPlayer && state.currentPrompt && state.options && (
        <MatchingPhase
          currentPrompt={state.currentPrompt}
          options={state.options}
          players={state.players}
          currentPlayer={currentPlayer!}
          onSubmit={handleMatchSubmit}
          submissions={state.submissions}
          startTime={state.round_start_time}
        />
      )}

      {state.phase === "results" && state.currentPrompt && state.options && state.results && (
        <ResultsPhase
          prompt={state.currentPrompt}
          options={state.options}
          results={state.results}
          players={state.players}
          onNextRound={actions.nextRound}
          isHost={isHost}
          submissions={state.submissions}
          currentPlayerId={playerId}
          onPlayerReady={handlePlayerReady}
          readyPlayers={state.ready_players}
        />
      )}
    </div>
  );
};

export default Index;
