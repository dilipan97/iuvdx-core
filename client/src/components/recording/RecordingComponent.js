import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Button from '@material-ui/core/Button'
import Divider from "@material-ui/core/Divider";
import Typography from '@material-ui/core/Typography';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

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
        width: 400,
        backgroundColor: theme.palette.background.paper,
        padding: theme.spacing(4, 4, 4),
    },
    title: {
        display: "flex",
        alignItems: "center",
        padding: theme.spacing(0, 1), ...theme.mixins.toolbar,
        justifyContent: "flex-start"
    },
}));

const RecordingComponent = (props) => {

    const classes = useStyles();
    // getModalStyle is not a pure function, we roll the style only on the first render
    const [modalStyle] = useState(getModalStyle);

    const [recordType, setRecordType] = React.useState('INDIVIDUAL');

    const handleRadioChange = (e) => {
        setRecordType(e.target.value);
    }

    const handleRecording = () => {
        handleClose();
        props.startRecord(recordType);
    }

    const handleClose = () => {
        props.setClose();
    };

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
                        Stream recording
                    </Typography>
                    <Divider />
                    <br />
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Recording Type</FormLabel>
                        <br />
                        <RadioGroup aria-label="gender" name="gender1" value={recordType} onChange={handleRadioChange}>
                            <FormControlLabel value="INDIVIDUAL" control={<Radio />} label="Individual Recording " />
                            <FormControlLabel value="COMPOSED" control={<Radio />} label="Composed Recording" />
                        </RadioGroup>
                    </FormControl>
                    <br />
                    <br />
                    <Button variant="outlined" color="primary" onClick={handleRecording}>
                        Start Record
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
export default RecordingComponent;