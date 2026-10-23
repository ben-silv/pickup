"use client";

import { startTransition, useActionState, useId, type FormEvent } from "react";
import { blockPerson, reportConversation, unblockPerson } from "../actions";
import { idleState } from "@/lib/action-state";
import { REPORT_REASONS, REPORT_REASON_LABEL } from "@/lib/vocab";

type Props = { offerId: string; otherFirst: string; blockedByMe: boolean };

/**
 * "Report or block" in a conversation's header. Plain forms underneath, so they work before JavaScript loads.
 * Blocking is one deliberate button inside this panel (no pop-up confirm), with what it does spelled out next to it.
 */
export function SafetyMenu({ offerId, otherFirst, blockedByMe }: Props) {
  const [report, reportAction, reporting] = useActionState(reportConversation, idleState);
  const [block, blockAction, blocking] = useActionState(blockedByMe ? unblockPerson : blockPerson, idleState);
  const id = useId();

  // Submit manually so React 19 doesn't clear the report details when there's an error.
  const onReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (reporting) return;
    const data = new FormData(e.currentTarget);
    startTransition(() => reportAction(data));
  };

  return (
    <details className="reveal safety-menu" open={report.status !== "idle" || block.status === "error" || undefined}>
      <summary className="btn btn-sm btn-outline">
        <span className="when-closed">Report or block</span>
        <span className="when-open">Close</span>
      </summary>
      <div className="safety-panel">
        {report.status === "done" ? (
          <p role="status" className="small">
            {report.message}
          </p>
        ) : (
          <form action={reportAction} onSubmit={onReport} noValidate className="stack-sm">
            <input type="hidden" name="offerId" value={offerId} />
            <label className="field">
              <span>Report {otherFirst}</span>
              <select name="reason" defaultValue="" required aria-invalid={report.status === "error" || undefined}>
                <option value="" disabled>
                  What&apos;s wrong?
                </option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {REPORT_REASON_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Details (optional)</span>
              <textarea name="details" rows={2} maxLength={500} placeholder="What happened? Only the Project Pickup team sees this." />
            </label>
            {report.status === "error" ? (
              <p id={`${id}-report-error`} role="alert" className="error-text">
                {report.message}
              </p>
            ) : null}
            <button type="submit" className="btn btn-sm glass-dark" disabled={reporting}>
              {reporting ? "Sending…" : "Send report"}
            </button>
          </form>
        )}

        <form action={blockAction} className="stack-sm safety-block">
          <input type="hidden" name="offerId" value={offerId} />
          <p className="small muted">
            {blockedByMe
              ? `You blocked ${otherFirst}. Unblocking lets you both message and offer on each other's projects again.`
              : `Blocking closes this conversation and any pending offers between you, and stops ${otherFirst} from offering on your projects. They aren't told.`}
          </p>
          {block.status === "error" ? (
            <p role="alert" className="error-text">
              {block.message}
            </p>
          ) : null}
          <button type="submit" className="btn btn-sm btn-outline" disabled={blocking}>
            {blocking ? "Saving…" : blockedByMe ? `Unblock ${otherFirst}` : `Block ${otherFirst}`}
          </button>
        </form>
      </div>
    </details>
  );
}
