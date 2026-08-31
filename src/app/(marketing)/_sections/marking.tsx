import "./marking.css";

type Clause = {
  pre?: string;
  hit?: string;
  slip?: string;
  post?: string;
  mp?: string;
  quote?: string;
  gloss?: string;
};

// One sentence per ruled line, the way handwriting actually breaks. Each line
// carries at most one decoration so the margin note beside it is unambiguous.
const SCRIPT: Clause[] = [
  {
    hit: "Oxygen diffuses from the alveolus into the blood",
    mp: "MP1",
    quote: "diffuses … into the blood",
  },
  {
    pre: "because ",
    slip: "the concentration is higher",
    post: " in the air sac.",
    gloss:
      "Close to MP5, but not it. A gradient that exists is not a gradient that is maintained.",
  },
  {
    pre: "The wall of the alveolus is ",
    hit: "only one cell thick",
    post: ", so the oxygen has less far to travel.",
    mp: "MP2",
    quote: "only one cell thick",
    gloss: "One mark, not two. The oblique offers alternative wordings.",
  },
  {
    pre: "There are ",
    hit: "millions of alveoli, so the surface area is huge",
    post: ".",
    mp: "MP3",
    quote: "the surface area is huge",
  },
  {
    pre: "Each one is ",
    hit: "wrapped in capillaries",
    post: " carrying the oxygen away.",
    mp: "MP4",
    quote: "wrapped in capillaries",
  },
  {
    slip: "This makes gas exchange efficient",
    post: ".",
    gloss: "No mark. This restates the stem rather than explaining it.",
  },
];

// Our wording, in the register a real scheme uses: one credit point per line,
// closed with a semicolon, worth (1), with the acceptance rule underneath.
const SCHEME = [
  {
    mp: "MP1",
    text: "oxygen moves from the alveolus into the blood ;",
    rule: ["ALLOW", "diffuses / passes into"],
    given: true,
  },
  {
    mp: "MP2",
    text: "wall (of alveolus) is one cell thick / short diffusion path ;",
    given: true,
  },
  {
    mp: "MP3",
    text: "many alveoli give a large surface area ;",
    given: true,
  },
  {
    mp: "MP4",
    text: "dense capillary network / good blood supply ;",
    rule: ["IGNORE", "‘lots of blood’ unqualified"],
    given: true,
  },
  {
    mp: "MP5",
    text: "ventilation and blood flow maintain the concentration gradient ;",
    rule: ["DO NOT ACCEPT", "a gradient that is only stated to exist"],
    given: false,
  },
  {
    mp: "MP6",
    text: "moist lining, so the gases dissolve before diffusing ;",
    given: false,
  },
];

function Tick() {
  return (
    <svg
      className="note__tick"
      viewBox="0 0 20 18"
      fill="none"
      aria-hidden="true"
    >
      <path pathLength={1} d="M2 9.2 6.8 14.6 18 1.8" />
    </svg>
  );
}

export function MarkingScene() {
  return (
    <section className="marking" id="marking">
      <div className="marking__inner">
        <header className="marking__head">
          <h2 className="display d2 trim">
            Every mark, traced to the line that earned it
          </h2>
          <p className="t-lede trim marking__lede">
            A real six-marker, marked. Everything in the margin is the
            examiner&rsquo;s ink. Each tick names the marking point it came from
            and points at the exact words that earned it.
          </p>
        </header>

        <div className="doc">
          <div className="script">
            <div className="script__head t-micro">
              <span className="script__paper">
                OCR A &middot; H420/01 &middot; Biology A
              </span>
              <span className="script__avail t-label" aria-hidden="true">
                [6]
              </span>
              <span className="marking-sr">6 marks available</span>
            </div>

            <div className="script__stem">
              <span className="script__no t-label" aria-hidden="true">
                4 (b)
              </span>
              <p className="d4 display script__q">
                Explain how the alveoli are adapted for efficient gas exchange.
              </p>
            </div>

            <div className="script__body">
              {SCRIPT.map((line, i) => (
                <ScriptLine key={i} clause={line} />
              ))}

              <div className="tally">
                <svg
                  className="tally__ring"
                  viewBox="0 0 100 56"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    pathLength={1}
                    d="M74 6C40-2 8 6 5 24 2 42 30 53 58 52 86 51 99 40 95 24 92 12 78 5 64 5"
                  />
                </svg>
                <span className="tally__n" aria-hidden="true">
                  4
                </span>
                <span className="tally__d t-body-sm" aria-hidden="true">
                  of 6
                </span>
                <span className="marking-sr">
                  Total for question 4 (b): 4 out of 6.
                </span>
              </div>
            </div>
          </div>

          <div className="scheme">
            <span className="scheme__tab t-micro">
              Mark scheme, held back until you&rsquo;ve answered
            </span>
            <p className="t-overline trim scheme__label">
              Credit points for 4 (b), in our wording
            </p>

            <ol className="scheme__list">
              {SCHEME.map((point) => (
                <li
                  key={point.mp}
                  data-mp={point.mp}
                  className={point.given ? "mp mp--given" : "mp"}
                >
                  <span className="mp__code t-micro">{point.mp}</span>
                  <span className="mp__text t-body-sm">{point.text}</span>
                  <span className="mp__award t-micro">
                    <span className="mp__worth">(1)</span>
                    <span className="mp__state">
                      {point.given ? "given" : "not given"}
                    </span>
                  </span>
                  {point.rule ? (
                    <span className="mp__rule t-micro">
                      <b>{point.rule[0]}</b> {point.rule[1]}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>

            <div className="scheme__foot">
              <div>
                <ol className="ledger">
                  {SCHEME.map((point) => (
                    <li
                      key={point.mp}
                      data-mp={point.mp}
                      data-state={point.given ? "given" : "open"}
                      className="ledger__cell"
                    >
                      <span className="ledger__bar" aria-hidden="true" />
                      <span className="ledger__lab t-micro">{point.mp}</span>
                    </li>
                  ))}
                </ol>
                <p className="ledger__caption t-micro">
                  One cell per marking point. Four filled, two left on the page.
                </p>
              </div>

              <p className="verdict t-body-sm">
                <strong>Four of six.</strong> Length was never the problem . MP5
                and MP6 are simply not written down. The band is decided by the
                points you hit, not by how much you wrote.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// A clause and its margin note are siblings of the same grid, so the note stays
// level with the line it annotates however the text reflows.
function ScriptLine({ clause }: { clause: Clause }) {
  const given = Boolean(clause.mp);

  return (
    <>
      <p className="clause" data-mp={clause.mp}>
        {clause.pre}
        {clause.hit ? <span className="hit">{clause.hit}</span> : null}
        {clause.slip ? <span className="slip">{clause.slip}</span> : null}
        {clause.post}
      </p>

      <div
        className={given ? "note note--given" : "note note--none"}
        data-mp={clause.mp}
      >
        {given ? (
          <>
            <Tick />
            <span className="note__code t-micro">{clause.mp}</span>
            <span className="note__quote t-body-sm">
              <span className="marking-sr">given for </span>
              &ldquo;{clause.quote}&rdquo;
            </span>
          </>
        ) : null}
        {clause.gloss ? (
          <span className="note__gloss t-micro">{clause.gloss}</span>
        ) : null}
      </div>
    </>
  );
}
