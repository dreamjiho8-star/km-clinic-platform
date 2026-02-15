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

export function renderMarkdown(md: string) {
  if (!md) return null;
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: { text: string; ordered: boolean; num?: number }[] = [];
  let key = 0;

  function flushList() {
    if (listItems.length === 0) return;
    const isOrdered = listItems[0].ordered;
    const Tag = isOrdered ? "ol" : "ul";
    elements.push(
      <Tag
        key={key++}
        className={`space-y-2 mb-5 ${isOrdered ? "list-none" : "list-none"}`}
      >
        {listItems.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
            {isOrdered ? (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                {item.num ?? i + 1}
              </span>
            ) : (
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            )}
            <span dangerouslySetInnerHTML={{ __html: inlineFormat(item.text) }} />
          </li>
        ))}
      </Tag>
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // --- 수평선: 무시 (구분선 대신 섹션 간격으로 처리)
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      flushList();
      continue;
    }

    // ## 대제목
    if (trimmed.startsWith("## ")) {
      flushList();
      const title = trimmed.replace(/^##\s+/, "").replace(/\*\*/g, "");
      // — 기준으로 부제목 분리
      const parts = title.split(/\s*[—–]\s*/);
      elements.push(
        <div key={key++} className="mt-8 mb-4 first:mt-0">
          <h2 className="text-[15px] font-bold text-gray-900">
            {parts[0]}
          </h2>
          {parts[1] && (
            <p className="text-xs text-gray-400 mt-0.5">{parts[1]}</p>
          )}
          <div className="mt-2 h-px bg-gradient-to-r from-emerald-200 to-transparent" />
        </div>
      );
    }
    // ### 소제목
    else if (trimmed.startsWith("### ")) {
      flushList();
      const title = trimmed.replace(/^###\s+/, "").replace(/\*\*/g, "");
      elements.push(
        <h3 key={key++} className="text-sm font-semibold text-gray-800 mt-5 mb-2 flex items-center gap-1.5">
          <span className="w-1 h-4 rounded-full bg-emerald-400" />
          {title}
        </h3>
      );
    }
    // 비순서 리스트
    else if (/^[-*]\s/.test(trimmed)) {
      // 기존에 순서형 리스트가 있었으면 먼저 flush
      if (listItems.length > 0 && listItems[0].ordered) flushList();
      listItems.push({
        text: trimmed.replace(/^[-*]\s+/, ""),
        ordered: false,
      });
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
    }
    // 빈 줄
    else if (trimmed === "") {
      flushList();
    }
    // 일반 텍스트
    else {
      flushList();
      elements.push(
        <p
          key={key++}
          className="text-sm text-gray-700 leading-[1.8] mb-3"
          dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }}
        />
      );
    }
  }
  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}
