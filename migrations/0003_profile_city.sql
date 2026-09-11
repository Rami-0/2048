ALTER TABLE leaderboard ADD COLUMN city TEXT NOT NULL DEFAULT ''
  CHECK(length(city) <= 40);
