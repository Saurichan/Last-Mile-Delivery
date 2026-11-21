import { Order, BusinessRules, DistanceTimeMatrix, Vehicle } from '../../types';
import { evaluateRouteSequence, RouteEvaluation } from './twoOpt';

/**
 * Real Genetic Algorithm implementation for Travelling Salesperson with Time Windows (VRPTW)
 */
export function runGeneticAlgorithm(
  orders: Order[],
  matrix: DistanceTimeMatrix,
  rules: BusinessRules,
  depotStartTimeMin: number,
  returnToDepot: boolean,
  vehicle?: Vehicle,
  maxRouteDurationMin: number = 480,
  populationSize: number = 40,
  generations: number = 50,
  mutationRate: number = 0.15
): { bestSequence: number[]; bestEvaluation: RouteEvaluation; generationHistory: { generation: number; bestCost: number }[] } {
  const n = orders.length;
  if (n === 0) {
    return {
      bestSequence: [],
      bestEvaluation: evaluateRouteSequence([], orders, matrix, rules, depotStartTimeMin, returnToDepot, vehicle, maxRouteDurationMin),
      generationHistory: [],
    };
  }

  // Base chromosome [0, 1, 2, ..., n-1]
  const baseChromosome = Array.from({ length: n }, (_, i) => i);

  // Initialize random population
  let population: number[][] = [];
  for (let i = 0; i < populationSize; i++) {
    // Shuffle base chromosome preserving locked items if possible
    const shuffled = [...baseChromosome].sort(() => Math.random() - 0.5);
    population.push(shuffled);
  }

  const generationHistory: { generation: number; bestCost: number }[] = [];
  let bestChromosome = population[0];
  let bestEval = evaluateRouteSequence(bestChromosome, orders, matrix, rules, depotStartTimeMin, returnToDepot, vehicle, maxRouteDurationMin);

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness of current population
    const evaluatedPop = population.map(chrom => {
      const evaluation = evaluateRouteSequence(chrom, orders, matrix, rules, depotStartTimeMin, returnToDepot, vehicle, maxRouteDurationMin);
      return {
        chromosome: chrom,
        evaluation,
        fitness: 1 / (1 + evaluation.cost),
      };
    });

    // Sort by fitness descending
    evaluatedPop.sort((a, b) => b.fitness - a.fitness);

    if (evaluatedPop[0].evaluation.cost < bestEval.cost) {
      bestChromosome = evaluatedPop[0].chromosome;
      bestEval = evaluatedPop[0].evaluation;
    }

    generationHistory.push({
      generation: gen + 1,
      bestCost: Number(evaluatedPop[0].evaluation.cost.toFixed(2)),
    });

    // Selection & Elitism: Retain top 15%
    const eliteCount = Math.max(2, Math.floor(populationSize * 0.15));
    const nextGeneration: number[][] = evaluatedPop.slice(0, eliteCount).map(p => p.chromosome);

    // Reproduce rest of population using Order Crossover (OX1)
    while (nextGeneration.length < populationSize) {
      // Tournament selection
      const parentA = tournamentSelect(evaluatedPop);
      const parentB = tournamentSelect(evaluatedPop);

      let child = orderCrossover(parentA, parentB);

      // Mutation (Swap mutation)
      if (Math.random() < mutationRate) {
        child = mutateSwap(child, orders);
      }

      nextGeneration.push(child);
    }

    population = nextGeneration;
  }

  return {
    bestSequence: bestChromosome,
    bestEvaluation: bestEval,
    generationHistory,
  };
}

function tournamentSelect(pop: { chromosome: number[]; fitness: number }[]): number[] {
  const k = 3;
  let best = pop[Math.floor(Math.random() * pop.length)];
  for (let i = 1; i < k; i++) {
    const candidate = pop[Math.floor(Math.random() * pop.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }
  return best.chromosome;
}

/**
 * Order Crossover (OX1) preserving permutation integrity
 */
function orderCrossover(parent1: number[], parent2: number[]): number[] {
  const n = parent1.length;
  if (n <= 2) return [...parent1];

  const idx1 = Math.floor(Math.random() * n);
  const idx2 = Math.floor(Math.random() * n);
  const start = Math.min(idx1, idx2);
  const end = Math.max(idx1, idx2);

  const child: (number | null)[] = Array(n).fill(null);

  // Copy slice from parent1
  for (let i = start; i <= end; i++) {
    child[i] = parent1[i];
  }

  // Fill remainder from parent2
  let p2Idx = 0;
  for (let i = 0; i < n; i++) {
    if (i >= start && i <= end) continue;
    while (child.includes(parent2[p2Idx])) {
      p2Idx++;
    }
    child[i] = parent2[p2Idx];
    p2Idx++;
  }

  return child as number[];
}

function mutateSwap(chromosome: number[], orders: Order[]): number[] {
  const mutated = [...chromosome];
  const idx1 = Math.floor(Math.random() * mutated.length);
  const idx2 = Math.floor(Math.random() * mutated.length);

  // Don't swap if either is locked
  if (orders[mutated[idx1]]?.isLocked || orders[mutated[idx2]]?.isLocked) {
    return mutated;
  }

  const temp = mutated[idx1];
  mutated[idx1] = mutated[idx2];
  mutated[idx2] = temp;
  return mutated;
}
