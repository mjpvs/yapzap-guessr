const songList = document.querySelector('#songs');
const userList = document.querySelector('#users');
const submit = document.querySelector('#submit');
const reset = document.querySelector('#reset');
const error = document.querySelector('#error');
const result = document.querySelector('#result');
let songs = [], users = [], guesses = [], selects = [], cards = [], max = 3;
let locked = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function update() {
  const counts = new Map(users.map(user => [user, guesses.filter(guess => guess === user).length]));
  userList.replaceChildren(...users.map(user => {
    const chip = element('div', `user-chip${counts.get(user) === max ? ' full' : ''}`);
    chip.append(element('span', 'initial', user.slice(0, 1).toUpperCase()), element('span', '', user), element('strong', '', `${counts.get(user)} / ${max}`));
    return chip;
  }));
  selects.forEach((select, index) => {
    select.disabled = locked;
    for (const option of select.options) {
      if (!option.value) continue;
      const user = users[Number(option.value) - 1];
      option.disabled = counts.get(user) >= max && guesses[index] !== user;
      option.textContent = `${user} (${counts.get(user)}/${max})`;
    }
    cards[index].classList.toggle('selected', guesses[index] !== null);
  });
  const guessed = guesses.filter(guess => guess !== null).length;
  document.querySelector('#progress').textContent = `${guessed} / ${songs.length} guessed`;
  document.querySelector('#summary').textContent = `${songs.length - guessed} unknown · ${guessed} guesses made`;
}

function render() {
  selects = []; cards = [];
  songList.replaceChildren(...songs.map((song, index) => {
    const card = element('article', 'song');
    card.append(element('span', 'number', String(index + 1).padStart(2, '0')));
    const cover = element('div', 'cover', '♫');
    if (song.thumbnailUrl) {
      const image = element('img', '');
      image.src = song.thumbnailUrl; image.alt = ''; image.loading = 'lazy';
      image.addEventListener('error', () => image.remove());
      cover.append(image);
    }
    const details = element('div', 'details');
    details.append(element('h3', '', song.title), element('p', '', song.artist));
    const label = element('label', 'guess-label', 'Submitted by');
    const select = element('select', '');
    select.setAttribute('aria-label', `Who submitted ${song.title} by ${song.artist}?`);
    select.append(new Option('Unknown', ''), ...users.map((user, i) => new Option(user, String(i + 1))));
    select.addEventListener('change', () => {
      const next = select.value ? users[Number(select.value) - 1] : null;
      if (next !== null && guesses.filter((guess, i) => i !== index && guess === next).length >= max) {
        select.value = guesses[index] === null ? '' : String(users.indexOf(guesses[index]) + 1);
        error.textContent = 'That person already has 3 songs. Change another guess first.';
        return;
      }
      error.textContent = ''; guesses[index] = next; update();
    });
    label.append(select); card.append(cover, details, label);
    selects.push(select); cards.push(card); return card;
  }));
  update();
}

document.querySelector('#game').addEventListener('submit', async event => {
  event.preventDefault();
  if (locked) return;
  locked = true; submit.disabled = true; submit.textContent = 'Checking guesses…'; update();
  try {
    const ordered = [];
    songs.forEach((song, index) => { ordered[Number(song.id)] = guesses[index]; });
    const response = await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guesses: ordered }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    result.replaceChildren(element('p', 'eyebrow', 'THE RESULTS ARE IN'), element('h2', '', `${data.score} / ${data.total} correct`), element('p', '', 'The submitters are revealed below. Play again to start fresh.'));
    const share = element('button', 'share-result', 'Share result 🎯');
    share.type = 'button';
    const shareStatus = element('p', 'share-status');
    shareStatus.setAttribute('role', 'status');
    const shareText = `🎯 I scored ${data.score}/${data.total} on yapzapguessr!\n${new URL('/', window.location.href).href}`;
    share.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareText);
        share.textContent = 'Copied! ✓';
        shareStatus.textContent = '';
      } catch {
        shareStatus.textContent = 'Could not copy automatically. Select and copy your result below:';
        let copyText = result.querySelector('.share-text');
        if (!copyText) {
          copyText = element('textarea', 'share-text');
          copyText.readOnly = true;
          copyText.setAttribute('aria-label', 'Result to copy');
          copyText.value = shareText;
          result.append(copyText);
        }
        copyText.focus();
        copyText.select();
      }
    });
    result.append(share, shareStatus);
    result.hidden = false;
    data.results.forEach(answer => {
      const index = songs.findIndex(song => song.id === answer.id);
      cards[index].classList.add(answer.correct ? 'correct' : 'incorrect');
      cards[index].querySelector('.details').append(element('p', 'answer', `${answer.correct ? '✓ Correct' : guesses[index] === null ? '— Unknown' : '✕ Incorrect'} · Submitted by ${answer.username}`));
    });
    submit.hidden = true; reset.hidden = false; result.focus(); result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (cause) {
    error.textContent = cause.message; locked = false; submit.disabled = false; submit.textContent = 'Submit guesses ↗'; update();
  }
});

reset.addEventListener('click', () => {
  guesses = songs.map(() => null); locked = false; result.hidden = true;
  reset.hidden = true; submit.hidden = false; submit.disabled = false;
  submit.textContent = 'Submit guesses ↗'; error.textContent = ''; render();
  document.querySelector('.list-heading').scrollIntoView({ behavior: 'smooth' });
});

try {
  const response = await fetch('/api/songs');
  if (!response.ok) throw new Error('Unable to load songs. Refresh to try again.');
  const data = await response.json();
  // Alphabetical order avoids revealing groups from the original submission order.
  songs = data.songs.sort((a, b) => a.title.localeCompare(b.title));
  users = data.users; max = data.maxPerUser; guesses = songs.map(() => null);
  render(); submit.disabled = songs.length === 0;
  if (!songs.length) document.querySelector('#summary').textContent = 'No songs have been added yet.';
} catch (cause) { error.textContent = cause.message; document.querySelector('#progress').textContent = 'Songs unavailable'; }
