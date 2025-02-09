
export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
};

export type GameState = {
  lobbyCode: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentPrompt?: string;
  options?: string[];
  submissions: Record<string, Record<string, string>>;
  results?: Record<string, string>;
  timeRemaining: number;
  phase: 'lobby' | 'prompt' | 'matching' | 'results' | 'gameOver';
  promptPlayerId?: string;
};

export type GameAction = 
  | { type: 'JOIN_GAME'; player: Player }
  | { type: 'START_GAME' }
  | { type: 'SET_PROMPT'; prompt: string }
  | { type: 'SET_OPTIONS'; options: string[] }
  | { type: 'SUBMIT_MATCHES'; playerId: string; matches: Record<string, string> }
  | { type: 'SET_RESULTS'; results: Record<string, string> }
  | { type: 'NEXT_ROUND' }
  | { type: 'UPDATE_TIME'; time: number }
  | { type: 'END_GAME' }
  | { type: 'SET_LOBBY_CODE'; lobbyCode: string }
  | { type: 'UPDATE_GAME_STATE'; state: Partial<GameState> };
