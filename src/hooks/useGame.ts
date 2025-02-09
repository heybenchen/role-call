
import { useReducer, useCallback, useEffect } from 'react';
import { GameState, GameAction, Player } from '@/types/game';
import { toast } from '@/hooks/use-toast';

const generateLobbyCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => 
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
};

const initialState: GameState = {
  lobbyCode: generateLobbyCode(),
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
    default:
      return state;
  }
};

export const useGame = () => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const joinGame = useCallback((player: Player) => {
    dispatch({ type: 'JOIN_GAME', player });
    toast({
      title: 'Player joined!',
      description: `${player.name} has joined the game`,
    });
  }, []);

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

  return {
    state,
    actions: {
      joinGame,
      startGame,
      setPrompt,
      setOptions,
      submitMatches,
      setResults,
      nextRound,
      updateTime,
      endGame,
    },
  };
};
