import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import './IpcamServerComponent.css';

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
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  }
}));

// assigning unique id for each camera
let rowId = 4;

// contains already connected cameras  
let connectedCameras = [];

const IpcamServerComponent = (props) => {

  const classes = useStyles();

  // newly added cameras will go into tableRows
  const [tableRows, setTableRows] = useState([
    { id: 0, ip: 'rtsp://195.46.114.132/live/ch00_0', port: 7000, type: '', url: '', del: false, err: false },
    { id: 1, ip: 'rtsp://98.163.61.242/live/ch00_0', port: 7001, type: '', url: '', del: false, err: false },
    { id: 2, ip: 'rtsp://91.191.213.49:554/live_mpeg4.sdp', port: 7002, type: '', url: '', del: false, err: false },
    // {id:3, ip:'/home/dilip/Downloads/sample.mp4', port: 7003, type: '', url:'', del:false, err:false},
    // {id:3, cam:'Hessdalen', ip:'rtsp://freja.hiof.no:1935/rtplive/definst/hessdalen03.stream', del:false, err:false}
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
      ip: trows[idx].ip !== '' ? trows[idx].ip : '',
      port: trows[idx].port !== 0 ? trows[idx].port : 0,
      type: trows[idx].type !== '' ? trows[idx].type : '',
      url: trows[idx].url,
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
      if (tableRows[index].ip !== '' && tableRows[index].port !== '' && tableRows[index].type !== '') {

        camToDelete.push(tableRows[index].port.toString());
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
        if (val.ip !== '' && val.port !== '' && val.type !== '') {
          camToConnect.push(val);
          connectedCameras.push(val.id);
        }
      }
    }

    // call for establishing connection
    if (camToConnect.length > 0) {
      props.getToken(camToConnect, false);
    }

    const rows = [...tableRows];

    for (const val of camToConnect) {
      switch (val.type) {
        case 'filetortsp':
        case 'rtsptortsp':
          let index = rows.findIndex((obj => obj.port === val.port));
          rows[index].url = 'rtsp://' + window.location.hostname + ':' + val.port + '/stream';
          console.log(rows[index].url);
          break;
        default:
          break;
      }
    }

    setTableRows(rows);
  }

  // adds new row to the table
  const handleAddRow = () => {
    const item = {
      id: rowId,
      ip: '',
      port: 0,
      type: '',
      url: '',
      del: false,
      err: false
    };
    rowId++;
    setTableRows([...tableRows, item]);
  };

  // remove all the rows that are empty
  const handleRemoveRow = () => {
    const nonEmptyRows = tableRows.filter(val => val.ip !== '' && val.port !== '');
    setTableRows(nonEmptyRows)
  };

  // handle changes while modifying details in the table
  const handleChange = (idx) => (e) => {

    const { name, value } = e.target;
    const rows = [...tableRows];

    // adds the camera name
    if (name === 'ip') {
      rows[idx] = {
        id: rows[idx].id,
        [name]: value,
        port: rows[idx].port !== 0 ? rows[idx].port : 0,
        type: rows[idx].type !== '' ? rows[idx].type : '',
        url: '',
        del: rows[idx].del ? true : false,
        err: rows[idx].err
      }
    }
    else if (name === 'port') { // adds the camera rstp url
      rows[idx] = {
        id: rows[idx].id,
        ip: rows[idx].ip !== '' ? rows[idx].ip : '',
        [name]: Number(value),
        type: rows[idx].type !== '' ? rows[idx].type : '',
        url: '',
        del: rows[idx].del ? true : false,
        err: value !== '' && rows.find(val => val.port === value)
      }
    }
    else {
      rows[idx] = {
        id: rows[idx].id,
        ip: rows[idx].ip !== '' ? rows[idx].ip : '',
        port: rows[idx].port !== 0 ? rows[idx].port : 0,
        [name]: value,
        url: '',
        del: rows[idx].del ? true : false,
        err: rows[idx].err
      }
    }
    setTableRows(rows);
  };

  const copyToClipboard = (e) => {
    e.target.select();
    document.execCommand("copy");
  }

  // function to the render dynamic table
  const renderTable = () => {
    return tableRows.map((rows, idx) => {
      return (
        <TableRow key={idx}>

          <TableCell>
            <TextField error={tableRows[idx].err ? true : false} label="Video url" name="ip" variant="outlined"
              value={tableRows[idx].ip} onChange={handleChange(idx)} />
          </TableCell>
          <TableCell>
            <TextField type="number" error={tableRows[idx].err ? true : false} disabled={tableRows[idx].err ? true : false}
              label="Port" name="port" variant="outlined" helperText={tableRows[idx].err ? 'Duplicate port' : ''}
              value={tableRows[idx].port} onChange={handleChange(idx)} />
          </TableCell>
          <TableCell>
            <FormControl variant="outlined" className={classes.formControl}>
              <InputLabel htmlFor="outlined-age-native-simple">Server Type</InputLabel>
              <Select
                name="type"
                label="Server Type"
                value={tableRows[idx].type}
                onChange={handleChange(idx)}
              >
                <MenuItem value={"rtsptortp"}>Rtsp to Rtp</MenuItem>
                <MenuItem value={"rtsptortsp"}>Rtsp to Rtsp</MenuItem>
                <MenuItem value={"filetortsp"}>File to Rtsp</MenuItem>
              </Select>
            </FormControl>
          </TableCell>
          <TableCell>
            <TextField
              name="finalUrl"
              value={tableRows[idx].url}
              InputProps={{
                readOnly: true,
              }}
              variant="filled"
              onClick={copyToClipboard}
            />
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
        maxWidth={'lg'}
        className={classes.dialog}
      >
        <DialogTitle id="scroll-dialog-title">Video Output Server</DialogTitle>
        <DialogActions className={classes.dialogActions}>
          <Button variant="contained" color="primary" onClick={connectSelectedCam} disabled>
            Connect
          </Button>
          <Button variant="contained" color="secondary" onClick={deleteSelectedCam} disabled>
            Disconnect
          </Button>
        </DialogActions>
        <DialogContent dividers={true}>
          <Paper className="container">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Video Url</TableCell>
                  <TableCell>Service Port</TableCell>
                  <TableCell>Server type </TableCell>
                  <TableCell>Output Url</TableCell>
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
          <Button className={classes.btn} variant="outlined" color="secondary" onClick={handleRemoveRow}>
            Delete Empty Rows
            </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}
export default IpcamServerComponent;