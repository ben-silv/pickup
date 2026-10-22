/** Signature element: light-blue role pill + hours. Use it wherever a role appears. */
export function RoleTag({ role, scope }: { role: string; scope: string }) {
  return (
    <div className="role-tag">
      <span className="tag">{role}</span>
      <span className="scope">{scope}</span>
    </div>
  );
}
