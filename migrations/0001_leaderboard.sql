CREATE TABLE IF NOT EXISTS leaderboard (
  player_id TEXT PRIMARY KEY CHECK(length(player_id) BETWEEN 8 AND 64),
  display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 18),
  best_score INTEGER NOT NULL CHECK(best_score BETWEEN 0 AND 999999999),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS leaderboard_rank_idx
ON leaderboard(best_score DESC, updated_at ASC);
