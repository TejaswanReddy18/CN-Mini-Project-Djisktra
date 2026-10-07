import { TOPOLOGY_PRESETS } from './src/presets/topologies';
import { runDijkstra } from './src/algorithms/dijkstra';
import { runDistanceVector } from './src/algorithms/bellmanFord';
import { getRouterRoutingTable } from './src/algorithms/routingTable';

console.log('=== ROUTELAB ALGORITHM TEST SUITE ===');

const preset = TOPOLOGY_PRESETS[0];
console.log('Topology loaded:', preset.name);

// Test 1: Dijkstra on initial stable network
const d1 = runDijkstra(preset.routers, preset.links, 'R1', 'R5');
console.log('\n[TEST 1] Dijkstra (Initial Stable):');
console.log('Path:', d1.result.path.join(' -> '));
console.log('Cost:', d1.result.totalCost);
console.log('Hops:', d1.result.hopCount);
console.log('Steps:', d1.steps.length);
if (d1.result.path.join('->') === 'R1->R2->R4->R5' && d1.result.totalCost === 9) {
  console.log('✓ PASS: Optimal route R1 -> R2 -> R4 -> R5 (Cost 9)');
} else {
  console.error('✗ FAIL');
  process.exit(1);
}

// Test 2: Simulate Failure on link R2-R4 (Section 24 scenario)
console.log('\n[TEST 2] Link Failure (R2 <-> R4 Failed):');
const failedLinks = preset.links.map(l => 
  l.id === 'R2-R4' ? { ...l, status: 'failed' as const } : l
);
const d2 = runDijkstra(preset.routers, failedLinks, 'R1', 'R5');
console.log('New Path:', d2.result.path.join(' -> '));
console.log('New Cost:', d2.result.totalCost);
if (d2.result.path.join('->') === 'R1->R3->R4->R5' && d2.result.totalCost === 13) {
  console.log('✓ PASS: Dynamic rerouting selected R1 -> R3 -> R4 -> R5 (Cost 13)');
} else {
  console.error('✗ FAIL');
  process.exit(1);
}

// Test 3: Distance-Vector (Bellman-Ford) convergence
console.log('\n[TEST 3] Distance-Vector (Bellman-Ford):');
const dv = runDistanceVector(preset.routers, preset.links, 'R1', 'R5');
console.log('DV Path:', dv.result.path.join(' -> '));
console.log('DV Cost:', dv.result.totalCost);
console.log('Converged in round:', dv.convergedRound);
if (dv.result.path.join('->') === 'R1->R2->R4->R5' && dv.result.totalCost === 9 && dv.convergedRound <= 3) {
  console.log(`✓ PASS: Distance-Vector converged in ${dv.convergedRound} rounds with cost 9`);
} else {
  console.error('✗ FAIL');
  process.exit(1);
}

// Test 4: Routing Table Generation
console.log('\n[TEST 4] Routing Table for Router R1:');
const table = getRouterRoutingTable('R1', preset.routers, preset.links, 'link-state');
table.forEach(entry => {
  console.log(`  Dest: ${entry.destination} (${entry.destIp}) | NextHop: ${entry.nextHop} | Cost: ${entry.cost} | Iface: ${entry.interfaceName} | ${entry.status}`);
});
const r5Entry = table.find(e => e.destination === 'R5');
if (r5Entry && r5Entry.nextHop === 'R2' && r5Entry.cost === 9) {
  console.log('✓ PASS: R1 routing table correctly forwards R5 to Next Hop R2');
} else {
  console.error('✗ FAIL');
  process.exit(1);
}

// Test 5: Destination Unreachable Test
console.log('\n[TEST 5] Destination Unreachable (Disconnect R5):');
const r5FailedLinks = preset.links.map(l => 
  l.target === 'R5' || l.source === 'R5' ? { ...l, status: 'failed' as const } : l
);
const dUnreach = runDijkstra(preset.routers, r5FailedLinks, 'R1', 'R5');
if (!dUnreach.result.reachable && dUnreach.result.totalCost === Infinity) {
  console.log('✓ PASS: Correctly detected Destination Unreachable');
} else {
  console.error('✗ FAIL');
  process.exit(1);
}

console.log('\n🎉 ALL 5 TEST SUITES PASSED PERFECTLY!');
