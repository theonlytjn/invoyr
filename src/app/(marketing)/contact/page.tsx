import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Invoyr",
  description: "Get in touch with the Invoyr team.",
};

const KICKER = "font-mono text-xs uppercase tracking-[0.14em] text-neutral-500";

export default function ContactPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-24">
      <p className={`${KICKER} mb-8`}>Contact</p>
      <h1 className="font-serif text-[clamp(2.4rem,5.5vw,4rem)] leading-[0.98] tracking-tight text-neutral-50">
        Get in touch
      </h1>
      <p className="mt-5 text-lg text-neutral-400">
        Questions about Invoyr, pricing, or your account? We reply within one business day.
      </p>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-900 border-y border-neutral-900">
        <div className="py-6 sm:pr-8">
          <h2 className={KICKER}>General enquiries</h2>
          <p className="mt-2 text-base text-neutral-500">For questions about features, plans, or how Invoyr works.</p>
          <a href="mailto:hello@invoyr.io" className="mt-2 inline-block text-base text-neutral-100 hover:text-brand transition-colors">
            hello@invoyr.io
          </a>
        </div>
        <div className="py-6 sm:pl-8">
          <h2 className={KICKER}>Support</h2>
          <p className="mt-2 text-base text-neutral-500">Already a customer and need help? We&apos;ve got you.</p>
          <a href="mailto:support@invoyr.io" className="mt-2 inline-block text-base text-neutral-100 hover:text-brand transition-colors">
            support@invoyr.io
          </a>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="font-serif text-2xl text-neutral-50 mb-6">Send a message</h2>
        <ContactForm />
      </div>
    </div>
  );
}
