import "server-only";

import {
  createMetaAppSecretProof,
  getFacebookGraphApiEnv,
  hasFacebookPublishingAccessToken,
  sanitizeFacebookResponsePayload,
} from "@/lib/facebook/server";

export type FacebookGraphComment = {
  authorFacebookId: string | null;
  authorName: string;
  commentId: string;
  createdTime: string | null;
  message: string;
  parentCommentId: string | null;
};

type GraphCommentFrom = {
  id?: string;
  name?: string;
};

type GraphCommentNode = {
  created_time?: string;
  from?: GraphCommentFrom;
  id?: string;
  message?: string;
  parent?: {
    id?: string;
  };
};

type GraphCommentsResponse = {
  data?: GraphCommentNode[];
  error?: {
    message?: string;
  };
  paging?: {
    next?: string;
  };
};

const COMMENT_FIELDS = "id,message,created_time,from{id,name},parent{id}";
const MAX_COMMENT_PAGES = 5;

function getStringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toIsoDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function mapGraphCommentNode(node: GraphCommentNode): FacebookGraphComment | null {
  const commentId = getStringValue(node.id);
  const message = getStringValue(node.message)?.trim() ?? "";
  const authorFacebookId = getStringValue(node.from?.id);
  const authorName = getStringValue(node.from?.name);

  if (!commentId || !message || !authorName) {
    return null;
  }

  return {
    authorFacebookId,
    authorName,
    commentId,
    createdTime: toIsoDateTime(getStringValue(node.created_time)),
    message,
    parentCommentId: getStringValue(node.parent?.id),
  };
}

async function fetchGraphJson(url: string): Promise<GraphCommentsResponse> {
  const response = await fetch(url, {
    method: "GET",
    next: {
      revalidate: 0,
    },
  });
  const responseText = await response.text();

  let payload: GraphCommentsResponse;

  try {
    payload = JSON.parse(responseText) as GraphCommentsResponse;
  } catch {
    throw new Error("facebook_graph_invalid_json");
  }

  if (!response.ok || payload.error?.message) {
    throw new Error(payload.error?.message ?? "facebook_graph_request_failed");
  }

  return payload;
}

export function hasFacebookCommentSyncAccess(): boolean {
  return hasFacebookPublishingAccessToken() && Boolean(process.env.META_APP_SECRET?.trim());
}

export async function fetchFacebookPostComments(input: {
  pageId: string;
  postId: string;
}): Promise<FacebookGraphComment[]> {
  if (!hasFacebookCommentSyncAccess()) {
    throw new Error("facebook_comment_sync_not_configured");
  }

  const env = getFacebookGraphApiEnv();
  const appsecretProof = createMetaAppSecretProof(env.META_PAGE_ACCESS_TOKEN);
  const comments: FacebookGraphComment[] = [];
  let nextUrl: string | null =
    `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${input.postId}/comments?` +
    new URLSearchParams({
      access_token: env.META_PAGE_ACCESS_TOKEN,
      appsecret_proof: appsecretProof,
      fields: COMMENT_FIELDS,
      filter: "stream",
      limit: "50",
    }).toString();
  let pageCount = 0;

  while (nextUrl && pageCount < MAX_COMMENT_PAGES) {
    const payload = await fetchGraphJson(nextUrl);

    for (const node of payload.data ?? []) {
      const mapped = mapGraphCommentNode(node);

      if (!mapped) {
        continue;
      }

      if (mapped.authorFacebookId && mapped.authorFacebookId === input.pageId) {
        continue;
      }

      comments.push(mapped);
    }

    nextUrl = payload.paging?.next ?? null;
    pageCount += 1;
  }

  return comments;
}

export function sanitizeFacebookGraphCommentsForLog(
  comments: FacebookGraphComment[],
): unknown {
  return sanitizeFacebookResponsePayload(
    comments.map((comment) => ({
      author_facebook_id: comment.authorFacebookId,
      author_name: comment.authorName,
      comment_id: comment.commentId,
      created_time: comment.createdTime,
      message: comment.message,
    })),
  );
}
