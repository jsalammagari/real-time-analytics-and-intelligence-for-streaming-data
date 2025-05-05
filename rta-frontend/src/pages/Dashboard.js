import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Card, CardContent, Grid, Box, Snackbar, Alert } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import AlarmIcon from '@mui/icons-material/Alarm';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import IntelligenceAssistant from './IntelligenceAssistant';
import { IOT_STREAM_URL,STOCK_STREAM_URL,HEALTHCARE_STREAM_URL } from '../config'

function Dashboard() {
  const [selectedSource, setSelectedSource] = useState(null);
  const location = useLocation();

  const [lineChartData, setLineChartData] = useState([]);
  const [pmChartData, setPmChartData] = useState([]);
  const [notification, setNotification] = useState(null);
  const [fireAlarmStatus, setFireAlarmStatus] = useState(0);
  const [aqi, setAqi] = useState(0);
  const [dataQualityStatus, setDataQualityStatus] = useState('Streaming');
  const [lastCnt, setLastCnt] = useState(null); 
  const [latestData, setLatestData] = useState({ TVOC: 0, eCO2: 0, PM1: 0, PM2_5: 0 });
  const [aqiData, setAqiData] = useState([]);
  const [stockChartData, setStockChartData] = useState([]);
  const [latestStock, setLatestStock] = useState({});
  const [vitalChartData, setVitalChartData] = useState([]);
  const [latestVitals, setLatestVitals] = useState({});
  

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setSelectedSource(queryParams.get('selected'));
    const sources = queryParams.get('selected');
    console.log('Selected:', selectedSource, queryParams.get('selected'));

    if (sources === '1') {
      const eventSource = new EventSource(IOT_STREAM_URL);

      eventSource.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        console.log('Received streaming data:', newData);

        const time = new Date(newData.UTC).toLocaleTimeString(); 
        const humidity = parseFloat(newData['Humidity[%]']);
        const temperature = parseFloat(newData['Temperature[C]']);
        const pm1 = parseFloat(newData['PM1.0']);
        const pm25 = parseFloat(newData['PM2.5']);
        const eCO2 = parseFloat(newData['eCO2[ppm]']);
        const TVOC = parseFloat(newData['TVOC[ppb]']);
        const fireAlarm = parseInt(newData['Fire Alarm'], 10); 
        const cnt = parseInt(newData['CNT'], 10);

        setLatestData({ TVOC, eCO2, PM1: pm1, PM2_5: pm25 });

        setLineChartData((prevData) => {
          const updatedData = [...prevData, { time, humidity, temperature }];
          return updatedData.slice(-6); 
        });
        setPmChartData((prevData) => {
          const updatedData = [...prevData, { time, pm1, pm25 }];
          return updatedData.slice(-6);
        });
        if (lastCnt !== null && cnt === lastCnt) {
          setDataQualityStatus('Disconnected');
        } else {
          setDataQualityStatus('Streaming');
        }
        setLastCnt(cnt);
        const calculatedAqi = (eCO2 * 0.25) + (TVOC * 0.25) + (pm1 * 0.25) + (pm25 * 0.25);
        setAqi(calculatedAqi);

        setAqiData([
          {
            name: 'AQI',
            value: calculatedAqi,
            fill: calculatedAqi <= 50 ? '#4caf50' : calculatedAqi <= 100 ? '#ffeb3b' : '#f44336',
          }
        ]);

        setFireAlarmStatus(fireAlarm);
      };

      eventSource.onerror = () => {
        console.error('Error receiving streaming data');
        eventSource.close();
      };

      const anomalyStream = new EventSource('http://localhost:5050/api/iot-stream-anomaly');
      anomalyStream.onmessage = (event) => {
        const anomalyData = JSON.parse(event.data);
        console.log('Received anomaly data:', anomalyData);
        setNotification(`Anomaly detected! Temperature: ${anomalyData['Temperature[C]']}°C`);
      };
      anomalyStream.onerror = () => {
        console.error('Error receiving anomaly data');
        anomalyStream.close();
      };

      return () => {
        eventSource.close();
        anomalyStream.close();
      };
    }

    if (sources === '2') {
      const eventSource = new EventSource(STOCK_STREAM_URL);

      eventSource.onmessage = (event) => {
        const newData = JSON.parse(event.data);
        const time = new Date(newData.UTC).toLocaleTimeString();
  
        const parsed = {
          time,
          AAPL: parseFloat(newData.AAPL),
          MSFT: parseFloat(newData.MSFT),
          NVDA: parseFloat(newData.NVDA),
          SPY: parseFloat(newData.SPY),
          QQQ: parseFloat(newData.QQQ),
          IWM: parseFloat(newData.IWM),
          VIX: parseFloat(newData.VIX),
        };
  
        setStockChartData(prev => [...prev.slice(-5), parsed]);
        setStockChartData(prev => {
          const updated = [...prev.slice(-5), parsed];
          setLatestStock(parsed);
          return updated;
        });
      };
  
      eventSource.onerror = (err) => {
        console.error('Stock stream error:', err);
        eventSource.close();
      };
  
      return () => eventSource.close();
    }

    if (sources === '3') {
      const eventSource = new EventSource(HEALTHCARE_STREAM_URL);
  
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLatestVitals(data);
        setVitalChartData(prev => [...prev, {
          time: new Date(data.UTC).toLocaleTimeString(),
          heart_rate: parseFloat(data.heart_rate),
          respiratory_rate: parseFloat(data.respiratory_rate),
          temperature: parseFloat(data.temperature),
        }].slice(-6));

        if (parseFloat(data.oxygen_saturation) < 94 || parseFloat(data.temperature) > 38) {
          setNotification(`⚠️ Alert for patient ${data.subject_id}: Low SpO2 or High Temp`);
        }
      };

      eventSource.onerror = (err) => {
        console.error('Healthcare stream error:', err);
        eventSource.close();
      };

      return () => eventSource.close();
    }

    
  }, [location, lastCnt, selectedSource]);

  const handleNotificationClose = () => {
    setNotification(null);
  };

  if (selectedSource === '1') {
    return (
      <Box sx={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {<Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          IOT Data Dashboard
        </Typography>}
        <Grid container spacing={3}>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' }, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
              <AlarmIcon style={{ fontSize: 50, color: '#F44336' }} />
                <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                  Fire Alarm Status
                </Typography>
                <Typography variant="body2" sx={{ color: fireAlarmStatus === 1 ? '#d32f2f' : '#388e3c', fontSize: '16px', fontWeight: 'bold', marginTop: '8px' }}>
                  {fireAlarmStatus === 1 ? '⚠️ Alarm Triggered!' : '✅ Normal'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' }, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ShowChartIcon style={{ fontSize: 50, color: dataQualityStatus === 'Streaming' ? '#4caf50' : '#f44336' }} />
                <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                  Data Quality Status
                </Typography>
                <Typography variant="body2" sx={{ color: dataQualityStatus === 'Streaming' ? '#4caf50' : '#f44336', fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>
                  {dataQualityStatus === 'Streaming' ? '🟢 Data Streaming' : '🔴 Disconnected'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' }, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                  Air Quality Index (AQI)
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={aqiData} startAngle={180} endAngle={0}>
                    <PolarAngleAxis type="number" domain={[0, 150]} angleAxisId={0} tick={false} />
                    <RadialBar background clockWise dataKey="value" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Typography variant="h6" sx={{ fontWeight: 'bold',marginTop: '-90px', color: aqi <= 50 ? '#4caf50' : aqi <= 100 ? '#ffeb3b' : '#f44336' }}>
                  {aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#777', marginTop: '8px' }}>
                  Current AQI: {Math.round(aqi)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' }, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: '600', color: '#555' }}>
                  Air Quality Summary
                </Typography>
                <Typography variant="body2" sx={{ color: '#777', marginTop: '8px' }}>
                  TVOC: {latestData.TVOC} ppb
                </Typography>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  eCO2: {latestData.eCO2} ppm
                </Typography>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  PM1.0: {latestData.PM1} µg/m³
                </Typography>
                <Typography variant="body2" sx={{ color: '#777' }}>
                  PM2.5: {latestData.PM2_5} µg/m³
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: '600', color: '#555', textAlign: 'center' }}>
                Humidity and Temperature Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="humidity" stroke="#0088FE" name="Humidity (%)" />
                  <Line type="monotone" dataKey="temperature" stroke="#FF0000" name="Temperature (°C)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ padding: '20px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: '600', color: '#555', textAlign: 'center' }}>
                Particulate Matter Levels (PM1.0 and PM2.5)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pmChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="pm1" stroke="#82ca9d" name="PM1.0" />
                  <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="PM2.5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

        </Grid>
        <Snackbar open={!!notification} autoHideDuration={12000} onClose={handleNotificationClose}>
          <Alert severity="warning" onClose={handleNotificationClose}>
            {notification}
          </Alert>
        </Snackbar>
        <IntelligenceAssistant source="IoT" />
      </Box>
    );
  } else if (selectedSource === '2') {
    return (
      <Box sx={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Financial Data Dashboard
        </Typography>
        <Grid container spacing={3}>
        {/* Market Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6">AAPL</Typography>
                <Typography variant="h5">${latestStock.AAPL || '--'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6">MSFT</Typography>
                <Typography variant="h5">${latestStock.MSFT || '--'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6">SPY</Typography>
                <Typography variant="h5">${latestStock.SPY || '--'}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6">VIX</Typography>
                <Typography variant="h5">{latestStock.VIX || '--'}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Tech Stocks Trend */}
          <Grid item xs={12} md={6}>
            <Card sx={{ padding: 2 }}>
              <Typography variant="h6" textAlign="center" mb={2}>Tech Stocks Trend (AAPL, MSFT, NVDA)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="AAPL" stroke="#4caf50" name="AAPL" />
                  <Line type="monotone" dataKey="MSFT" stroke="#2196f3" name="MSFT" />
                  <Line type="monotone" dataKey="NVDA" stroke="#9c27b0" name="NVDA" />
                </LineChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                  <Typography variant="body2">AAPL</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#2196f3' }} />
                  <Typography variant="body2">MSFT</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#9c27b0' }} />
                  <Typography variant="body2">NVDA</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* ETF Comparison */}
          <Grid item xs={12} md={6}>
            <Card sx={{ padding: 2 }}>
              <Typography variant="h6" textAlign="center" mb={2}>ETF Comparison (SPY, QQQ, IWM)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="SPY" stroke="#ff9800" name="SPY" />
                  <Line type="monotone" dataKey="QQQ" stroke="#00bcd4" name="QQQ" />
                  <Line type="monotone" dataKey="IWM" stroke="#f44336" name="IWM" />
                </LineChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                  <Typography variant="body2">SPY</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#00bcd4' }} />
                  <Typography variant="body2">QQQ</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#f44336' }} />
                  <Typography variant="body2">IWM</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
        <IntelligenceAssistant source="Stock" />
      </Box>
    );

  } else{
    return (
      <Box sx={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Healthcare Data Dashboard
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: '12px' }}>
              <CardContent>
                <FavoriteIcon style={{ fontSize: 50, color: '#f44336' }} />
                <Typography variant="h6">Heart Rate</Typography>
                <Typography variant="h5">{latestVitals.heart_rate} bpm</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: '12px' }}>
              <CardContent>
                <MonitorHeartIcon style={{ fontSize: 50, color: '#2196f3' }} />
                <Typography variant="h6">Oxygen Saturation</Typography>
                <Typography variant="h5">{latestVitals.oxygen_saturation} %</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6">Temperature</Typography>
                <Typography variant="h5">{latestVitals.temperature} °C</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6">Respiratory Rate</Typography>
                <Typography variant="h5">{latestVitals.respiratory_rate} bpm</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ padding: '20px', borderRadius: '12px' }}>
              <Typography variant="h6" sx={{ textAlign: 'center', marginBottom: 2 }}>
                Vital Signs Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vitalChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="heart_rate" stroke="#f44336" name="Heart Rate" />
                  <Line type="monotone" dataKey="respiratory_rate" stroke="#2196f3" name="Resp. Rate" />
                  <Line type="monotone" dataKey="temperature" stroke="#ff9800" name="Temperature" />
                </LineChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#f44336' }} />
                  <Typography variant="body2">Heart Rate</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#2196f3' }} />
                  <Typography variant="body2">Resp. Rate</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                  <Typography variant="body2">Temperature</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        <Snackbar open={!!notification} autoHideDuration={10000} onClose={handleNotificationClose}>
          <Alert severity="warning" onClose={handleNotificationClose}>
            {notification}
          </Alert>
        </Snackbar>
        <IntelligenceAssistant source="Healthcare" />
      </Box>
    );
  }
}

export default Dashboard;
