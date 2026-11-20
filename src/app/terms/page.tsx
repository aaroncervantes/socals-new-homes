import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata: Metadata = {
  title: "Terms",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms">
      <p>
        This draft explains the limits of the home-search form. It is not a client agreement and it
        does not create an agency relationship.
      </p>
      <p>
        Submitting the form is a request for a person on the team to follow up about new-construction
        homes. It does not guarantee representation, a showing, a price, availability, a builder
        incentive, financing, or approval of any kind.
      </p>
      <p>
        Home information changes. Communities, incentives, and move-in timing have to be confirmed
        with the builder and the brokerage. Nothing on this site is an offer to sell real estate by
        itself.
      </p>
      <p>
        The legal name of the business, the brokerage, and the governing terms still have to be
        written by the owner’s counsel. Until that happens, this page is a placeholder.
      </p>
    </LegalDocument>
  );
}
