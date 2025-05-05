import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

const DsenseTable = ({ data = [] }) => {
  // Add `id` to each row based on index (starting from 1)
  const dataWithId = data.map((row, index) => ({
    id: index + 1,
    ...row,
  }));

  const generateColumnsFromData = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const sample = data[0];
    return Object.keys(sample)
      .filter((key) => key !== 'id') // Skip duplicate id column
      .map((key) => ({
        field: key,
        headerName: key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        minWidth: 130,
        flex: 1,
        type: typeof sample[key] === 'number' ? 'number' : 'string',
        sortable: true,
      }));
  };

  const indexColumn = {
    field: 'id',
    headerName: '#',
    width: 60,
    sortable: false,
    filterable: false,
  };

  const columns =
    dataWithId.length > 0
      ? [indexColumn, ...generateColumnsFromData(dataWithId)]
      : [];

  const paginationModel = { page: 0, pageSize: 5 };

  return (
    <Paper
      elevation={3}
      sx={{
        height: 450,
        width: '100%',
        backgroundColor: '#f0f0f0',
        border: '1px solid #b0b0b0',
        borderRadius: 2,
        padding: 0.5,
      }}
    >
      <DataGrid
        rows={dataWithId}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        sx={{
          backgroundColor: '#ffffff',
          borderRadius: 2,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#e0e0e0',
            fontWeight: 'bold',
            fontSize: '0.95rem',
          },
          '& .MuiDataGrid-cell': {
            fontSize: '0.9rem',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f9f9f9',
          },
        }}
      />
    </Paper>
  );
};

export default DsenseTable;
