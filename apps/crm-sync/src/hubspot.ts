import fetch from "node-fetch";
import type { CanonicalLead } from "@involynk/shared";

const HUBSPOT_BASE_URL = "https://api.hubapi.com";

function authHeaders() {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error("HUBSPOT_ACCESS_TOKEN is not set");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function findContactIdByPhone(phoneNumber: string): Promise<string | null> {
  const res = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: "phone", operator: "EQ", value: phoneNumber }] }],
      limit: 1,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { results: Array<{ id: string }> };
  return data.results[0]?.id ?? null;
}

async function upsertContact(lead: CanonicalLead): Promise<string> {
  const properties = {
    phone: lead.phoneNumber,
    company: lead.companyName ?? "",
    jobtitle: lead.role ?? "",
    involynk_lead_score: lead.scoreBand,
    involynk_last_call_outcome: lead.callOutcome,
  };

  const existingId = await findContactIdByPhone(lead.phoneNumber);

  if (existingId) {
    await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${existingId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ properties }),
    });
    return existingId;
  }

  const createRes = await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ properties }),
  });
  const created = (await createRes.json()) as { id: string };
  return created.id;
}

async function logCallNote(contactId: string, lead: CanonicalLead): Promise<void> {
  await fetch(`${HUBSPOT_BASE_URL}/crm/v3/objects/notes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      properties: {
        hs_note_body: `AI call (${lead.callSid}) — outcome: ${lead.callOutcome}, score: ${lead.scoreBand}\n\n${lead.callSummary}`,
        hs_timestamp: Date.now(),
      },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        },
      ],
    }),
  });
}

export async function syncLeadToHubSpot(lead: CanonicalLead): Promise<void> {
  const contactId = await upsertContact(lead);
  await logCallNote(contactId, lead);
}
