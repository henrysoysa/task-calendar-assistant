"use client";

import React from 'react';
import { format } from 'date-fns';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-gray-700 mb-4">
            This Privacy Policy describes how Calendar Assistant ("we", "our", or "us") 
            collects, uses, and protects your personal information when you use our service.
            We are committed to ensuring that your privacy is protected and that we comply with
            applicable data protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-2">We collect information that you provide directly to us, including:</p>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Account information (name, email address)</li>
            <li>Calendar data and task information</li>
            <li>Project and scheduling preferences</li>
            <li>Usage data and application preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 mb-2">We use the collected information to:</p>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Provide and maintain our calendar assistant service</li>
            <li>Improve and personalize your user experience</li>
            <li>Send important notifications about your tasks and schedule</li>
            <li>Analyze usage patterns to enhance our service</li>
            <li>Protect against unauthorized access and abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational security measures to protect
            your personal information against unauthorized access, alteration, disclosure, or
            destruction. Your data is stored securely and is only accessible to authorized personnel.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your personal information for as long as necessary to provide you with our
            services and as required by applicable laws. You can request deletion of your account
            and associated data at any time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-gray-700 mb-2">You have the right to:</p>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Request data portability</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page and updating the "Last
            Updated" date below.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy or our data practices, please
            contact us at:
            <br />
            <a 
              href="mailto:support@calendar-assistant.com" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              support@calendar-assistant.com
            </a>
          </p>
        </section>

        <footer className="mt-12 pt-4 border-t text-gray-600 text-sm">
          Last Updated: {format(new Date(), 'MM/dd/yyyy')}
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 