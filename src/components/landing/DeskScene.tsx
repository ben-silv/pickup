import { RoleTag } from "@/components/RoleTag";

const chips = [
  { role: "UI/UX design", scope: "3 screens", x: 120, y: 50, z: 70, delay: "0s" },
  { role: "Backend", scope: "~6 hrs", x: 300, y: 40, z: 110, delay: "-2.2s" },
  { role: "Pitch deck", scope: "2 hrs", x: 330, y: 200, z: 60, delay: "-4.1s" },
];

/**
 * Stand-in for the Tisch photo: a table on the Hill in CSS 3D (open laptop, sketchbook, role tags floating above).
 * No JavaScript; the table sways slowly and the tags bob, transforms only. Swap for a real photo when there is one.
 */
export function DeskScene() {
  return (
    <div className="desk-scene" aria-hidden="true">
      <div className="desk-shadow" />
      <div className="desk-stage">
        <div className="desk-top">
          <span className="desk-edge desk-edge-front" />
          <span className="desk-edge desk-edge-side" />

          <div className="laptop">
            <div className="laptop-base">
              <span className="laptop-keys" />
              <span className="laptop-pad" />
            </div>
            <div className="laptop-lid">
              <div className="laptop-screen">
                <span className="screen-title" />
                <span className="screen-line" />
                <span className="screen-line short" />
                <span className="screen-pill" />
              </div>
            </div>
          </div>

          <div className="sketchbook">
            <span className="sketch-frame" />
            <span className="sketch-frame small" />
            <span className="pencil" />
          </div>

          {chips.map((c) => (
            <div key={c.role} className="desk-float" style={{ transform: `translate3d(${c.x}px, ${c.y}px, ${c.z}px)` }}>
              <div className="desk-bob" style={{ animationDelay: c.delay }}>
                <div className="desk-face">
                  <div className="desk-chip">
                    <RoleTag role={c.role} scope={c.scope} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
