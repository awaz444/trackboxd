import React from "react";
import Link from "next/link";
import type { LikeActivityItem } from "@/lib/profile-service";

// One "X liked Y" line with the target user and item linked.
export default function LikeSentence({ like: l }: { like: LikeActivityItem }) {
  const renderSentenceWithEmbeddedLinks = () => {
    const sentence = l.sentence;
    const links = l.links;

    const parts = sentence.split(" ");
    const subject = parts[0]; // Always the profile owner
    const verb = parts[1]; // Always "liked"

    let remainingParts = parts.slice(2);
    let result = [];

    // Just render the subject as plain text, but keep it semibold
    result.push(
        <span
            key="subject"
            className="font-semibold text-[#5C5537]">
            {subject}
        </span>
    );
    result.push(" ");
    result.push(
        <span className="font-medium text-[#5C5537]/70">
            {verb}
        </span>
    );
    result.push(" ");

    // Check if there's a target user (contains apostrophe s)
    const targetIndex = remainingParts.findIndex(
        (part) => part.includes("'s")
    );
    if (targetIndex !== -1 && links.targetProfile) {
        const targetName = remainingParts[
            targetIndex
        ].replace("'s", "");

        // Add target user link with semibold
        result.push(
            <Link
                key="target"
                href={links.targetProfile}
                className="font-semibold text-[#5C5537] hover:underline">
                {targetName}
            </Link>
        );
        result.push("'s ");

        remainingParts = [
            ...remainingParts.slice(0, targetIndex),
            ...remainingParts.slice(
                targetIndex + 1
            ),
        ];
    }

    // Add the type (playlist, album, annotation, review, etc.) with medium weight
    if (remainingParts.length > 0) {
        result.push(
            <span className="font-medium text-[#5C5537]/70">
                {remainingParts[0]}
            </span>
        );
        result.push(" ");
        remainingParts = remainingParts.slice(1);
    }

    // Handle "on" or "of" prepositions with medium weight
    if (
        remainingParts.length > 0 &&
        (remainingParts[0] === "on" ||
            remainingParts[0] === "of")
    ) {
        result.push(
            <span className="font-medium text-[#5C5537]/70">
                {remainingParts[0]}
            </span>
        );
        result.push(" ");
        remainingParts = remainingParts.slice(1);
    }

    // The remaining parts are the item name - link them with semibold
    if (
        remainingParts.length > 0 &&
        links.itemHref
    ) {
        const itemText = remainingParts.join(" ");
        result.push(
            <Link
                key="item"
                href={links.itemHref}
                className="font-semibold text-[#5C5537] hover:underline">
                {itemText}
            </Link>
        );
    } else if (remainingParts.length > 0) {
        // If no item link, just add the text with medium weight
        result.push(
            <span className="font-medium text-[#5C5537]/70">
                {remainingParts.join(" ")}
            </span>
        );
    }

    return result;
  };

  return (
    <div className="text-sm text-[#5C5537]">
      {renderSentenceWithEmbeddedLinks()}
    </div>
  );
}
