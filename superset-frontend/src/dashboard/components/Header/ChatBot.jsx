import React, { useEffect, useState, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import Grow from '@mui/material/Grow';
import axios from 'axios';
import { queries } from '@testing-library/dom';
import { callApi } from '@superset-ui/core';
import TypingText from './TypingText';
import DsenseTable from './DsenseTable';
import TypingText2 from './TypingText2';
import DsenseLogo from '../../../assets/images/icons/dsense-logo-sm.svg?react';

const CORTEX_ENDPOINT_NEW = window.featureFlags.CORTEX_ENPOINT;
const COSMOS_URL = window.featureFlags.COSMOS_ENDPOINT;
const LOGIN_PASSWORD = window.featureFlags.LOGIN_PASSWORD;

const CORTEX_INTERNAL_TOKEN = window.featureFlags.CORTEX_INTERNAL_TOKEN;
const promptTemplate = window.featureFlags.PROMPT_TEMPLATE;
const labelIds = window.featureFlags.DEFAULT_LABELIDS;

const ChatButton = styled(Button)(({ theme }) => ({
  minWidth: 'unset',
  padding: theme.spacing(0.5),
  sx: {
    borderRadius: 3,
    position: 'fixed',
    bottom: { xs: 8, sm: 24 },
    right: { xs: 8, sm: 24 },
    m: 0,
    width: { xs: 'calc(100% - 16px)', sm: '400px' },
    height: '70vh',
    maxHeight: 'calc(100% - 30px)',
    overflow: 'hidden',
    boxShadow: 10,
    border: '1px solid #E0E0E0',
  },
  borderRadius: '50%',
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 2000,
  boxShadow: theme.shadows[6],
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.shadows[8],
  },
  transition: 'transform 0.2s, box-shadow 0.2s',
}));

const ChatIconWrapper = styled('div')(({ theme }) => ({
  backgroundColor: 'rgb(177, 140, 255)',
  borderRadius: '50%',
  padding: theme.spacing(1.5),
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}));

const MessageBubble = styled(Paper)(({ theme, sender, charts }) => ({
  padding: theme.spacing(1.5),
  borderRadius: sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
  backgroundColor: charts ? 'white' : 'rgb(157 111 255)',
  color: charts ? '' : 'white',
  boxShadow: theme.shadows[2],
  fontSize: '0.95rem',
  lineHeight: 1.6,
}));

const MessageBubbleBot = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1.5),
  borderRadius: sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
  backgroundColor: sender === 'user' ? 'white' : 'white',
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[2],
  fontSize: '0.95rem',
  lineHeight: 1.6,
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(1),
  overflowY: 'auto',
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: 'white',
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Grow ref={ref} {...props} />;
});

const GreetingBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '16px 16px 0 16px', // user-style shape
  background: '#f3f0ff', // lavender
  color: '#4a2c82', // purple text
  boxShadow: theme.shadows[1],
  fontSize: '0.95rem',
  lineHeight: 1.5,

  textAlign: 'left',
}));

