/** The opt-in box for update emails. Unticked unless the person already said yes. */
export function EmailUpdatesField({ checked = false }: { checked?: boolean }) {
  return (
    <label className="consent-row">
      <input type="checkbox" name="emailUpdates" defaultChecked={checked} />
      <span>
        <strong>Email me important updates about Project Pickup</strong>
        <span className="muted"> (new features, an app launch). No spam, just the occasional update. Turn it off anytime in Edit profile.</span>
      </span>
    </label>
  );
}
