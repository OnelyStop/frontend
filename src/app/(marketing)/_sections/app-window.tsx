import "./app-window.css";

const NAV_MAIN = [
  ["Home", ""],
  ["Question bank", "1,284"],
  ["Past papers", "312"],
  ["Marker", "4"],
];
const NAV_REVISE = [
  ["PYQ mixes", ""],
  ["Flashcards", "18"],
  ["Progress", ""],
];

const ANSWER_ROWS = [
  {
    mp: "MP1",
    text: "Oxygen diffuses from the alveolus into the blood",
    hit: true,
  },
  { mp: "MP2", text: "The alveolus wall is one cell thick", hit: true },
  {
    mp: "MP3",
    text: "Blood flow maintains the concentration gradient",
    hit: false,
  },
  { mp: "MP4", text: "Many alveoli give a large surface area", hit: true },
];

const ACTIVITY = [
  ["Marked", "Q4(b) · Gas exchange", "4/6", true],
  ["Marked", "Q7(c) · Le Chatelier", "5/5", true],
  ["Marked", "Q2(a) · Rate equations", "3/4", true],
  ["Queued", "Q11 · Integration by parts", "—", false],
  ["Queued", "Q5(b) · Enzyme kinetics", "—", false],
];

export function AppWindow() {
  return (
    <div className="win" aria-hidden>
      <div className="win__chrome">
        <span className="win__dot" />
        <span className="win__dot" />
        <span className="win__dot" />
        <span className="win__crumb">Marker · OCR A H420 · Paper 1</span>
      </div>

      <div className="win__body">
        <aside className="win__rail">
          <div className="win__org">
            <span className="win__orgmark" />
            Aarav · Year 13
          </div>
          {NAV_MAIN.map(([label, count], i) => (
            <span
              key={label}
              className={i === 3 ? "win__nav is-on" : "win__nav"}
            >
              {label}
              {count ? <i>{count}</i> : null}
            </span>
          ))}
          <p className="win__group">Revise</p>
          {NAV_REVISE.map(([label, count]) => (
            <span key={label} className="win__nav">
              {label}
              {count ? <i>{count}</i> : null}
            </span>
          ))}
          <p className="win__group">Subjects</p>
          {["Biology", "Chemistry", "Maths"].map((s) => (
            <span key={s} className="win__nav">
              <em className={`win__swatch win__swatch--${s.toLowerCase()}`} />
              {s}
            </span>
          ))}
        </aside>

        <div className="win__main">
          <div className="win__qhead">
            <span className="win__tag">6 marks</span>
            <span className="win__qtext">
              Explain how the alveoli are adapted for efficient gas exchange.
            </span>
          </div>

          <div className="win__paper">
            <p>
              Oxygen diffuses from the alveolus into the blood because there is
              a higher concentration in the air sac. The alveolus wall is one
              cell thick, so the diffusion distance is short. There are many
              alveoli, which gives a large surface area for exchange.
            </p>
          </div>

          <p className="win__section">Marking points</p>
          <div className="win__mps">
            {ANSWER_ROWS.map((r) => (
              <div key={r.mp} className={r.hit ? "win__mp is-hit" : "win__mp"}>
                <span className="win__mpid">{r.mp}</span>
                <span className="win__mptext">{r.text}</span>
                <span className="win__mpstate">{r.hit ? "✓" : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="win__side">
          <p className="win__section">This answer</p>
          <div className="win__score">
            <span>4</span>
            <i>/ 6</i>
          </div>
          <div className="win__meta">
            <div>
              <span>Band</span>
              <b>5</b>
            </div>
            <div>
              <span>AO3</span>
              <b>6/8</b>
            </div>
            <div>
              <span>Time</span>
              <b>7m 12s</b>
            </div>
          </div>

          <p className="win__section">Working grade</p>
          <div className="win__track">
            {["D", "C", "B", "A", "A*"].map((g) => (
              <span key={g} className={g === "A" ? "is-now" : undefined}>
                {g}
              </span>
            ))}
          </div>

          <p className="win__section">Recent</p>
          <div className="win__activity">
            {ACTIVITY.map(([state, q, mark, done]) => (
              <div key={q as string}>
                <span className={done ? "win__pip is-done" : "win__pip"} />
                <span className="win__act">{q}</span>
                <span className={done ? "win__mark is-done" : "win__mark"}>
                  {mark}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