// Logout Dialog Component
const LogoutDialog = ({ open, onClose, onConfirm, isLoggingOut }) => {
  React.useEffect(() => {
    if (open) {
      onConfirm();
    }
  }, [open, onConfirm]);

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing during logout process
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-description"
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle id="logout-dialog-title" style={{ textAlign: 'center' }}>
        Session Expired
      </DialogTitle>
      <DialogContent style={{ padding: '20px 24px' }}>
        <DialogContentText
          id="logout-dialog-description"
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          Your session has expired. Logging out...
        </DialogContentText>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={20} />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default function ChatBotDialog({ dashboardId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const [dashBoardChart, setDashboardCharts] = useState(null);
  const [dashBoardChartResponse, setDashboardChartsResponse] = useState(null);
  const [dashBoardChartError, setDashboardChartsError] = useState(null);

  const [chartSql, setChartSql] = useState(null);
  const [dataSourceId, setDatasourceId] = useState(null);
  const [chartSqlError, setChartSqlError] = useState(null);
  const [selectedChart, setSelectedChart] = useState(null);
  const [alertContent, setAlertContent] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [loginToken, setLoginToken] = useState(null);
  const [datasetId, setDatasetId] = useState(null);

  useEffect(() => {
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }

    const token = getCookie('token');
    const hasBearerToken = token?.startsWith('Bearer ') ?? false;
    if (!hasBearerToken) {
      const loginToDsense = async () => {
        try {
          await axios.get(`${SUPERSET_URL}/dsense/login`, {
            withCredentials: true,
          });
        } catch (error) {
          window.location.href = '/logout';
        }
      };

      loginToDsense();
    }
  }, []);

  // Logout dialog states
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const SUPERSET_URL = `${window.location.origin}/api/v1`;

  // Logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Clear all local state
      setLoginToken(null);
      // setUserEmail(null);
      setMessages([]);
      setDatasetId(null);

      // Wait a moment to show the logging out message
      setTimeout(() => {
        setIsLoggingOut(false);
        setShowLogoutDialog(false);

        // Redirect to login page or reload the page
        window.location.href = '/logout'; // or window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);

      // Even if logout API fails, redirect to login
      setTimeout(() => {
        setShowLogoutDialog(false);
        window.location.href = '/logout';
      }, 1000);
    }
  };

  // Function to trigger logout dialog
  const triggerLogout = () => {
    setShowLogoutDialog(true);
  };

  const sendDataset = async () => {
    let labelIdsVar = [];
    let tablesDefault = [];
    if (labelIds) {
      labelIdsVar = labelIdsVar;
    }
    const payload = {
      catalogs: [],
      schemas: [],
      tables: labelIds,
      label_ids: [],
    };

    try {
      let userName = null;
      await axios.get(`${SUPERSET_URL}/me`).then(response => {
        userName = response.data?.result?.first_name;
      });

      const data = await callApi({
        parseMethod: 'json',
        url: `${CORTEX_ENDPOINT_NEW}/chat/`,
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        jsonPayload: payload,
      });
      setDatasetId(data.json.id);

      const capitalizeName = name =>
        name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';
      const displayName = capitalizeName(userName);

      const botResponse = {
        data_type: 'TEXT',
        explanation: null,
        text: `Hello <strong>${displayName}</strong>, welcome to Dsense Assistant 👋`,
        sender: 'first',
        timestamp: new Date(),
        error: false,
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      if (error.status >= 400 && error.status < 500) {
        triggerLogout();
      } else {
        const botResponse = {
          data_type: 'TEXT',
          explanation: null,
          text: `Dsense request failed. Please retry after sometime!"`,
          sender: 'bot',
          timestamp: new Date(),
          error: true,
        };

        setMessages(prev => [...prev, botResponse]);
      }
    }
  };

  React.useEffect(() => {
    if (open) {
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      }

      const token = getCookie('token');
      const hasBearerToken = token?.startsWith('Bearer ') ?? false;
      if (!hasBearerToken) {
        const loginToDsense = async () => {
          try {
            await axios.get(`${SUPERSET_URL}/dsense/login`, {
              withCredentials: true,
            });
          } catch (error) {
            window.location.href = '/logout';
          }
        };

        loginToDsense();
      }
      sendDataset();
    }
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (open) {
      setUnread(0);
      scrollToBottom();
    }
  }, [open, messages]);

  const handleClickOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  const sendDsenseMessage = async prompt => {
    const new_prompt = promptTemplate.replace('{prompt}', prompt);
    try {
      const response_from_dsense = await callApi({
        parseMethod: 'json',
        url: `${CORTEX_ENDPOINT_NEW}/chat/${datasetId}/ask?prompt=${new_prompt}`,
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      setTimeout(() => {
        const botResponse = {
          data_type: response_from_dsense.json?.result_type,
          explanation: response_from_dsense.json?.sql_explanation,
          text: response_from_dsense.json?.results,
          sender: 'bot',
          timestamp: new Date(),
          error: false,
        };

        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);

        if (!open) {
          setUnread(prev => prev + 1);
        }
      }, 1000);
    } catch (error) {
      if (error.status >= 400 && error.status < 500 && error.status != 422) {
        // Trigger logout instead of console.log
        triggerLogout();
      } else {
        setIsTyping(false);
        let botResponse = {};
        if (error.status == 422) {
          botResponse = {
            data_type: 'TEXT',
            explanation: null,
            text: 'Dsense request failed.Enter more than 6 characters!',
            sender: 'bot',
            timestamp: new Date(),
            error: true,
          };
        } else {
          botResponse = {
            data_type: 'TEXT',
            explanation: null,
            text: 'Dsense request failed. Please retry after sometime!',
            sender: 'bot',
            timestamp: new Date(),
            error: true,
          };
        }

        setMessages(prev => [...prev, botResponse]);
      }
    }
  };

  function boldWordsInsideQuotes(text) {
    return text.replace(/\*\*(.*?)\*\*/g, (_, matchedText) => {
      return `<b>${matchedText.toUpperCase()}</b>`;
    });
  }

  const handleClose = () => {
    setOpen(false);
    setMessages([]);
    setInput('');
    setDatasourceId(null);

    setSelectedChart(null);
    setAlertContent('');
    setOpenAlert(false);
    setDatasetId(null);
    setSelectedChartId(null);
  };

  const handleAlertclose = () => setOpenAlert(false);

  const chat_result = msg => {
    if (msg.sender === 'first') {
      return (
        <GreetingBubble>
          <Typography
            variant="body1"
            sx={{ fontSize: '0.95rem', whiteSpace: 'pre-line' }}
            dangerouslySetInnerHTML={{ __html: String(msg.text || '') }}
          />
        </GreetingBubble>
      );
    } else if (msg.data_type === 'TABLE') {
      return (
        <MessageBubbleBot
          style={{ display: 'flex', overflow: 'scroll', gap: 1 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'start',
              gap: 2,
              width: '100%',
            }}
          >
            <div style={{ maxWidth: '100%', overflowX: 'scroll' }}>
              <DsenseTable data={msg.text} />
            </div>
          </div>
        </MessageBubbleBot>
      );
    } else if (msg.data_type === 'TEXT') {
      return (
        <div>
          {!msg.error ? (
            <MessageBubbleBot
              style={{
                marginBottom: '12px',
                color: '#555',
                fontSize: '0.95rem',
              }}
            >
              <TypingText text={msg.text} speed={20} />
            </MessageBubbleBot>
          ) : (
            <TypingText2 text={boldWordsInsideQuotes(msg.text)} />
          )}
        </div>
      );
    }

    return null;
  };

  const handleSend = () => {
    if (isTyping) {
      setAlertContent(
        'Dsense is fetching response.Send message once it is done.',
      );
      setOpenAlert(true);
      return null;
    }
    if (input.trim()) {
      const userMessage = {
        text: input.trim(),
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);
      setInput('');
      setIsTyping(true);
      sendDsenseMessage(input);
    }
    setInput('');
  };

  const formatTime = date => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const alignMessage = sender => {
    if (sender === 'user' || sender === 'first') {
      return 'flex-end';
    } else if (sender === 'bot') {
      return 'flex-start';
    } else {
      return 'center';
    }
  };

  return (
    <div id="dview-chatbot">
      <Badge badgeContent={unread} color="error">
        <ChatButton onClick={handleClickOpen} color="primary">
          <ChatIconWrapper>
            <DsenseLogo />
          </ChatIconWrapper>
        </ChatButton>
      </Badge>

      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            position: 'fixed',
            bottom: 16,
            right: 16,
            m: 0,
            width: { xs: 'calc(100% - 32px)', sm: '450px' },
            height: '90vh',
            maxHeight: 'calc(100% - 32px)',
            overflowY: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgb(157 111 255)',
            color: 'primary.contrastText',
            padding: '12px 20px',
            fontWeight: '600',
            fontSize: '1.1rem',
          }}
        >
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <DsenseLogo />
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dsense Assistant
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: 0, display: 'flex', flexDirection: 'column' }}
        >
          <ChatContainer>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: alignMessage(msg.sender),
                  alignItems: 'flex-end',
                  gap: 1,
                  p: 1,
                }}
              >
                <Box sx={{ maxWidth: '100%' }}>
                  {msg.sender === 'user' ? (
                    <MessageBubble sender={msg.sender} charts={msg?.charts}>
                      <Typography variant="body1" style={{ fontSize: '13px' }}>
                        {msg.text}
                      </Typography>
                    </MessageBubble>
                  ) : (
                    chat_result(msg)
                  )}
                </Box>
              </Box>
            ))}

            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MessageBubbleBot sender="bot" sx={{ py: 1, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" style={{ fontSize: '13px' }}>
                      Thinking
                    </Typography>
                    <CircularProgress size={14} />
                  </Box>
                </MessageBubbleBot>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </ChatContainer>

          <InputContainer>
            <div
              style={{
                border: '1px solid #D3D3D3x',
                borderRadius: '20px',
                width: '100%',
                display: 'flex',
              }}
            >
              <TextField
                fullWidth
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                variant="outlined"
                size="small"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    setInput('');
                  }
                }}
                multiline
                maxRows={3}
                sx={{
                  mr: 1,
                  fontSize: 13,
                  borderWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'grey',
                      borderWidth: '0px',
                    },
                    '&:hover fieldset': {
                      borderColor: 'grey',
                      borderWidth: '0px',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'grey',
                      borderWidth: '0px',
                    },
                    '&.Mui-disabled fieldset': {
                      borderColor: 'grey',
                      borderWidth: '0px',
                    },
                    '&.Mui-error fieldset': {
                      borderColor: 'grey',
                      borderWidth: '0px',
                    },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() && input.trim().length > 6}
                sx={{
                  p: 1.5,

                  color:
                    input.trim() && input.trim().length > 6
                      ? 'black'
                      : 'action.disabled',
                }}
              >
                <SendIcon />
              </IconButton>
            </div>
          </InputContainer>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog
        open={openAlert}
        onClose={handleAlertclose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" style={{ textAlign: 'center' }}>
          Dsense Alert
        </DialogTitle>
        <DialogContent style={{ padding: '10px 24px' }}>
          <DialogContentText
            id="alert-dialog-description"
            sstyle={{ textAlign: 'center' }}
          >
            {alertContent}
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button onClick={handleAlertclose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Logout Dialog */}
      <LogoutDialog
        open={showLogoutDialog}
        onClose={() => !isLoggingOut && setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
}
