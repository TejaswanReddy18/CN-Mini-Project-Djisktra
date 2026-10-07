import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  RouterNode, 
  NetworkLink, 
  RoutingAlgorithm, 
  ShortestPathResult, 
  DijkstraStep, 
  DVRound, 
  PacketSimulation, 
  SimulationEvent 
} from './types/network';
import { TOPOLOGY_PRESETS } from './presets/topologies';
import { runDijkstra } from './algorithms/dijkstra';
import { runDistanceVector } from './algorithms/bellmanFord';

// UI Components
import { Header } from './components/Header';
import { NetworkCanvas } from './components/NetworkCanvas';
import { ControlsPanel } from './components/ControlsPanel';
import { DijkstraStepper } from './components/DijkstraStepper';
import { DVRoundViewer } from './components/DVRoundViewer';
import { RoutingTableModal } from './components/RoutingTableModal';
import { PacketInspector } from './components/PacketInspector';
import { FailureManager } from './components/FailureManager';
import { ComparisonModal } from './components/ComparisonModal';
import { EditLinkModal } from './components/EditLinkModal';
import { EventLog } from './components/EventLog';

export function App() {
  // Initialize with Section 24 Default Demo Scenario
  const defaultPreset = TOPOLOGY_PRESETS[0];

  const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
  const [routers, setRouters] = useState<RouterNode[]>(defaultPreset.routers);
  const [links, setLinks] = useState<NetworkLink[]>(defaultPreset.links);

  const [sourceId, setSourceId] = useState<string>(defaultPreset.defaultSource);
  const [destinationId, setDestinationId] = useState<string>(defaultPreset.defaultDestination);
  const [algorithm, setAlgorithm] = useState<RoutingAlgorithm>('link-state');

  const [selectedRouterId, setSelectedRouterId] = useState<string | null>(null);

  // Routing Results
  const [pathResult, setPathResult] = useState<ShortestPathResult | null>(null);
  const [previousPath, setPreviousPath] = useState<ShortestPathResult | null>(null);

  // Step-by-Step Steppers
  const [isStepperOpen, setIsStepperOpen] = useState<boolean>(false);
  const [dijkstraSteps, setDijkstraSteps] = useState<DijkstraStep[]>([]);
  const [currentDijkstraStepIndex, setCurrentDijkstraStepIndex] = useState<number>(0);

  const [dvRounds, setDvRounds] = useState<DVRound[]>([]);
  const [convergedRound, setConvergedRound] = useState<number>(0);
  const [currentDVRoundIndex, setCurrentDVRoundIndex] = useState<number>(0);

  // Packet Forwarding Animation State
  const [packetState, setPacketState] = useState<PacketSimulation | null>(null);
  const [isPacketSending, setIsPacketSending] = useState<boolean>(false);
  const packetAnimRef = useRef<number | null>(null);

  // Modals & UI Modes
  const [isAddLinkMode, setIsAddLinkMode] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isRoutingTableModalOpen, setIsRoutingTableModalOpen] = useState<boolean>(false);
  const [editingLink, setEditingLink] = useState<NetworkLink | null>(null);

  // Event Log Stream
  const [events, setEvents] = useState<SimulationEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'topology',
      message: 'RouteLab initialized with Classic 5-Router topology (Section 24).'
    }
  ]);

  const addEvent = useCallback((type: SimulationEvent['type'], message: string) => {
    setEvents(prev => [
      {
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
      },
      ...prev.slice(0, 75) // retain latest 75 events
    ]);
  }, []);

  // Compute Routes
  const computeRoute = useCallback((currentRouters = routers, currentLinks = links, algo = algorithm, src = sourceId, dst = destinationId) => {
    if (algo === 'link-state') {
      const { result, steps } = runDijkstra(currentRouters, currentLinks, src, dst);
      setDijkstraSteps(steps);
      setCurrentDijkstraStepIndex(steps.length - 1); // point to end by default

      setPathResult(prev => {
        if (prev && prev.path.join('-') !== result.path.join('-')) {
          setPreviousPath(prev);
        }
        return result;
      });

      return result;
    } else {
      const { result, rounds, convergedRound: conv } = runDistanceVector(currentRouters, currentLinks, src, dst);
      setDvRounds(rounds);
      setConvergedRound(conv);
      setCurrentDVRoundIndex(rounds.length - 1);

      setPathResult(prev => {
        if (prev && prev.path.join('-') !== result.path.join('-')) {
          setPreviousPath(prev);
        }
        return result;
      });

      return result;
    }
  }, [routers, links, algorithm, sourceId, destinationId]);

  // Recalculate route whenever topology or algorithm changes
  useEffect(() => {
    computeRoute();
  }, [computeRoute]);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = TOPOLOGY_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActivePresetId(preset.id);
    setRouters(preset.routers);
    setLinks(preset.links);
    setSourceId(preset.defaultSource);
    setDestinationId(preset.defaultDestination);
    setSelectedRouterId(null);
    setPreviousPath(null);
    setIsStepperOpen(false);
    setPacketState(null);

    addEvent('topology', `Loaded preset topology: ${preset.name}`);
  };

  // Add Router
  const handleAddRouter = () => {
    const nextIndex = routers.length + 1;
    const newId = `R${nextIndex}`;
    const newRouter: RouterNode = {
      id: newId,
      label: newId,
      ip: `10.0.${nextIndex}.1`,
      x: 200 + Math.floor(Math.random() * 450),
      y: 180 + Math.floor(Math.random() * 200),
      status: 'active'
    };

    setRouters(prev => [...prev, newRouter]);
    setActivePresetId('custom');
    addEvent('topology', `Added new router ${newId} (${newRouter.ip}) to network.`);
  };

  // Create Link between two routers
  const handleCreateLink = (srcId: string, tgtId: string, cost = 3) => {
    // Check if link already exists
    const exists = links.some(
      l => (l.source === srcId && l.target === tgtId) || (l.source === tgtId && l.target === srcId)
    );
    if (exists) {
      addEvent('topology', `Link between ${srcId} and ${tgtId} already exists.`);
      setIsAddLinkMode(false);
      return;
    }

    const newLink: NetworkLink = {
      id: `${srcId}-${tgtId}`,
      source: srcId,
      target: tgtId,
      cost,
      status: 'active',
      sourceInterface: `eth${Math.floor(Math.random() * 3)}`,
      targetInterface: `eth${Math.floor(Math.random() * 3)}`
    };

    setLinks(prev => [...prev, newLink]);
    setIsAddLinkMode(false);
    setActivePresetId('custom');
    addEvent('topology', `Connected link ${srcId} ↔ ${tgtId} with cost ${cost}.`);
  };

  // Update Router Position
  const handleUpdateRouterPosition = (routerId: string, x: number, y: number) => {
    setRouters(prev => prev.map(r => r.id === routerId ? { ...r, x, y } : r));
  };

  // Toggle Router Failure
  const handleToggleRouterFailure = (routerId: string) => {
    setRouters(prev => {
      const updated = prev.map(r => {
        if (r.id === routerId) {
          const nextStatus = r.status === 'active' ? 'failed' : 'active';
          addEvent('failure', `Router ${r.label} hardware status changed to: ${nextStatus.toUpperCase()}`);
          return { ...r, status: nextStatus as RouterNode['status'] };
        }
        return r;
      });
      return updated;
    });
  };

  // Delete Router
  const handleDeleteRouter = (routerId: string) => {
    setRouters(prev => prev.filter(r => r.id !== routerId));
    setLinks(prev => prev.filter(l => l.source !== routerId && l.target !== routerId));
    if (selectedRouterId === routerId) setSelectedRouterId(null);
    if (sourceId === routerId) setSourceId(routers.find(r => r.id !== routerId)?.id || '');
    if (destinationId === routerId) setDestinationId(routers.find(r => r.id !== routerId)?.id || '');
    addEvent('topology', `Removed router ${routerId} and its associated links.`);
  };

  // Toggle Link Failure
  const handleToggleLinkFailure = (linkId: string) => {
    setLinks(prev => {
      const updated = prev.map(l => {
        if (l.id === linkId) {
          const nextStatus = l.status === 'active' ? 'failed' : 'active';
          addEvent('failure', `Network Link ${l.source} ↔ ${l.target} changed to: ${nextStatus.toUpperCase()}`);
          return { ...l, status: nextStatus as NetworkLink['status'] };
        }
        return l;
      });
      return updated;
    });
  };

  // Update Link Cost
  const handleUpdateLinkCost = (linkId: string, newCost: number) => {
    setLinks(prev => prev.map(l => {
      if (l.id === linkId) {
        addEvent('topology', `Updated link ${l.source} ↔ ${l.target} metric cost from ${l.cost} to ${newCost}.`);
        return { ...l, cost: newCost };
      }
      return l;
    }));
  };

  // Delete Link
  const handleDeleteLink = (linkId: string) => {
    setLinks(prev => prev.filter(l => l.id !== linkId));
    addEvent('topology', `Deleted link ${linkId}.`);
  };

  // Restore All Failures
  const handleRestoreAll = () => {
    setRouters(prev => prev.map(r => ({ ...r, status: 'active' })));
    setLinks(prev => prev.map(l => ({ ...l, status: 'active' })));
    addEvent('failure', 'Restored all routers and links to ACTIVE status.');
  };

  // Execute Demo Scenario (Section 24: Fail Link R2-R4)
  const handleSimulateDemoScenario = () => {
    const demoLink = links.find(l => (l.source === 'R2' && l.target === 'R4') || (l.source === 'R4' && l.target === 'R2'));
    if (demoLink) {
      handleToggleLinkFailure(demoLink.id);
      addEvent('failure', 'SIMULATING SECTION 24: Disabled link R2 ↔ R4. Triggering dynamic reroute via R3!');
    } else {
      addEvent('failure', 'Link R2 ↔ R4 not found in current network. Please switch to "Classic Demo" preset.');
    }
  };

  // Reset Simulation
  const handleResetTopology = () => {
    handleSelectPreset('demo-scenario');
    setPreviousPath(null);
    addEvent('topology', 'Reset topology to initial demo state.');
  };

  // Send Packet Animation
  const handleSendPacket = () => {
    if (!pathResult || !pathResult.reachable || pathResult.path.length < 2) return;

    if (packetAnimRef.current) {
      cancelAnimationFrame(packetAnimRef.current);
    }

    const path = pathResult.path;
    const packetId = `PKT-${Math.floor(1000 + Math.random() * 9000)}`;

    addEvent('packet', `Injected ${packetId} at ${sourceId} destined for ${destinationId} via ${path.join(' → ')}`);
    setIsPacketSending(true);

    const initialPacket: PacketSimulation = {
      id: packetId,
      source: sourceId,
      destination: destinationId,
      path,
      currentHopIndex: 0,
      currentRouter: path[0],
      nextRouter: path[1],
      progress: 0,
      ttl: 64,
      totalCost: pathResult.totalCost,
      status: 'in_transit',
      protocol: 'IPv4 Data',
      payload: 'GET /index.html HTTP/1.1'
    };

    setPacketState(initialPacket);

    let hopIndex = 0;
    let progress = 0;
    const speed = 0.02; // speed per animation frame

    const stepAnimation = () => {
      progress += speed;

      if (progress >= 1) {
        // Hop reached
        hopIndex++;
        if (hopIndex >= path.length - 1) {
          // Delivered to destination!
          setPacketState({
            ...initialPacket,
            currentHopIndex: hopIndex,
            currentRouter: path[hopIndex],
            nextRouter: null,
            progress: 1,
            ttl: 64 - hopIndex,
            status: 'delivered'
          });
          setIsPacketSending(false);
          addEvent('packet', `${packetId} arrived at destination ${destinationId} successfully. TTL: ${64 - hopIndex}`);
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
          return;
        } else {
          // Intermediate hop
          progress = 0;
          addEvent('packet', `${packetId} forwarded by ${path[hopIndex]} to next hop ${path[hopIndex + 1]}`);
        }
      }

      setPacketState({
        ...initialPacket,
        currentHopIndex: hopIndex,
        currentRouter: path[hopIndex],
        nextRouter: path[hopIndex + 1],
        progress,
        ttl: 64 - hopIndex,
        status: 'in_transit'
      });

      packetAnimRef.current = requestAnimationFrame(stepAnimation);
    };

    packetAnimRef.current = requestAnimationFrame(stepAnimation);
  };

  // Clean animation frame on unmount
  useEffect(() => {
    return () => {
      if (packetAnimRef.current) cancelAnimationFrame(packetAnimRef.current);
    };
  }, []);

  // Stats
  const activeRoutersCount = routers.filter(r => r.status === 'active').length;
  const activeLinksCount = links.filter(l => l.status === 'active').length;
  const failedLinksCount = links.filter(l => l.status === 'failed').length;

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        onSelectPreset={handleSelectPreset}
        onAddRouter={handleAddRouter}
        isAddLinkMode={isAddLinkMode}
        onToggleAddLinkMode={() => setIsAddLinkMode(!isAddLinkMode)}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenAllTables={() => {
          setSelectedRouterId(sourceId);
          setIsRoutingTableModalOpen(true);
        }}
        onResetTopology={handleResetTopology}
        totalRouters={routers.length}
        activeRouters={activeRoutersCount}
        totalLinks={links.length}
        activeLinks={activeLinksCount}
        failedLinks={failedLinksCount}
        isConverged={Boolean(pathResult?.reachable)}
        activePresetId={activePresetId}
      />

      {/* Main Grid: Network Canvas + Side Inspector Panel */}
      <main className="main-content">
        {/* Left Section: Interactive Network Topology Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '8px', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
            <NetworkCanvas
              routers={routers}
              links={links}
              sourceId={sourceId}
              destinationId={destinationId}
              selectedRouterId={selectedRouterId}
              activePathNodes={pathResult?.path || []}
              activePathLinkIds={pathResult?.linkIds || []}
              activeDijkstraStep={
                isStepperOpen && algorithm === 'link-state'
                  ? dijkstraSteps[currentDijkstraStepIndex] || null
                  : null
              }
              packetState={packetState}
              isAddLinkMode={isAddLinkMode}
              onSelectRouter={(rId) => setSelectedRouterId(rId)}
              onSetSource={(rId) => {
                setSourceId(rId);
                addEvent('routing', `Set source router to ${rId}.`);
              }}
              onSetDestination={(rId) => {
                setDestinationId(rId);
                addEvent('routing', `Set destination router to ${rId}.`);
              }}
              onToggleRouterFailure={handleToggleRouterFailure}
              onDeleteRouter={handleDeleteRouter}
              onUpdateRouterPosition={handleUpdateRouterPosition}
              onToggleLinkFailure={handleToggleLinkFailure}
              onEditLink={(link) => setEditingLink(link)}
              onCreateLink={handleCreateLink}
              onSendPacket={handleSendPacket}
            />
          </div>

          {/* Stepper Drawer (When opened) */}
          {isStepperOpen && algorithm === 'link-state' && (
            <DijkstraStepper
              steps={dijkstraSteps}
              currentStepIndex={currentDijkstraStepIndex}
              onStepChange={(idx) => setCurrentDijkstraStepIndex(idx)}
              onClose={() => setIsStepperOpen(false)}
            />
          )}

          {isStepperOpen && algorithm === 'distance-vector' && (
            <DVRoundViewer
              rounds={dvRounds}
              convergedRound={convergedRound}
              currentRoundIndex={currentDVRoundIndex}
              onRoundChange={(idx) => setCurrentDVRoundIndex(idx)}
              onClose={() => setIsStepperOpen(false)}
            />
          )}

          {/* Live Packet Telemetry Card */}
          {packetState && (
            <PacketInspector
              packet={packetState}
              onSendAnother={handleSendPacket}
              onClose={() => setPacketState(null)}
            />
          )}

          {/* Real-time Syslog & Event Stream */}
          <EventLog events={events} onClearEvents={() => setEvents([])} />
        </div>

        {/* Right Section: Controls, Failure Manager, Diagnostics */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ControlsPanel
            routers={routers}
            sourceId={sourceId}
            destinationId={destinationId}
            algorithm={algorithm}
            pathResult={pathResult}
            previousPath={previousPath}
            isStepperOpen={isStepperOpen}
            isPacketSending={isPacketSending}
            onSelectAlgorithm={(algo) => {
              setAlgorithm(algo);
              addEvent('routing', `Switched routing engine to: ${algo === 'link-state' ? 'OSPF / Link-State (Dijkstra)' : 'RIP / Distance-Vector (Bellman-Ford)'}`);
            }}
            onChangeSource={(id) => {
              setSourceId(id);
              addEvent('routing', `Changed Source endpoint to: ${id}`);
            }}
            onChangeDestination={(id) => {
              setDestinationId(id);
              addEvent('routing', `Changed Destination endpoint to: ${id}`);
            }}
            onCalculateRoute={() => {
              computeRoute();
              addEvent('routing', `Manual route recalculation triggered.`);
            }}
            onToggleStepper={() => setIsStepperOpen(!isStepperOpen)}
            onSendPacket={handleSendPacket}
          />

          {/* Network Failure Simulator */}
          <FailureManager
            routers={routers}
            links={links}
            onToggleLinkFailure={handleToggleLinkFailure}
            onToggleRouterFailure={handleToggleRouterFailure}
            onRestoreAll={handleRestoreAll}
            onSimulateDemoScenario={handleSimulateDemoScenario}
          />
        </aside>
      </main>

      {/* Modals */}
      {isRoutingTableModalOpen && (
        <RoutingTableModal
          routers={routers}
          links={links}
          initialRouterId={selectedRouterId || sourceId}
          algorithm={algorithm}
          onClose={() => setIsRoutingTableModalOpen(false)}
        />
      )}

      {isComparisonOpen && (
        <ComparisonModal
          routers={routers}
          links={links}
          sourceId={sourceId}
          destinationId={destinationId}
          onClose={() => setIsComparisonOpen(false)}
        />
      )}

      {editingLink && (
        <EditLinkModal
          link={editingLink}
          onUpdateCost={handleUpdateLinkCost}
          onToggleFailure={handleToggleLinkFailure}
          onDeleteLink={handleDeleteLink}
          onClose={() => setEditingLink(null)}
        />
      )}
    </div>
  );
}

export default App;
