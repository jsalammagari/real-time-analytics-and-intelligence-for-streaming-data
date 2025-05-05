import React, { useState } from 'react';
import { Box, TextField, Typography, Button, Divider, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { INTELLIGENCE_URL } from '../config'

const IntelligenceAssistant = ({ source }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch(INTELLIGENCE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, source }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply || 'No response.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: '❌ Failed to contact AI.' }]);
    }

    setInput('');
  };

  if (!isOpen) return (
    <Box
      sx={{
        position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
        zIndex: 1000, backgroundColor: '#1976d2', padding: '8px', borderTopRightRadius: 12, borderBottomRightRadius: 12
      }}
    >
      <Button variant="contained" onClick={() => setIsOpen(true)}>AI</Button>
    </Box>
  );

  return (
    <Paper elevation={4}
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        zIndex: 1300,
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #ddd',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">🤖 Ask AI</Typography>
        <IconButton size="small" onClick={() => setIsOpen(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', mb: 1 }}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              textAlign: msg.sender === 'user' ? 'right' : 'left',
              mb: 1,
              whiteSpace: 'pre-wrap'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                display: 'inline-block',
                backgroundColor: msg.sender === 'user' ? '#1976d2' : '#eee',
                color: msg.sender === 'user' ? '#fff' : '#000',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
              }}
            >
              {msg.text}
            </Typography>
          </Box>
        ))}
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Ask a question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
      />
      <Button fullWidth onClick={sendMessage} sx={{ mt: 1, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark', color: 'white'} }} variant="contained">
        Send
      </Button>
    </Paper>
  );
};

export default IntelligenceAssistant;