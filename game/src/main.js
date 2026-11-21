// main.js — the page's bootstrap: gather the head-up display and the two
// panels, start the game, and honour the ?shot= staging parameter the
// maker uses to photograph real states of play for the screenshots folder.
//
//   ?shot=start  the title screen (also the default)
//   ?shot=cover  round 1 mid-hunt, five differences already ringed
//   ?shot=late   round 3, the eclipse, mid-hunt under a shorter clock
//   ?shot=end    the end of the night, all three rounds cleared

import { ObservatoryGame } from './game.js';

const dom = {
  leftCanvas: document.getElementById('panel-left'),
  rightCanvas: document.getElementById('panel-right'),
  roundLabel: document.getElementById('round-label'),
  timerText: document.getElementById('timer-text'),
  timerBar: document.getElementById('timer-bar'),
  leftCount: document.getElementById('left-count'),
  foundCount: document.getElementById('found-count'),
  scoreEl: document.getElementById('score'),
  hintButton: document.getElementById('btn-hint'),
  hintCount: document.getElementById('hints-left'),
  pauseButton: document.getElementById('btn-pause'),
  muteButton: document.getElementById('btn-mute'),
  overlay: document.getElementById('overlay'),
};

const game = new ObservatoryGame(dom);

const shot = new URLSearchParams(location.search).get('shot');
if (shot === 'cover') game.stageCover();
else if (shot === 'late') game.stageLateRound();
else if (shot === 'end') game.stageEnd();

window.__observatory = game;
