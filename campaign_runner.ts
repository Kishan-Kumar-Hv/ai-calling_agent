import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const CALL_ORCHESTRATOR_URL = "http://localhost:4000/calls/outbound";

async function run() {
  const csvPath = path.resolve(__dirname, "./leads.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("leads.csv not found!");
    return;
  }

  const lines = fs.readFileSync(csvPath, "utf-8").split("\n").filter(Boolean);
  // Remove header row
  lines.shift();

  console.log(`[campaign-runner] loaded ${lines.length} leads. starting dialer...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Splitting by commas that are not inside quotes
    const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (parts.length < 4) continue;

    const phoneNumber = parts[0].trim().replace(/"/g, "");
    const ownerName = parts[1].trim().replace(/"/g, "");
    const businessName = parts[2].trim().replace(/"/g, "");
    const observedLack = parts[3].trim().replace(/"/g, "");

    console.log(`\n--------------------------------------------`);
    console.log(`[campaign-runner] (${i + 1}/${lines.length}) dialing: ${ownerName} at ${businessName} (${phoneNumber})`);
    console.log(`[campaign-runner] observed lack: "${observedLack}"`);

    try {
      const response = await fetch(CALL_ORCHESTRATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: "campaign-abc",
          leadPhoneNumber: phoneNumber,
          leadName: ownerName,
          businessName: businessName,
          observedLack: observedLack,
          bypassTimeGuardrails: true, // Bypass time limits for active testing
        }),
      });

      const data = (await response.json()) as { callSid?: string; error?: string };
      if (response.ok) {
        console.log(`[campaign-runner] successfully placed call! SID: ${data.callSid}`);
      } else {
        console.error(`[campaign-runner] call failed: ${data.error}`);
      }
    } catch (err) {
      console.error(`[campaign-runner] API connection failed:`, err);
    }

    if (i < lines.length - 1) {
      console.log(`[campaign-runner] waiting 10 seconds before next call...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
  console.log(`\n[campaign-runner] campaign complete!`);
}

run();
