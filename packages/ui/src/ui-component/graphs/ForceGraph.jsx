import { useRef, useEffect, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'

// ===========================|| FORCE GRAPH ||=========================== //

/**
 * ForceGraph Component
 * 
 * Renders a 3D force-directed graph visualization.
 * Based on the example from: https://github.com/vasturiano/react-force-graph/blob/master/example/large-graph/index.html
 * 
 * The component:
 * 1. Loads graph data from a local JSON file
 * 2. Renders a 3D force-directed graph with the data
 * 3. Applies visual styling like auto-coloring nodes and directional particles
 */
const ForceGraph = () => {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState(null);
  
  // Load graph data
  useEffect(() => {
    // Import the JSON data
    import('@/ui-component/graphs/datasets.json')
      .then(data => {
        setGraphData(data.default);
      })
      .catch(err => {
        console.error("Failed to load graph data:", err);
      });
  }, []);
  
  // Set up camera orbit animation
  useEffect(() => {
    if (!fgRef.current || !graphData) return;
    
    const distance = 800;
    fgRef.current.cameraPosition({ z: distance });
    
    // Camera orbit animation
    let angle = 0;
    let isInteracting = false;
    const interval = setInterval(() => {
      if (fgRef.current && !isInteracting) {
        fgRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle)
        });
        
        // ROTATION SPEED: Controls how fast the camera orbits around the graph
        // Smaller values = slower rotation, Larger values = faster rotation
        angle += Math.PI / 800; // Increment angle by ~0.6 degrees per frame
      }
    }, 10);
    
    const handleInteraction = () => {
      isInteracting = true;
      clearInterval(interval);
    };
    
    fgRef.current.controls().addEventListener('start', handleInteraction);
    
    return () => {
      clearInterval(interval);
      if (fgRef.current && fgRef.current.controls()) {
        fgRef.current.controls().removeEventListener('start', handleInteraction);
      }
    };
  }, [graphData]);
  
  // Don't render until data is loaded
  if (!graphData) return null;
  
  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={graphData}
      //nodeLabel={node => node.user ? `${node.user}: ${node.description || ''}` : node.id}
      nodeAutoColorBy="user"
      linkDirectionalParticles={1}
      enableNodeDrag={false}
      enableNavigationControls={true}
      showNavInfo={false}
      backgroundColor="#1a1a2e"
 
      controlType="trackball"
      enableZoomInteraction={true}
    />
  );
};

export default ForceGraph;