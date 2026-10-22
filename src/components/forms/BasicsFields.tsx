import { CLASS_YEARS, CLASS_YEAR_LABEL, MAJOR_GROUPS } from "@/lib/vocab";

type Props = {
  classYear: string;
  major: string;
  errors: Record<string, string | undefined>;
};

/** Class year + major dropdowns, shared by the welcome step and the profile editor. */
export function BasicsFields({ classYear, major, errors }: Props) {
  const invalid = (k: string) => (errors[k] ? true : undefined);
  const describedBy = (k: string) => (errors[k] ? `err-${k}` : undefined);
  return (
    <div className="field-grid">
      <div className="stack-sm">
        <label className="field">
          <span>Class year</span>
          <select name="classYear" required defaultValue={classYear} aria-invalid={invalid("classYear")} aria-describedby={describedBy("classYear")}>
            <option value="" disabled>
              Pick your year
            </option>
            {CLASS_YEARS.map((y) => (
              <option key={y} value={y}>
                {CLASS_YEAR_LABEL[y]}
              </option>
            ))}
          </select>
        </label>
        {errors.classYear ? (
          <p id="err-classYear" className="error-text">
            {errors.classYear}
          </p>
        ) : null}
      </div>
      <div className="stack-sm">
        <label className="field">
          <span>Major</span>
          <select name="major" required defaultValue={major} aria-invalid={invalid("major")} aria-describedby={describedBy("major")}>
            <option value="" disabled>
              Pick your major
            </option>
            {MAJOR_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.majors.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {errors.major ? (
          <p id="err-major" className="error-text">
            {errors.major}
          </p>
        ) : null}
      </div>
    </div>
  );
}
