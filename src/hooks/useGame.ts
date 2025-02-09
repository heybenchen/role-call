import { useReducer, useCallback, useEffect } from 'react';
import { GameState, GameAction, Player } from '@/types/game';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const generateLobbyCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => 
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
};

const initialState: GameState = {
  lobbyCode: '',
  players: [],
  currentRound: 0,
  totalRounds: 0,
  submissions: {},
  timeRemaining: 90,
  phase: 'lobby',
};

const calculateResults = (submissions: Record<string, Record<string, string>>, players: Player[]): Record<string, string> => {
  const results: Record<string, string> = {};
  const optionCounts: Record<string, Record<string, number>> = {};
  const assignedPlayers = new Set<string>();

  Object.values(submissions).forEach(playerSubmission => {
    Object.entries(playerSubmission).forEach(([option, playerId]) => {
      if (!optionCounts[option]) {
        optionCounts[option] = {};
      }
      optionCounts[option][playerId] = (optionCounts[option][playerId] || 0) + 1;
    });
  });

  Object.entries(optionCounts).forEach(([option, counts]) => {
    const sortedPlayers = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(([playerId]) => !assignedPlayers.has(playerId))
      .map(([playerId]) => playerId);

    if (sortedPlayers.length > 0) {
      const selectedPlayer = sortedPlayers[0];
      results[option] = selectedPlayer;
      assignedPlayers.add(selectedPlayer);
    }
  });

  return results;
};

const updateScores = (
  players: Player[],
  submissions: Record<string, Record<string, string>>,
  results: Record<string, string>
): Player[] => {
  return players.map(player => {
    const submission = submissions[player.id];
    if (!submission) return player;

    const points = Object.entries(submission).reduce((score, [option, playerId]) => {
      return results[option] === playerId ? score + 1 : score;
    }, 0);

    return {
      ...player,
      score: player.score + points,
    };
  });
};

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'JOIN_GAME':
      if (state.players.find(p => p.id === action.player.id)) {
        return state;
      }
      return {
        ...state,
        players: [...state.players, action.player],
        totalRounds: state.players.length * 2,
      };
    case 'START_GAME':
      return {
        ...state,
        phase: 'prompt',
        promptPlayerId: state.players[0].id,
      };
    case 'SET_PROMPT':
      return {
        ...state,
        currentPrompt: action.prompt,
        phase: 'matching',
        timeRemaining: 90,
      };
    case 'SET_OPTIONS':
      return {
        ...state,
        options: action.options,
      };
    case 'SUBMIT_MATCHES':
      const allPlayersSubmitted = 
        Object.keys(state.submissions).length + 1 >= state.players.length - 1;

      if (allPlayersSubmitted) {
        const newSubmissions = {
          ...state.submissions,
          [action.playerId]: action.matches,
        };
        const results = calculateResults(newSubmissions, state.players);
        const updatedPlayers = updateScores(state.players, newSubmissions, results);

        return {
          ...state,
          submissions: newSubmissions,
          results,
          players: updatedPlayers,
          phase: 'results',
        };
      }

      return {
        ...state,
        submissions: {
          ...state.submissions,
          [action.playerId]: action.matches,
        },
      };
    case 'SET_RESULTS':
      return {
        ...state,
        results: action.results,
        phase: 'results',
      };
    case 'NEXT_ROUND':
      const nextPlayerIndex = (state.currentRound + 1) % state.players.length;
      return {
        ...state,
        currentRound: state.currentRound + 1,
        phase: state.currentRound + 1 >= state.totalRounds ? 'gameOver' : 'prompt',
        promptPlayerId: state.players[nextPlayerIndex]?.id,
        submissions: {},
        results: undefined,
        currentPrompt: undefined,
        options: undefined,
      };
    case 'UPDATE_TIME':
      if (action.time === 0) {
        return {
          ...state,
          timeRemaining: action.time,
          phase: 'results',
        };
      }
      return {
        ...state,
        timeRemaining: action.time,
      };
    case 'END_GAME':
      return {
        ...state,
        phase: 'gameOver',
      };
    case 'SET_LOBBY_CODE':
      return {
        ...state,
        lobbyCode: action.lobbyCode,
      };
    default:
      return state;
  }
};

export const useGame = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const joinGame = useCallback(async (player: Player) => {
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
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
      };

      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
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

      dispatch({ type: 'JOIN_GAME', player: completePlayer });
      toast({
        title: 'Player joined!',
        description: `${player.name} has joined the game`,
      });
    } catch (error) {
      console.error('Error joining game:', error);
      toast({
        title: 'Error joining game',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  }, [state]);

  const createLobby = useCallback(async () => {
    try {
      const newLobbyCode = generateLobbyCode();
      const { error } = await supabase
        .from('lobbies')
        .insert({
          code: newLobbyCode,
          state: initialState,
        });

      if (error) throw error;

      dispatch({ type: 'SET_LOBBY_CODE', lobbyCode: newLobbyCode });
      return newLobbyCode;
    } catch (error) {
      console.error('Error creating lobby:', error);
      toast({
        title: 'Error creating lobby',
        description: 'Please try again later',
        variant: 'destructive',
      });
      return null;
    }
  }, []);

  const fetchLobby = useCallback(async (lobbyCode: string) => {
    try {
      const { data, error } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', lobbyCode)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: 'Lobby not found',
          description: 'The lobby code you entered does not exist',
          variant: 'destructive',
        });
        return;
      }

      dispatch({ type: 'SET_LOBBY_CODE', lobbyCode: data.code });
      Object.entries(data.state).forEach(([key, value]) => {
        if (key === 'players') {
          value.forEach((player: Player) => {
            dispatch({ type: 'JOIN_GAME', player });
          });
        }
      });
    } catch (error) {
      console.error('Error fetching lobby:', error);
      toast({
        title: 'Error fetching lobby',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  }, []);

  useEffect(() => {
    if (!state.lobbyCode) return;

    const channel = supabase
      .channel('lobby_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lobbies',
          filter: `code=eq.${state.lobbyCode}`,
        },
        (payload) => {
          if (payload.new) {
            const newState = (payload.new as any).state;
            if (newState.players) {
              newState.players.forEach((player: Player) => {
                if (!state.players.find(p => p.id === player.id)) {
                  dispatch({ type: 'JOIN_GAME', player });
                }
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.lobbyCode, state.players]);

  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);

  const setPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_PROMPT', prompt });
  }, []);

  const setOptions = useCallback((options: string[]) => {
    dispatch({ type: 'SET_OPTIONS', options });
  }, []);

  const submitMatches = useCallback((playerId: string, matches: Record<string, string>) => {
    dispatch({ type: 'SUBMIT_MATCHES', playerId, matches });
  }, []);

  const setResults = useCallback((results: Record<string, string>) => {
    dispatch({ type: 'SET_RESULTS', results });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  const updateTime = useCallback((time: number) => {
    dispatch({ type: 'UPDATE_TIME', time });
  }, []);

  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);

  const setLobbyCode = useCallback((lobbyCode: string) => {
    dispatch({ type: 'SET_LOBBY_CODE', lobbyCode });
  }, []);

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
      setResults,
      nextRound,
      updateTime,
      endGame,
      setLobbyCode,
    },
  };
};
