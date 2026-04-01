
# OSA Phenotyper v8 – requested quick‑adds

### New inputs
* **Cardiovascular disease** (yes/no) under Medical History.
* **Snoring Index** (events/hr) in WatchPAT section.

### New logic / messaging
* **High Hypoxic Burden** phenotype now shows a blue card in the Patient Summary with CV‑risk language and CPAP‑urgency bullet.  
  *Triggered when Min SpO₂ < 85 % or ODI ≥ 40 (simple proxy until full HB calculator arrives).*
* **Symptom subtype** derived from questionnaires:  
  *Sleepy* (ESS ≥ 15) → extra counselling sentence.  
  *Disturbed‑sleep* (ISI ≥ 15).  
  *Minimally Symptomatic* otherwise.

### No HB or ΔHR calculators yet — placeholders only.

### Chart governance hardening
* **Archived patients can now be restored** by admins from the patient list.
* **Field provenance** is tracked on saved chart data so clinicians can see whether values came from manual chart entry, patient intake, or a pending intake conflict.
* **Patient report snapshots** can be saved into the chart as frozen artifacts with hash metadata and replayed later from snapshot history.
