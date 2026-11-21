import React from 'react';
import { ShieldCheck, Lock, Database, Eye, FileText } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-6 shadow-card space-y-2">
        <span className="text-[10px] uppercase font-bold text-[#238B5E] tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-xl font-black text-[#111C16] dark:text-white">Privacy Policy</h1>
        <p className="text-xs text-[#6C7D74]">
          Transparency guidelines for local dispatch and logistics operations in Tumakuru, Karnataka
        </p>
      </div>

      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed shadow-card text-zinc-700 dark:text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-[#238B5E]" />
            1. Data Collection & Processing
          </h2>
          <p className="text-[#6C7D74] text-xs">
            LocalRoute processes dispatch data provided directly by the operating merchant, including delivery addresses in Tumakuru, customer contact details, package payload characteristics, and delivery slot preferences solely to compute optimized route sequences.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#238B5E]" />
            2. Location Data & Geocoding Telemetry
          </h2>
          <p className="text-[#6C7D74] text-xs">
            Customer addresses are converted into latitude and longitude coordinates using OpenStreetMap Nominatim and OSRM (Open Source Routing Machine) routing engines.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#238B5E]" />
            3. Proof of Delivery & Digital Signatures
          </h2>
          <p className="text-[#6C7D74] text-xs">
            Digital signatures and delivery verification captured during the proof-of-delivery workflow are associated directly with the merchant order records.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#238B5E]" />
            4. Local Storage & Session Data
          </h2>
          <p className="text-[#6C7D74] text-xs">
            Users may export, modify, or purge their dispatch queue and route history directly from the application settings at any time.
          </p>
        </section>
      </div>
    </div>
  );
};
