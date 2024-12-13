import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './BlockProposal.css'; // Import the CSS file for styling

const BlockProposal = () => {
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState('');
    const [blockData, setBlockData] = useState('');
    const centralServerPort = 5000; // Port of the central server

    // Fetch registered nodes from the central server
    useEffect(() => {
        const fetchNodes = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:${centralServerPort}/public_keys`);
                setNodes(Object.entries(response.data)); // Convert to array of [node_id, public_key]
            } catch (error) {
                console.error('Error fetching nodes:', error);
            }
        };

        fetchNodes();
    }, []);

    // Handle form submission to propose a block
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedNode || !blockData) {
            alert('Please select a node and enter block data.');
            return;
        }

        // Construct the URL for the selected node
        const nodePort = 5000 + parseInt(selectedNode); // Assuming node_id corresponds to the port offset
        const nodeUrl = `http://127.0.0.1:${nodePort}/propose_block`;

        try {
            const response = await axios.post(nodeUrl, {
                node_id: selectedNode, // Include the node_id in the proposal
                block_data: blockData,
            });
            alert('Block proposal sent successfully: ' + response.data.message);
            setBlockData(''); // Clear the input field
        } catch (error) {
            console.error('Error proposing block:', error);
            alert('Failed to propose block: ' + error.response.data.message);
        }
    };

    return (
        <div className="block-proposal-container">
            <h2>Propose a Block</h2>
            <div className="block-proposal-card">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nodeSelect">Select Node</label>
                        <select
                            id="nodeSelect"
                            value={selectedNode}
                            onChange={(e) => setSelectedNode(e.target.value)}
                        >
                            <option value="">Select a Node</option>
                            {nodes.map(([nodeId]) => (
                                <option key={nodeId} value={nodeId}>
                                    {nodeId}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="blockData">Block Data</label>
                        <input
                            type="text"
                            id="blockData"
                            value={blockData}
                            onChange={(e) => setBlockData(e.target.value)}
                            placeholder="Enter block data here"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-button">Propose Block</button>
                </form>
            </div>
        </div>
    );
};

export default BlockProposal;