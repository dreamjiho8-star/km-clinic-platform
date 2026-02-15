"use client";
import React from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineFormat(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>'
    )
    .replace(/\*(.+?)\*/g, '<em class="text-gray-600">$1</em>')
    .replace(
      /`(.+?)`/g,
      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-emerald-700">$1</code>'
    );
}

/**
 * 간격 규칙:
 * - ## 대제목: 위 32px (pt-8), 아래 16px (pb-4)  → 엔터 2번 느낌
 * - ### 소제목: 위 24px (pt-6), 아래 8px (pb-2)   → 엔터 1.5번 느낌
 * - 본문/리스트: 위 0, 아래 12px (pb-3)            → 엔터 1번 느낌
 * - 첫 번째 요소는 위 간격 없음
 */
export function renderMarkdown(md: string) {
  if (!md) return null;
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered: boolean; num?: number }[] = [];
  let key = 0;
  let isFirst = true;

  function flushList() {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const Tag = isOrdered ? "ol" : "ul";
    elements.push(
      <Tag key={key++} className="space-y-2.5 pb-3 pl-1">
        {listItems.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-sm text-gray-700 leading-[1.8]"
          >
            {isOrdered ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                {item.num ?? i + 1}
              </span>
            ) : (
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            )}
            <span
              className="flex-1"
              dangerouslySetInnerHTML={{ __html: inlineFormat(item.text) }}
            />
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // --- 수평선: 무시
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushList();
      continue;
    }

    // ## 대제목 — 엔터 2번
    if (trimmed.startsWith("## ")) {
      flushList();
      const title = trimmed.replace(/^##\s+/, "").replace(/\*\*/g, "");
      const parts = title.split(/\s*[—–]\s*/);
      elements.push(
        <div key={key++} className={isFirst ? "pb-4" : "pt-8 pb-4"}>
          <h2 className="text-[15px] font-bold text-gray-900">{parts[0]}</h2>
          {parts[1] && (
            <p className="text-xs text-gray-400 mt-1">{parts[1]}</p>
          )}
          <div className="mt-2.5 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
        </div>
      );
      isFirst = false;
    }
    // ### 소제목 — 엔터 1.5번
    else if (trimmed.startsWith("### ")) {
      flushList();
      const title = trimmed.replace(/^###\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <h3
          key={key++}
          className={`text-sm font-semibold text-gray-800 flex items-center gap-1.5 ${isFirst ? "pb-2" : "pt-6 pb-2"}`}
        >
          <span className="w-1 h-4 rounded-full bg-emerald-400" />
          {title}
        </h3>
      );
      isFirst = false;
    }
    // 비순서 리스트
    else if (/^[-*]\s/.test(trimmed)) {
      if (listItems.length > 0 && listItems[0].ordered) flushList();
      listItems.push({
        text: trimmed.replace(/^[-*]\s+/, ""),
        ordered: false,
      });
      isFirst = false;
    }
    // 순서 리스트
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listItems.length > 0 && !listItems[0].ordered) flushList();
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      listItems.push({
        text: match ? match[2] : trimmed,
        ordered: true,
        num: match ? parseInt(match[1]) : undefined,
      });
      isFirst = false;
    }
    // 빈 줄
    else if (trimmed === "") {
      flushList();
    }
    // 일반 텍스트 — 엔터 1번
    else {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-sm text-gray-700 leading-[1.8] pb-3"
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      );
      isFirst = false;
    }
  }
  flushList();
  return <div>{elements}</div>;
}
