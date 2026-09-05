import type { Metadata } from "next";
import { SUPPORT_EMAIL } from "@/config/site";
import { LegalDoc, LegalTodo } from "../legal-doc";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The agreement between you and onelystop: who can use it, what the marking is and is not, how Pro billing and the cutoff promise work, and who to write to when something is wrong.",
};

const UPDATED = "5 September 2026";

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
  ["grievance", "Grievance officer"],
  ["law", "Governing law"],
];

export default function Page() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Terms of service"
      intro="The agreement between you and onelystop. The parts that matter are what the marking actually is, what happens to your money if you stop, and who to write to when something is wrong."
      meta={[`Last updated ${UPDATED}`, "Governed by the laws of India"]}
      sections={SECTIONS as [string, string][]}
    >
      <section id="agreement">
        <h2>
          <span>The agreement</span>
        </h2>
        <p>
          By creating an account you agree to these terms. If you do not agree,
          do not use the service.
        </p>
        <p>
          Where these terms conflict with the pledge published on our home page,{" "}
          <strong>the pledge wins</strong>. We do not get to promise one thing
          in large type and take it back in small type.
        </p>
        <p>
          These terms are a contract between you and the company that runs
          onelystop. Nothing in them takes away a right you have under the
          Consumer Protection Act, 2019. A term that tried to would be void
          under that Act anyway.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> registered entity name, CIN and
          registered office address.
        </LegalTodo>
      </section>

      <section id="who">
        <h2>
          <span>Who can use onelystop</span>
        </h2>
        <p>
          onelystop is for aspirants preparing for IBPS PO, IBPS Clerk, SBI PO,
          SBI Clerk and RBI Grade B, and for coaching institutes supporting them
          on the Institute plan.
        </p>
        <p>
          You must be 18 or over to create an account. The exams themselves
          require candidates to be at least 20, so this rules almost nobody out.
          The reason it is a hard line: the Digital Personal Data Protection
          Act, 2023 requires verifiable parental consent before a child&rsquo;s
          data can be processed, and we have no way to collect it. If we find an
          account belongs to someone under 18, we close it and delete the data.
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
            One account per person. Accounts are not to be shared or resold, and
            a second account is not a way to reset a free quota, whether the two
            monthly mocks or the five community doubts. We close duplicates.
          </li>
          <li>
            On the Institute plan each student gets their own account. The
            institute is billed per student, and each student is bound by these
            terms individually.
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
            <strong>The marking is a model reading a rubric.</strong> It is fast
            and it is specific, and it is not an examiner. It is not IBPS, SBI
            or RBI, and it has nothing to do with them.
          </li>
          <li>
            <strong>It is not an official result.</strong> Scores, sectional
            bands and cutoffs shown on onelystop are practice feedback. They
            carry no standing with IBPS, SBI, RBI or any other recruiting body,
            and they do not predict your result.
          </li>
          <li>
            <strong>Cutoffs are indicative.</strong> The cutoffs we show are
            taken from the published cutoffs of earlier years. The next
            exam&rsquo;s cutoff is set after it is held, by the body that holds
            it, and can differ from every earlier year.
          </li>
          <li>
            <strong>It can be wrong.</strong> If a mark looks wrong, tell us and
            a person will look at it. That is how the marking improves.
          </li>
          <li>
            <strong>Do not rely on it alone.</strong> It is one input alongside
            your teachers and your own judgement.
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
            scrape, bulk-download or resell our question bank, mocks,
            current-affairs questions or marking output;
          </li>
          <li>
            impersonate another person, or post anyone else&rsquo;s personal
            information, in the community or anywhere else on the service;
          </li>
          <li>
            use the community to sell coaching, paid material or anything else.
            It is for doubts, not for leads;
          </li>
          <li>upload unlawful content;</li>
          <li>attempt to break, overload or reverse-engineer the service.</li>
        </ul>
      </section>

      <section id="content">
        <h2>
          <span>Content and ownership</span>
        </h2>

        <h3>Your work stays yours</h3>
        <p>
          You keep ownership of everything you write on onelystop: answers in
          mocks and drills, descriptive answers you submit for marking, private
          notes, doubts you post, and questions you ask Ask Onely. You grant us
          a limited licence to store and process it solely to provide the
          service to you: marking it, working out your scores and sectional
          bands, building your attempt map, scheduling your flashcards. That
          licence ends when you delete the content or close your account.
        </p>
        <p>
          Doubts posted to the community are shown to other signed-in members
          under your display name until you delete them. Private notes are
          private.
        </p>
        <p>
          Your answers are not used to train any model, ours or a
          provider&rsquo;s, and we do not publish them.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> confirm the providers&rsquo;
          no-training and zero-retention terms in writing, OpenRouter in
          particular since it sees the text you submit.
        </LegalTodo>

        <h3>Exam bodies</h3>
        <p>
          onelystop is not affiliated with, endorsed by, or connected to IBPS,
          SBI, RBI or any other recruiting body. Their names are used only to
          say which exam a mock or drill is modelled on. Mocks follow each
          exam&rsquo;s published pattern; they are not copies of actual papers.
          Current-affairs questions are written from public reporting, and each
          one names its source.
        </p>

        <h3>Our material</h3>
        <p>
          The software, design and original content of onelystop, including the
          questions, mocks and marking output, belong to us. Using the service
          does not transfer any of it to you.
        </p>
      </section>

      <section id="billing">
        <h2>
          <span>Plans and billing</span>
        </h2>
        <ul>
          <li>
            <strong>The free plan is not a trial.</strong> It does not expire
            and does not need a card. It includes the knowledge base, private
            notes, the last seven days of current affairs, two full mocks a
            month under sectional timing, and five community doubts a month.
          </li>
          <li>
            <strong>Pro renews automatically</strong> through Razorpay
            Subscriptions, monthly or yearly as you chose, until you cancel. It
            includes unlimited mocks and drills, unlimited descriptive marking,
            the full current-affairs archive, the attempt map and progress, Ask
            Onely on any passage, and fifteen community doubts a month.
          </li>
          <li>
            <strong>Prices are in Indian rupees.</strong> Razorpay handles your
            card, UPI or net-banking details directly; we never see or store
            them.
          </li>
          <li>
            <strong>You can cancel at any time.</strong> Cancelling stops the
            next renewal; you keep Pro until the end of the period you have
            already paid for.
          </li>
          <li>
            <strong>The cutoff promise.</strong> Sit at least eight full mocks
            on Pro in three months. If your weakest section has not crossed its
            sectional cutoff, we refund the three months in full.
          </li>
          <li>
            <strong>Other refunds.</strong> A duplicate charge, or a period in
            which the service was unavailable, is refunded in full. We do not
            give partial refunds for the remainder of a cancelled period, except
            where the law requires it.
          </li>
          <li>
            <strong>Price changes</strong> apply from your next renewal, and we
            will tell you before they take effect.
          </li>
          <li>
            <strong>The Institute plan</strong> is arranged by contact, priced
            per student per year, and billed on a single invoice.
          </li>
        </ul>
        <LegalTodo>
          <strong>Before launch:</strong> decide whether prices are shown
          inclusive or exclusive of GST, and check the refund position above
          against the pricing and upgrade pages.
        </LegalTodo>
      </section>

      <section id="availability">
        <h2>
          <span>Availability and changes</span>
        </h2>
        <p>
          We aim to keep onelystop available but do not guarantee uninterrupted
          service. onelystop runs on providers under contract: Vercel hosts the
          site, Supabase holds the database and sign-in, Razorpay takes
          payments, Google Gemini generates current-affairs questions from
          public reporting, and OpenRouter carries Ask Onely questions and
          descriptive answers to a language model. When one of them is down, the
          part of onelystop that depends on it is down too. A period in which
          the service was unavailable is refunded, as set out under Plans and
          billing.
        </p>
        <p>
          We may change features, and we may retire ones that are not working.
          Where a change materially reduces what you are paying for we will tell
          you before it takes effect, and you may cancel for a refund of the
          rest of your period.
        </p>
      </section>

      <section id="liability">
        <h2>
          <span>Our liability</span>
        </h2>
        <p>
          Nothing here limits our liability for fraud, for death or personal
          injury caused by our negligence, or for anything else that Indian law
          does not allow to be limited. Your rights under the Consumer
          Protection Act, 2019 are unaffected.
        </p>
        <p>
          Subject to that, we are not liable for indirect or consequential loss,
          and specifically not for exam results, selection or employment
          outcomes. onelystop is practice material; it is not a guarantee that
          you will clear a cutoff, be called for an interview, or be offered a
          post.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> have the exclusions above checked
          against the Consumer Protection Act, 2019. An unfair contract term is
          void under it.
        </LegalTodo>
      </section>

      <section id="ending">
        <h2>
          <span>Ending the agreement</span>
        </h2>
        <p>
          You can close your account at any time from Settings &rarr; Close
          account. Closing it deletes your work immediately and cancels Pro;
          payment records stay with Razorpay for as long as tax law requires.
        </p>
        <p>
          We may suspend or close an account that breaches these terms, and will
          explain why unless we are legally prevented from doing so.
        </p>
      </section>

      <section id="grievance">
        <h2>
          <span>Grievance officer</span>
        </h2>
        <p>
          Under the Information Technology (Intermediary Guidelines and Digital
          Media Ethics Code) Rules, 2021 we have a named Grievance Officer. A
          complaint about content on the service, or about how we have handled
          your account, is acknowledged within 24 hours and resolved within 15
          days.
        </p>
        <p>
          Until the officer is named, write to{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Complaints
          about your personal data follow the grievance process in our privacy
          policy, which is your route to the Data Protection Board of India if
          we do not resolve them.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> the Grievance Officer&rsquo;s name,
          email and postal address.
        </LegalTodo>
      </section>

      <section id="law">
        <h2>
          <span>Governing law</span>
        </h2>
        <p>
          These terms are governed by the laws of India. Nothing here stops you
          from taking a complaint to a consumer forum under the Consumer
          Protection Act, 2019, wherever that Act lets you file it.
        </p>
        <LegalTodo>
          <strong>Before launch:</strong> the city whose courts have
          jurisdiction over disputes that are not consumer complaints.
        </LegalTodo>
      </section>
    </LegalDoc>
  );
}
