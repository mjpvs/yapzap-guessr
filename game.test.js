import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSongs, scoreGuesses } from './game.js';
const songs = normalizeSongs([
  ...Array.from({ length: 3 }, () => ({ title: 'A song', artistName: 'Artist', userName: 'Alice' })),
  { title: 'Another song', artist: 'Artist', username: 'Bob' },
]);
test('all unknown scores zero', () => assert.equal(scoreGuesses(songs, [null, null, null, null]).score, 0));
test('three selections allowed and correct answers scored', () => assert.equal(scoreGuesses(songs, ['Alice', 'Alice', 'Alice', 'Bob']).score, 4));
test('incorrect and unknown answers do not earn points', () => assert.equal(scoreGuesses(songs, ['Bob', null, 'Alice', 'Alice']).score, 1));
test('four selections for a user rejected', () => assert.throws(() => scoreGuesses(songs, Array(4).fill('Alice')), /3 songs/));
test('invalid user and incomplete submissions rejected', () => {
  assert.throws(() => scoreGuesses(songs, ['Eve', null, null, null]), /valid user/);
  assert.throws(() => scoreGuesses(songs, []), /every song/);
});
