import React, { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Radio,
  FormControlLabel,
  Grid,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DATA_SOURCE_URL, SELECTED_SOURCE_URL } from '../config';

// Optional: Uncomment if using npm-installed font
// import '@fontsource/poppins/400.css';
// import '@fontsource/poppins/600.css';

function DataSourceSelection() {
  const navigate = useNavigate();
  const [dataSources, setDataSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(DATA_SOURCE_URL)
      .then((response) => {
        setDataSources(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data sources:', error);
        setLoading(false);
      });
  }, []);

  const handleRadioChange = (event) => {
    setSelectedSource(event.target.value);
  };

  const handleSubmit = () => {
    if (!selectedSource) {
      alert("Please select a data source.");
      return;
    }

    axios.post(SELECTED_SOURCE_URL, { selectedSources: selectedSource })
      .then((response) => {
        console.log('Selected data source submitted successfully:', response.data);
        navigate(`/dashboard?selected=${selectedSource}`);
      })
      .catch((error) => {
        console.error('Error submitting selected source:', error);
        alert('An error occurred while submitting the data source');
      });
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 4 },
        py: 4,
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'Poppins, Roboto, sans-serif',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontFamily: 'Poppins, Roboto, sans-serif',
          fontWeight: 600,
          textAlign: 'center',
          color: '#2c3e50',
          mb: 4,
          letterSpacing: '0.5px',
        }}
      >
        Select a Data Source
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : dataSources.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
          No data sources available.
        </Typography>
      ) : (
        <Grid container spacing={4} justifyContent="center">
          {dataSources.map((dataSource) => (
            <Grid item xs={12} sm={6} md={4} key={dataSource.id}>
              <Card
                onClick={() => setSelectedSource(dataSource.id.toString())}
                sx={{
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: selectedSource === dataSource.id.toString()
                    ? '0 4px 20px rgba(25, 118, 210, 0.3)'
                    : '0px 2px 8px rgba(0, 0, 0, 0.1)',
                  transform: selectedSource === dataSource.id.toString()
                    ? 'scale(1.03)'
                    : 'scale(1)',
                  '&:hover': {
                    boxShadow: '0 6px 24px rgba(25, 118, 210, 0.25)',
                    transform: 'scale(1.03)',
                  },
                  backgroundColor: '#fff',
                }}
              >
                <CardContent>
                  <FormControlLabel
                    control={
                      <Radio
                        checked={selectedSource === dataSource.id.toString()}
                        onChange={handleRadioChange}
                        value={dataSource.id}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {dataSource.name}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {dataSource.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={handleSubmit}
          disabled={!selectedSource}
          sx={{
            px: 5,
            py: 1.5,
            fontWeight: 'bold',
            borderRadius: '8px',
            fontSize: '16px',
            textTransform: 'uppercase',
            opacity: selectedSource ? 1 : 0.6,
            boxShadow: selectedSource ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
            color: selectedSource ? 'white' : 'rgba(255,255,255,0.8)',
            backgroundColor: selectedSource ? 'primary.main' : '#90caf9',
            '&:hover': {
              backgroundColor: selectedSource ? 'primary.dark' : '#90caf9',
            },
          }}
        >
          Confirm Selection
        </Button>
      </Box>
    </Box>
  );
}

export default DataSourceSelection;
