import React, { useState } from 'react';
import axios from 'axios';
import {
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import Spline from '@splinetool/react-spline';  // يمكن تفعيله لاحقًا

function App() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event, newValue) => {
    setTab(newValue);
    setInput('');
    setOutput('');
    setError('');
  };

  const handleSubmit = async () => {
    const endpoints = ['/explain-code', '/fix-code', '/generate-code'];
    const data = tab === 2 ? { task: input } : { code: input };

    setLoading(true);
    setOutput('');
    setError('');

    try {
      const response = await axios.post(`http://localhost:8000${endpoints[tab]}`, data);
      const key = Object.keys(response.data)[0];
      setOutput(response.data[key]);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Typography variant="h4" align="center" gutterBottom>
        AI Code Assistant
      </Typography>

      <div className="flex justify-center mb-4">
        <Tabs value={tab} onChange={handleChange} centered>
          <Tab label="Explain" />
          <Tab label="Fix" />
          <Tab label="Generate" />
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TextField
            label={tab === 2 ? 'Describe what to generate...' : 'Paste your code'}
            multiline
            rows={5}
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            className="mt-4"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Send'}
          </Button>

<Paper
  elevation={3}
  className="mt-4"
  style={{
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #ddd',
    position: 'relative',
    maxHeight: '400px',
    overflowY: 'auto',
    fontFamily: 'monospace',
  }}
>
  <div className="flex justify-between items-center mb-2">
    <Typography variant="h6" style={{ color: '#3f51b5' }}>
      Output:
    </Typography>
    {output && (
      <Tooltip title="Copy to clipboard">
        <IconButton size="small" onClick={copyToClipboard}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
  </div>

  {error ? (
    <Typography variant="body1" style={{ color: 'red' }}>
      {error}
    </Typography>
  ) : output ? (
    <SyntaxHighlighter
      language="python"
      style={github}
      wrapLongLines={true}
      customStyle={{
        backgroundColor: 'transparent',
        fontSize: '14px',
        padding: '8px',
        borderRadius: '8px',
      }}
    >
      {output}
    </SyntaxHighlighter>
  ) : (
    <Typography variant="body2" color="textSecondary">
      No output yet.
    </Typography>
  )}
</Paper>

        </div>

        {/* <div className="hidden md:block">
          <Spline scene="https://prod.spline.design/6hYVsvBTm7uHpOQf/scene.splinecode" />
        </div> */}
      </div>
    </div>
  );
}

export default App;
