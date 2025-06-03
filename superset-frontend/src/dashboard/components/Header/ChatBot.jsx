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
import TypingText2 from './TypingText2';
import DsenseLogo from '../../../assets/images/icons/dsense-logo-sm.svg?react';

const CORTEX_ENDPOINT_NEW = window.featureFlags.CORTEX_ENPOINT;
const COSMOS_URL = window.featureFlags.COSMOS_ENDPOINT;
const DEFAULT_CATALOG = window.featureFlags.DEFAULT_CATALOG;
const LOGIN_PASSWORD = window.featureFlags.LOGIN_PASSWORD;
const CORTEX_INTERNAL_TOKEN = window.featureFlags.CORTEX_INTERNAL_TOKEN;
const promptTemplate = window.featureFlags.PROMPT_TEMPLATE;

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

export default function ChatBotDialog({ dashboardId }) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const messagesEndRef = React.useRef(null);
  const [dashBoardChart, setDashboardCharts] = React.useState(null);
  const [dashBoardChartResponse, setDashboardChartsResponse] =
    React.useState(null);
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
  const [userEmail, setUserEmail] = React.useState(null);

  const SUPERSET_URL = `${window.location.origin}/api/v1`;

  const hitLogin = async (retry = false) => {
    if ((userEmail) && LOGIN_PASSWORD) {
      if (loginToken && !retry) {
        return loginToken;
      }

      const loginPayload = {
        email: userEmail,
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
          sender: 'first',
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

  const sendDataset = async (retryFlag = false) => {
    const fetchData = async () => {
      const token = await hitLogin(retryFlag);
      let catalog = [];
      if (DEFAULT_CATALOG) {
        catalog = [DEFAULT_CATALOG];
      }
      const payload = {
        catalogs: catalog,
        schemas: [],
        tables: [],
      };
      if (token) {
        try {
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
          if (!retryFlag) {
            const botResponse = {
              data_type: 'TEXT',
              explanation: null,
              text: `${selectedChart.name} chart is selected.\n Ask a question.`,
              sender: 'first',
              timestamp: new Date(),
              error: true,
            };

            setMessages(prev => [...prev, botResponse]);
          }
        } catch (error) {
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
    await fetchData();
  };

  React.useEffect(() => {
    if (open && dashboardId) {
      axios
        .get(`${SUPERSET_URL}/dashboard/${dashboardId}/charts`)
        .then(response => {
          setDashboardChartsResponse(response.data);
        })
        .catch(error => {
          setDashboardChartsError(error.message);
        });
    }
  }, [open]);

  function filterCharts(chartArray) {
    const result = [];

    chartArray.result.forEach(chart => {
      const formData = chart.form_data;

      if (Object.hasOwn(formData, 'column')) {
        result.push(chart);
      } else if (
        Object.hasOwn(formData, 'groupby') &&
        Array.isArray(formData.groupby) &&
        formData.groupby.length === 1
      ) {
        result.push(chart);
      } else if (
        Object.hasOwn(formData, 'source') &&
        Object.hasOwn(formData, 'target')
      ) {
        result.push(chart);
      } else if (Object.hasOwn(formData, 'source')) {
        result.push(chart);
      } else if (Object.hasOwn(formData, 'target')) {
        result.push(chart);
      } else if (Object.hasOwn(formData, 'all_columns')) {
        result.push(chart);
      }
    });

    return { result: result };
  }

  React.useEffect(() => {
    if (dashBoardChartResponse) {
      const filteredcharts = filterCharts(dashBoardChartResponse);
      setDashboardCharts(filteredcharts);
    }
  }, [dashBoardChartResponse]);

  React.useEffect(() => {
    if (chartData) {
      let columns_value = [];
      if (Object.hasOwn(chartData.result.form_data, 'column')) {
        columns_value.push(chartData.result.form_data.column);
      } else if (
        Object.hasOwn(chartData.result.form_data, 'groupby') &&
        chartData.result.form_data.groupby.length === 1
      ) {
        if (chartData.result.form_data.groupby.length === 1) {
          columns_value = chartData.result.form_data.groupby;
        }
      } else if (
        Object.hasOwn(chartData.result.form_data, 'source') &&
        Object.hasOwn(chartData.result.form_data, 'target')
      ) {
        columns_value.push(
          chartData.result.form_data.source,
          chartData.result.form_data.target,
        );
      } else if (Object.hasOwn(chartData.result.form_data, 'source')) {
        columns_value.push(chartData.result.form_data.source);
      } else if (Object.hasOwn(chartData.result.form_data, 'target')) {
        columns_value.push(chartData.result.form_data.target);
      } else if (Object.hasOwn(chartData.result.form_data, 'all_columns')) {
        columns_value = chartData.result.form_data.all_columns;
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
        sql: chartSql.result[0].query,
      };
      sendDataset();
    }
  }, [chartSql]);

  const handleChartSelect = chart => {
    setSelectedChart(chart);
    getSqlQuery(chart.datasource_id, chart.slice_url);
  };

  const fetchUserEmail = async () => {
    try {
      const response = await axios.get(`${SUPERSET_URL}/me`, {
        withCredentials: true,
      });
      setUserEmail(response.data.result.email);
    } catch (error) {
      const botResponse = {
        data_type: 'TEXT',
        explanation: null,
        text: `Unable to login email address.`,
        sender: 'first',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, botResponse]);
      return null;
    }
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
          text: 'Select a chart to explore key insights from the dashboard',
          sender: 'user',
          charts: chartList,
          timestamp: new Date(),
          error: false,
        },
      ]);
      fetchUserEmail();
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
    const sql_query = {
      sql: chartSql.result[0].query,
    };
    const new_prompt = promptTemplate
      .replace('{catalog}', DEFAULT_CATALOG)
      .replace('{sql}', sql_query.sql)
      .replace('{prompt}', prompt);
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
      if (error.status >= 400 && error.status < 500) {
        try {
          await sendDataset(true);
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
      } else {
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
    if (msg.data_type === 'TABLE') {
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
    if (input.trim() && selectedChart) {
      const userMessage = {
        text: input.trim(),
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
    setInput('');
  };

  const formatTime = date => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const alignMessage = sender => {
    if (sender === 'user') {
      return 'flex-end';
    } else if (sender === 'bot') {
      return 'flex-start';
    } else {
      return 'center';
    }
  };

  return (
    <>
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
    </>
  );
}