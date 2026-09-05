import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/config/site";
import { LegalDoc, LegalTodo } from "../legal-doc";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What onelystop collects, why, who it is shared with, and how to get it corrected or deleted, under the Digital Personal Data Protection Act, 2023.",
};

const UPDATED = "5 September 2026";

const SECTIONS = [
  ["who", "Who we are"],
  ["collect", "What we collect"],
  ["why", "Why we use it"],
  ["answers", "Your answers and AI marking"],
  ["sharing", "Who else sees it"],
  ["age", "Age"],
  ["keep", "How long we keep it"],
  ["rights", "Your rights"],
  ["contact", "Grievances and contact"],
];

export default function Page() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Privacy policy"
      intro="What we collect when you use onelystop, why we collect it, who else sees it, and how to get it corrected or deleted. Written to be read, not survived."
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
          onelystop is a practice platform for people preparing for Indian bank
          recruitment exams: IBPS PO, IBPS Clerk, SBI PO, SBI Clerk and RBI
          Grade B. Under the Digital Personal Data Protection Act, 2023 we are
          the data fiduciary for the information described here. We decide what
          is collected and why, and we answer for it.
        </p>
        <p>
          onelystop is not affiliated with, endorsed by, or connected to IBPS,
          SBI, RBI or any other recruiting body. Nothing you do here reaches
          them.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> registered entity name, CIN and
          registered office address.
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
            display. If you sign in with Google, the name and email Google
            shares with us.
          </li>
          <li>
            <strong>Exam setup.</strong> Your target exam, attempt year, and
            your coaching institute if you give one, so mocks, cutoffs and the
            current-affairs feed match the exam you are actually sitting.
          </li>
          <li>
            <strong>Your work.</strong> Answers in mocks and drills, descriptive
            answers you submit for marking, private notes, doubts you post to
            the community, and questions you ask Ask Onely.
          </li>
          <li>
            <strong>Payment references.</strong> Your plan, and the Razorpay
            subscription and payment ids that tie a charge to your account.
            Card, UPI and net-banking details go to Razorpay directly; we never
            see or store them.
          </li>
        </ul>

        <h3>Information we generate</h3>
        <ul>
          <li>
            Scores and sectional bands from your mocks and drills, and the
            marking of your descriptive answers.
          </li>
          <li>Your attempt map, progress and flashcard schedule.</li>
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
          <span>Why we use it</span>
        </h2>
        <p>
          The DPDP Act lets us process your data with your consent, and for a
          few uses it allows without asking. Ours are:
        </p>
        <ul>
          <li>
            <strong>Consent.</strong> When you create an account you consent to
            us processing your data for the service you asked for: running your
            account, marking your answers, tracking your progress. You withdraw
            that consent by closing your account.
          </li>
          <li>
            <strong>Product emails.</strong> Only if you opt in. Opting out
            never costs you access.
          </li>
          <li>
            <strong>Security and fraud prevention.</strong> Keeping the service
            up, keeping accounts safe, stopping abuse.
          </li>
          <li>
            <strong>Legal obligations.</strong> Records we have to keep, for
            example tax records for payments.
          </li>
        </ul>
        <p>
          None of this extends to profiling you for advertising. We do not do
          that.
        </p>
      </section>

      <section id="answers">
        <h2>
          <span>Your answers and AI marking</span>
        </h2>
        <p>
          Descriptive marking works by sending your answer, and the rubric it is
          marked against, to a large language model. Ask Onely works the same
          way with the passage and your question. This is the part people most
          want a straight answer about, so:
        </p>
        <ul>
          <li>
            <strong>Your answers are not used to train any model.</strong> Not
            ours, not a provider&rsquo;s. We send them to be marked and we get a
            result back.
          </li>
          <li>
            <strong>Marks are practice feedback.</strong> Scores, bands and
            cutoffs come from a model reading a rubric. They have no standing
            with IBPS, SBI, RBI or any recruiting body, and they do not predict
            your result. The cutoffs shown are indicative, taken from published
            cutoffs of earlier years.
          </li>
          <li>
            <strong>The questions are ours.</strong> Mocks are modelled on each
            exam&rsquo;s published pattern, not copies of actual papers.
            Current-affairs questions are written from public reporting and name
            their source.
          </li>
          <li>
            <strong>Private work stays private.</strong> Mock answers,
            descriptive answers, notes and Ask Onely questions are visible to
            you, and to staff only where you have asked us to review a mark.
            Doubts you post to the community are different: other signed-in
            members see them under your display name.
          </li>
          <li>
            <strong>You can delete them.</strong> Closing your account removes
            your answers and marks.
          </li>
        </ul>
        <LegalTodo>
          <strong>Before launch:</strong> confirm the no-training and
          zero-retention terms of each model provider. The commitments above
          depend on them.
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
            <strong>Vercel.</strong> Hosts and runs the site. Sees the technical
            data any web server sees.
          </li>
          <li>
            <strong>Supabase.</strong> Holds the database and handles sign-in,
            including Google sign-in. Stores your account and your work.
          </li>
          <li>
            <strong>Razorpay.</strong> Takes payment. Processes your card, UPI
            or net-banking details directly; we receive only the subscription
            and payment ids.
          </li>
          <li>
            <strong>Google Gemini.</strong> Generates current-affairs questions
            from public news reporting. It never receives user data.
          </li>
          <li>
            <strong>OpenRouter.</strong> Routes Ask Onely questions and
            descriptive answers to a large language model. It sees the text you
            submit, and nothing else about you.
          </li>
        </ul>
        <p>
          Some of these providers store or process data outside India. The DPDP
          Act permits that, except to countries the Central Government restricts
          by notification, and we will not transfer your data to any such
          country.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> where each provider stores data
          (regions).
        </LegalTodo>
      </section>

      <section id="age">
        <h2>
          <span>Age</span>
        </h2>
        <p>
          You must be 18 or over to use onelystop. The exams themselves require
          candidates to be at least 20, so this should rarely come up, but it is
          a hard line.
        </p>
        <p>
          The DPDP Act requires verifiable parental consent before a
          child&rsquo;s data can be processed. We do not collect it, so anyone
          under 18 must not create an account. If we find that a child has, we
          delete the account and its data. If you are a parent or guardian and
          believe your child has an account, tell us and we will act on it.
        </p>
      </section>

      <section id="keep">
        <h2>
          <span>How long we keep it</span>
        </h2>
        <ul>
          <li>
            <strong>While your account is open.</strong> Your answers, scores,
            notes and schedule, so your history stays useful.
          </li>
          <li>
            <strong>After your account is closed.</strong> Your work is deleted,
            including doubts you posted to the community. Backups are
            overwritten on their normal cycle.
          </li>
          <li>
            <strong>Records we must keep.</strong> Payment records, for as long
            as tax law requires.
          </li>
          <li>
            <strong>Closing your account.</strong> Write to us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the
            email address on your account. There is no self-serve delete yet; a
            person does it, and confirms when it is done.
          </li>
        </ul>
      </section>

      <section id="rights">
        <h2>
          <span>Your rights</span>
        </h2>
        <p>Under the DPDP Act you can ask us to:</p>
        <ul>
          <li>
            give you a summary of the personal data we hold about you and how we
            have used it;
          </li>
          <li>correct, complete or update anything wrong or missing;</li>
          <li>erase your data, unless a law requires us to keep it;</li>
          <li>hear and resolve a grievance about how we have handled it;</li>
          <li>
            act on the instructions of a person you nominate to exercise these
            rights if you die or are unable to.
          </li>
        </ul>
        <p>
          Write to us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{" "}
          from the email address on your account, so we know it is you. We will
          respond within 30 days. If we have not put it right, you can complain
          to the Data Protection Board of India. We would rather you told us
          first.
        </p>
      </section>

      <section id="contact">
        <h2>
          <span>Grievances and contact</span>
        </h2>
        <p>
          Questions about any of this, or a request about your data, come to us
          directly at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          Under the Information Technology (Intermediary Guidelines and Digital
          Media Ethics Code) Rules, 2021 we have a Grievance Officer. Complaints
          are acknowledged within 24 hours and resolved within 15 days of
          receipt.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> the Grievance Officer&rsquo;s name,
          email and postal address.
        </LegalTodo>
      </section>
    </LegalDoc>
  );
}
