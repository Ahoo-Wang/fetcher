# CI analysis input budget

The Build Storybook failure is the production analysis input P95 assertion, not compilation. GitHub-hosted Linux Chromium evidence:

| Run                                                                          | Commit   | Input P95 | Switch P95 | Page errors |
| ---------------------------------------------------------------------------- | -------- | --------- | ---------- | ----------- |
| [34612629595](https://github.com/Ahoo-Wang/fetcher/actions/runs/34612629595) | fe8d0f37 | 77.1 ms   | 83.7 ms    | 0           |
| [34610819462](https://github.com/Ahoo-Wang/fetcher/actions/runs/34610819462) | cded79f6 | 76.7 ms   | 84.4 ms    | 0           |
| [34608554738](https://github.com/Ahoo-Wang/fetcher/actions/runs/34608554738) | 72094f61 | 101.6 ms  | 106.1 ms   | 0           |

The prior 75 ms input budget fails all three runs. Under the user's authorization to moderately relax shared-runner thresholds, raise the input ceiling to 125 ms; retain the 150 ms cached-instance-switch ceiling. This provides about 23% headroom over the larger observed P95. It is an acceptance tolerance change, not evidence of a runtime speedup or a guarantee against all runner variance.

Keep 5 warmup samples, 30 measured samples, nearest-rank P95, raw samples and environment metadata. Do not remove outliers, retry to select a favorable sample, skip production checks, alter cancellation assertions, or change the record budget. Update both the interactive report and independent delivery verifier, plus the bilingual package documentation.
