/** Unread-dot rules shared by the menu and the chat. No imports, so client components can use it. */

/** Should a message that just arrived light the dot? Not if I sent it, and not if I'm looking at that conversation. */
export function flagsUnread(message: { sender_id: string; offer_id: string }, me: string, pathname: string): boolean {
  if (message.sender_id === me) return false;
  return pathname !== `/messages/${message.offer_id}`;
}
