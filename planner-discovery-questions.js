/** Discovery questions shared with the simulator qualification tracker. */

const DISCOVERY_QUESTIONS = [
  {
    category: "Hardware & Space",
    risk: "Critical",
    question:
      "What are the exact ceiling heights, lux lighting levels, and power paths? Are there structural blockers?",
    mitigation:
      "Conduct physical site survey. Map cable trays, perform 3D scan for camera overlap, and identify dark spots."
  },
  {
    category: "Hardware & Space",
    risk: "Critical",
    question:
      "Is there a secure, climate-controlled comms closet to house the Edge servers? What is the UPS capacity?",
    mitigation:
      "Verify HVAC capacity. Audit current UPS load to ensure safe edge server shutdown during power outages."
  },
  {
    category: "Hardware & Space",
    risk: "High",
    question: "What are the specific local privacy laws regarding CCTV and skeletal tracking?",
    mitigation:
      "Consult legal. Ensure warning signage is printed and visible at entrance. Confirm data retention policies."
  },
  {
    category: "Operations",
    risk: "Medium",
    question:
      "Can we phase the hardware installation (12 AM - 4 AM) to keep the store operational? Where is the staging area?",
    mitigation:
      "Draft night-shift schedule. Define Zone A/B rollout. Confirm delivery hours and security clearance."
  },
  {
    category: "Operations",
    risk: "Medium",
    question:
      "How are deliveries scheduled? Do restocking carts block aisles during peak operating hours?",
    mitigation:
      "Map delivery schedule. Recommend shifting bulk restocking to off-peak hours to avoid camera occlusion."
  },
  {
    category: "Systems & Data",
    risk: "Medium",
    question:
      "What are the specific vendors/versions of legacy ERP & POS? Do they expose REST APIs or use SFTP/XML?",
    mitigation:
      "Request architecture docs. Determine Translation Middleware requirements (e.g., MuleSoft) to map JSON to legacy."
  },
  {
    category: "Systems & Data",
    risk: "High",
    question:
      "How frequently is pricing, promotional data, and tax configuration pushed from HQ to the store?",
    mitigation:
      "Define sync frequency (e.g., 15 mins). Map complex promo logic (BOGO, meal deals) to edge logic."
  },
  {
    category: "Systems & Data",
    risk: "High",
    question:
      "What are the firewall, VPN, or IP whitelisting requirements to establish a secure connection to HQ?",
    mitigation: "Exchange security questionnaires. Set up secure site-to-site VPN tunnel."
  },
  {
    category: "Product Catalog",
    risk: "High",
    question:
      "What percentage of items are variable-weight? Are there visually similar items (e.g., Diet vs Regular)?",
    mitigation:
      "Extract active SKU list. Identify items requiring load-cell precision tuning vs. visual tracking."
  },
  {
    category: "Product Catalog",
    risk: "Critical",
    question:
      "How is SKU master data structured? What is the ongoing SOP for introducing a net-new SKU post-launch?",
    mitigation:
      "Provide standard CSV ingestion template. Document standard procedure for weighing new items before shelving."
  }
];

const PlannerDiscoveryQuestions = { DISCOVERY_QUESTIONS };

if (typeof module !== "undefined" && module.exports) {
  module.exports = PlannerDiscoveryQuestions;
}
if (typeof globalThis !== "undefined") {
  globalThis.PlannerDiscoveryQuestions = PlannerDiscoveryQuestions;
}
