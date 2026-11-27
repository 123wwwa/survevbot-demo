# survevBot

Squads of four AI agents that learned to play a 2D battle royale with multi-agent reinforcement learning (MAPPO), trained on one desktop PC. A personal research project.

**[Watch full matches in your browser](https://123wwwa.github.io/survevbot-demo/)** · [short clip](https://www.youtube.com/shorts/PPAVNHRAb7k) (October 2026 model)

The game is [survev](https://github.com/survev/survev), an open-source clone of surviv.io. Everything here ran on the unmodified open-source game server on a local machine, and nobody in the replays is human.

## At a glance

| | |
|---|---|
| Algorithm | MAPPO: centralized training, decentralized execution |
| Agents | squads of 4, 10–17 squads (40–68 players) per game |
| Policy | recurrent actor (CNNs + set encoders + GRU), about 3.4M parameters, one decision every 0.25 s |
| Training | about 1,100 hours of run time and about 125k policy updates, 9 October – 28 November 2026, still running |
| Hardware | one desktop PC: Ryzen 7 7800X3D, RTX 5070 12 GB, 32 GB RAM |
| Result | October checkpoints won 83 of 112 local games against a hand-written expert bot (74%, chance about 53%) |

## The problem

- **Multi-agent**: four teammates act together against many other squads at once.
- **Partial observability**: each agent sees only what its own player could see (its screen area and a minimap), never the full game state.
- **Delay**: every player sees the world late and its inputs arrive late.
- **Long horizon**: a match lasts minutes; looting early pays off in fights much later.
- **Limited compute**: one consumer GPU and an 8-core CPU.

## Approach

**Hierarchical policy.** Every 0.25 s the policy chooses *where to go* (an intent, mostly picked among candidate destinations), *who to engage* (one of the enemies it knows about, or nobody) and *what to use*. The low-level control under it is not learned and is not described here. The learning problem is the decision making.

**MAPPO with centralized training, decentralized execution.**

- **Actor**, shared by the four squad members, using only that agent's own observations:
  - a feature vector (own state, items, teammates, surroundings) → MLP
  - egocentric grids at two scales → small CNNs
  - a coarse whole-map grid → small CNN
  - set encoders over the known enemies and over candidate destinations (shared MLP with max + mean pooling, so these summaries do not depend on order)
  - all merged → GRU
  - three categorical heads: intent (mostly a pointer over the candidate destinations), target (a pointer over the enemies, or none) and mode; invalid choices are masked
- **Critic**, used only in training: all four members' observations plus a squad-centred global map that includes enemies nobody on the squad can see. It predicts one shared team value.
- **Reward**: terms credited to the agent that earned them (damage, knocks, survival, …) plus team terms (placement, win), summed for the squad; the critic learns the squad's return.
- **PPO**: recurrent PPO over long chunks replayed from stored GRU states, with a long discount horizon (about two minutes of look-ahead).

**Imitation warm start.** The policy first copied the expert bot's decisions (behaviour cloning), then switched to RL. For most of training a small imitation loss on the model's own past best decisions acted as an anchor; it was removed in mid-November.

**Opponents.** A mix of rule-based expert bots (with several play styles) and self-play: the current model and a pool of its past snapshots.

**Simulated delay.** Every player gets its own simulated network delay, varied between games, and the policy is given its delay as an input.

## Results (local simulation)

All games ran on a local server. Both sides played their most likely actions under simulated delay. These evaluations used checkpoints from October 2026 (updates 56k–80k, an actor of about 3.0M parameters), smaller than the current model.

| Comparison | Result | Notes |
|---|---|---|
| Learned policy vs expert bot (same low-level control) | **83 of 112 games won (74%, 95% CI 65–82%)** | chance from squad share about 53%; 1.59× the bots' kills per squad; 14 evaluations of 8 games |
| Learned intents vs random intents (same low-level control) | 8 of 8 games won | kills per squad 6.33 vs 0.89: the learned decisions drive performance; small sample |
| Trained with delay vs without | each model won 5 of 6 games under its own training condition | 10 of 12 together (one-sided sign test p = 0.019); mixed on kills and damage |

A running evaluation of the model in training against expert bots (about 5,000 games in November 2026, while maps and delay settings changed) gives 2.07× the bots' kills per squad and 69% of one-on-one duels won.

**Teamwork.** Nothing in the reward asks for close spacing; the only distance terms penalize being far from every teammate. In fights, the policy kept its nearest teammate 2–8 m away in 31% of decisions, against 24% for the expert bots, and this share was higher in 11 of 12 evaluations (one tie).

**Caveats.** Head-to-head comparisons are 6–8 games each. Observation, reward and training changes overlap, so there is no clean ablation. The p-values are descriptive: nothing was pre-registered and there is no correction for multiple comparisons. The expert bot shares the low-level control, so these numbers compare decision making.

## Training

- **Hardware**: one desktop PC. AMD Ryzen 7 7800X3D (8 cores, 16 threads), NVIDIA GeForce RTX 5070 (12 GB), 32 GB RAM, Windows 11.
- **Setup**: game worker processes on the CPU (currently 8, between 4 and 14 over the project) feed one server and one GPU learner.
- **Time**: about 1,100 hours of training run time from 9 October to 28 November 2026, including branches later rolled back. The model in training is at about 125,000 policy updates, after about 127,000 games and 1.4 billion agent decisions. Training is still going.

## What I learned

- **Learning under delay.** A policy trained without delay did badly once delay was added. Varying the delay per player during training and giving the policy its delay as an input fixed much of it, but play still gets worse as delay grows.
- **What the actor may see.** The actor gets only what its own player could see. A perturbation test (changing enemies' hidden health and checking that no input changes) guards against leaks. The critic may use privileged state; that is the point of centralized training.
- **Team reward and credit assignment.** Rewards are credited to the agent that earned them and summed for the squad, so one critic learns the team's return while individual contributions still show up in the signal.
- **Imitation as an anchor, not only a start.** In October, removing the imitation loss made some learned choices collapse within a few hundred updates, so a small anchor stayed until the policy no longer needed it.
- **Opponent diversity.** Training against scripted bots of several styles, the current self and past snapshots kept the policy from exploiting one opponent's weaknesses.
- **Throughput on one PC.** Recurrent PPO over replayed chunks, parallel CPU game workers and one GPU learner reached over a billion agent decisions on consumer hardware.
- **Measuring honestly.** Some metrics flatter a model. Sample sizes, confidence intervals and chance baselines mattered as much as the training itself.

## The replays

[The replay page](https://123wwwa.github.io/survevbot-demo/) holds 10 full matches, each won by a model squad. Follow any squad or a single player, turn each squad's AI intent lines (where it means to go and who it is targeting) on and off, and jump to any point of a match. `RL · latest` is the model in training, `RL · snapshot` is a saved version of it used as an opponent, and `baseline` is the scripted bot.

The matches were recorded on 14 October 2026 on the desert map, at about update 17,500 (around 95 hours of training): an earlier, smaller version of the model than the one described above.

## Not included

The training code, the bot and the model weights are not published. A bot like this could be abused as a cheat on public servers.

## Credits

Game, images and sounds: [survev](https://github.com/survev/survev), GPL-3.0. This repository is under the same licence. See [NOTICE.md](NOTICE.md).
