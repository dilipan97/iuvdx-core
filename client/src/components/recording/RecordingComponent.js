import React from 'react';
import Button from '@material-ui/core/Button'
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

const RecordingComponent = (props) => {

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
            <Dialog
                open={props.open}
                onClose={handleClose}
                aria-labelledby="scroll-dialog-title"
                aria-describedby="scroll-dialog-description"
                fullWidth={true}
                maxWidth={'md'}
                style={{ marginTop: '30px' }}
            >
                <DialogTitle id="scroll-dialog-title"> Stream recording</DialogTitle>
                <DialogContent dividers={true}>
                    <div style={{ width: '30%', float: 'left', paddingTop: '10px', }}>
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
                    <div style={{ width: '60%', height: '80%', float: 'right', paddingTop: '10px', overflow: 'auto', textAlign: 'center' }}>
                        <FormLabel component="legend">Recorded files</FormLabel>
                        <br />
                        {props.filesList.map((files, i) => (
                            <Button key={i} color="primary" style={{ paddingTop: '5px' }}
                                onClick={() => window.open(files.url)}>{files.folderName} ({files.type}) Download</Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
export default RecordingComponent;