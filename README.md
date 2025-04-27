
# OSA Phenotyper Prototype

This is a **client‑side** prototype web app that collects basic sleep study and clinical data,
classifies likely obstructive sleep apnea phenotypes, and generates patient‑friendly and clinician‑oriented reports.

## How to use

1. Download and unzip the package.
2. Open `index.html` in any modern web browser.
3. Enter the requested data and click **Run Analysis**.
4. Two reports will appear:
   * **Patient‑Friendly Summary**
   * **Clinician Decision Support**

All processing happens locally in the browser — no data are stored or transmitted.

## Customisation

* The rule set can be expanded in `runAnalysis()` inside the HTML file.
* Styling uses Bootstrap 5; feel free to adjust the CSS in the `<style>` block.

## Limitations

This is a **minimal viable prototype**:
* Phenotype logic uses simplified, rule‑based heuristics.
* It does **not** save data or connect to any backend.
* It is **not** a substitute for clinical judgment.

