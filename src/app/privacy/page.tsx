import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <p>
        This draft describes what this website actually does today. It is not a finished policy.
        Counsel and the brokerage need to replace it before the site is advertised to the public.
      </p>
      <p>
        If you complete the home search and press submit, the site stores your first name, last
        name, phone number, the answers you gave, the time you submitted, whether you agreed to be
        contacted, and the version of that consent language. It also stores the page you landed on,
        the referring URL, and any utm_source, utm_medium, utm_campaign, utm_content, and utm_term
        values from that link. A shortened browser name is stored so a bad submission can be
        investigated. Your IP address is not saved on the lead. A hash of it is used only to slow
        down repeated submissions.
      </p>
      <p>
        Choosing “I’m just browsing for now” does not create a lead, does not email the owner, and
        does not create a CRM contact. Progress before you submit is saved in this browser only, so
        a refresh does not clear the form. That local copy is removed after a successful submit.
      </p>
      <p>
        The site records funnel events such as which question was viewed. Those events are tied to
        a random session id, not to your name or phone number. Google Analytics and the Meta Pixel
        are off unless the owner adds their ids. If they are turned on later, those services receive
        the same event names, still without your name or phone number from this form.
      </p>
      <p>
        A saved lead can be emailed to the owner through Resend when that service is configured, and
        can be sent to GoHighLevel when that service is configured. The hosting provider and the
        database provider store the data needed to run the site. This application does not sell the
        answers to a data broker.
      </p>
      <p>
        The business still needs to name who controls the data, how long leads are kept, and how a
        person can ask for access or deletion. Those points are blank until the owner supplies them.
      </p>
    </LegalDocument>
  );
}
