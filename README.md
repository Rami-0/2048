# Twenty Forty-Eight

A tactile React edition of 2048 with keyboard and swipe controls, portable anonymous profiles, localized country flags, and a compact Cloudflare D1 leaderboard.

## Local development

```sh
npm start
```

To run the full Worker and leaderboard locally:

```sh
npm run db:migrate:local
npm run dev:worker
```

## Deploy

The Worker serves the React build and handles `/api/leaderboard`. After creating the D1 database, place its ID in `wrangler.jsonc`, then run:

```sh
npm run db:migrate:remote
npm run deploy
```

## Storage design

The leaderboard stores one best score per anonymous browser, not every play. Names are limited to 18 characters, player IDs to 64 characters, and scores to integers. A weekly cleanup retains only the best 25,000 unique players. At this bound the leaderboard remains far below 500 MB under ordinary usage; the indexed query only reads the top ten rows.

Profiles can be moved between browsers with a private transfer link or UUID code. Country names are localized in the browser from ISO country codes; `IL` is excluded in both the interface and database validation.

Source: [github.com/Rami-0/2048](https://github.com/Rami-0/2048)
