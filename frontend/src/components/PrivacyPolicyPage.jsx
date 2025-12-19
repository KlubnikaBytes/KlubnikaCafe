import React from "react";
import PolicyLayout from "./PolicyLayout";
import { motion } from "framer-motion";

const PrivacyPolicyPage = () => {
  return (
    <PolicyLayout title="Privacy Policy">
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
          <h3 className="text-xl font-semibold mb-2 text-rose-400">1. Information We Collect</h3>
          <p>
            We collect personal identification information (Name, Email, Phone Number, Delivery Address) when you register on our site, place an order, or subscribe to our newsletter.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">2. How We Use Your Information</h3>
          <p>
            We use the information collected for the following purposes: To process transactions and deliver your orders; To send periodic emails regarding your order or other products and services; To improve our website and customer service.
          </p>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">3. Data Security</h3>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. All supplied sensitive/credit information is transmitted via Secure Socket Layer (SSL) technology and then encrypted into our payment gateway providers database.
          </p>
        </section>
        
        <section>
          <h3 className="text-xl font-semibold mb-2 text-rose-400">4. Disclosure to Third Parties</h3>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential (e.g., Delivery partners).
          </p>
        </section>
        
        <section>
            <h3 className="text-xl font-semibold mb-2 text-rose-400">5. Contact Us</h3>
            <p>
                If there are any questions regarding this privacy policy, you may contact us using the information below: <br/>
                Email: <strong>nguria7@gmail.com</strong>
            </p>
        </section>
      </motion.div>
    </PolicyLayout>
  );
};

export default PrivacyPolicyPage;