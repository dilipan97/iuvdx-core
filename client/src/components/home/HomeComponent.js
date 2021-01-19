import React, { Component } from 'react';
import './HomeComponent.css';

const logo1 = require('../../assets/images/logo1.png')
const logo2 = require('../../assets/images/logo2.png')
const logo3 = require('../../assets/images/IUDX-logo.png')

export default class HomeComponent extends Component {
    constructor(props) {
      super(props)
      this.state = { 
          session: '' ,
        };
      this.handleChange = this.handleChange.bind(this);
      this.handleRedirect = this.handleRedirect.bind(this);
      this.setSessionId = this.setSessionId.bind(this);
    }
  
    componentDidMount() {
      this.setSessionId();
    }

    handleChange(event) {
      this.setState({ session: event.target.value });
    }
  
    handleRedirect() {
      this.props.history.push('/' + this.state.session);
    }

    setSessionId() {
      let id = '';
      let characters = 'abcdefghijklmnopqrstuvwxyz';
      let len = characters.length;
      for ( let i = 0; i < 9; i++ ) {
          if(i % 3 === 0 && i !== 0) {
              id += '-';
          }
          id += characters.charAt(Math.floor(Math.random() * len));
      }
      this.setState({ session: id});
    }

    render() {
        return (
            <div className="section1">  
              <div id="mainHeader">
                <mat-toolbar>
                  <img id="header_img" alt="OpenVidu Logo" src={logo1} />
                </mat-toolbar>
                <mat-toolbar>
                  <img id="header_img1" alt="OpenVidu Logo" src={logo2} />
                </mat-toolbar>
                <mat-toolbar>
                  <img id="header_img" alt="OpenVidu Logo" src={logo3} />
                </mat-toolbar>
              </div>
              <div className="mainContainer">
                  <img className="ovLogo" alt="OpenVidu Logo" src={logo3} />
                  <h4 id="header4">Video data exchange for Smart Cities</h4>
                <div className="formContainer">
                  
                  <form onSubmit={this.handleRedirect}>
                    <div className="joinForm">
                      <input className="inputForm" type="text" value={this.state.session}
                                  onChange={this.handleChange} id="roomInput" />
                      <button type="submit" className="joinButton" id="joinButton" >JOIN</button>
                    </div>
                  </form>
              </div>
            </div>
            </div>
        )
    }
  }
