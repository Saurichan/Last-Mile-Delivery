import React from 'react';
import { FileText } from 'lucide-react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-6 shadow-card space-y-2">
        <span className="text-[10px] uppercase font-bold text-[#238B5E] tracking-wider">
          Legal Terms
        </span>
        <h1 className="text-xl font-black text-[#111C16] dark:text-white">Terms of Service</h1>
        <p className="text-xs text-[#6C7D74]">
          Terms governing usage of the LocalRoute Last-Mile Route Optimization system
        </p>
      </div>

      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-6 sm:p-8 space-y-6 text-xs sm:text-sm leading-relaxed shadow-card text-zinc-700 dark:text-zinc-300">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white">1. Service Description & Routing Engine</h2>
          <p className="text-[#6C7D74] text-xs">
            The platform provides mathematical route sequencing, vehicle load balancing, and time window optimization for local businesses in Tumakuru, Karnataka. Estimated transit times, fuel savings, and arrival projections are algorithmic approximations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white">2. Merchant & Courier Responsibilities</h2>
          <p className="text-[#6C7D74] text-xs">
            Merchants and couriers remain exclusively responsible for road safety, local traffic compliance, parking legality, and actual road conditions. Route suggestions do not override local road regulations or driver judgement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-[#111C16] dark:text-white">3. OpenStreetMap & Routing Services</h2>
          <p className="text-[#6C7D74] text-xs">
            The system interfaces with OpenStreetMap data and OSRM matrix calculations. When external network latency occurs, topological straight-line fallback distances are computed seamlessly.
          </p>
        </section>
      </div>
    </div>
  );
};
