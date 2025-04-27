
# OSA Phenotyper Prototype – v2

Changes from v1
---------------

* **Neck circumference field now in inches** (rules use ≥17 in for males and ≥16 in for females per STOP‑BANG).
* **Rich patient‑friendly explanations** – each phenotype expands to a plain‑language description plus actionable steps.
* **Clinician Decision Support** – shows explicit rule triggers (e.g., "Neck circumference 17.2 in") so you see why each phenotype was selected.
* Small UI tweaks: collapsible `<details>` sections, responsive viewport, clearer headings.

To test locally:
```
python -m http.server 8000      # optional – or just open index.html
```

All processing still happens client‑side; no data are stored or transmitted.
