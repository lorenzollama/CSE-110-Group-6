# Sound credits

Every sound in this folder, where it came from, and the credit its license asks for.
Most free sounds require credit, so add a line here whenever you add a file.

| File | What it's for | Title / artist | Source | License and required credit |
|---|---|---|---|---|
| `heroic-music.mp3` | Background music (loops once a game starts) | "Heroic" (Legendary Epic Heroic) by Alex-Productions | chosic.com | TODO: copy the exact credit line from the chosic.com download page (usually Creative Commons CC BY, which requires this credit) |
| `menu-click.wav` | Sound when any button is clicked | Original "blip" made for this project (generated from sound waves, no recordings) | This project | None needed: no outside source, free to use |
| `shoot.wav` | Spaceship Shooter: a scrap is shot (laser "pew" and a small boom) | Original, made for this project (generated from sound waves, no recordings) | This project | None needed: no outside source, free to use |
| `wrong.wav` | Spaceship Shooter: a wrong answer, or a scrap reaching the dashed line (two-note "uh-oh") | Original, made for this project (generated from sound waves, no recordings) | This project | None needed: no outside source, free to use |

The code that plays these is in `src/audio/`. A file listed here that isn't in the folder yet
is simply skipped, so the game still works without it.

To use a different click sound, add it as `menu-click.mp3` (or `.ogg`): an mp3 is used before
the wav, so the wav can stay as a backup. Add its credit here.
