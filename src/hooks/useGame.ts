import { useReducer, useCallback, useEffect } from "react";
import { GameState, GameAction, Player } from "@/types/game";
import { toast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const generateLobbyCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

const initialState: GameState = {
  lobbyCode: "",
  players: [],
  currentRound: 0,
  totalRounds: 0,
  submissions: {},
  phase: "lobby",
  currentPrompt: "",
  options: [],
  ready_players: [],
  round_start_time: null,
};

const calculateResults = (
  submissions: Record<string, Record<string, string>>
): Record<string, string | null> => {
  const results: Record<string, string | null> = {};
  const optionCounts: Record<string, Record<string, number>> = {};
  const assignedPlayers = new Set<string>();

  Object.values(submissions).forEach((playerSubmission) => {
    Object.entries(playerSubmission).forEach(([option, playerId]) => {
      if (!optionCounts[option]) {
        optionCounts[option] = {};
      }
      optionCounts[option][playerId] = (optionCounts[option][playerId] || 0) + 1;
    });
  });

  Object.entries(optionCounts).forEach(([option, counts]) => {
    const sortedCounts = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(([playerId]) => !assignedPlayers.has(playerId));

    if (sortedCounts.length > 0) {
      const highestCount = sortedCounts[0][1];
      const hasTie = sortedCounts.length > 1 && sortedCounts[1][1] === highestCount;

      if (hasTie) {
        results[option] = null;
      } else {
        const selectedPlayer = sortedCounts[0][0];
        results[option] = selectedPlayer;
        assignedPlayers.add(selectedPlayer);
      }
    }
  });

  console.log("results", results);

  return results;
};

const updateScores = (
  players: Player[],
  submissions: Record<string, Record<string, string>>,
  results: Record<string, string | null>,
  currentRound: number
): Player[] => {
  return players.map((player) => {
    const submission = submissions[player.id];

    if (!submission) return player;

    const roundPoints = Object.entries(submission).reduce((score, [option, playerId]) => {
      return results[option] === playerId ? score + 1 : score;
    }, 0);

    const newPointsHistory = [...(player.pointsHistory || [])];
    newPointsHistory[currentRound] = roundPoints;

    return {
      ...player,
      pointsHistory: newPointsHistory,
      score: newPointsHistory.reduce((sum, points) => sum + points, 0),
    };
  });
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "JOIN_GAME":
      if (state.players.find((p) => p.id === action.player.id)) {
        return state;
      }
      return {
        ...state,
        players: [
          ...state.players,
          { ...action.player, pointsHistory: action.player.pointsHistory || [] },
        ],
        totalRounds: state.players.length * 2,
      };
    case "START_GAME":
      return {
        ...state,
        phase: "prompt",
        promptPlayerId: state.players[0].id,
      };
    case "SET_PROMPT":
      return {
        ...state,
        currentPrompt: action.prompt,
      };
    case "SET_OPTIONS":
      return {
        ...state,
        options: action.options,
        currentPrompt: action.prompt,
        round_start_time: new Date().toISOString(),
      };
    case "SUBMIT_MATCHES":
      return {
        ...state,
        submissions: {
          ...state.submissions,
          [action.playerId]: action.matches,
        },
      };
    case "SET_RESULTS": {
      const allPlayersSubmitted = Object.keys(action.submissions).length === state.players.length;

      if (allPlayersSubmitted) {
        const results = calculateResults(action.submissions);
        const updatedPlayers = updateScores(
          state.players,
          action.submissions,
          results,
          state.currentRound
        );

        return {
          ...state,
          results,
          submissions: action.submissions,
          players: updatedPlayers,
          phase: "results",
          round_start_time: null,
        };
      }

      return {
        ...state,
        results: action.results,
        submissions: action.submissions,
        phase: "results",
        round_start_time: null,
      };
    }
    case "SET_ROUND_START_TIME":
      return {
        ...state,
        round_start_time: action.time,
      };
    case "MARK_PLAYER_READY":
      if (state.ready_players.includes(action.playerId)) {
        return state;
      }
      return {
        ...state,
        ready_players: [...state.ready_players, action.playerId],
      };
    case "NEXT_ROUND": {
      const nextPlayerIndex = (state.currentRound + 1) % state.players.length;
      return {
        ...state,
        currentRound: state.currentRound + 1,
        phase: state.currentRound + 1 >= state.totalRounds ? "gameOver" : "prompt",
        promptPlayerId: state.players[nextPlayerIndex]?.id,
        submissions: {},
        results: {},
        currentPrompt: "",
        options: [],
        ready_players: [],
        round_start_time: null,
      };
    }
    case "UPDATE_TIME":
      if (action.time === 0) {
        return {
          ...state,
          phase: "results",
        };
      }
      return state;
    case "END_GAME":
      return {
        ...state,
        phase: "gameOver",
      };
    case "SET_LOBBY_CODE":
      return {
        ...state,
        lobbyCode: action.lobbyCode,
      };
    case "UPDATE_GAME_STATE":
      return {
        ...state,
        ...action.state,
      };
    default:
      return state;
  }
};

