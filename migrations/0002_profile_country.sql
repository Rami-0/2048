ALTER TABLE leaderboard ADD COLUMN country_code TEXT NOT NULL DEFAULT ''
  CHECK(country_code = '' OR (length(country_code) = 2 AND country_code <> 'IL'));
