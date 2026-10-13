# survevBot

Squads of four agents that learned to play a 2D battle royale with multi-agent reinforcement learning. A proof of concept.

**[Watch full matches in your browser](https://123wwwa.github.io/survevbot-demo/)** · [40-second clip](https://www.youtube.com/shorts/PPAVNHRAb7k)

The game is [survev](https://github.com/survev/survev), an open-source clone of surviv.io. Everything runs on a local, unmodified game server, and nobody in the replays is human.

## Model

- **MAPPO**: a centralized critic and one actor network shared by the four members of a squad. The actor sees only what a real game client receives.
- **Input**: about 1.4k features, two local grids and a minimap through small CNNs, and a set encoder over the visible enemies.
- **Memory**: a GRU after the encoders.
- **Output**: an intent (loot, take cover, peek, retreat, regroup, push), a target, and what to use.

## Training

- **Hardware**: one desktop PC. AMD Ryzen 7 7800X3D (8 cores, 16 threads), NVIDIA GeForce RTX 5070 (12 GB), 32 GB RAM, Windows 11.
- **Time**: about 95 hours of training so far (as of 14 October 2026), about 17,000 policy updates, with 14 game environments running in parallel on the CPU. Training is still going.

## The replays

The page holds several recorded matches, each won by a model squad. Follow any squad or a single player, switch the AI's intent lines on and off, and jump to any point of a match. `RL · latest` is the model in training, `RL · snapshot` is a saved version of it used as an opponent, and `scripted` is a hand-written bot.

## Not included

The training code, the bot and the model weights are not published. A bot like this could be abused as a cheat on public servers.

## Credits

Game, images and sounds: [survev](https://github.com/survev/survev), GPL-3.0. This repository is under the same licence. See [NOTICE.md](NOTICE.md).
