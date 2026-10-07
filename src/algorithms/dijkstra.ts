import type { RouterNode, NetworkLink, ShortestPathResult, DijkstraStep } from '../types/network';

export function runDijkstra(
  routers: RouterNode[],
  links: NetworkLink[],
  sourceId: string,
  destinationId: string
): { result: ShortestPathResult; steps: DijkstraStep[] } {
  const steps: DijkstraStep[] = [];

  // Filter only active routers
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
      algorithm: 'link-state',
      computedAt: Date.now()
    };
    steps.push({
      stepNumber: 1,
      visited: [],
      unvisited: Array.from(activeRouterIds),
      currentNode: null,
      neighborNode: null,
      distances: {},
      previous: {},
      description: `Source or Destination router is OFFLINE / Inactive. Route cannot be established.`,
      relaxed: false,
      tentativeCost: null,
      phase: 'init'
    });
    return { result: unreachableResult, steps };
  }

  // Active links connecting active routers
  const activeLinks = links.filter(
    l => l.status === 'active' && activeRouterIds.has(l.source) && activeRouterIds.has(l.target)
  );

  // Build adjacency graph
  const adj: Record<string, Array<{ neighbor: string; cost: number; linkId: string }>> = {};
  activeRouters.forEach(r => {
    adj[r.id] = [];
  });

  activeLinks.forEach(l => {
    adj[l.source].push({ neighbor: l.target, cost: l.cost, linkId: l.id });
    adj[l.target].push({ neighbor: l.source, cost: l.cost, linkId: l.id });
  });

  // State
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const unvisited = new Set<string>(activeRouters.map(r => r.id));

  activeRouters.forEach(r => {
    distances[r.id] = r.id === sourceId ? 0 : Infinity;
    previous[r.id] = null;
  });

  let stepCount = 0;

  // Step 0: Init
  steps.push({
    stepNumber: ++stepCount,
    visited: [],
    unvisited: Array.from(unvisited),
    currentNode: sourceId,
    neighborNode: null,
    distances: { ...distances },
    previous: { ...previous },
    description: `Initialize Dijkstra: Set distance to source router ${sourceId} = 0, all other routers = ∞. Permanent visited set is empty.`,
    relaxed: false,
    tentativeCost: 0,
    phase: 'init'
  });

  while (unvisited.size > 0) {
    // Find node with minimum distance in unvisited
    let minNode: string | null = null;
    let minDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        minNode = nodeId;
      }
    }

    // If smallest distance is infinity, remaining nodes are disconnected
    if (minNode === null || minDist === Infinity) {
      steps.push({
        stepNumber: ++stepCount,
        visited: Array.from(visited),
        unvisited: Array.from(unvisited),
        currentNode: null,
        neighborNode: null,
        distances: { ...distances },
        previous: { ...previous },
        description: `All remaining unvisited routers (${Array.from(unvisited).join(', ')}) have distance = ∞ and are unreachable from ${sourceId}.`,
        relaxed: false,
        tentativeCost: null,
        phase: 'completed'
      });
      break;
    }

    // Select minNode
    unvisited.delete(minNode);
    visited.add(minNode);

    steps.push({
      stepNumber: ++stepCount,
      visited: Array.from(visited),
      unvisited: Array.from(unvisited),
      currentNode: minNode,
      neighborNode: null,
      distances: { ...distances },
      previous: { ...previous },
      description: `Select router ${minNode} with smallest tentative distance (${minDist}). Mark as PERMANENT (Visited).`,
      relaxed: false,
      tentativeCost: minDist,
      phase: 'select_min'
    });

    // If destination was reached and settled
    if (minNode === destinationId) {
      steps.push({
        stepNumber: ++stepCount,
        visited: Array.from(visited),
        unvisited: Array.from(unvisited),
        currentNode: minNode,
        neighborNode: null,
        distances: { ...distances },
        previous: { ...previous },
        description: `Destination router ${destinationId} has been reached with minimum cost ${distances[destinationId]}! Shortest path confirmed.`,
        relaxed: false,
        tentativeCost: distances[destinationId],
        phase: 'destination_reached'
      });
      break;
    }

    // Relax neighbors
    const neighbors = adj[minNode] || [];
    for (const edge of neighbors) {
      const neighbor = edge.neighbor;
      if (!visited.has(neighbor)) {
        const tentativeDist = distances[minNode] + edge.cost;
        const currentDist = distances[neighbor];
        const isShorter = tentativeDist < currentDist;

        if (isShorter) {
          distances[neighbor] = tentativeDist;
          previous[neighbor] = minNode;
        }

        steps.push({
          stepNumber: ++stepCount,
          visited: Array.from(visited),
          unvisited: Array.from(unvisited),
          currentNode: minNode,
          neighborNode: neighbor,
          distances: { ...distances },
          previous: { ...previous },
          description: isShorter
            ? `Relax edge ${minNode} ↔ ${neighbor} (cost ${edge.cost}): Tentative distance = ${distances[minNode]} + ${edge.cost} = ${tentativeDist} < ${currentDist === Infinity ? '∞' : currentDist}. Updated dist[${neighbor}] = ${tentativeDist}, prev[${neighbor}] = ${minNode}.`
            : `Inspect edge ${minNode} ↔ ${neighbor} (cost ${edge.cost}): Tentative distance = ${distances[minNode]} + ${edge.cost} = ${tentativeDist} >= ${currentDist}. No update needed.`,
          relaxed: isShorter,
          tentativeCost: tentativeDist,
          phase: 'relax_neighbor'
        });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  const linkIds: string[] = [];

  let curr: string | null = destinationId;
  const isReachable = distances[destinationId] !== undefined && distances[destinationId] !== Infinity;

  if (isReachable) {
    while (curr !== null) {
      path.unshift(curr);
      const prev: string | null = previous[curr];
      if (prev) {
        // Find link id between prev and curr
        const link = activeLinks.find(
          l => (l.source === prev && l.target === curr) || (l.source === curr && l.target === prev)
        );
        if (link) linkIds.unshift(link.id);
      }
      curr = prev;
    }
  }

  const result: ShortestPathResult = {
    path: isReachable ? path : [],
    linkIds: isReachable ? linkIds : [],
    totalCost: isReachable ? distances[destinationId] : Infinity,
    hopCount: isReachable && path.length > 1 ? path.length - 1 : 0,
    reachable: isReachable,
    algorithm: 'link-state',
    computedAt: Date.now()
  };

  return { result, steps };
}
