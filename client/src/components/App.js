import React, { Component } from 'react'; 
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'; 
import HomeComponent from './home/HomeComponent';
import VideoRoomComponent from '../components/video-room/VideoRoomComponent';
import './App.css'; 
  
class App extends Component { 
  render() { 
    return ( 
        <Router> 
            <Switch> 
                <Route exact path='/' component={HomeComponent}></Route> 
                <Route path='/:value' component={VideoRoomComponent}></Route> 
            </Switch> 
        </Router>
   ); 
  } 
} 
export default App;
