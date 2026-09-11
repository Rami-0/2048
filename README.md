# Twenty Forty-Eight

The original animated purple 2048 game, upgraded with keyboard/WASD and swipe controls, a run timer, portable anonymous profiles, localized country flags, automatic score saving, and a separate Cloudflare D1 leaderboard page.

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

The game follows three explicit stages: create or restore a profile, play a timed run, then see the result and automatic save status. Rankings live at `/leaderboard` and exclude zero-score profile records.

Source: [github.com/Rami-0/2048](https://github.com/Rami-0/2048)
