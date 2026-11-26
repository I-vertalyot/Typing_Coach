# Typing Coach

Learn to type with all ten fingers. Every lesson also teaches one English writing point and one tip for writing clear requests to Claude.

The app runs on claude.ai as an artifact: <https://claude.ai/artifact/W7HvM26PnqhCP3yNSNfRcA>. Only its owner can open it until it is shared.

## Features

- **16 lessons**, *Keyboard basics*, teach the keys from the home row to numbers, then the second layer of the number row (lessons 14–16: the Shift symbols such as ! " £ $ %, or ě š č ř ž ý á í é on Czech keyboards; built for your layout). Each lesson has a short English tip. The drills use only keys you have already learned.
- **Finger guide.** An on-screen keyboard colored by finger, hands that show the finger for the next key, and a Shift hint for capital letters.
- **Keyboard layouts.** English (US), English (UK), Czech (QWERTZ), Czech (QWERTY) and German (QWERTZ). If the selected layout doesn't match what your keyboard actually types, the app offers to switch.
- **One moving line.** The text runs past a fixed cursor, like a ticker. You can switch to the whole text in a box in Options. The typing text is sans-serif for easy reading; monospace is an option.
- **Two ways to handle mistakes.** "Stop until the right key", or "continue and fix with Backspace".
- **Static lessons** (on the Practice page). Fixed lessons whose text never changes (warm-ups, every letter, numbers and symbols, everyday English). Each lesson is about 100 words, about 2 minutes, typed in one go. Use **Add a lesson** to add your own (title, group, note and text); they sync like your texts and can be edited or deleted. To add a lesson, add a block to `src/library.js` (the template is at the top of the file).
- **Your own texts.** Paste a text or open a `.txt` file. Each text is one lesson, typed from start to end, with a "Finished N times" counter. Smart quotes and dashes become keyboard characters.
- **Writing coach** (in lesson 26). Claude corrects your request (removals crossed out, additions in blue), explains each mistake, rates how clear the request is and suggests a better version. Then you type it.
- **Common words.** Practice the 50, 100, 200, 500 or 1000 most common English words.
- **Global timer.** The clock button in the top bar (on every page, also during an exercise) sets the timer for all Quick drills: off (18 words), or 1, 2, 3, 5 or 10 minutes with a countdown. Changing it during a drill restarts the drill. Exercises with a fixed text (Learn lessons, static lessons, your texts, steno) are never timed; there the button is crossed out.
- **Metronome.** On every exercise screen (and in Options): one beat per key at 15–80 WPM, or "my speed + 10%" (from your last 10 sessions). It starts with your first key, every 5th beat is louder (one word), and a dot pulses with the beat. Changing it while typing takes effect at once.
- **Weak keys drill.** Every word practices one of your weak keys, and weaker keys come more often. The words use every key you have practiced and rarely repeat. Weak capitals and marks (? , . and so on) are practiced too. A Reset button clears the key statistics on all devices.
- **Weak words.** The app logs the last 10 times you typed every word (lessons, drills, your texts; not the one-hand drills). A word becomes weak when it has 3 or more letters, at least 5 logged typings, 2 or more of the last 10 with a mistake, and mistakes on 2 different days. A slip on one of your weak keys is not logged against the word. The drill takes 6 words (first those not done today, then those closest to strong, then the weakest), each 7 times, mixed with a common word after every 3. A word becomes strong when you type it right 7 times in a row in one exercise on 5 different days within 14 days. **Add words** adds words by hand (adding a strong word makes it weak again). **Reset** clears the list.
- **Choose keys.** Click the keys you want on the keyboard (or type them) and practice only those keys, or real words that contain them. Quick choices: rows, one hand, your weak keys.
- **Steno basics.** The technique American court reporters use: press several keys at once to write a whole word. Your normal keyboard works as a steno machine with Plover's free key mapping. 5 lessons: the steno keys, one-key words, words in one chord, chord letters (D = TK, B = PW...) and common short forms.
- **Progress.** Speed and accuracy charts, minutes per day against a daily goal, mistakes by key on a keyboard heatmap, and drills for your weak keys.
- **Sign-in and sync.** You sign in with your Claude account; there is no extra password. Progress syncs across your devices. Without sign-in, it is saved in the browser.

## How it works

The app is one self-contained HTML page (`dist/index.html`) with no libraries. On claude.ai it uses these artifact capabilities:

| Capability | Used for |
|---|---|
| `db` + `user` | Private progress for each user, synced between devices |
| `sample` | Writing coach feedback and practice texts |
| `tts` | The "Listen" button, which reads the sentence aloud |

Declaration: `{"db": {}, "user": {"scopes": ["profile"]}, "sample": {}, "tts": {}}`

Data is stored under the user's private path:

- `data/users/<id>/progress`: lessons, history, settings, and key and time counters for each device
- `data/users/<id>/progress/texts/<textId>`: one document for each custom text
- `data/users/<id>/journal`: the last 40 coach feedback entries

Merging is safe across devices:

- the best result for each exercise wins
- histories are combined
- counters are kept per device, so nothing is counted twice
- the newest settings win
- a reset on one device clears older data everywhere

A copy is always kept in `localStorage`, so the app also works offline or when opened as a plain file.

## Project structure

```
src/content.js          lessons, starter texts, word list
src/library.js          Static lessons on the Practice page (add new ones here)
src/layouts.js          physical keyboard, finger zones, layout presets
src/core.js             pure logic: text cleanup, splitting long texts, scoring, drills, merge, diff
src/ui.js               keyboard, hands, charts, sound, dialog, toast
src/app.js              state, sync, typing engine, views, router
src/style.css           styles (light and dark theme)
src/index.template.html page shell
build.js                joins everything into dist/index.html
dist/index.html         the built app
icons/                  home screen icon (Keycap T): icon.svg and PNGs; dist/manifest.webmanifest uses them
test/content.test.js    checks that drills use only learned keys, that every layout can type every lesson, and the merge logic
test/e2e.js             headless Chrome: typing, layouts, two-device sync, coach, reset, dark mode, phone width, weak keys
test/mock-claude.js     a fake Claude platform for the browser tests
```

## Build and test

```sh
npm install
npm run build        # writes dist/index.html
npm test             # content and logic checks (Node only)
npm run test:e2e     # browser tests
```

The browser tests need Chromium: run `npx playwright install chromium`, or set `CHROME_PATH` to your Chrome. Add `--shots` (`node test/e2e.js --shots`) to save screenshots to `test/shots/`.

## Updating the live app

Edit the files in `src/` and run `npm run build`. Then publish `dist/index.html` as the artifact's `index.html`. The capability declaration stays the same.
