import type { Metadata } from "next";
import "../legal.css";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The agreement between you and onelystop: who can use it, what the marking is and is not, and how billing works.",
};

const UPDATED = "29 August 2026";

const SECTIONS = [
  ["agreement", "The agreement"],
  ["who", "Who can use onelystop"],
  ["account", "Your account"],
  ["marking", "What the marking is"],
  ["use", "Acceptable use"],
  ["content", "Content and ownership"],
  ["billing", "Plans and billing"],
  ["availability", "Availability and changes"],
  ["liability", "Our liability"],
  ["ending", "Ending the agreement"],
  ["law", "Governing law"],
];

export default function Page() {
  return (
    <main className="legal">
      <header className="legal__head">
        <p className="t-overline trim">Legal</p>
        <h1 className="display d2 trim">Terms of service</h1>
        <p className="t-lede legal__intro">
          The agreement between you and onelystop. The parts that matter are
          what the marking actually is, and what happens to your money if you
          stop.
        </p>
        <div className="t-label legal__meta">
          <span>Last updated {UPDATED}</span>
          <span>Governed by the law of England and Wales</span>
        </div>
      </header>

      <div className="legal__body">
        <nav className="legal__toc t-body-sm">
          <p className="t-label legal__toc-title">Contents</p>
          {SECTIONS.map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="legal__content">
          <section id="agreement">
            <h2>
              <span>The agreement</span>
            </h2>
            <p>
              By creating an account you agree to these terms. If you do not
              agree, do not use the service.
            </p>
            <p>
              Where these terms conflict with the pledge published on our home
              page, <strong>the pledge wins</strong>. We do not get to promise
              one thing in large type and take it back in small type.
            </p>
          </section>

          <section id="who">
            <h2>
              <span>Who can use onelystop</span>
            </h2>
            <p>
              onelystop is for students preparing for GCSE and A-Level
              qualifications, and for teachers and schools supporting them.
            </p>
            <p>
              If you are under 18 you may use onelystop where your parent or
              guardian agrees to these terms on your behalf. If you are paying
              for a plan you must be 18 or over, or have permission from the
              person whose payment method is used.
            </p>
            <p className="legal__todo t-body-sm">
              <strong>Before launch:</strong> set the minimum age, and decide
              how parental agreement is captured at sign-up.
            </p>
          </section>

          <section id="account">
            <h2>
              <span>Your account</span>
            </h2>
            <ul>
              <li>Give accurate details and keep your password to yourself.</li>
              <li>
                You are responsible for what happens under your account. Tell us
                promptly if you think someone else has access.
              </li>
              <li>
                One account per person. Accounts are not to be shared or resold.
              </li>
            </ul>
          </section>

          <section id="marking">
            <h2>
              <span>What the marking is</span>
            </h2>
            <p>This is the part worth reading twice.</p>
            <ul>
              <li>
                <strong>The marking is a model reading a mark scheme.</strong>{" "}
                It is fast and it is specific, and it is not a teacher, an
                examiner, or your exam board.
              </li>
              <li>
                <strong>It is not an official result.</strong> Marks, bands and
                working grades produced by onelystop are practice feedback. They
                carry no weight with any awarding body and do not predict your
                actual result.
              </li>
              <li>
                <strong>It can be wrong.</strong> If a mark looks wrong, tell us
                and a person will look at it. That is how the marking improves.
              </li>
              <li>
                <strong>Do not rely on it alone.</strong> It is one input
                alongside your teachers and your own judgement.
              </li>
            </ul>
          </section>

          <section id="use">
            <h2>
              <span>Acceptable use</span>
            </h2>
            <p>Do not:</p>
            <ul>
              <li>
                scrape, bulk-download or resell our question bank, mark schemes
                or marking output;
              </li>
              <li>
                submit another person&rsquo;s work as your own where that
                breaches your school&rsquo;s or exam board&rsquo;s rules;
              </li>
              <li>
                use onelystop for any coursework or assessment where your exam
                board prohibits AI assistance. That is your responsibility to
                check;
              </li>
              <li>
                upload unlawful content, or anything containing another
                person&rsquo;s personal information;
              </li>
              <li>attempt to break, overload or reverse-engineer the service.</li>
            </ul>
          </section>

          <section id="content">
            <h2>
              <span>Content and ownership</span>
            </h2>

            <h3>Your work stays yours</h3>
            <p>
              You keep ownership of everything you write and upload. You grant
              us a limited licence to store and process it solely to provide the
              service to you: marking it, tracking your progress, scheduling
              your revision. That licence ends when you delete the content or
              your account.
            </p>
            <p>
              We do not use your work to train AI models, and we do not publish
              it.
            </p>

            <h3>Exam board material</h3>
            <p>
              onelystop is not affiliated with, endorsed by, or connected to
              OCR, AQA, Pearson Edexcel, WJEC or Cambridge International.
              Specification codes and paper references are used only to identify
              which syllabus a question belongs to. Past papers and mark schemes
              remain the copyright of their respective awarding bodies, and we
              host only what we are permitted to host.
            </p>

            <h3>Our material</h3>
            <p>
              The software, design and original content of onelystop belong to
              us. Using the service does not transfer any of it to you.
            </p>
          </section>

          <section id="billing">
            <h2>
              <span>Plans and billing</span>
            </h2>
            <ul>
              <li>
                <strong>The free plan is not a trial.</strong> It does not
                expire and does not require a card.
              </li>
              <li>
                <strong>Paid plans renew automatically</strong> at the interval
                you chose, until you cancel.
              </li>
              <li>
                <strong>You can cancel at any time.</strong> Cancelling stops
                the next renewal; you keep paid access until the end of the
                period you have already paid for.
              </li>
              <li>
                <strong>Statutory rights.</strong> As a UK consumer buying
                online you normally have 14 days to change your mind. Where you
                ask us to start immediately and use the service in that window,
                we may reduce a refund to reflect what you used.
              </li>
              <li>
                <strong>Price changes</strong> apply from your next renewal, and
                we will tell you before they take effect.
              </li>
            </ul>
            <p className="legal__todo t-body-sm">
              <strong>Before launch:</strong> confirm prices, billing intervals
              and the refund position against what the pricing page says.
            </p>
          </section>

          <section id="availability">
            <h2>
              <span>Availability and changes</span>
            </h2>
            <p>
              We aim to keep onelystop available but do not guarantee
              uninterrupted service. We may change features, and we may retire
              ones that are not working. Where a change materially reduces what
              you are paying for we will tell you, and you may cancel for a
              pro-rata refund.
            </p>
          </section>

          <section id="liability">
            <h2>
              <span>Our liability</span>
            </h2>
            <p>
              Nothing here limits our liability for death or personal injury
              caused by our negligence, for fraud, or for anything else that
              cannot be limited by law. Your statutory rights as a consumer are
              unaffected.
            </p>
            <p>
              Subject to that, we are not liable for indirect or consequential
              loss, and specifically not for examination results, grades or
              academic outcomes. onelystop is practice material; it is not a
              guarantee of performance.
            </p>
            <p className="legal__todo t-body-sm">
              <strong>Before launch:</strong> have the cap and exclusions above
              checked against the Consumer Rights Act 2015. Unfair terms in a
              consumer contract are unenforceable.
            </p>
          </section>

          <section id="ending">
            <h2>
              <span>Ending the agreement</span>
            </h2>
            <p>
              You can delete your account at any time from your settings. We may
              suspend or close an account that breaches these terms, and will
              explain why unless we are legally prevented from doing so.
            </p>
          </section>

          <section id="law">
            <h2>
              <span>Governing law</span>
            </h2>
            <p>
              These terms are governed by the law of England and Wales, and the
              courts of England and Wales have jurisdiction. If you live in
              Scotland or Northern Ireland you may bring proceedings in your own
              courts.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
