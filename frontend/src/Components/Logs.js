import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const Logs = () => {
    const [nodes, setNodes] = useState([]);
    const [logs, setLogs] = useState({});
    const [loading, setLoading] = useState(false); // To track loading state
    const [socketError, setSocketError] = useState(null); // To handle socket errors

    const centralServerPort = 5000; // Port of the central server

    // Function to fetch registered nodes from the central server
    const fetchNodes = async () => {
        try {
            const response = await axios.get(`http://127.0.0.1:${centralServerPort}/public_keys`);
            setNodes(Object.entries(response.data)); // Convert to array of [node_id, public_key]
            console.log(response.data);
        } catch (error) {
            console.log('Error fetching nodes:', error);
        }
    };

    // Function to fetch logs for a specific node
    const fetchLogs = async (nodeId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:${centralServerPort}/node_logs/${nodeId}`);
            setLogs((prevLogs) => ({
                ...prevLogs,
                [nodeId]: response.data,
            }));
            console.log(response.data);
        } catch (error) {
            console.error(`Error fetching logs for node ${nodeId}:`, error);
        }
    };

    // Function to fetch both nodes and their logs
    const fetchData = async () => {
        setLoading(true);

        try {
            const serverLogsResponse = await axios.get(`http://127.0.0.1:${centralServerPort}/logs`);
            setLogs((prevLogs) => ({
                ...prevLogs,
                central: serverLogsResponse.data.central_logs, // Assign the central logs correctly
            }));
            console.log(serverLogsResponse.data);
        } catch (error) {
            console.error('Error fetching central server logs:', error);
        }

        try {
            await fetchNodes(); // Fetch nodes first
            // Wait for nodes to be set before fetching logs
            await Promise.all(nodes.map(([nodeId]) => fetchLogs(nodeId))); // Fetch logs for each node
        } catch (fetchError) {
            console.error('Error fetching nodes or their logs:', fetchError);
        }

        setLoading(false);
    };

    // Initialize the Socket.IO client
    useEffect(() => {
        const socket = io(`http://127.0.0.1:${centralServerPort}`, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        // Handle socket connection errors
        socket.on('connect_error', () => {
            setSocketError('Error connecting to server. Retrying...');
        });

        socket.on('connect', () => {
            setSocketError(null); // Clear any connection errors once connected
        });

        // Handle initial logs from the server
        const handleInitialLogs = (initialLogs) => {
            setLogs((prevLogs) => ({
                ...prevLogs,
                central: initialLogs.central_logs || [], // Ensure central logs are added
            }));
        };

        // Dynamic event listeners for central server logs
        const handleServerLogUpdate = (log) => {
            setLogs((prevLogs) => ({
                ...prevLogs,
                central: prevLogs.central ? [...prevLogs.central, log] : [log],
            }));
        };

        const handleNodeLogUpdate = (data) => {
            console.log("Node Log Update: ", data)
            const { node_id, log } = data;
            setLogs((prevLogs) => ({
                ...prevLogs,
                [node_id]: prevLogs[node_id] ? [...prevLogs[node_id], log] : [log],
            }));
        };

        // Add event listeners
        socket.on('server_logs', handleInitialLogs);
        socket.on('server_log_update', handleServerLogUpdate);
        socket.on('node_log_update', handleNodeLogUpdate);

        // Cleanup on component unmount
        return () => {
            socket.off('server_log_update', handleServerLogUpdate);
            socket.off('node_log_update', handleNodeLogUpdate);
            socket.close();
        };
    }, [centralServerPort]);

    // Refresh data on button click
    const handleRefresh = () => {
        setLogs({});
        fetchData(); // Re-fetch the nodes and logs
    };

    useEffect(()=>{
        fetchNodes()
    },[])

    return (
        <>
            <div
                style={{
                    marginTop: '20px',
                    width: '100%',
                    paddingTop: '10px',
                }}
            >
                <h2>Central Server Logs:</h2>
                    {logs.central && logs.central.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto', "border": "2px solid #ccc", padding: "20px" }}>
                        {logs.central.map((log, index) => (
                            <div
                                key={index}
                                style={{
                                    marginBottom: '10px',
                                    padding: '5px',
                                    backgroundColor: '#f1f1f1',
                                    borderRadius: '4px',
                                }}
                            >
                                <p>{log}</p>
                                <small>Server Log</small>
                            </div>
                        ))}
                </div>
                    ) : (
                        <p style={{height: "200px", display: "flex", "justifyContent" : "center", "alignItems": "center", "backgroundColor": "#ededed"}}>No logs available for the central server.</p>
                    )}
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap', // Allow wrapping to the next line
                    justifyContent: 'space-between', // Space between cards
                    margin: '20px 0', // Add some margin
                }}
            >
                {nodes.map(([nodeId, publicKey]) => (
                    <div
                        key={nodeId}
                        style={{
                            margin: '10px',
                            width: 'calc(50% - 20px)', // Two cards per row with some margin
                            border: '1px solid #ccc',
                            padding: '20px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)', // Optional: Add shadow for better visibility
                            backgroundColor: '#fff', // Optional: Set background color
                        }}
                    >
                        <h3>Node ID: {nodeId}</h3>
                        <p>
                            <strong>Public Key:</strong> {publicKey.slice(0, 10)}...
                        </p>
                        <h4>Logs:</h4>
                        <br></br>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {logs[nodeId] && logs[nodeId].length > 0 ? (
                                logs[nodeId].map((log, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            marginBottom: '10px',
                                            padding: '5px',
                                            backgroundColor: '#f1f1f1',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <p>{log.log}</p>
                                        <small>
                                            {log.log_type === 'node' ? 'Node Log' : 'Server Log'}
                                        </small>
                                    </div>
                                ))
                            ) : (
                                <p>No logs available for this node.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Logs;