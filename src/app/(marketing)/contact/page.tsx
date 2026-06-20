import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Invoyr",
  description: "Get in touch with the Invoyr team.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Get in touch</h1>
      <p className="text-gray-500 mb-10">
        Questions about Invoyr, pricing, or your account? We reply within one business day.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">General enquiries</h2>
          <p className="text-sm text-gray-500">For questions about features, plans, or how Invoyr works.</p>
          <a href="mailto:hello@invoyr.io" className="text-sm text-gray-900 font-medium mt-2 block hover:underline">
            hello@invoyr.io
          </a>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Support</h2>
          <p className="text-sm text-gray-500">Already a customer and need help? We&apos;ve got you.</p>
          <a href="mailto:support@invoyr.io" className="text-sm text-gray-900 font-medium mt-2 block hover:underline">
            support@invoyr.io
          </a>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Send a message</h2>
        <ContactForm />
      </div>
    </div>
  );
}
