import React from "react";
import PolicyLayout from "./PolicyLayout";
import { motion } from "framer-motion";

const TermsPage = () => {
  return (
    <PolicyLayout title="Terms and Conditions">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <p className="text-neutral-400">
          <strong>Last Updated: 16th December 2025</strong>
        </p>

        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">1. Acceptance of Terms</h3>
          <p>
            By accessing and using the Klubnika Café website, you agree to be bound by these Terms and Conditions and all terms incorporated by reference. If you do not agree to all of these terms, do not use this website.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">2. Ordering and Payment</h3>
          <p>
            All orders placed through the website are subject to availability and confirmation of the order price. Payment must be made at the time of placing the order. We use Razorpay for processing payments.
          </p>
          <p className="mt-2 text-sm text-neutral-400">
             For details regarding order cancellations, returns, and refunds, please refer to our <a href="/refund" className="text-rose-400 underline">Cancellation and Refund Policy</a>.
          </p>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">3. User Conduct</h3>
          <p>
            You agree not to use the website for any unlawful purpose or in any way that interrupts, damages, or impairs the service. Misuse, including abusive reviews or fraudulent orders, will result in account termination.
          </p>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">4. Changes to Terms</h3>
          <p>
            Klubnika Café reserves the right to change these terms at any time. Your continued use of the site following any changes constitutes your acceptance of the new terms.
          </p>
        </section>
        
        <section>
            <h3 className="text-xl font-semibold mb-2 text-rose-400">5. Contact Information</h3>
            <p>
                If you have any questions about these Terms, please contact us at <strong>nguria7@gmail.com</strong>.
            </p>
        </section>
      </motion.div>
    </PolicyLayout>
  );
};

export default TermsPage;