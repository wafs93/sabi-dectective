# Sabi Detective art manifest

All art lives in `public/art/` and is imported through `src/data/case1-art.ts`.
Style for everything: painterly Nigerian noir, warm brass and dawn light against charcoal
shadows, no text or logos in the image, no recognisable real people.

## In use

| File | Size | Used for |
| --- | --- | --- |
| `scene-empty-stall.jpg` | 768×1152 | Investigation scene, Home, intro cold open (lines 1–3), title backdrop |
| `clue-muddy-footprint.jpg` | 1236×604 | Footprint clue; intro cold open (last line) |
| `clue-security-log.jpg` | 1236×604 | Security log clue |
| `clue-wage-ledger.jpg` | 1234×612 | Wage ledger clue |
| `portrait-chuks.jpg` | 768×1152 | Chuks |
| `portrait-alhaja-bisi.jpg` | 768×1152 | Alhaja Bisi |

## Wanted (not created; the game works without them)

| File | Size | Brief | Would replace |
| --- | --- | --- | --- |
| `intro-market-dawn.jpg` | 1080×1920 (tall), JPEG under 250 KB | A quiet Lagos market at about 6 AM. Stalls closed with plastic tarpaulins, wet red-brown soil reflecting the first dawn light, light haze, nobody about. One stall in the middle distance is shut. | The night-time stall interior in cold open lines 1–3 (the brief asks for dawn outside) |
| `intro-tarpaulins.png` | 1080×1920, transparent PNG under 200 KB | Only the tarpaulins from the image above, cut out on a transparent background, so they can sway gently as a separate layer. | Nothing yet; it adds the "moving tarpaulins" from the brief |
| `intro-bootprint-tall.jpg` | 1080×1920, JPEG under 250 KB | Close-up of one work-boot sole print in wet red-brown soil, heavy tread and worn heel, seen from above, framed for a tall phone screen. Same look as `clue-muddy-footprint.jpg`. | The wide footprint band on the cold open's last line |
| `case-cover-empty-stall.jpg` | 1200×800, JPEG under 200 KB | Case-file cover photo: the shut stall from outside at dawn, police tape optional, as if pinned to a dossier. | Stage B case file cover (the stall scene is used until then) |

## Sound (optional, off by default)

| File | Brief |
| --- | --- |
| `public/audio/market-dawn.mp3` | 20–30 second loop of a quiet market before opening: distant birds, a far-off generator, tarpaulin flapping. Under 300 KB. No music, no voices. |

There is no sound toggle in the game until this file exists.
