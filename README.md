# Store-Base-Planner

Interactive dashboard to simulate monthly value realization for a smart autonomous store.

## What it models

- Peak traffic uplift during commuter windows
- Queue checkout speed effects on conversion and throughput
- Stock reposition speed effects on sell-through
- Exception handling penalties
- Staffing tradeoff (lower exceptions vs higher costs)
- Energy and communications monthly cost lever (EUR 600 to 5000)

Core formula:

`Net Value = Revenue - (Operating Costs + Exception Penalties)`

The simulator projects monthly outcomes (30-day period) from daily operational inputs.

## Run

Open `index.html` in a browser.

## Calibration

All assumptions are in the `modelConstants` object inside `index.html`:

- `baseConversion`
- `averageItemsPerTransaction`
- `averageProductPrice`
- `baseFixedDailyCosts`
- `baseFixedMonthlyCosts`
- `laborCostPerPerson`
- `penaltyPerException`
- `daysPerMonth`

Tune these values to align with real store KPIs.
