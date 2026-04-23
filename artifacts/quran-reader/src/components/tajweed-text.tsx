import React, { useMemo } from "react";
// @ts-expect-error — no types for this package
import Tajweed from "tajweed-highlight";

interface TajweedTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
  as?: "p" | "span" | "div";
  "data-testid"?: string;
}

export function TajweedText({
  text,
  style,
  className = "",
  as: Tag = "p",
  "data-testid": testId,
}: TajweedTextProps) {
  const html = useMemo(() => Tajweed.parse(text) as string, [text]);

  const baseClass =
    Tag === "p" || Tag === "div"
      ? `tajweed-text font-arabic text-right leading-loose ${className}`
      : `tajweed-text font-arabic ${className}`;

  return (
    <Tag
      className={baseClass}
      style={style}
      dir="rtl"
      data-testid={testId}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
