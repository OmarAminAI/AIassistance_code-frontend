import React, { useState } from 'react';
import axios from 'axios';
import { Tabs, Tab, TextField, Button, Paper, Typography, Box } from '@mui/material';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function App() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleChange = (event, newValue) => {
    setTab(newValue);
    setInput('');
    setOutput('');
  };

  const handleSubmit = async () => {
    const endpoints = ['/explain-code', '/fix-code', '/generate-code'];
    const data = tab === 2 ? { task: input } : { code: input };

    try {
      const response = await axios.post(`http://localhost:8000${endpoints[tab]}`, data);
      const key = Object.keys(response.data)[0];
      setOutput(response.data[key]);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <Box className="min-h-screen bg-gray-100 p-4" sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: 4 }}>
      <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
        AI Code Assistant
      </Typography>

      <Box className="flex justify-center mb-4">
        <Tabs value={tab} onChange={handleChange} centered>
          <Tab label="Explain" />
          <Tab label="Fix" />
          <Tab label="Generate" />
        </Tabs>
      </Box>

      <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Box>
          <TextField
            label={tab === 2 ? 'Describe what to generate...' : 'Paste your code'}
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2, textTransform: 'none', fontWeight: 'bold' }}
            onClick={handleSubmit}
          >
            Send
          </Button>

          {output && (
            <Paper elevation={4} sx={{ mt: 4, padding: 2, backgroundColor: '#ffffff' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Output:
              </Typography>
              <SyntaxHighlighter language="python" style={github} wrapLongLines={true}>
                {output}
              </SyntaxHighlighter>
            </Paper>
          )}
        </Box>

        <Box className="hidden md:block" sx={{ display: { xs: 'none', md: 'block' } }}>
          {/* يمكنك هنا استرجاع العنصر ثلاثي الأبعاد أو استبداله بصورة إذا أردت */}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
