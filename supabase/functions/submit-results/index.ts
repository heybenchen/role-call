import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  pointsHistory: number[];
}

interface GameState {
  lobbyCode: string;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  submissions: Record<string, Record<string, string>>;
  phase: string;
  currentPrompt: string;
  options: string[];
  ready_players: string[];
  round_start_time: string | null;
  reactions: Record<string, Record<string, number>>;
  results?: Record<string, string | null>;
}

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

    const roundPoints = Object.entries(submission).reduce(
      (score, [option, playerId]) => {
        return results[option] === playerId ? score + 1 : score;
      },
      0
    );

    const newPointsHistory = [...(player.pointsHistory || [])];
    newPointsHistory[currentRound] = roundPoints;

    return {
      ...player,
      pointsHistory: newPointsHistory,
      score: newPointsHistory.reduce((sum, points) => sum + points, 0),
    };
  });
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { lobbyCode, playerId, matches } = await req.json();

    if (!lobbyCode || !playerId || !matches) {
      throw new Error("Missing required fields: lobbyCode, playerId, or matches");
    }

    // Fetch current lobby state
    const { data: lobby, error: fetchError } = await supabaseClient
      .from("lobbies")
      .select("*")
      .eq("code", lobbyCode.toUpperCase())
      .single();

    if (fetchError) throw fetchError;
    if (!lobby) throw new Error("Lobby not found");

    const gameState = lobby.state as GameState;

    // Update submissions with new matches
    const updatedSubmissions = {
      ...gameState.submissions,
      [playerId]: matches,
    };

    // Check if all players have submitted
    const allPlayersSubmitted = Object.keys(updatedSubmissions).length === gameState.players.length;

    let results = gameState.results;
    let updatedPlayers = gameState.players;

    if (allPlayersSubmitted) {
      // Calculate results and update scores
      results = calculateResults(updatedSubmissions);
      updatedPlayers = updateScores(
        gameState.players,
        updatedSubmissions,
        results,
        gameState.currentRound
      );
    }

    // Update lobby state
    const { error: updateError } = await supabaseClient
      .from("lobbies")
      .update({
        state: {
          ...gameState,
          submissions: updatedSubmissions,
          results,
          players: updatedPlayers,
          phase: allPlayersSubmitted ? "results" : gameState.phase,
          round_start_time: allPlayersSubmitted ? null : gameState.round_start_time,
        },
      })
      .eq("code", lobbyCode.toUpperCase());

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        submissions: updatedSubmissions,
        results,
        players: updatedPlayers,
        phase: allPlayersSubmitted ? "results" : gameState.phase,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in submit-results function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 