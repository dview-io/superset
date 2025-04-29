import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import CircularProgress from '@mui/material/CircularProgress';
import Grow from '@mui/material/Grow';
import axios from 'axios';
import { queries } from '@testing-library/dom';

const ChatButton = styled(Button)(({ theme }) => ({
  minWidth: 'unset',
  padding: theme.spacing(0.5),
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

const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1.5),
  maxWidth: '85%',
  borderRadius: sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  backgroundColor: sender === 'user' ? theme.palette.primary.light : '#f5f5f5',
  color: sender === 'user' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  wordBreak: 'break-word',
  position: 'relative',
  boxShadow: theme.shadows[1],
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Grow ref={ref} {...props} />;
});

export default function ChatBotDialog({dashboardId}) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { text: "Hi! I'm Dsense bot. How can I help you today?", sender: "bot" },
  ]);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const messagesEndRef = React.useRef(null);
  const [dashBoardChart, setDashboardCharts] = React.useState(null);
  const [dashBoardChartError, setDashboardChartsError] = React.useState(null);
  const [chartSql, setChartSql] = React.useState(null);
  const [chartSqlError, setChartSqlError] = React.useState(null);
  const SUPERSET_URL='http://localhost:8088/api/v1/'


  React.useEffect(()=>{
    if (dashboardId){
      axios.get(`${SUPERSET_URL}dashboard/${dashboardId}/charts`)
        .then(response => {
          setDashboardCharts(response.data);
        })
        .catch(error => {
          setDashboardChartsError(error.message);
        });
    
    }
  },[dashboardId])

  const getSqlQuery=(datasource_id,form_data)=>{

    // if (form_data.all_columns){
    //   columms=form_data.all_columns;
    // }
    // else if (form_data.columns){
    //   columns=form_data.columns;
    // }
    const payload={
      datasource:{id:datasource_id,type:"table"},
      force:false,
      form_data,
      queries:[
        {
            "time_range": form_data.time_range,
            "granularity": form_data.granularity_sqla,
            "filters": [],
            "extras": {},
            "applied_time_extras": {},
            "columns": [],
            "orderby": [],
            "annotation_layers": [],
            "row_limit": form_data.row_limit,
            "series_limit": 0,
            "order_desc": true,
            "url_params": form_data.url_params,
            "custom_params": {},
            "custom_form_data": {},
            "post_processing": [],
            "time_offsets": []
        }
    ],
      result_format: "json",
      result_type: "query"
    }
    axios.post(`${SUPERSET_URL}chart/data`,payload)
        .then(response => {
          setChartSql(response.data);
        })
        .catch(error => {
          setDashboardChartsError(error.message);
        });
    
  }

  React.useEffect(()=>{
    console.log('gaurav sql',chartSql)
  },[chartSql])
  const handleChartSelect = (chart) => {
    const userMessage = {
      text: `I want to view the chart: ${chart.name} `,
      sender: 'user',
      timestamp: new Date()
    };

    getSqlQuery(chart.datasource_id,chart.form_data)

  
    const botResponse = {
      text: `Loading details for "${chart.name}"`,
      sender: 'bot',
      timestamp: new Date()
    };
  
    setMessages(prev => [...prev, userMessage, botResponse]);
  };
  

  React.useEffect(() => {
    if (dashBoardChart && dashBoardChart.result && Array.isArray(dashBoardChart.result)) {
      const chartList = dashBoardChart.result.map(chart => ({
        id: chart.id,
        name: chart.slice_name,
        form_data:chart.form_data,
        datasource_id:chart.form_data.datasource.split('_')[0]

      }));
  
      setMessages(prev => [
        ...prev,
        {
          text: 'Here are the charts from this dashboard. Please select one:',
          sender: 'bot',
          charts: chartList,
          timestamp: new Date(),
        }
      ]);
    }
  }, [dashBoardChart]);
  

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

  const handleClose = () => setOpen(false);

  const handleSend = () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: "user", timestamp: new Date() };
      setMessages([...messages, userMessage]);
      setInput("");
      setIsTyping(true);
      
      // Simulated bot response with typing indicator
      setTimeout(() => {
        const botResponse = { 
          text: "Thanks for your message! How else can I help you today?", 
          sender: "bot",
          timestamp: new Date() 
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        
        if (!open) {
          setUnread(prev => prev + 1);
        }
      }, 1000);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Badge badgeContent={unread} color="error">
        <ChatButton onClick={handleClickOpen} color="primary">
          <ChatIconWrapper>
            <img
              src='/static/assets/images/icons/dsense-logo-sm.svg'
              alt="dsense-icon"
              style={{ height: '30px', width: '30px' }}
            />
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
            height: '65vh',
            maxHeight: 'calc(100% - 32px)',
            overflowY: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          bgcolor: 'rgb(157 111 255)', 
          color: 'primary.contrastText'
        }}>
          <Avatar 
            src='/static/assets/images/icons/dsense-logo-sm.svg'
            alt="Dsense"
            sx={{ mr: 2 }}
          />
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

        <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatContainer>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 1,
                }}
              >
                {msg.sender === 'bot' && (
                  <Avatar 
                    src='/static/assets/images/icons/dsense-logo-sm.svg'
                    alt="Dsense Bot"
                    sx={{ width: 28, height: 28 }}
                  />
                )}
                
                <Box sx={{ maxWidth: '80%' }}>
                <MessageBubble sender={msg.sender}>
  <Typography variant="body1">{msg.text}</Typography>
  {msg.charts && (
    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {msg.charts.map((chart) => (
        <Button 
          key={chart.id} 
          variant="outlined" 
          size="small"
          onClick={() => handleChartSelect(chart)}
          sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
          style={{textAlign:'left'}}
        >
          {chart.name}
        </Button>
      ))}
    </Box>
  )}
</MessageBubble>
                  {msg.timestamp && (
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block', 
                        textAlign: msg.sender === 'user' ? 'right' : 'left',
                        mt: 0.5,
                        mx: 1
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  )}
                </Box>
                
                {msg.sender === 'user' && (
                  <Avatar sx={{ 
                    width: 28, 
                    height: 28,
                    bgcolor: 'primary.main'
                  }}>
                    U
                  </Avatar>
                )}
              </Box>
            ))}
            
            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src='/static/assets/images/icons/dsense-logo-sm.svg'
                  alt="Dsense Bot"
                  sx={{ width: 28, height: 28 }}
                />
                <MessageBubble sender="bot" sx={{ py: 1, px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant="body2">Typing...</Typography>
                  </Box>
                </MessageBubble>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </ChatContainer>

          <InputContainer>
            <TextField
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              variant="outlined"
              size="small"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              multiline
              maxRows={3}
              sx={{ mr: 1 }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSend} 
              disabled={!input.trim()}
              sx={{ 
                p: 1.5,
                bgcolor: input.trim() ? 'primary.main' : 'action.disabledBackground',
                color: input.trim() ? 'primary.contrastText' : 'action.disabled',
                '&:hover': {
                  bgcolor: input.trim() ? 'primary.dark' : 'action.disabledBackground',
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </InputContainer>
        </DialogContent>
      </Dialog>
    </>
  );
}