import React,{useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Divider from "@material-ui/core/Divider";
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    outline: 'none',
    position: 'absolute',
    width: 700,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(4, 4, 4),
  },
  container: {
    maxHeight: 400,
  },
  btn: {
    marginLeft: 30,
  },
  title: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1), ...theme.mixins.toolbar,
    justifyContent: "flex-start"
  }
}));

// assigning unique id for each camera
let rowId = 4;

// contains already connected cameras  
let connectedCameras = [];

const IpCameraComponent =(props) =>{

  const classes = useStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = useState(getModalStyle);

  // newly added cameras will go into tableRows
  const [tableRows, setTableRows] = useState([
    {id:0, cam:'Russian building', ip:'rtsp://195.46.114.132/live/ch00_0', del:false, err:false},
    {id:1, cam:'Wickenburg, Arizona', ip:'rtsp://98.163.61.242/live/ch00_0', del:false, err:false},
    {id:2, cam:'City', ip:'rtsp://91.191.213.49:554/live_mpeg4.sdp', del:false, err:false},
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
      cam: trows[idx].cam !== ''? trows[idx].cam: '',
      ip: trows[idx].ip !== ''? trows[idx].ip: '',
      del: e.target.checked,
      err: trows[idx].err
    }
    setTableRows(trows);

    // cameras added to list if the box is checked
    if(e.target.checked) {
      setDeleteCam([...deleteCam, tableRows[idx].id])
    }
    else {

      const index = deleteCam.indexOf(tableRows[idx].id);
      if(index > -1) {
        deleteCam.splice(index, 1);
      }
      setDeleteCam(deleteCam);
    }
  }

  // disconnects all the selected cameras from the session
  const deleteSelectedCam = () => {

    const camToDelete = [];
    
    // validates the cameras that are to be deleted
    for(const id of deleteCam) {

      const index = tableRows.findIndex(val => val.id === id);
      if(tableRows[index].cam !== '' && tableRows[index].ip !== '') {
        
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
    if(camToDelete.length > 0) {
      props.removeCam(camToDelete);
    }

    setDeleteCam([]);
  }

  // establishes connection for the cameras
  const connectSelectedCam = () => {

    let camToConnect = [];

    // adds only the cameras that are not already connected
    for(const val of tableRows) {
      if(!val.err && !connectedCameras.includes(val.id)) {
        if(val.cam !== '' && val.ip !== '') {
          camToConnect.push(val);
          connectedCameras.push(val.id);
        }
      }
    }

    // call for establishing connection
    if(camToConnect.length > 0) {
      props.getToken(camToConnect, true);
    }
  }

  // adds new row to the table
  const handleAddRow = () => {
    const item = {
      id  : rowId,
      cam : '',
      ip  : '',
      del : false,
      err : false
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
    if(name === 'cam') {
      rows[idx] = {
        id    : rows[idx].id,
        [name]: value,
        ip    : rows[idx].ip !== ''? rows[idx].ip: '',
        del   : rows[idx].del? true: false,
        err   : value !== '' && rows.find(val => val.cam === value)
      }
    }
    else { // adds the camera rstp url
      rows[idx] = {
        id    : rows[idx].id,
        cam   : rows[idx].cam !== ''? rows[idx].cam: '',
        [name]: value,
        del   : rows[idx].del? true: false,
        err   : rows[idx].err
      }
    }
    setTableRows(rows);
  };

  // function to the render dynamic table
  const renderTable = () => {
    return tableRows.map((rows, idx) => {
      return (
        <TableRow key={idx}>
          <TableCell>
            <TextField error={tableRows[idx].err? true: false} label="Name" name="cam" variant="outlined" helperText={tableRows[idx].err?'Duplicate camera name':''} 
              value={tableRows[idx].cam} onChange={handleChange(idx)}/>
          </TableCell>
          <TableCell>
            <TextField error={tableRows[idx].err? true: false} disabled={tableRows[idx].err? true: false} label="rtsp stream url" name="ip" variant="outlined" 
              value={tableRows[idx].ip} onChange={handleChange(idx)}/>
          </TableCell>
          <TableCell>
           <Checkbox  indeterminate inputProps={{ 'aria-label': 'indeterminate checkbox' }}  checked={tableRows[idx].del} onChange={handleChecked(idx)}/>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div>
      <Modal
        open={props.open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
       
        <div style={modalStyle} className={classes.paper}>
          <Typography variant="h4" className={classes.title} >
            Subscribe to IP Cameras
          </Typography>
          <Divider />
          <br/>
          <Button variant="contained" color="primary" onClick={connectSelectedCam}>
            Connect
          </Button>
          <Button className={classes.btn} variant="contained" color="secondary" onClick={deleteSelectedCam}>
            Disconnect
          </Button>
          <br/>
          <br/>
          <TableContainer component={Paper} className={classes.container}>
            <Table className={classes.table} aria-label="simple table">
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
          </TableContainer>
            <br/>
            <Button variant="outlined" color="primary" onClick={handleAddRow}>
              Add Row
            </Button>
            <Button className={classes.btn} variant="outlined" color="secondary" onClick={handleRemoveRow}>
              Delete Empty Rows
            </Button>
        </div>
      </Modal>
    </div>
  );
}
export default IpCameraComponent;