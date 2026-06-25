"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { FacebookPublicationStatusBadge } from "@/features/facebook/components/facebook-publication-status-badge";
import type { FacebookPublicationRecordWithRelations } from "@/features/facebook/types";
import {
  buildFacebookPostUrl,
  getFacebookPublishTypeLabel,
} from "@/features/facebook/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatVehicleDateTime } from "@/features/vehicles/utils";

type FacebookPublishHistoryListProps = {
  publications: FacebookPublicationRecordWithRelations[];
};

function getCaptionPreview(caption: string): string {
  const firstLine = caption.split("\n").find((line) => line.trim().length > 0) ?? caption;

  if (firstLine.length <= 120) {
    return firstLine;
  }

  return `${firstLine.slice(0, 117)}...`;
}

export function FacebookPublishHistoryList({
  publications,
}: FacebookPublishHistoryListProps): ReactElement {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (publications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-[#fafaf9] px-4 py-8 text-center">
        <p className="text-sm font-semibold text-foreground">
          No Facebook Page publish history yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Successful and failed publish attempts will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {publications.map((publication) => {
        const isExpanded = expandedIds.has(publication.id);
        const postUrl = buildFacebookPostUrl({
          facebookPhotoId: publication.facebook_photo_id,
          facebookPostId: publication.facebook_post_id,
        });

        return (
          <div
            key={publication.id}
            className="rounded-2xl border border-border bg-[#fafaf9] px-4 py-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {getFacebookPublishTypeLabel(publication.publish_type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {publication.published_at
                    ? `Published ${formatVehicleDateTime(publication.published_at)}`
                    : `Created ${formatVehicleDateTime(publication.created_at)}`}
                  {publication.publishedByName
                    ? ` · ${publication.publishedByName}`
                    : ""}
                </p>
                <p className="truncate text-sm text-foreground">
                  {getCaptionPreview(publication.caption)}
                </p>
              </div>
              <FacebookPublicationStatusBadge status={publication.status} />
            </div>

            {publication.error_message ? (
              <p className="mt-2 text-xs text-red-700">{publication.error_message}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setExpandedIds((current) => {
                    const next = new Set(current);

                    if (next.has(publication.id)) {
                      next.delete(publication.id);
                    } else {
                      next.add(publication.id);
                    }

                    return next;
                  });
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                {isExpanded ? "Hide caption" : "View caption"}
              </Button>
              {postUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={postUrl} rel="noreferrer" target="_blank">
                    Open post
                  </a>
                </Button>
              ) : null}
            </div>

            {isExpanded ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {publication.caption}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="pt-1">
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/facebook/published-posts">View all published posts</Link>
        </Button>
      </div>
    </div>
  );
}
