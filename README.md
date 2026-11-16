# Kopi Panic! — one tiny café, too many thirsty strangers

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/ariefansclub13/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/ariefansclub13/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

A cheerful time-management arcade game: you run the world's smallest café for
one 90-second day. Regulars walk in — a pigeon in a tie, a robot that runs on
coffee, a grandma who knows every barista by name, a cat that judges your
latte art, a duck that quacks when the foam is wrong, and an office zombie who
has not slept since Tuesday. Each one orders a drink of two or three
ingredients. Brew it right and serve it before their patience runs dry; get
three walk-outs and the café closes early.

## How to play

Open `game/index.html` from any static server (or run `node serve.ts` and open
http://localhost:8080). No network request, no build step.

- **Pour:** click an ingredient button, or press **1** (espresso), **2** (milk),
  **3** (sugar), **4** (ice). The cup holds up to four pours.
- **Serve:** click a customer, or press **Space** (serves the selected one).
  **← →** picks another customer. **Backspace** dumps the cup.
- **Win:** earn **$60** before the 90-second day ends. A perfect serve pays the
  drink's price plus a tip that grows with the patience left — and a streak
  sweetens every tip after it.
- **Lose:** a customer whose patience empties storms out. Three walk-outs and
  the shutters come down. Rush hour (the middle of the day) brings faster
  customers and faster-draining patience.
- **Restart:** click the button or press **R**. **M** mutes the music and sounds.

All art is drawn on canvas and all sound is synthesised with WebAudio — the
game ships no image or audio files at all.
