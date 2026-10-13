# survevBot

Squads of four agents that learned to play a 2D battle royale with multi-agent reinforcement learning. A proof of concept.

**[Watch a full match in your browser](https://123wwwa.github.io/survevbot-demo/)** · [40-second clip](https://www.youtube.com/shorts/PPAVNHRAb7k)

The game is [survev](https://github.com/survev/survev), an open-source clone of surviv.io. Everything runs on a local, unmodified game server, and nobody in the replay is human.

## How it works

- **MAPPO** with a centralized critic and one actor shared by the squad. The actor sees only what a real game client receives.
- **Input**: about 1.4k features, local grids and a minimap through small CNNs, a set encoder over visible enemies, then a GRU.
- **Actions**: the policy picks an intent (loot, take cover, peek, retreat, regroup, push), a target, and what to use. Scripted skills carry it out: aiming, pathfinding, healing and revives, throws.
- **Reward**: one team reward shared by the squad.

## The replay

Follow any squad or a single player, switch the AI's intent lines on and off, and jump to any point of the match. `RL · latest` is the model in training, `RL · snapshot` is a saved version of it used as an opponent, and `scripted` is a hand-written bot.

## Not included

The training code, the bot and the model weights are not published. A bot like this could be abused as a cheat on public servers.

## Credits

Game, images and sounds: [survev](https://github.com/survev/survev), GPL-3.0. This repository is under the same licence. See [NOTICE.md](NOTICE.md).
