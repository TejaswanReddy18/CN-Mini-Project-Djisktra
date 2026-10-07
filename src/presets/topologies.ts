import type { RouterNode, NetworkLink } from '../types/network';

export interface TopologyPreset {
  id: string;
  name: string;
  description: string;
  defaultSource: string;
  defaultDestination: string;
  routers: RouterNode[];
  links: NetworkLink[];
}

export const TOPOLOGY_PRESETS: TopologyPreset[] = [
  {
    id: 'demo-scenario',
    name: 'Classic RouteLab Demo (Section 24)',
    description: 'The standard 5-router network from the specification. Demonstrates alternative routing via R2 vs R3 when link R2-R4 fails.',
    defaultSource: 'R1',
    defaultDestination: 'R5',
    routers: [
      { id: 'R1', label: 'R1', ip: '10.0.1.1', x: 180, y: 260, status: 'active' },
      { id: 'R2', label: 'R2', ip: '10.0.2.1', x: 380, y: 130, status: 'active' },
      { id: 'R3', label: 'R3', ip: '10.0.3.1', x: 380, y: 390, status: 'active' },
      { id: 'R4', label: 'R4', ip: '10.0.4.1', x: 590, y: 260, status: 'active' },
      { id: 'R5', label: 'R5', ip: '10.0.5.1', x: 800, y: 260, status: 'active' }
    ],
    links: [
      { id: 'R1-R2', source: 'R1', target: 'R2', cost: 4, status: 'active', sourceInterface: 'eth0', targetInterface: 'eth0' },
      { id: 'R1-R3', source: 'R1', target: 'R3', cost: 7, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R2-R4', source: 'R2', target: 'R4', cost: 2, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R3-R4', source: 'R3', target: 'R4', cost: 3, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth1' },
      { id: 'R4-R5', source: 'R4', target: 'R5', cost: 3, status: 'active', sourceInterface: 'eth2', targetInterface: 'eth0' }
    ]
  },
  {
    id: 'ring-redundancy',
    name: 'Ring Network (Fault-Tolerant Loop)',
    description: 'A 6-router ring network demonstrating clockwise vs counter-clockwise routing when any segment fails.',
    defaultSource: 'R1',
    defaultDestination: 'R4',
    routers: [
      { id: 'R1', label: 'R1', ip: '172.16.1.1', x: 260, y: 140, status: 'active' },
      { id: 'R2', label: 'R2', ip: '172.16.2.1', x: 540, y: 140, status: 'active' },
      { id: 'R3', label: 'R3', ip: '172.16.3.1', x: 740, y: 270, status: 'active' },
      { id: 'R4', label: 'R4', ip: '172.16.4.1', x: 540, y: 400, status: 'active' },
      { id: 'R5', label: 'R5', ip: '172.16.5.1', x: 260, y: 400, status: 'active' },
      { id: 'R6', label: 'R6', ip: '172.16.6.1', x: 120, y: 270, status: 'active' }
    ],
    links: [
      { id: 'R1-R2', source: 'R1', target: 'R2', cost: 2, status: 'active', sourceInterface: 'eth0', targetInterface: 'eth0' },
      { id: 'R2-R3', source: 'R2', target: 'R3', cost: 3, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R3-R4', source: 'R3', target: 'R4', cost: 2, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R4-R5', source: 'R4', target: 'R5', cost: 4, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R5-R6', source: 'R5', target: 'R6', cost: 3, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R6-R1', source: 'R6', target: 'R1', cost: 2, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth1' },
      { id: 'R2-R5', source: 'R2', target: 'R5', cost: 8, status: 'active', sourceInterface: 'eth2', targetInterface: 'eth2' }
    ]
  },
  {
    id: 'enterprise-mesh',
    name: 'Enterprise Dual-Core Mesh',
    description: 'High-availability multi-tiered topology with Core, Distribution, and Edge routers with diverse link weights.',
    defaultSource: 'R1',
    defaultDestination: 'R6',
    routers: [
      { id: 'R1', label: 'Edge-1', ip: '192.168.10.1', x: 160, y: 260, status: 'active' },
      { id: 'R2', label: 'Core-A', ip: '192.168.1.1', x: 380, y: 150, status: 'active' },
      { id: 'R3', label: 'Core-B', ip: '192.168.1.2', x: 380, y: 370, status: 'active' },
      { id: 'R4', label: 'Dist-A', ip: '192.168.2.1', x: 620, y: 150, status: 'active' },
      { id: 'R5', label: 'Dist-B', ip: '192.168.2.2', x: 620, y: 370, status: 'active' },
      { id: 'R6', label: 'Edge-2', ip: '192.168.20.1', x: 840, y: 260, status: 'active' }
    ],
    links: [
      { id: 'R1-R2', source: 'R1', target: 'R2', cost: 5, status: 'active', sourceInterface: 'eth0', targetInterface: 'eth0' },
      { id: 'R1-R3', source: 'R1', target: 'R3', cost: 10, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth0' },
      { id: 'R2-R3', source: 'R2', target: 'R3', cost: 2, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth1' },
      { id: 'R2-R4', source: 'R2', target: 'R4', cost: 3, status: 'active', sourceInterface: 'eth2', targetInterface: 'eth0' },
      { id: 'R3-R5', source: 'R3', target: 'R5', cost: 4, status: 'active', sourceInterface: 'eth2', targetInterface: 'eth0' },
      { id: 'R2-R5', source: 'R2', target: 'R5', cost: 9, status: 'active', sourceInterface: 'eth3', targetInterface: 'eth1' },
      { id: 'R4-R5', source: 'R4', target: 'R5', cost: 3, status: 'active', sourceInterface: 'eth1', targetInterface: 'eth2' },
      { id: 'R4-R6', source: 'R4', target: 'R6', cost: 4, status: 'active', sourceInterface: 'eth2', targetInterface: 'eth0' },
      { id: 'R5-R6', source: 'R5', target: 'R6', cost: 6, status: 'active', sourceInterface: 'eth3', targetInterface: 'eth1' }
    ]
  }
];
