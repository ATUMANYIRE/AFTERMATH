"use client";

import React, { useMemo, useState } from "react";
import { ChevronsUpDown, FileCode } from "lucide-react";

type RowKind = "add" | "del" | "ctx" | "hunk";
interface Row {
  kind: RowKind;
  oldNo?: number;
  newNo?: number;
  text: string;
}
interface FileDiff {
  path: string;
  rows: Row[];
  additions: number;
  deletions: number;
}

const HUNK_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)$/;
const COLLAPSE_AFTER = 6; // collapse runs of unchanged lines longer than this
const KEEP_EDGE = 2; // context lines kept next to a change

export function parseUnifiedDiff(diff: string): FileDiff[] {
  const files: FileDiff[] = [];
  let cur: FileDiff | undefined;
  let oldNo = 0;
  let newNo = 0;

  const start = (path: string): FileDiff => {
    const f: FileDiff = { path, rows: [], additions: 0, deletions: 0 };
    files.push(f);
    return f;
  };

  for (const line of diff.replace(/\r\n/g, "\n").split("\n")) {
    if (line.startsWith("diff --git")) {
      cur = start(line.split(" b/")[1] ?? line);
      continue;
    }
    if (line.startsWith("--- ")) {
      if (!cur || cur.rows.length > 0) cur = start(line.slice(4).replace(/^a\//, ""));
      continue;
    }
    if (line.startsWith("+++ ")) {
      if (!cur) cur = start(line.slice(4).replace(/^b\//, ""));
      else cur.path = line.slice(4).replace(/^b\//, "");
      continue;
    }
    if (!cur) cur = start("patch");
    const f = cur;
    const hunk = HUNK_RE.exec(line);
    if (hunk) {
      oldNo = Number(hunk[1]);
      newNo = Number(hunk[2]);
      f.rows.push({ kind: "hunk", text: line });
    } else if (line.startsWith("+")) {
      f.rows.push({ kind: "add", newNo: newNo++, text: line.slice(1) });
      f.additions++;
    } else if (line.startsWith("-")) {
      f.rows.push({ kind: "del", oldNo: oldNo++, text: line.slice(1) });
      f.deletions++;
    } else if (line.startsWith("\\")) {
      continue; // "\ No newline at end of file"
    } else if (line !== "" || f.rows.length > 0) {
      f.rows.push({ kind: "ctx", oldNo: oldNo++, newNo: newNo++, text: line.startsWith(" ") ? line.slice(1) : line });
    }
  }
  return files.filter((f) => f.rows.length > 0);
}

const ROW_STYLE: Record<RowKind, string> = {
  add: "bg-[#22C55E]/[0.08]",
  del: "bg-[#FF6A13]/[0.08]",
  ctx: "",
  hunk: "bg-[#F4F5F7] text-[#747B87]",
};
const SIGN: Record<RowKind, string> = { add: "+", del: "-", ctx: " ", hunk: "" };

function FileBlock({ file, hash }: { file: FileDiff; hash?: string | null }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Group rows so long unchanged runs collapse into one expandable placeholder.
  const items = useMemo(() => {
    const out: Array<{ type: "row"; row: Row; idx: number } | { type: "fold"; from: number; to: number; runStart: number }> = [];
    const rows = file.rows;
    let i = 0;
    while (i < rows.length) {
      if (rows[i].kind !== "ctx") {
        out.push({ type: "row", row: rows[i], idx: i });
        i++;
        continue;
      }
      let j = i;
      while (j < rows.length && rows[j].kind === "ctx") j++;
      const len = j - i;
      const atStart = i === 0 || rows[i - 1].kind === "hunk";
      const atEnd = j === rows.length;
      const keepHead = atStart ? 0 : KEEP_EDGE;
      const keepTail = atEnd ? 0 : KEEP_EDGE;
      if (len > COLLAPSE_AFTER && !expanded.has(i)) {
        for (let k = i; k < i + keepHead; k++) out.push({ type: "row", row: rows[k], idx: k });
        out.push({ type: "fold", from: i + keepHead, to: j - keepTail, runStart: i });
        for (let k = j - keepTail; k < j; k++) out.push({ type: "row", row: rows[k], idx: k });
      } else {
        for (let k = i; k < j; k++) out.push({ type: "row", row: rows[k], idx: k });
      }
      i = j;
    }
    return out;
  }, [file.rows, expanded]);

  return (
    <section className="rounded-[13px] border border-[#ECEEF1] bg-white">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#F9FAFB] border-b border-[#ECEEF1] rounded-t-[13px]">
        <span className="flex items-center gap-2 min-w-0 text-[12px] text-[#191C24]">
          <FileCode className="w-4 h-4 shrink-0 text-[#747B87]" />
          <span className="font-mono truncate" title={file.path}>{file.path}</span>
        </span>
        <span className="flex items-center gap-3 text-[11px] text-[#747B87] whitespace-nowrap">
          <span className="text-[#191C24]">+{file.additions}</span>
          <span className="text-[#FF6A13]">−{file.deletions}</span>
          {hash && <span className="font-mono" title={hash}>sha256 {hash.substring(0, 10)}</span>}
        </span>
      </header>

      <div className="overflow-x-auto rounded-b-[13px]">
        <table className="w-full min-w-max border-collapse font-mono text-[12px] leading-5">
          <tbody>
            {items.map((it, n) => {
              if (it.type === "fold") {
                return (
                  <tr key={`f${n}`}>
                    <td colSpan={4} className="bg-[#F9FAFB] border-y border-[#ECEEF1]">
                      <button
                        type="button"
                        onClick={() => setExpanded((s) => new Set(s).add(it.runStart))}
                        className="w-full flex items-center gap-2 px-4 py-1 text-[11px] text-[#747B87] hover:text-[#191C24] font-sans"
                      >
                        <ChevronsUpDown className="w-3 h-3" />
                        Show {it.to - it.from} unchanged lines
                      </button>
                    </td>
                  </tr>
                );
              }
              const { row } = it;
              if (row.kind === "hunk") {
                return (
                  <tr key={`h${n}`} className={ROW_STYLE.hunk}>
                    <td colSpan={4} className="px-4 py-1 whitespace-pre">{row.text}</td>
                  </tr>
                );
              }
              return (
                <tr key={`r${n}`} className={ROW_STYLE[row.kind]}>
                  <td className="w-12 select-none text-right pr-2 pl-3 text-[#969CA6] align-top">{row.oldNo ?? ""}</td>
                  <td className="w-12 select-none text-right pr-2 text-[#969CA6] align-top border-r border-[#ECEEF1]">{row.newNo ?? ""}</td>
                  <td className={`w-5 select-none text-center align-top ${row.kind === "add" ? "text-[#191C24]" : row.kind === "del" ? "text-[#FF6A13]" : "text-[#C9CDD4]"}`}>{SIGN[row.kind]}</td>
                  <td className="pr-4 whitespace-pre text-[#191C24]">{row.text || " "}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DiffViewer({ diff, hash }: { diff?: string | null; hash?: string | null }) {
  const files = useMemo(() => (diff ? parseUnifiedDiff(diff) : []), [diff]);
  if (files.length === 0) {
    return <p className="typo-description text-[#747B87] py-8 text-center">No patch diff has been generated for this workflow yet.</p>;
  }
  return (
    <div className="space-y-4">
      {files.map((f, i) => (
        <FileBlock key={`${f.path}-${i}`} file={f} hash={hash} />
      ))}
    </div>
  );
}
