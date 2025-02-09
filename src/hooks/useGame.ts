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
      // First, ensure the player exists in the players table
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .upsert({ 
          id: player.id,
          name: player.name,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Then, update the lobby state to include the new player
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lobbies')
        .upsert({
          code: state.lobbyCode,
          state: {
            ...state,
            players: [...state.players, playerData],
            totalRounds: state.players.length * 2,
          },
        })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      dispatch({ type: 'JOIN_GAME', player: playerData });
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
        .single();

      if (error) throw error;

      if (data) {
        dispatch({ type: 'SET_LOBBY_CODE', lobbyCode: data.code });
        Object.entries(data.state).forEach(([key, value]) => {
          if (key === 'players') {
            value.forEach((player: Player) => {
              dispatch({ type: 'JOIN_GAME', player });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching lobby:', error);
      toast({
        title: 'Error fetching lobby',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  }, []);

  // Subscribe to real-time updates
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
