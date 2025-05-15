export type Player = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  pointsHistory: number[];
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
  phase: "lobby" | "prompt" | "matching" | "results" | "gameOver";
  promptPlayerId?: string;
  ready_players: string[];
  round_start_time: string | null;
  reactions: Record<string,  Record<string, number>>;
};

export type GameAction =
  | { type: "RESET_GAME" }
  | { type: "JOIN_GAME"; player: Player }
  | { type: "START_GAME" }
  | { type: "SET_PROMPT"; prompt: string }
  | { type: "SET_OPTIONS"; options: string[]; prompt: string }
  | { type: "SUBMIT_MATCHES"; playerId: string; matches: Record<string, string> }
  | {
      type: "SET_RESULTS";
      results: Record<string, string>;
      submissions: Record<string, Record<string, string>>;
    }
  | { type: "NEXT_ROUND" }
  | { type: "UPDATE_TIME"; time: number }
  | { type: "END_GAME" }
  | { type: "SET_LOBBY_CODE"; lobbyCode: string }
  | { type: "UPDATE_GAME_STATE"; state: Partial<GameState> }
  | { type: "MARK_PLAYER_READY"; playerId: string }
  | { type: "SET_ROUND_START_TIME"; time: string }
  | { type: "UPDATE_REACTIONS"; option: string; emoji: string};
