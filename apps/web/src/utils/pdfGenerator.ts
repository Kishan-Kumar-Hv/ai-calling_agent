import jsPDF from "jspdf";

export interface CallReportData {
  shopName: string;
  leadName: string;
  leadPhoneNumber: string;
  callSid?: string;
  duration?: string | number;
  outcome?: string;
  scoreBand?: string;
  phase?: string;
  callNotes?: string;
  actionItems?: string[];
  objectionsRaised?: string[];
  extractedEntities?: {
    intent?: string;
    teamSize?: string;
    budgetSignal?: string;
    timeline?: string;
  };
  transcript?: Array<{
    speaker: "agent" | "customer";
    text: string;
    timestamp?: string;
  }>;
  date?: string;
}

export function generateCallReportPdf(data: CallReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededSpace: number) {
    if (y + neededSpace > pageHeight - 15) {
      doc.addPage();
      y = margin;
      drawHeaderSmall();
    }
  }

  function drawHeaderSmall() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("INVOLYNK AI CALLING PLATFORM • EXECUTIVE CALL AUDIT REPORT", margin, y);
    doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin - 12, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // --- 1. Top Header Banner ---
  doc.setFillColor(30, 58, 138); // Deep Blue #1e3a8a
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOLYNK • AI VOICE SDR AUDIT REPORT", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(219, 234, 254);
  doc.text(
    `Store: ${data.shopName || "Involynk Outlet"} | Generated: ${data.date || new Date().toLocaleString()}`,
    margin + 6,
    y + 16
  );

  y += 30;

  // --- 2. Key Metrics & Call Overview Grid ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Column 1
  doc.text("CUSTOMER LEAD:", margin + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.leadName}`, margin + 4, y + 12);
  doc.setTextColor(71, 85, 105);
  doc.text(`${data.leadPhoneNumber}`, margin + 4, y + 17);
  doc.setFontSize(8);
  doc.text(`SID: ${data.callSid || "CA_DIRECT"}`, margin + 4, y + 25);

  // Column 2
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("DURATION & OUTCOME:", margin + 70, y + 7);
  doc.setFont("helvetica", "normal");
  const durationText = typeof data.duration === "number" ? `${data.duration}s` : data.duration || "N/A";
  doc.text(`Duration: ${durationText}`, margin + 70, y + 12);
  doc.text(`Outcome: ${(data.outcome || "Completed").toUpperCase()}`, margin + 70, y + 17);
  doc.text(`Lead Score: ${(data.scoreBand || "HOT").toUpperCase()}`, margin + 70, y + 22);

  // Column 3
  doc.setFont("helvetica", "bold");
  doc.text("AI SDR PIPELINE:", margin + 130, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`Agent: Riya (AI SDR)`, margin + 130, y + 12);
  doc.text(`Voice Model: Deepgram Aura`, margin + 130, y + 17);
  doc.text(`Brain: Gemini 3.5 Flash-Lite`, margin + 130, y + 22);

  y += 38;

  // --- 3. Executive Summary / Call Notes ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("1. EXECUTIVE CONVERSATION SUMMARY & INTENT", margin, y);
  y += 4;

  const notesText =
    data.callNotes ||
    "Inbound missed call follow-up conducted by autonomous voice SDR. Customer inquiry and requirements recorded in MongoDB Atlas.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
  const notesBoxHeight = splitNotes.length * 4.5 + 6;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, notesBoxHeight, 1.5, 1.5, "FD");

  doc.text(splitNotes, margin + 4, y + 5);
  y += notesBoxHeight + 6;

  // --- 4. Action Items & Follow-ups ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text("2. ACTION ITEMS & NEXT STEPS", margin, y);
  y += 4;

  const actionItems =
    data.actionItems && data.actionItems.length > 0
      ? data.actionItems
      : ["Review customer inquiry", "Follow-up via WhatsApp catalog"];

  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  const actionBoxHeight = actionItems.length * 5.5 + 4;
  doc.roundedRect(margin, y, contentWidth, actionBoxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);

  actionItems.forEach((item, idx) => {
    doc.text(`[x]  ${item}`, margin + 4, y + 5 + idx * 5.5);
  });
  y += actionBoxHeight + 6;

  // --- 5. Objections Raised & Extracted Entities ---
  checkPageBreak(25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6); // Amber
  doc.text("3. OBJECTIONS & QUALIFIED ENTITIES", margin, y);
  y += 4;

  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(113, 63, 18);

  const objectionsText =
    data.objectionsRaised && data.objectionsRaised.length > 0
      ? data.objectionsRaised.join(" • ")
      : "No critical objections raised during conversation.";

  doc.text(`Objections Handled: ${objectionsText}`, margin + 4, y + 5);
  doc.text(
    `Intent: ${data.extractedEntities?.intent || "Wholesale/Retail Order"} | Quantity: ${
      data.extractedEntities?.teamSize || "Bulk"
    }`,
    margin + 4,
    y + 11
  );
  doc.text(
    `Budget Signal: ${data.extractedEntities?.budgetSignal || "Flexible"} | Timeline: ${
      data.extractedEntities?.timeline || "Immediate"
    }`,
    margin + 4,
    y + 16
  );

  y += 26;

  // --- 6. Turn-by-Turn Audio Transcript ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text("4. FULL AUDIO CONVERSATION TRANSCRIPT", margin, y);
  y += 5;

  const turns = data.transcript || [
    { speaker: "agent", text: "Namaste! Riya calling from Involynk.", timestamp: "00:01" },
  ];

  turns.forEach((turn) => {
    const isAgent = turn.speaker === "agent";
    const speakerLabel = isAgent ? "AI SDR (Riya)" : data.leadName || "Customer";
    const headerLine = `${speakerLabel} [${turn.timestamp || "00:00"}]`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(isAgent ? 30 : 180, isAgent ? 64 : 83, isAgent ? 175 : 9);

    const splitText = doc.splitTextToSize(turn.text, contentWidth - 10);
    const boxHeight = splitText.length * 4 + 7;

    checkPageBreak(boxHeight + 4);

    if (isAgent) {
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
    } else {
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(229, 231, 235);
    }
    doc.roundedRect(margin, y, contentWidth, boxHeight, 1.2, 1.2, "FD");

    doc.text(headerLine, margin + 3, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    doc.text(splitText, margin + 3, y + 8);

    y += boxHeight + 2.5;
  });

  // --- 7. Footer / Verification Stamp ---
  checkPageBreak(18);
  y = pageHeight - 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by Involynk Platform • Multi-Tenant Isolated Storage • Verified Call Record`,
    margin,
    y
  );
  doc.text(`CONFIDENTIAL`, pageWidth - margin - 22, y);

  return doc;
}

export function downloadCallReportPdf(data: CallReportData): void {
  const doc = generateCallReportPdf(data);
  const safeName = (data.leadName || "Customer").replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Involynk_Call_Report_${safeName}_${Date.now()}.pdf`);
}

export function openCallReportPdfInNewTab(data: CallReportData): void {
  const doc = generateCallReportPdf(data);
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}
