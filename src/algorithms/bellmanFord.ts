import type { RouterNode, NetworkLink, ShortestPathResult, DVRound, DVExchange, DVChange } from '../types/network';

export function runDistanceVector(
  routers: RouterNode[],
  links: NetworkLink[],
  sourceId: string,
  destinationId: string,
  maxRounds = 15
): {
  result: ShortestPathResult;
  rounds: DVRound[];
  convergedRound: number;
} {
  const activeRouters = routers.filter(r => r.status === 'active');
  const activeRouterIds = new Set(activeRouters.map(r => r.id));

  // If source or destination is failed/missing
  if (!activeRouterIds.has(sourceId) || !activeRouterIds.has(destinationId)) {
    const unreachableResult: ShortestPathResult = {
      path: [],
      linkIds: [],
      totalCost: Infinity,
      hopCount: 0,
      reachable: false,
      algorithm: 'distance-vector',
      computedAt: Date.now()
    };
    const emptyRound: DVRound = {
      roundNumber: 0,
      tables: {},
      exchanges: [],
      changes: [],
      converged: true,
      description: 'Source or Destination router is OFFLINE. Distance-Vector cannot converge.'
    };
    return { result: unreachableResult, rounds: [emptyRound], convergedRound: 0 };
  }

  // Active links
  const activeLinks = links.filter(
    l => l.status === 'active' && activeRouterIds.has(l.source) && activeRouterIds.has(l.target)
  );

  // Neighbors map: routerId -> Array of { neighborId, cost, linkId }
  const neighbors: Record<string, Array<{ id: string; cost: number; linkId: string }>> = {};
  activeRouters.forEach(r => {
    neighbors[r.id] = [];
  });

  activeLinks.forEach(l => {
    neighbors[l.source].push({ id: l.target, cost: l.cost, linkId: l.id });
    neighbors[l.target].push({ id: l.source, cost: l.cost, linkId: l.id });
  });

  // Current distance table: tables[routerId][destId] = { cost, nextHop }
  let currentTables: Record<string, Record<string, { cost: number; nextHop: string | null }>> = {};

  // Round 0: Initialize with local direct neighbor knowledge only
  activeRouters.forEach(r => {
    currentTables[r.id] = {};
    activeRouters.forEach(dest => {
      if (dest.id === r.id) {
        currentTables[r.id][dest.id] = { cost: 0, nextHop: null };
      } else {
        const directEdge = neighbors[r.id].find(n => n.id === dest.id);
        if (directEdge) {
          currentTables[r.id][dest.id] = { cost: directEdge.cost, nextHop: dest.id };
        } else {
          currentTables[r.id][dest.id] = { cost: Infinity, nextHop: null };
        }
      }
    });
  });

  const rounds: DVRound[] = [];

  // Deep clone helper
  const cloneTables = (
    tbl: Record<string, Record<string, { cost: number; nextHop: string | null }>>
  ) => {
    const copy: Record<string, Record<string, { cost: number; nextHop: string | null }>> = {};
    for (const r in tbl) {
      copy[r] = {};
      for (const d in tbl[r]) {
        copy[r][d] = { ...tbl[r][d] };
      }
    }
    return copy;
  };

  // Add Round 0
  rounds.push({
    roundNumber: 0,
    tables: cloneTables(currentTables),
    exchanges: [],
    changes: [],
    converged: false,
    description: `Round 0 (Initial State): Each router initializes its distance vector with local direct neighbors only. All multi-hop routes are currently unknown (cost = ∞).`
  });

  let convergedRoundNumber = 0;
  let hasConverged = false;

  for (let round = 1; round <= maxRounds; round++) {
    const nextTables = cloneTables(currentTables);
    const exchanges: DVExchange[] = [];
    const changes: DVChange[] = [];

    // 1. Prepare vectors that each router sends to each of its neighbors
    activeRouters.forEach(r => {
      const vector: Record<string, number> = {};
      activeRouters.forEach(dest => {
        vector[dest.id] = currentTables[r.id][dest.id].cost;
      });

      // Send to direct neighbors
      neighbors[r.id].forEach(nbr => {
        exchanges.push({
          from: r.id,
          to: nbr.id,
          vector: { ...vector }
        });
      });
    });

    // 2. Each router updates its table using Bellman-Ford equation:
    // D_x(y) = min_v { c(x, v) + D_v(y) }
    activeRouters.forEach(x => {
      activeRouters.forEach(y => {
        if (x.id === y.id) return; // cost to self is always 0

        // Find the best neighbor path
        let bestCost = Infinity;
        let bestNextHop: string | null = null;

        for (const nbr of neighbors[x.id]) {
          const directCost = nbr.cost;
          const nbrDistanceToY = currentTables[nbr.id][y.id]?.cost ?? Infinity;

          if (nbrDistanceToY !== Infinity) {
            const totalCandidateCost = directCost + nbrDistanceToY;
            if (totalCandidateCost < bestCost) {
              bestCost = totalCandidateCost;
              bestNextHop = nbr.id;
            }
          }
        }

        const oldEntry = currentTables[x.id][y.id];
        if (bestCost < oldEntry.cost) {
          nextTables[x.id][y.id] = { cost: bestCost, nextHop: bestNextHop };
          changes.push({
            routerId: x.id,
            destId: y.id,
            oldCost: oldEntry.cost,
            newCost: bestCost,
            oldNextHop: oldEntry.nextHop,
            newNextHop: bestNextHop
          });
        }
      });
    });

    const isRoundConverged = changes.length === 0;

    rounds.push({
      roundNumber: round,
      tables: cloneTables(nextTables),
      exchanges,
      changes,
      converged: isRoundConverged,
      description: isRoundConverged
        ? `Round ${round}: Convergence Reached! No distance updates occurred across any routers. All routing tables are now stable and optimal.`
        : `Round ${round}: Routers exchanged distance vectors. ${changes.length} route improvement(s) discovered across the network.`
    });

    currentTables = nextTables;

    if (isRoundConverged) {
      convergedRoundNumber = round;
      hasConverged = true;
      break;
    }
  }

  if (!hasConverged) {
    convergedRoundNumber = maxRounds;
  }

  // Trace path using final converged tables from sourceId to destinationId
  const path: string[] = [];
  const linkIds: string[] = [];
  let curr = sourceId;
  const visitedPathNodes = new Set<string>();
  let reached = false;

  while (curr) {
    path.push(curr);
    visitedPathNodes.add(curr);

    if (curr === destinationId) {
      reached = true;
      break;
    }

    const nextHop = currentTables[curr]?.[destinationId]?.nextHop;
    if (!nextHop || visitedPathNodes.has(nextHop) || !activeRouterIds.has(nextHop)) {
      // Loop or dead end
      break;
    }

    // Find link
    const link = activeLinks.find(
      l => (l.source === curr && l.target === nextHop) || (l.source === nextHop && l.target === curr)
    );
    if (link) linkIds.push(link.id);

    curr = nextHop;
  }

  const finalCost = currentTables[sourceId]?.[destinationId]?.cost ?? Infinity;
  const isReachable = reached && finalCost !== Infinity;

  const result: ShortestPathResult = {
    path: isReachable ? path : [],
    linkIds: isReachable ? linkIds : [],
    totalCost: isReachable ? finalCost : Infinity,
    hopCount: isReachable && path.length > 1 ? path.length - 1 : 0,
    reachable: isReachable,
    algorithm: 'distance-vector',
    computedAt: Date.now()
  };

  return { result, rounds, convergedRound: convergedRoundNumber };
}
