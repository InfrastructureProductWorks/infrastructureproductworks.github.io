/* Synthetic reference only; no enterprise financial data. */
(function(g){
  const data = {
  "organization": "Example Organization",
  "division": "Cloud Platform Division",
  "period": "FY27 Q1",
  "currency": "USD",
  "contract": "northstar-funding-planning/v1",
  "synthetic": true,
  "revision": "funding-reference-1",
  "observedOn": "2026-10-11",
  "source": "NorthStar synthetic planning fixture",
  "envelope": 100000000,
  "investments": [
    {
      "organization": "Example Organization",
      "division": "Cloud Platform Division",
      "period": "FY27 Q1",
      "currency": "USD",
      "objective": "O9",
      "title": "Cloud-product investment decisions",
      "krs": [
        "KR9.3",
        "KR9.6"
      ],
      "epics": [
        "EP-FUND-FOUNDATION",
        "EP-FUND-DISCOVERY"
      ],
      "allocation": 45000000,
      "actual": 12000000,
      "commitments": 14000000,
      "remaining": 27000000,
      "availableCapacity": 4,
      "requiredCapacity": 5,
      "basis": "Management estimate: foundation delivery plus an independently deferrable discovery Epic.",
      "source": "synthetic-estimate-O9",
      "outcome": "Unavailable",
      "capacityOption": {
        "cost": 8000000,
        "capacity": 1,
        "source": "synthetic-management-option-O9",
        "assumption": "Management assumes suitable additional capacity is available for the full period. Skills and availability are illustrative, not verified."
      },
      "deferral": {
        "epic": "EP-FUND-DISCOVERY",
        "kr": "KR9.3",
        "cost": 8000000,
        "capacity": 1,
        "consequence": "KR9.3 option discovery moves to the next period. Foundation work continues."
      }
    },
    {
      "organization": "Example Organization",
      "division": "Cloud Platform Division",
      "period": "FY27 Q1",
      "currency": "USD",
      "objective": "O10",
      "title": "Governed product reuse",
      "krs": [
        "KR10.2"
      ],
      "epics": [
        "EP-FUND-REUSE"
      ],
      "allocation": 30000000,
      "actual": 8000000,
      "commitments": 9000000,
      "remaining": 11000000,
      "availableCapacity": 3,
      "requiredCapacity": 3,
      "basis": "Synthetic reusable-product adoption estimate; no measured savings claimed.",
      "source": "synthetic-estimate-O10",
      "outcome": "Unavailable"
    },
    {
      "organization": "Example Organization",
      "division": "Cloud Platform Division",
      "period": "FY27 Q1",
      "currency": "USD",
      "objective": "O11",
      "title": "Evidence confidence",
      "krs": [
        "KR11.1"
      ],
      "epics": [
        "EP-FUND-EVIDENCE"
      ],
      "allocation": 15000000,
      "actual": null,
      "commitments": 3000000,
      "remaining": 9000000,
      "availableCapacity": 2,
      "requiredCapacity": 2,
      "basis": "Actual spending has not been supplied; affordability remains unknown.",
      "source": "synthetic-estimate-O11",
      "outcome": "Unavailable"
    }
  ]
};
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else g.NorthstarFundingFixture = data;
})(globalThis);
