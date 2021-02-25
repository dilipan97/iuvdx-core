import React, { useState } from 'react';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import { makeStyles } from '@material-ui/core/styles';

import './IpCameraComponent.css';

const useStyles = makeStyles((theme) => ({
  dialog: {
    marginTop: '30px',
  },
  dialogActions: {
    flex: '0 0 auto',
    display: 'flex',
    paddingLeft: '20px',
    alignItems: 'center',
    justifyContent: 'flex-start',
  }
}))

// assigning unique id for each camera
let rowId = 5;

// contains already connected cameras  
let connectedCameras = [];

const IpCameraComponent = (props) => {

  const classes = useStyles();

  // newly added cameras will go into tableRows
  const [tableRows, setTableRows] = useState([
    { id: 0, cam: 'Abhoy Nagar Bridge', ip: 'rtsp://admin:admin123@video-server.iudx.io:8554/abhoy_nagar_bridge', del: false, err: false },
    { id: 1, cam: 'Melar Math', ip: 'rtsp://admin:admin123@video-server.iudx.io:8554/melar_math', del: false, err: false },
    { id: 2, cam: 'Orient Chowmuhani 1', ip: 'rtsp://admin:admin123@video-server.iudx.io:8554/orient_chowmuhani_1', del: false, err: false },
    { id: 3, cam: 'Orient Chowmuhani 2', ip: 'rtsp://admin:admin123@video-server.iudx.io:8554/orient_chowmuhani_2', del: false, err: false },
    { id: 4, cam: 'Orient Chowmuhani 3', ip: 'rtsp://admin:admin123@video-server.iudx.io:8554/orient_chowmuhani_3', del: false, err: false },
  ]);

  // deleted cameras is stored in this variable
  const [deleteCam, setDeleteCam] = useState([]);

  const handleClose = () => {
    props.setClose();
  };

  // function to handle checkbox onchecked validation
  const handleChecked = (idx) => (e) => {

    // changes the checked value status
    const trows = [...tableRows];
    trows[idx] = {
      id: trows[idx].id,
      cam: trows[idx].cam !== '' ? trows[idx].cam : '',
      ip: trows[idx].ip !== '' ? trows[idx].ip : '',
      del: e.target.checked,
      err: trows[idx].err
    }
    setTableRows(trows);

    // cameras added to list if the box is checked
    if (e.target.checked) {
      setDeleteCam([...deleteCam, tableRows[idx].id])
    }
    else {

      const index = deleteCam.indexOf(tableRows[idx].id);
      if (index > -1) {
        deleteCam.splice(index, 1);
      }
      setDeleteCam(deleteCam);
    }
  }

  // disconnects all the selected cameras from the session
  const deleteSelectedCam = () => {

    const camToDelete = [];

    // validates the cameras that are to be deleted
    for (const id of deleteCam) {

      const index = tableRows.findIndex(val => val.id === id);
      if (tableRows[index].cam !== '' && tableRows[index].ip !== '') {

        camToDelete.push(tableRows[index].cam);
        let indx = connectedCameras.indexOf(id);

        // removing cameras from already connected camera list
        if (indx > -1) {
          connectedCameras.splice(indx, 1);
        }
      }
      tableRows.splice(index, 1);
      setTableRows(tableRows);
    }

    // call for diconnecting the cameras 
    if (camToDelete.length > 0) {
      props.removeCam(camToDelete);
    }

    setDeleteCam([]);
  }

  // establishes connection for the cameras
  const connectSelectedCam = () => {

    let camToConnect = [];

    // adds only the cameras that are not already connected
    for (const val of tableRows) {
      if (!val.err && !connectedCameras.includes(val.id)) {
        if (val.cam !== '' && val.ip !== '') {
          camToConnect.push(val);
          connectedCameras.push(val.id);
        }
      }
    }

    // call for establishing connection
    if (camToConnect.length > 0) {
      props.getToken(camToConnect, true);
    }
  }

  // adds new row to the table
  const handleAddRow = () => {
    const item = {
      id: rowId,
      cam: '',
      ip: '',
      del: false,
      err: false
    };
    rowId++;
    setTableRows([...tableRows, item]);
  };

  // remove all the rows that are empty
  const handleRemoveRow = () => {
    const nonEmptyRows = tableRows.filter(val => val.cam !== '' && val.ip !== '');
    setTableRows(nonEmptyRows)
  };

  // handle changes while modifying details in the table
  const handleChange = (idx) => (e) => {

    const { name, value } = e.target;
    const rows = [...tableRows];

    // adds the camera name
    if (name === 'cam') {
      rows[idx] = {
        id: rows[idx].id,
        [name]: value,
        ip: rows[idx].ip !== '' ? rows[idx].ip : '',
        del: rows[idx].del ? true : false,
        err: value !== '' && rows.find(val => val.cam === value)
      }
    }
    else { // adds the camera rstp url
      rows[idx] = {
        id: rows[idx].id,
        cam: rows[idx].cam !== '' ? rows[idx].cam : '',
        [name]: value,
        del: rows[idx].del ? true : false,
        err: rows[idx].err
      }
    }
    setTableRows(rows);
  };

  // function to the render dynamic table
  const renderTable = () => {
    return tableRows.map((rows, idx) => {
      return (
        <TableRow key={idx}>
          <TableCell >
            <TextField style={{ width: "100%" }} error={tableRows[idx].err ? true : false} label="Name" name="cam" variant="outlined" helperText={tableRows[idx].err ? 'Duplicate camera name' : ''}
              value={tableRows[idx].cam} onChange={handleChange(idx)} />
          </TableCell>
          <TableCell>
            <TextField style={{ width: "100%" }} error={tableRows[idx].err ? true : false} disabled={tableRows[idx].err ? true : false} label="rtsp stream url" name="ip" variant="outlined"
              value={tableRows[idx].ip} onChange={handleChange(idx)} />
          </TableCell>
          <TableCell>
            <Checkbox indeterminate inputProps={{ 'aria-label': 'indeterminate checkbox' }} checked={tableRows[idx].del} onChange={handleChecked(idx)} />
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div>
      <Dialog
        open={props.open}
        onClose={handleClose}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
        fullWidth={true}
        maxWidth={'md'}
        className={classes.dialog}
      >
        <DialogTitle id="scroll-dialog-title">Subscribe to IP Cameras</DialogTitle>
        <DialogActions className={classes.dialogActions}>
          <Button variant="contained" color="primary" onClick={connectSelectedCam}>
            Connect
          </Button>
          <Button variant="contained" color="secondary" onClick={deleteSelectedCam}>
            Disconnect
          </Button>
        </DialogActions>
        <DialogContent dividers={true}>
          <Paper className="container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Camera Name</TableCell>
                  <TableCell>Camera IP</TableCell>
                  <TableCell>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTable()}
              </TableBody>
            </Table>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="primary" onClick={handleAddRow}>
            Add Row
            </Button>
          <Button variant="outlined" color="secondary" onClick={handleRemoveRow}>
            Delete Empty Rows
            </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
export default IpCameraComponent;