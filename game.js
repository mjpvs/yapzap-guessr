export const MAX_PER_USER = 3;

export function normalizeSongs(data) {
  return data.map((song, index) => ({
    id: String(index),
    title: song.title,
    artist: song.artist ?? song.artistName ?? song.musicData?.artist ?? 'Unknown artist',
    thumbnailUrl: song.thumbnailUrl ?? '',
    username: song.username ?? song.userName,
  }));
}

export function scoreGuesses(songs, guesses) {
  if (!Array.isArray(guesses) || guesses.length !== songs.length) {
    throw new Error('Include a guess or Unknown for every song.');
  }
  const users = new Set(songs.map(song => song.username));
  const counts = new Map();
  for (const guess of guesses) {
    if (guess === null) continue;
    if (!users.has(guess)) throw new Error('Please select a valid user.');
    counts.set(guess, (counts.get(guess) ?? 0) + 1);
    if (counts.get(guess) > MAX_PER_USER) throw new Error('Each user can only be selected for 3 songs.');
  }
  const results = songs.map((song, index) => ({
    id: song.id, username: song.username,
    correct: guesses[index] !== null && guesses[index] === song.username,
  }));
  return { score: results.filter(result => result.correct).length, total: songs.length, results };
}
