import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Tabs, Tab, TextField, Button, Paper, Typography, CircularProgress,
  IconButton, Tooltip, Box, Container, ThemeProvider, createTheme, 
  CssBaseline, Snackbar, Alert, Divider, useMediaQuery
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import BuildIcon from '@mui/icons-material/Build';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Create theme with dark mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6',
    },
    secondary: {
      main: '#4db6ac',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 10,
  },
});

// Custom code block renderer component with copy button
const CodeBlock = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <div 
        style={{ 
          position: 'absolute', 
          top: '5px', 
          right: '5px', 
          zIndex: 10 
        }}
      >
        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
          <IconButton 
            size="small" 
            onClick={copyToClipboard} 
            sx={{ 
              bgcolor: alpha('#ffffff', 0.1),
              '&:hover': { bgcolor: alpha('#ffffff', 0.2) },
              color: copied ? '#4db6ac' : '#ffffff'
            }}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <SyntaxHighlighter
        language={language || 'python'}
        style={vscDarkPlus}
        wrapLongLines={true}
        customStyle={{
          margin: 0,
          padding: '1rem',
          paddingTop: '2rem',
          borderRadius: '4px',
          fontSize: '0.9rem',
          fontFamily: '"Fira Code", monospace',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

function App() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('python');
  const [copySuccess, setCopySuccess] = useState(false);
  const [history, setHistory] = useState([]);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Detect language based on code input
  useEffect(() => {
    if (tab !== 2 && input) { // Not for "Generate" tab
      // Simple language detection
      if (input.includes('console.log') || input.includes('function') || input.includes('const ')) {
        setLanguage('javascript');
      } else if (input.includes('import React') || input.includes('function') || input.includes('const ')) {
        setLanguage('jsx');
      } else if (input.includes('def ') || input.includes('import ') || input.includes('class ')) {
        setLanguage('python');
      } else if (input.includes('public class') || input.includes('void main')) {
        setLanguage('java');
      } else if (input.includes('<html') || input.includes('<div')) {
        setLanguage('html');
      } else if (input.includes('{') && input.includes('}') && input.includes(';')) {
        setLanguage('c');
      }
    }
  }, [input, tab]);

  const handleChange = (event, newValue) => {
    setTab(newValue);
    setInput('');
    setOutput('');
    setError('');
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError('Please enter some code or a task description!');
      return;
    }

    const endpoints = ['/explain-code', '/fix-code', '/generate-code'];
    const data = tab === 2 ? { task: input } : { code: input };

    setLoading(true);
    setOutput('');
    setError('');

    try {
      const response = await axios.post(`http://localhost:8000${endpoints[tab]}`, data);
      const key = Object.keys(response.data)[0];
      setOutput(response.data[key]);
      
      // Add to history
      setHistory([...history, { 
        input, 
        output: response.data[key], 
        timestamp: new Date(), 
        type: ['explanation', 'fixed', 'generated'][tab] 
      }]);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearInput = () => {
    setInput('');
  };

  const getTabIcon = (index) => {
    switch(index) {
      case 0: return <CodeIcon />;
      case 1: return <BuildIcon />;
      case 2: return <AutoAwesomeIcon />;
      default: return <CodeIcon />;
    }
  };
  
  const getPlaceholderText = () => {
    switch(tab) {
      case 0: return "Paste your code here to get an explanation...";
      case 1: return "Paste code with errors for AI to fix...";
      case 2: return "Describe the code you want to generate in detail...";
      default: return "Enter your code...";
    }
  };

  // Enhanced markdown renderer for code blocks with syntax highlighting
  const renderers = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <CodeBlock
          language={(match && match[1]) || language}
          value={String(children).replace(/\n$/, '')}
          {...props}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  // Prepare the output for markdown rendering
  const prepareOutput = (text) => {
    // If output already has code blocks, return as is
    if (text.includes('```')) return text;
    
    // Add backticks if it looks like code
    if (tab === 1 || tab === 2) {
      return '```' + language + '\n' + text + '\n```';
    }
    
    return text;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ pt: 4, pb: 8 }}>
        <Paper 
          elevation={8} 
          sx={{ 
            p: 3, 
            borderRadius: 3, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box sx={{ position: 'relative', mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ 
              background: 'linear-gradient(45deg, #64b5f6, #4db6ac)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800
            }}>
              AI Code Assistant
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Explain, Fix, or Generate Code with AI
            </Typography>
          </Box>
          
          <Tabs 
            value={tab} 
            onChange={handleChange} 
            centered
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{ 
              mb: 4,
              '& .MuiTab-root': {
                borderRadius: '50px',
                mx: 1,
                transition: 'all 0.3s',
                fontWeight: 'medium',
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                }
              }
            }}
          >
            <Tab icon={getTabIcon(0)} label="Explain" iconPosition="start" />
            <Tab icon={getTabIcon(1)} label="Fix" iconPosition="start" />
            <Tab icon={getTabIcon(2)} label="Generate" iconPosition="start" />
          </Tabs>
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ 
                p: 2, 
                borderRadius: 2, 
                backgroundColor: alpha(theme.palette.background.default, 0.7),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                height: '100%',
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {tab === 0 ? "Code to Explain" : tab === 1 ? "Code to Fix" : "Task Description"}
                </Typography>
                
                <TextField
                  placeholder={getPlaceholderText()}
                  multiline
                  rows={10}
                  fullWidth
                  variant="outlined"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: alpha(theme.palette.background.default, 0.4),
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.9rem',
                    }
                  }}
                  InputProps={{
                    endAdornment: input && (
                      <IconButton size="small" onClick={clearInput}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                    sx={{ 
                      px: 3, 
                      py: 1, 
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {loading ? 'Processing...' : tab === 0 ? 'Explain' : tab === 1 ? 'Fix' : 'Generate'}
                  </Button>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    {tab === 0 ? "AI analyzes your code" : tab === 1 ? "AI detects & fixes errors" : "AI creates code from your description"}
                  </Typography>
                </Box>
              </Paper>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.background.default, 0.7),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {tab === 0 ? "Explanation" : tab === 1 ? "Fixed Code" : "Generated Code"}
                  </Typography>
                  
                  {output && (
                    <Tooltip title="Copy all output">
                      <IconButton size="small" onClick={copyToClipboard} color={copySuccess ? "success" : "default"}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                
                <Box sx={{ 
                  backgroundColor: '#1e1e1e', 
                  borderRadius: 1,
                  overflow: 'auto',
                  flex: 1,
                  p: 2
                }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert severity="error" sx={{ m: 2, width: '100%' }}>{error}</Alert>
                  ) : output ? (
                    <Box sx={{ color: '#e0e0e0', fontSize: '0.9rem', fontFamily: '"Inter", sans-serif', wordBreak: 'break-word' }}>
                      <ReactMarkdown 
                        components={renderers}
                        remarkPlugins={[remarkGfm]}
                      >
                        {prepareOutput(output)}
                      </ReactMarkdown>
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      p: 3
                    }}>
                      <Box sx={{ 
                        width: '100px', 
                        height: '100px', 
                        mb: 2, 
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }}>
                        {getTabIcon(tab)}
                      </Box>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Your {tab === 0 ? "explanation" : tab === 1 ? "fixed code" : "generated code"} will appear here
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
          
          {history.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">HISTORY</Typography>
              </Divider>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                overflowX: 'auto', 
                pb: 1,
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '4px',
                },
              }}>
                {history.slice(-5).map((item, index) => (
                  <Paper 
                    key={index} 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      minWidth: '200px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                      }
                    }}
                    onClick={() => {
                      setInput(item.input);
                      setOutput(item.output);
                      // Set the appropriate tab
                      if (item.type === 'explanation') setTab(0);
                      else if (item.type === 'fixed') setTab(1);
                      else if (item.type === 'generated') setTab(2);
                    }}
                  >
                    <Typography variant="subtitle2" noWrap>
                      {item.type === 'explanation' ? "Explanation" : 
                       item.type === 'fixed' ? "Fixed Code" : "Generated Code"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }} noWrap>
                      {item.input.slice(0, 30)}...
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              AI Code Assistant v1.0 — Powered by LLM — <GitHubIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> <a href="https://github.com/OmarAminAI/AIassistance_code-frontend" style={{ color: 'inherit', textDecoration: 'underline' }}>GitHub</a>
            </Typography>
          </Box>
          </Paper>
      </Container>
      
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;