# CI analysis input budget

The Build Storybook failure is the production analysis input P95 assertion, not compilation. GitHub-hosted Linux Chromium evidence:

| Run                                                                          | Commit   | Input P95 | Switch P95 | Page errors |
| ---------------------------------------------------------------------------- | -------- | --------- | ---------- | ----------- |
| [34612629595](https://github.com/Ahoo-Wang/fetcher/actions/runs/34612629595) | fe8d0f37 | 77.1 ms   | 83.7 ms    | 0           |
| [34610819462](https://github.com/Ahoo-Wang/fetcher/actions/runs/34610819462) | cded79f6 | 76.7 ms   | 84.4 ms    | 0           |
| [34608554738](https://github.com/Ahoo-Wang/fetcher/actions/runs/34608554738) | 72094f61 | 101.6 ms  | 106.1 ms   | 0           |

The prior 75 ms input budget fails all three runs. The first adjustment to 125/150 ms let Chromium proceed in [run 34613438072](https://github.com/Ahoo-Wang/fetcher/actions/runs/34613438072): input/switch P95 were 98.4/97.9 ms. That run exposed the previously unreached Firefox measurement: input/switch P95 were 165/177 ms, with no page errors. Both browsers ran on an AMD EPYC 7763 runner with 4 reported logical processors. Firefox idle two-frame P95 was 34 ms; measured input dispatch was roughly 18–29 ms in the initial samples, with most elapsed time after dispatch. This is not solely an idle-frame spike.

The next [run 34615027951](https://github.com/Ahoo-Wang/fetcher/actions/runs/34615027951) passed Chromium (96.3/103.2 ms) and Firefox (113/154 ms), then exposed WebKit at 232/281 ms, again without page errors. This completes the first cross-browser measurement set for the changed workbench.

Under the user's authorization to relax shared-runner thresholds, use uniform cross-browser regression ceilings of 300 ms input and 350 ms switch P95: about 29% and 25% headroom above the observed slowest engine. These are CI regression tolerances, not end-user latency targets or evidence of a speedup. The matrix runner now executes browsers sequentially even after an individual failure, then rejects with the collected failures. Cancellation still stops immediately. This preserves the failure gate while avoiding repeated runs merely to discover the next browser's result.

Keep 5 warmup samples, 30 measured samples, nearest-rank P95, raw samples and environment metadata. Do not remove outliers, retry to select a favorable sample, skip production checks, alter cancellation assertions, or change the record budget. Update both the interactive report and independent delivery verifier, plus the bilingual package documentation.
