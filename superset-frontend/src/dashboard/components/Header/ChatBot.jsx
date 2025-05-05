import * as React from 'react';
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

const CORTEX_ENDPOINT_NEW = window.featureFlags.CORTEX_ENPOINT;
const COSMOS_URL = window.featureFlags.COSMOS_ENDPOINT;
const DEFAULT_CATALOG = window.featureFlags.DEFAULT_CATALOG;
const LOGIN_USERNAME = window.featureFlags.LOGIN_USERNAME;
const LOGIN_PASSWORD = window.featureFlags.LOGIN_PASSWORD;

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

const MessageBubble = styled(Paper)(({ theme, sender }) => ({
  padding: theme.spacing(1.5),
  borderRadius: sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
  backgroundColor:
    sender === 'user' ? theme.palette.primary.main : theme.palette.grey[100],
  color:
    sender === 'user'
      ? theme.palette.primary.contrastText
      : theme.palette.text.primary,
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
  backgroundColor: '#fafafa',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Grow ref={ref} {...props} />;
});

export default function ChatBotDialog({ dashboardId }) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const messagesEndRef = React.useRef(null);
  const [dashBoardChart, setDashboardCharts] = React.useState(null);
  const [dashBoardChartError, setDashboardChartsError] = React.useState(null);
  const [chartData, setChartData] = React.useState(null);
  const [chartSql, setChartSql] = React.useState(null);
  const [dataSourceId, setDatasourceId] = React.useState(null);
  const [chartSqlError, setChartSqlError] = React.useState(null);
  const [selectedChart, setSelectedChart] = React.useState(null);
  const [alertContent, setAlertContent] = React.useState('');
  const [openAlert, setOpenAlert] = React.useState(false);
  const [loginToken, setLoginToken] = React.useState(null);
  const [datasetId, setDatasetId] = React.useState(null);
  const [selectedChartId, setSelectedChartId] = React.useState(null);
  const SUPERSET_URL = 'http://localhost:8088/api/v1';

  const hitLogin = async () => {
    if (LOGIN_PASSWORD && LOGIN_USERNAME) {
      if (loginToken) {
        return loginToken;
      }

      const loginPayload = {
        email: LOGIN_USERNAME,
        password: LOGIN_PASSWORD,
      };

      try {
        const response = await axios.post(
          `${SUPERSET_URL}/dsense/login`,
          loginPayload,
          {
            withCredentials: true,
          },
        );
        const token = response.data.cookie_token;
        setLoginToken(token.replace(/^token=/, ''));
        return token.replace(/^token=/, '');
      } catch (error) {
        const botResponse = {
          data_type: 'TEXT',
          explanation: null,
          text: `Login failed. Select chart to retry.`,
          sender: 'bot',
          timestamp: new Date(),
          error: true,
        };
        setMessages(prev => [...prev, botResponse]);
        return null;
      }
    }

    return null;
  };

  const handleChange = (event, msg) => {
    const selectedId = event.target.value;
    setSelectedChartId(selectedId);
    const chart = event.target.value;
    if (chart) {
      handleChartSelect(chart);
    }
  };

  const sendDataset = payload => {
    const fetchData = async () => {
      const token = await hitLogin();
      console.log('gaurav log', token);
      if (token) {
        try {
          const data = await callApi({
            parseMethod: 'json',
            url: `${CORTEX_ENDPOINT_NEW}/stateless/?catalog=${DEFAULT_CATALOG}`,
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Dsense-Auth': 'Testing123',
            },
            credentials: 'include',
            jsonPayload: payload,
          });

          setDatasetId(data.json.id);
          const botResponse = {
            data_type: 'TEXT',
            explanation: null,
            text: `${selectedChart.name} chart is selected. Ask a question.`,
            sender: 'bot',
            timestamp: new Date(),
            error: false,
          };

          setMessages(prev => [...prev, botResponse]);
        } catch (error) {
          console.error('API call failed:', error);
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
    fetchData();
  };

  React.useEffect(() => {
    if (open && dashboardId) {
      axios
        .get(`${SUPERSET_URL}/dashboard/${dashboardId}/charts`)
        .then(response => {
          setDashboardCharts(response.data);
        })
        .catch(error => {
          setDashboardChartsError(error.message);
        });
    }
  }, [open]);

  React.useEffect(() => {
    if (chartData) {
      let columns_value = [];
      if (Object.hasOwn(chartData.result.form_data, 'column')) {
        columns_value.push(chartData.result.form_data.column);
      } else if (Object.hasOwn(chartData.result.form_data, 'groupby')) {
        if (chartData.result.form_data.groupby.length === 1) {
          columns_value = chartData.result.form_data.groupby;
        }
      }

      const queries = [
        {
          annotation_layers: [],
          applied_time_extras: {},
          columns: columns_value,
          extras: {},
          filters: [],
          granularity: '',
          groupby: [],
          time_range: chartData.result.form_data.time_range,
        },
      ];
      const payload = {
        datasource: { id: dataSourceId, type: 'table' },
        force: false,
        form_data: chartData.result.form_data,
        queries: queries,
        result_format: 'json',
        result_type: 'query',
      };
      let slice_id_value = chartData.result.slice.slice_id;
      slice_id_value = parseInt(slice_id_value, 10); // 10 is for decimal (base 10)
      const formData = { slice_id: slice_id_value };
      const formDataString = JSON.stringify(formData);
      const encodedFormData = encodeURIComponent(formDataString);

      axios
        .post(
          `${SUPERSET_URL}/chart/data?form_data=${encodedFormData}`,
          payload,
        )
        .then(response => {
          setChartSql(response.data);
        })
        .catch(error => {
          setDashboardChartsError(error.message);
        });
    }
  }, [chartData]);

  const getSqlQuery = (datasource_id, slice_url) => {
    axios
      .get(`${SUPERSET_URL}${slice_url}`)
      .then(response => {
        setDatasourceId(datasource_id);
        setChartData(response.data);
      })
      .catch(error => {
        setDashboardChartsError(error.message);
      });
  };

  React.useEffect(() => {
    if (chartSql) {
      const sql_payload = {
        sql: 'SELECT * FROM databricks.tpcds.catalog_sales LIMIT 100',
      };
      sendDataset(sql_payload);
    }
  }, [chartSql]);

  const handleChartSelect = chart => {
    const userMessage = {
      text: `I want to view the chart: ${chart.name} `,
      sender: 'user',
      timestamp: new Date(),
      error: false,
    };
    setSelectedChart(chart);

    getSqlQuery(chart.datasource_id, chart.slice_url);
  };

  React.useEffect(() => {
    if (
      dashBoardChart &&
      dashBoardChart.result &&
      Array.isArray(dashBoardChart.result)
    ) {
      const chartList = dashBoardChart.result.map(chart => ({
        id: chart.id,
        name: chart.slice_name,
        form_data: chart.form_data,
        datasource_id: chart.form_data.datasource.split('_')[0],
        slice_url: chart.slice_url,
      }));

      setMessages(prev => [
        ...prev,
        {
          text: 'Here are the charts from this dashboard. Please select one:',
          sender: 'bot',
          charts: chartList,
          timestamp: new Date(),
          error: false,
        },
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
  const sendDsenseMessage = async prompt => {
    try {
      const response_from_dsense = await callApi({
        timeout: 9000,
        parseMethod: 'json',
        url: `${CORTEX_ENDPOINT_NEW}/stateless/${datasetId}/ask?prompt=${prompt}`,
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Dsense-Auth': 'Testing123',
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
      setIsTyping(false);
      const botResponse = {
        data_type: 'TEXT',
        explanation: null,
        text: 'Dsense request failed. Please retry after sometime!',
        sender: 'bot',
        timestamp: new Date(),
        error: true,
      };

      setMessages(prev => [...prev, botResponse]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setMessages([]);
    setInput('');
    setDashboardCharts(null);
    setDashboardChartsError(null);
    setChartData(null);
    setChartSql(null);
    setDatasourceId(null);
    setChartSqlError(null);
    setSelectedChart(null);
    setAlertContent('');
    setOpenAlert(false);
    setDatasetId(null);
    setSelectedChartId(null);
  };
  const handleAlertclose = () => setOpenAlert(false);

  const chat_result = msg => {
    console.log('gaurav', msg);
    const explanationComponent = msg.explanation ? (
      <div style={{ marginBottom: '12px', color: '#555', fontSize: '0.95rem' }}>
        <strong>Explanation:</strong> {msg.explanation}
      </div>
    ) : null;

    if (msg.data_type === 'TABLE') {
      return (
        <div>
          {explanationComponent}
          <DsenseTable data={msg.text} />
        </div>
      );
    } else if (msg.data_type === 'TEXT') {
      return (
        <div>
          {explanationComponent}
          {!msg.error ? (
            <div
              style={{ marginBottom: '12px', color: '#555', fontSize: '0.95rem' }}
            >
              <span style={{ color: '#555' }}>Answer:</span>
              <TypingText text={msg.text} speed={30} />
            </div>
          ) : (
            <TypingText text={msg.text} speed={30} />
          )}
        
        </div>
      );
    }

    return null; // Fallback case if no data type matches
  };

  const handleSend = () => {
    if (input.trim() && selectedChart) {
      const userMessage = {
        text: input,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages([...messages, userMessage]);
      setInput('');
      setIsTyping(true);
      sendDsenseMessage(input);

      // Simulated bot response with typing indicator
    } else if (!selectedChart) {
      setAlertContent('No chart is selected');
      setOpenAlert(true);
    }
  };

  const formatTime = date => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <Badge badgeContent={unread} color="error">
        <ChatButton onClick={handleClickOpen} color="primary">
          <ChatIconWrapper>
            <img
              src="/static/assets/images/icons/dsense-logo-sm.svg"
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
            height: '80vh',
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
          <Avatar
            src="/static/assets/images/icons/dsense-logo-sm.svg"
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
                  justifyContent:
                    msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 1,
                  p: 1,
                }}
              >
                <Box sx={{ maxWidth: '100%' }}>
                  <MessageBubble sender={msg.sender}>
                    {!msg.charts && msg.sender === 'bot' ? (
                      chat_result(msg)
                    ) : (
                      <Typography variant="body1">{msg.text}</Typography>
                    )}
                    {msg.charts && (
                      <Box sx={{ mt: 2, minWidth: 200 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="chart-select-label">
                            Select Chart
                          </InputLabel>
                          <Select
                            labelId="chart-select-label"
                            value={selectedChartId}
                            label="Select Chart"
                            onChange={handleChange}
                          >
                            {msg.charts.map(chart => (
                              <MenuItem key={chart.id} value={chart}>
                                {chart.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
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
                        mx: 1,
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}

            {isTyping && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              variant="outlined"
              size="small"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
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
                bgcolor: input.trim()
                  ? 'primary.main'
                  : 'action.disabledBackground',
                color: input.trim()
                  ? 'primary.contrastText'
                  : 'action.disabled',
                '&:hover': {
                  bgcolor: input.trim()
                    ? 'primary.dark'
                    : 'action.disabledBackground',
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </InputContainer>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openAlert}
        onClose={handleAlertclose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Dsense Alert'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {alertContent}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAlertclose}>Close</Button>
          <Button onClick={handleAlertclose} autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
