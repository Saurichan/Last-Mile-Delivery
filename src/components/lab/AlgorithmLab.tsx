import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { getDistanceTimeMatrix } from '../../services/routingService';
import {
  evaluateRouteSequence,
  runTwoOptOptimization,
  timeStringToMinutes,
  RouteEvaluation,
} from '../../services/optimizer/twoOpt';
import { runGeneticAlgorithm } from '../../services/optimizer/geneticAlgorithm';
import {
  Cpu,
  Play,
  CheckCircle2,
  Gauge,
  Clock,
  Zap,
} from 'lucide-react';

interface BenchmarkResult {
  algorithm: string;
  name: string;
  description: string;
  distanceKm: number;
  durationMin: number;
  lateOrders: number;
  costScore: number;
  executionTimeMs: number;
  isFeasible: boolean;
  improvementVsManualPercent: number;
}

export const AlgorithmLab: React.FC = () => {
  const { business, orders, vehicles } = useStore();

  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmarkSuite = async () => {
    setIsRunning(true);
    const activeOrders = orders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    );
    const n = activeOrders.length;
    const depotStartTimeMin = timeStringToMinutes(business.defaultStartTime || '08:30');
    const vehicle = vehicles[0];

    const allCoords = [
      { lat: business.depot.lat, lng: business.depot.lng },
      ...activeOrders.map((o) => ({ lat: o.customer.lat, lng: o.customer.lng })),
    ];

    const matrix = await getDistanceTimeMatrix(allCoords);

    // 1. Manual sequence (0, 1, 2, ..., n-1)
    const t0 = performance.now();
    const manualSeq = Array.from({ length: n }, (_, i) => i);
    const manualEval = evaluateRouteSequence(
      manualSeq,
      activeOrders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes
    );
    const manualTime = Math.max(1, Math.round(performance.now() - t0));

    // 2. Nearest Neighbor (0-indexed indices into activeOrders)
    const t1 = performance.now();
    const unvisited = new Set(manualSeq);
    let curr = 0; // Depot is index 0 in matrix
    const nnSeq: number[] = [];
    while (unvisited.size > 0) {
      let nearest = -1;
      let minD = Infinity;
      unvisited.forEach((targetOrderIdx) => {
        const matrixTargetIdx = targetOrderIdx + 1;
        const d = matrix.distances[curr][matrixTargetIdx];
        if (d < minD) {
          minD = d;
          nearest = targetOrderIdx;
        }
      });
      if (nearest !== -1) {
        nnSeq.push(nearest);
        unvisited.delete(nearest);
        curr = nearest + 1;
      } else break;
    }
    const nnEval = evaluateRouteSequence(
      nnSeq,
      activeOrders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes
    );
    const nnTime = Math.max(1, Math.round(performance.now() - t1));

    // 3. 2-Opt Local Search
    const t2 = performance.now();
    const twoOptResult = runTwoOptOptimization(
      nnSeq,
      activeOrders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes
    );
    const twoOptTime = Math.max(1, Math.round(performance.now() - t2));

    // 4. Genetic Algorithm
    const t3 = performance.now();
    const gaResult = runGeneticAlgorithm(
      activeOrders,
      matrix,
      business.rules,
      depotStartTimeMin,
      business.returnToDepot,
      vehicle,
      business.maxRouteDurationMinutes,
      30,
      40
    );
    const gaTime = Math.max(1, Math.round(performance.now() - t3));

    const results: BenchmarkResult[] = [
      {
        algorithm: 'manual',
        name: 'Manual FIFO Sequence',
        description: 'Orders dispatched in default order queue without topological routing.',
        distanceKm: manualEval.totalDistanceKm,
        durationMin: manualEval.totalDurationMin,
        lateOrders: manualEval.lateOrdersCount,
        costScore: Math.round(manualEval.cost),
        executionTimeMs: manualTime,
        isFeasible: manualEval.isFeasible,
        improvementVsManualPercent: 0,
      },
      {
        algorithm: 'nearest_neighbor',
        name: 'Greedy Nearest Neighbor',
        description: 'Greedy heuristic selecting the physically closest unvisited stop next.',
        distanceKm: nnEval.totalDistanceKm,
        durationMin: nnEval.totalDurationMin,
        lateOrders: nnEval.lateOrdersCount,
        costScore: Math.round(nnEval.cost),
        executionTimeMs: nnTime,
        isFeasible: nnEval.isFeasible,
        improvementVsManualPercent: Number(
          (
            ((manualEval.totalDistanceKm - nnEval.totalDistanceKm) /
              Math.max(1, manualEval.totalDistanceKm)) *
            100
          ).toFixed(1)
        ),
      },
      {
        algorithm: 'two_opt',
        name: '2-Opt Local Search (Recommended)',
        description: 'Iterative edge-swapping heuristic removing criss-crossing route overlaps.',
        distanceKm: twoOptResult.bestEvaluation.totalDistanceKm,
        durationMin: twoOptResult.bestEvaluation.totalDurationMin,
        lateOrders: twoOptResult.bestEvaluation.lateOrdersCount,
        costScore: Math.round(twoOptResult.bestEvaluation.cost),
        executionTimeMs: twoOptTime,
        isFeasible: twoOptResult.bestEvaluation.isFeasible,
        improvementVsManualPercent: Number(
          (
            ((manualEval.totalDistanceKm - twoOptResult.bestEvaluation.totalDistanceKm) /
              Math.max(1, manualEval.totalDistanceKm)) *
            100
          ).toFixed(1)
        ),
      },
      {
        algorithm: 'genetic',
        name: 'Genetic Evolutionary Search',
        description: 'Population-based metaheuristic using crossover and mutation operators.',
        distanceKm: gaResult.bestEvaluation.totalDistanceKm,
        durationMin: gaResult.bestEvaluation.totalDurationMin,
        lateOrders: gaResult.bestEvaluation.lateOrdersCount,
        costScore: Math.round(gaResult.bestEvaluation.cost),
        executionTimeMs: gaTime,
        isFeasible: gaResult.bestEvaluation.isFeasible,
        improvementVsManualPercent: Number(
          (
            ((manualEval.totalDistanceKm - gaResult.bestEvaluation.totalDistanceKm) /
              Math.max(1, manualEval.totalDistanceKm)) *
            100
          ).toFixed(1)
        ),
      },
    ];

    setBenchmarks(results);
    setIsRunning(false);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 shadow-card space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#238B5E] tracking-wider">
              Algorithmic Benchmark Sandbox
            </span>
            <h1 className="text-lg font-black text-[#111C16] dark:text-white">Optimization Algorithm Lab</h1>
          </div>

          <button
            disabled={isRunning || orders.length === 0}
            onClick={runBenchmarkSuite}
            className="px-5 py-2.5 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] rounded-xl text-xs font-black shadow-sm flex items-center gap-2 transition"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Benchmarking...' : 'Run All Algorithms'}</span>
          </button>
        </div>

        <p className="text-xs text-[#6C7D74]">
          Compare computational performance, distance efficiency, execution latency, and constraint satisfaction across heuristic algorithms in Tumakuru.
        </p>
      </div>

      {/* Results Table */}
      {benchmarks ? (
        <div className="bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl p-5 shadow-card space-y-4 animate-fade-in">
          <h3 className="text-xs font-bold text-[#6C7D74] uppercase tracking-wider">
            Comparative Benchmark Results ({orders.length} Deliveries)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {benchmarks.map((res) => {
              const isBest = res.algorithm === 'two_opt';
              return (
                <div
                  key={res.algorithm}
                  className={`p-4 rounded-3xl border transition space-y-3 ${
                    isBest
                      ? 'bg-[#E8F5EF] dark:bg-[#1E5B44]/30 border-[#238B5E] ring-1 ring-[#238B5E]'
                      : 'bg-[#F4F7F5] dark:bg-[#182E25] border-[#D8E2DC] dark:border-[#1F3A2E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#111C16] dark:text-white">{res.name}</span>
                    {isBest && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#1E5B44] text-white">
                        BEST
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6C7D74] leading-relaxed">
                    {res.description}
                  </p>

                  <div className="space-y-1 pt-2 border-t border-[#D8E2DC]/60 dark:border-[#1F3A2E] text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#6C7D74]">Distance:</span>
                      <span className="font-bold text-[#111C16] dark:text-white">{res.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6C7D74]">Duration:</span>
                      <span className="font-bold text-[#1E5B44] dark:text-[#2FA872]">{res.durationMin} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6C7D74]">Late Deliveries:</span>
                      <span className={`font-bold ${res.lateOrders > 0 ? 'text-rose-600' : 'text-[#238B5E]'}`}>
                        {res.lateOrders}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6C7D74]">Execution Time:</span>
                      <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {res.executionTimeMs} ms
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#D8E2DC]/60 dark:border-[#1F3A2E]">
                      <span className="text-[#6C7D74]">Improvement:</span>
                      <span className="font-black text-[#238B5E]">
                        +{res.improvementVsManualPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-12 bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl text-center space-y-2 shadow-card">
          <Cpu className="w-10 h-10 text-[#238B5E] mx-auto" />
          <h3 className="text-xs font-bold text-[#111C16] dark:text-white">Ready to Benchmark Optimization Algorithms</h3>
          <p className="text-xs text-[#6C7D74] max-w-md mx-auto">
            Click "Run All Algorithms" above to test your active {orders.length} orders across Greedy Nearest Neighbor, 2-Opt Local Search, and Genetic Algorithms.
          </p>
        </div>
      )}
    </div>
  );
};