export const useGame = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const joinGame = useCallback(
    async (player: Player) => {
      try {
        const { data: playerData, error: playerError } = await supabase
          .from("players")
          .upsert({
            id: player.id,
            name: player.name,
          })
          .select()
          .single();

        if (playerError) throw playerError;

        const completePlayer: Player = {
          id: playerData.id,
          name: playerData.name,
          score: player.score,
          isHost: player.isHost,
          pointsHistory: player.pointsHistory || [],
        };

        const { data, error: lobbyError } = await supabase
          .from("lobbies")
          .upsert({
            code: state.lobbyCode,
            state: {
              ...state,
              players: [...state.players, completePlayer],
              totalRounds: state.players.length * 2,
            },
          })
          .select()
          .single();

        if (lobbyError) throw lobbyError;

        dispatch({ type: "JOIN_GAME", player: completePlayer });
      } catch (error) {
        console.error("Error joining game:", error);
        toast({
          title: "Error joining game",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    },
    [state]
  );

  const createLobby = useCallback(async () => {
    try {
      const newLobbyCode = generateLobbyCode();
      const { error } = await supabase.from("lobbies").insert({
        code: newLobbyCode,
        state: initialState,
      });

      if (error) throw error;

      dispatch({ type: "SET_LOBBY_CODE", lobbyCode: newLobbyCode });
      return newLobbyCode;
    } catch (error) {
      console.error("Error creating lobby:", error);
      toast({
        title: "Error creating lobby",
        description: "Please try again later",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  const fetchLobby = useCallback(async (lobbyCode: string) => {
    try {
      console.log("fetching lobby", lobbyCode);

      const { data, error } = await supabase
        .from("lobbies")
        .select("*")
        .eq("code", lobbyCode)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Lobby not found",
          description: "The lobby code you entered does not exist",
          variant: "destructive",
        });
        return;
      }

      dispatch({ type: "SET_LOBBY_CODE", lobbyCode: data.code });
      Object.entries(data.state).forEach(([key, value]) => {
        if (key === "players") {
          value.forEach((player: Player) => {
            dispatch({ type: "JOIN_GAME", player });
          });
        }
      });

      if (data.state && typeof data.state === "object") {
        const dataState = data.state as GameState;
        if (state.phase !== dataState.phase) {
          dispatch({ type: "UPDATE_GAME_STATE", state: dataState });
        }

        if (
          (dataState.phase === "matching" || dataState.phase === "results") &&
          dataState.submissions &&
          dataState.players &&
          Object.keys(dataState.submissions).length === dataState.players.length
        ) {
          dispatch({
            type: "SET_RESULTS",
            results: dataState.results,
            submissions: dataState.submissions,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching lobby:", error);

      toast({
        title: "Error fetching lobby",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, []);

  const updateLobbyState = useCallback(
    async (newState: Partial<GameState>) => {
      try {
        const { error } = await supabase
          .from("lobbies")
          .update({
            state: {
              ...state,
              ...newState,
            },
          })
          .eq("code", state.lobbyCode);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating lobby state:", error);
        toast({
          title: "Error updating game state",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    },
    [state]
  );

  const startGame = useCallback(async () => {
    dispatch({ type: "START_GAME" });
    const shuffledPlayers = state.players.sort(() => Math.random() - 0.5);
    await updateLobbyState({
      phase: "prompt",
      players: shuffledPlayers,
      promptPlayerId: shuffledPlayers[0].id,
    });
  }, [state.players, updateLobbyState]);

  const setPrompt = useCallback(
    async (prompt: string) => {
      console.log("prompt", prompt);
      dispatch({ type: "SET_PROMPT", prompt });
      await updateLobbyState({ currentPrompt: prompt });
    },
    [updateLobbyState]
  );

  const setOptions = useCallback(
    async (prompt: string, options: string[]) => {
      const round_start_time = new Date().toISOString();
      dispatch({ type: "SET_OPTIONS", prompt, options });

      await updateLobbyState({
        phase: "matching",
        options,
        currentPrompt: prompt,
        round_start_time,
      });
    },
    [updateLobbyState]
  );

  const submitMatches = useCallback(
    async (playerId: string, matches: Record<string, string>) => {
      dispatch({ type: "SUBMIT_MATCHES", playerId, matches });
      const updatedSubmissions = {
        ...state.submissions,
        [playerId]: matches,
      };

      if (Object.keys(state.submissions).length === state.players.length - 1) {
        await updateLobbyState({ phase: "results", submissions: updatedSubmissions });
      } else {
        await updateLobbyState({ submissions: updatedSubmissions });
      }
    },
    [state.players.length, state.submissions, updateLobbyState]
  );

  const nextRound = useCallback(async () => {
    dispatch({ type: "NEXT_ROUND" });
    await updateLobbyState({
      phase: "prompt",
      submissions: {},
      results: {},
      currentRound: state.currentRound + 1,
      promptPlayerId: state.players[(state.currentRound + 1) % state.players.length].id,
      currentPrompt: "",
      options: [],
      round_start_time: null,
    });
  }, [state.currentRound, state.players, updateLobbyState]);

  const endGame = useCallback(async () => {
    dispatch({ type: "END_GAME" });
    await updateLobbyState({ phase: "gameOver" });
  }, [updateLobbyState]);

  const markPlayerReady = useCallback(
    async (playerId: string) => {
      dispatch({ type: "MARK_PLAYER_READY", playerId });
      const updatedReadyPlayers = [...state.ready_players, playerId];

      await updateLobbyState({ ready_players: updatedReadyPlayers });

      if (updatedReadyPlayers.length === state.players.length) {
        await nextRound();
      }
    },
    [state.ready_players, state.players.length, nextRound, updateLobbyState]
  );

  useEffect(() => {
    if (!state.lobbyCode) return;

    const channel = supabase
      .channel("lobby_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobbies",
          filter: `code=eq.${state.lobbyCode}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            state: GameState;
          }>
        ) => {
          if (payload.new && "state" in payload.new) {
            const newState = payload.new.state;
            dispatch({ type: "UPDATE_GAME_STATE", state: newState });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.lobbyCode]);

  const updateTime = useCallback((time: number) => {
    dispatch({ type: "UPDATE_TIME", time });
  }, []);

  const setLobbyCode = useCallback((lobbyCode: string) => {
    dispatch({ type: "SET_LOBBY_CODE", lobbyCode });
  }, []);

  useEffect(() => {
    if (state.phase === "matching" && state.round_start_time) {
      const calculateTimeRemaining = () => {
        const startTime = new Date(state.round_start_time!).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
        const maxTime = state.players.length * 20;
        const remainingTime = Math.max(0, maxTime - elapsedSeconds);
        return remainingTime;
      };

      const interval = setInterval(() => {
        const remainingTime = calculateTimeRemaining();
        dispatch({ type: "UPDATE_TIME", time: remainingTime });

        if (remainingTime === 0) {
          const currentPlayer = state.players.find((p) => p.id === state.players[0]?.id);
          if (currentPlayer?.isHost) {
            dispatch({
              type: "SET_RESULTS",
              results: state.results,
              submissions: state.submissions,
            });
            updateLobbyState({ phase: "results" });
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [
    state.phase,
    state.round_start_time,
    state.players,
    updateLobbyState,
    state.results,
    state.submissions,
  ]);

  return {
    state,
    actions: {
      joinGame,
      createLobby,
      fetchLobby,
      startGame,
      setPrompt,
      setOptions,
      submitMatches,
      nextRound,
      updateTime,
      endGame,
      setLobbyCode,
      markPlayerReady,
    },
  };
};
