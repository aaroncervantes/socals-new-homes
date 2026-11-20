import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { requiredBrandAssets } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Real Estate Disclosures",
  robots: { index: false, follow: false },
};

export default function DisclosuresPage() {
  return (
    <LegalDocument title="Real Estate Disclosures">
      <p>
        California real estate advertising has to identify the brokerage and the responsible broker.
        Those details are not in this project, so they are not printed here as if they were real.
      </p>
      <p>
        The official place to confirm a license is the California Department of Real Estate at{" "}
        <a href="https://www.dre.ca.gov/" className="underline underline-offset-4">
          dre.ca.gov
        </a>
        . The agency disclosure form required in a transaction has to come from the brokerage. This
        page does not replace that form.
      </p>
      <p>
        The people behind this site intend to follow the federal Fair Housing Act and California
        fair housing law. The form does not ask about protected characteristics, and a budget answer
        is never used to turn someone away.
      </p>
      <p>
        Sending this form does not mean you have hired an agent. It does not promise exclusive
        pricing, the lowest price, or a guaranteed incentive.
      </p>
      <h2 className="pt-4 font-serif text-2xl">Brand assets still needed</h2>
      <ul className="list-disc space-y-2 pl-5">
        {requiredBrandAssets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </LegalDocument>
  );
}
