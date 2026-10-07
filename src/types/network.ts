export type RouterStatus = 'active' | 'failed';
export type LinkStatus = 'active' | 'failed';
export type RoutingAlgorithm = 'link-state' | 'distance-vector';

export interface RouterNode {
  id: string;
  label: string;
  ip: string;
  x: number;
  y: number;
  status: RouterStatus;
}

export interface NetworkLink {
  id: string;
  source: string; // router id
  target: string; // router id
  cost: number;
  status: LinkStatus;
  sourceInterface: string;
  targetInterface: string;
}

export interface RoutingTableEntry {
  destination: string;
  destIp: string;
  nextHop: string | '-';
  cost: number;
  interfaceName: string;
  status: 'reachable' | 'unreachable' | 'local';
}

export interface DijkstraStep {
  stepNumber: number;
  visited: string[];
  unvisited: string[];
  currentNode: string | null;
  neighborNode: string | null;
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  description: string;
  relaxed: boolean;
  tentativeCost: number | null;
  phase: 'init' | 'select_min' | 'relax_neighbor' | 'destination_reached' | 'completed';
}

export interface DVExchange {
  from: string;
  to: string;
  vector: Record<string, number>;
}

export interface DVChange {
  routerId: string;
  destId: string;
  oldCost: number;
  newCost: number;
  oldNextHop: string | null;
  newNextHop: string | null;
}

export interface DVRound {
  roundNumber: number;
  tables: Record<string, Record<string, { cost: number; nextHop: string | null }>>;
  exchanges: DVExchange[];
  changes: DVChange[];
  converged: boolean;
  description: string;
}

export interface ShortestPathResult {
  path: string[];
  linkIds: string[];
  totalCost: number;
  hopCount: number;
  reachable: boolean;
  algorithm: RoutingAlgorithm;
  computedAt: number;
}

export interface PacketSimulation {
  id: string;
  source: string;
  destination: string;
  path: string[];
  currentHopIndex: number;
  currentRouter: string;
  nextRouter: string | null;
  progress: number; // 0 to 1 between currentRouter and nextRouter
  ttl: number;
  totalCost: number;
  status: 'idle' | 'in_transit' | 'delivered' | 'dropped';
  protocol: 'ICMP Echo Request' | 'IPv4 Data' | 'Routing LSA' | 'Distance Vector';
  payload: string;
  dropReason?: string;
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  type: 'topology' | 'failure' | 'routing' | 'packet' | 'convergence';
  message: string;
  details?: string;
  badge?: string;
}

export interface AlgorithmMetrics {
  algorithm: RoutingAlgorithm;
  path: string[];
  cost: number;
  hopCount: number;
  stepsCount: number;
  roundsCount: number;
  messagesExchanged: number;
  convergenceState: string;
  complexityTime: string;
  overhead: string;
}
