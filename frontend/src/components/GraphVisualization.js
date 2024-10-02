// frontend/src/components/GraphVisualization.js

import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph';
import axios from 'axios';

const GraphVisualization = () => {
  const [data, setData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    const fetchGraphData = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/graph-data', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div>
      <h2>Graph Visualization</h2>
      <ForceGraph2D
        graphData={data}
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        width={800}
        height={600}
      />
    </div>
  );
};

export default GraphVisualization;
