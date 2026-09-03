import type { Metadata } from "next";
import { LegalDoc, LegalTodo } from "../legal-doc";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What onelystop collects, why, who it is shared with, and how to get it deleted.",
};

const UPDATED = "29 August 2026";

const SECTIONS = [
  ["who", "Who we are"],
  ["collect", "What we collect"],
  ["why", "Why we can use it"],
  ["answers", "Your answers and AI marking"],
  ["sharing", "Who else sees it"],
  ["age", "Under-18s"],
  ["keep", "How long we keep it"],
  ["rights", "Your rights"],
  ["contact", "Contact"],
];

export default function Page() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Privacy policy"
      intro="What we collect when you use onelystop, why we collect it, who else sees it, and how to get it back or deleted. Written to be read, not survived."
      meta={[
        `Last updated ${UPDATED}`,
        "Applies to onelystop and all its features",
      ]}
      sections={SECTIONS as [string, string][]}
    >
      <section id="who">
        <h2>
          <span>Who we are</span>
        </h2>
        <p>
          onelystop is a revision platform for GCSE and A-Level students in the
          UK. For UK GDPR purposes we are the data controller for the
          information described here.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> registered company name, company
          number, registered address, and ICO registration number.
        </LegalTodo>
      </section>

      <section id="collect">
        <h2>
          <span>What we collect</span>
        </h2>

        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details.</strong> Your email address, a password
            (stored hashed, never in plain text), and the name you choose to
            display.
          </li>
          <li>
            <strong>Study setup.</strong> Your exam board, subjects and exam
            dates, so questions and revision schedules match the paper you are
            actually sitting.
          </li>
          <li>
            <strong>Your work.</strong> Answers you type or photograph,
            including handwriting images uploaded for marking.
          </li>
        </ul>

        <h3>Information we generate</h3>
        <ul>
          <li>
            Marks, bands and the marking-point breakdown produced when your
            answer is assessed.
          </li>
          <li>
            Your working grade, practice history and spaced-repetition schedule.
          </li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li>
            Basic technical data needed to run the service: IP address, browser
            and device type, and pages requested.
          </li>
          <li>
            Essential cookies that keep you signed in. No advertising cookies,
            no third-party trackers.
          </li>
        </ul>
      </section>

      <section id="why">
        <h2>
          <span>Why we can use it</span>
        </h2>
        <p>Under UK GDPR we need a lawful basis for each use. Ours are:</p>
        <ul>
          <li>
            <strong>Performing our contract with you.</strong> Running your
            account, marking your answers, tracking your grade.
          </li>
          <li>
            <strong>Legitimate interests.</strong> Keeping the service secure,
            preventing abuse, fixing faults. This never extends to profiling you
            for advertising.
          </li>
          <li>
            <strong>Consent.</strong> For anything optional, such as product
            emails. You can withdraw it at any time without losing access.
          </li>
          <li>
            <strong>Legal obligation.</strong> Where we have to keep records,
            for example for tax.
          </li>
        </ul>
      </section>

      <section id="answers">
        <h2>
          <span>Your answers and AI marking</span>
        </h2>
        <p>
          Marking works by sending your answer, and the mark scheme it is
          assessed against, to a large language model. This is the part people
          most want a straight answer about, so:
        </p>
        <ul>
          <li>
            <strong>Your answers are not used to train any model.</strong> Not
            ours, not a third party&rsquo;s. We send them to be marked and we
            get a result back.
          </li>
          <li>
            <strong>They are not published or shown to other users.</strong>{" "}
            Your work is visible to you, and to staff only where you have asked
            us to review a mark.
          </li>
          <li>
            <strong>You can delete them.</strong> Deleting your account removes
            your answers and marks.
          </li>
        </ul>
        <LegalTodo>
          <strong>Before launch:</strong> confirm the zero-retention and
          no-training terms of the specific model providers used. The
          commitments above depend on them.
        </LegalTodo>
      </section>

      <section id="sharing">
        <h2>
          <span>Who else sees it</span>
        </h2>
        <p>
          We do not sell your data. We share it only with providers who help us
          run the service, under contract, and only as far as needed:
        </p>
        <ul>
          <li>
            <strong>Hosting and database.</strong> To store your account and
            your work.
          </li>
          <li>
            <strong>AI model providers.</strong> To mark answers and generate
            practice material.
          </li>
          <li>
            <strong>Payment processing.</strong> For paid plans. We never see or
            store your full card number.
          </li>
        </ul>
        <p>
          Some providers process data outside the UK. Where they do, transfers
          rely on UK adequacy regulations or International Data Transfer
          Agreements.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> name each provider, what it processes,
          and where.
        </LegalTodo>
      </section>

      <section id="age">
        <h2>
          <span>Under-18s</span>
        </h2>
        <p>
          onelystop is built for people sitting GCSEs and A-Levels, so most of
          our users are under 18 and many are under 16.
        </p>
        <p>
          In the UK a child can consent to online services from age 13. Below
          that we need consent from someone with parental responsibility. We
          design to the ICO&rsquo;s Age Appropriate Design Code: no advertising,
          no behavioural profiling, no nudges to share more than necessary, and
          privacy settings that default to the protective option.
        </p>
        <p>
          If you are a parent or guardian and want to see, correct or delete
          your child&rsquo;s data, contact us and we will act on it.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> set the minimum age, and decide how
          parental consent is obtained and verified below it.
        </LegalTodo>
      </section>

      <section id="keep">
        <h2>
          <span>How long we keep it</span>
        </h2>
        <ul>
          <li>
            <strong>While your account is open.</strong> Your answers, marks and
            schedule, so your history stays useful.
          </li>
          <li>
            <strong>After you delete your account.</strong> Your work is
            deleted. Backups are overwritten on their normal cycle.
          </li>
          <li>
            <strong>Records we must keep.</strong> Payment records, for as long
            as tax law requires.
          </li>
        </ul>
      </section>

      <section id="rights">
        <h2>
          <span>Your rights</span>
        </h2>
        <p>You can ask us to:</p>
        <ul>
          <li>give you a copy of your data, in a portable file;</li>
          <li>correct anything wrong;</li>
          <li>delete your data;</li>
          <li>restrict or object to how we use it;</li>
          <li>withdraw consent you previously gave.</li>
        </ul>
        <p>
          We will respond within one month. If you think we have handled your
          data badly you can complain to the Information Commissioner&rsquo;s
          Office at{" "}
          <a href="https://ico.org.uk" rel="noreferrer">
            ico.org.uk
          </a>
          . We would rather you told us first.
        </p>
      </section>

      <section id="contact">
        <h2>
          <span>Contact</span>
        </h2>
        <p>
          Questions about any of this, or a request about your data, come to us
          directly.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> a monitored privacy contact address,
          and a postal address for formal requests.
        </LegalTodo>
      </section>
    </LegalDoc>
  );
}
