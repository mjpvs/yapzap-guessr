# YapZap Guessr

Run `npm start`, then open http://localhost:3030. No dependencies need installing.

Songs are loaded from `submissions.json` when the server starts. Each song starts as Unknown; each user can be assigned to at most three songs. Submit at any time to score your guesses and reveal the answers. Play again clears all guesses.

The server keeps submitters out of the playlist API and validates the selection limit when scoring. This is a casual local game without accounts or saved scores.

Run `npm test` to check scoring and validation.
