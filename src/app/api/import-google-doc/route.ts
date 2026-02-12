import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doc_url, provider_token } = await request.json();

    if (!doc_url) {
      return NextResponse.json(
        { error: "Missing Google Docs URL" },
        { status: 400 }
      );
    }

    if (!provider_token) {
      return NextResponse.json(
        {
          error:
            "Google account not connected. Please link your Google account first.",
        },
        { status: 403 }
      );
    }

    const match = doc_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid Google Docs URL. Please paste a valid Google Docs link." },
        { status: 400 }
      );
    }
    const docId = match[1];

    const docRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${docId}`,
      { headers: { Authorization: `Bearer ${provider_token}` } }
    );

    if (!docRes.ok) {
      const err = await docRes.json().catch(() => ({}));
      if (docRes.status === 401 || docRes.status === 403) {
        return NextResponse.json(
          {
            error:
              "Google token expired or insufficient permissions. Please reconnect your Google account.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          error: `Failed to fetch document: ${err.error?.message || docRes.statusText}`,
        },
        { status: docRes.status }
      );
    }

    const doc = await docRes.json();

    let essayText = "";
    if (doc.body?.content) {
      for (const element of doc.body.content) {
        if (element.paragraph?.elements) {
          for (const el of element.paragraph.elements) {
            if (el.textRun?.content) {
              essayText += el.textRun.content;
            }
          }
        }
      }
    }

    const commentsRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/comments?fields=comments(content,quotedFileContent,resolved)&includeDeleted=false`,
      { headers: { Authorization: `Bearer ${provider_token}` } }
    );

    let comments: Array<{ excerpt: string; comment: string }> = [];

    if (commentsRes.ok) {
      const commentsData = await commentsRes.json();
      if (commentsData.comments) {
        comments = commentsData.comments
          .filter(
            (c: { resolved?: boolean }) => !c.resolved
          )
          .map(
            (c: {
              content?: string;
              quotedFileContent?: { value?: string };
            }) => ({
              excerpt: c.quotedFileContent?.value || "",
              comment: c.content || "",
            })
          )
          .filter((c: { comment: string }) => c.comment.trim());
      }
    }

    return NextResponse.json({
      essay_text: essayText.trim(),
      comments,
      doc_title: doc.title || "Untitled Document",
    });
  } catch (err) {
    console.error("Google Doc import error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to import document",
      },
      { status: 500 }
    );
  }
}
