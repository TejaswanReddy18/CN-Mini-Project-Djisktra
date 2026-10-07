import type { RouterNode, NetworkLink, RoutingTableEntry, RoutingAlgorithm } from '../types/network';
import { runDijkstra } from './dijkstra';
import { runDistanceVector } from './bellmanFord';

/**
 * Computes the complete routing table for a given router under the chosen algorithm.
 */
export function getRouterRoutingTable(
  routerId: string,
  routers: RouterNode[],
  links: NetworkLink[],
  algorithm: RoutingAlgorithm = 'link-state'
): RoutingTableEntry[] {
  const targetRouter = routers.find(r => r.id === routerId);
  if (!targetRouter) return [];

  // If this router itself is failed, all entries are unreachable/down
  if (targetRouter.status === 'failed') {
    return routers.map(dest => ({
      destination: dest.id,
      destIp: dest.ip,
      nextHop: '-',
      cost: Infinity,
      interfaceName: 'down',
      status: 'unreachable'
    }));
  }

  const entries: RoutingTableEntry[] = [];

  if (algorithm === 'link-state') {
    // Under Link-State, each router runs Dijkstra from itself to every other router
    routers.forEach(dest => {
      if (dest.id === routerId) {
        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: '-',
          cost: 0,
          interfaceName: 'lo0',
          status: 'local'
        });
        return;
      }

      const { result } = runDijkstra(routers, links, routerId, dest.id);

      if (result.reachable && result.path.length >= 2) {
        const firstHop = result.path[1]; // First hop after source
        // Find the outgoing interface on this router
        const outLink = links.find(
          l => (l.source === routerId && l.target === firstHop) || (l.target === routerId && l.source === firstHop)
        );
        const iface = outLink
          ? outLink.source === routerId
            ? outLink.sourceInterface
            : outLink.targetInterface
          : 'eth0';

        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: firstHop,
          cost: result.totalCost,
          interfaceName: iface,
          status: 'reachable'
        });
      } else {
        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: '-',
          cost: Infinity,
          interfaceName: '-',
          status: 'unreachable'
        });
      }
    });
  } else {
    // Under Distance-Vector
    const { rounds } = runDistanceVector(routers, links, routerId, routers[0]?.id || routerId);
    const lastRound = rounds[rounds.length - 1];
    const routerVector = lastRound?.tables[routerId] || {};

    routers.forEach(dest => {
      if (dest.id === routerId) {
        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: '-',
          cost: 0,
          interfaceName: 'lo0',
          status: 'local'
        });
        return;
      }

      const entry = routerVector[dest.id];
      if (entry && entry.cost !== Infinity && entry.nextHop) {
        const outLink = links.find(
          l => (l.source === routerId && l.target === entry.nextHop) || (l.target === routerId && l.source === entry.nextHop)
        );
        const iface = outLink
          ? outLink.source === routerId
            ? outLink.sourceInterface
            : outLink.targetInterface
          : 'eth0';

        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: entry.nextHop,
          cost: entry.cost,
          interfaceName: iface,
          status: 'reachable'
        });
      } else {
        entries.push({
          destination: dest.id,
          destIp: dest.ip,
          nextHop: '-',
          cost: Infinity,
          interfaceName: '-',
          status: 'unreachable'
        });
      }
    });
  }

  // Sort: local first, then by destination ID
  return entries.sort((a, b) => {
    if (a.status === 'local') return -1;
    if (b.status === 'local') return 1;
    return a.destination.localeCompare(b.destination);
  });
}
