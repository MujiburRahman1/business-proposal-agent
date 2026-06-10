import { NextRequest, NextResponse } from "next/server";

const ANVIL_GENERATE_PDF_URL =
  "https://app.useanvil.com/api/v1/generate-pdf";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function proposalToHtml(proposal: string, title: string): string {
  const paragraphs = proposal
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<h1>${escapeHtml(title)}</h1>\n${paragraphs}`;
}

const PROPOSAL_CSS = `
  body {
    font-family: 'Noto Sans', sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
  }
  h1 {
    font-size: 22pt;
    color: #047857;
    border-bottom: 2px solid #047857;
    padding-bottom: 8px;
    margin-bottom: 24px;
  }
  p {
    margin: 0 0 14px 0;
  }
`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANVIL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "ANVIL_API_KEY is not configured. Add it to frontend/.env.local",
      },
      { status: 503 },
    );
  }

  let body: { proposal?: string; title?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const proposal = body.proposal?.trim();
  if (!proposal || proposal.length < 100) {
    return NextResponse.json(
      { error: "Proposal text is required to generate a PDF" },
      { status: 400 },
    );
  }

  const title = body.title?.trim() || "DealPilot Business Proposal";
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  try {
    const response = await fetch(ANVIL_GENERATE_PDF_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/pdf",
      },
      body: JSON.stringify({
        type: "html",
        title,
        data: {
          html: proposalToHtml(proposal, title),
          css: PROPOSAL_CSS,
        },
        page: {
          width: "8.5in",
          height: "11in",
          margin: "0.75in",
          pageCount: "bottomCenter",
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: detail || "Anvil PDF generation failed" },
        { status: response.status },
      );
    }

    const pdfBytes = await response.arrayBuffer();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${title.replace(/[^a-z0-9-_ ]/gi, "").trim() || "proposal"}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Anvil PDF generation failed";

    return NextResponse.json({ error: message }, { status: 503 });
  }
}
