
import React, { Component } from 'react';
import {
  Alert,
  AppRegistry,
  AsyncStorage,
  Button,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native'

import Login from './Components/Login.js';
import Homepage from './Components/Homepage.js';
import axios from 'axios';

import SocketIOClient from 'socket.io-client';
import PushNotification from 'react-native-push-notification'


console.disableYellowBox = true;

class App extends Component {

    constructor(props) {
        super(props)
        this.state = {
            authToken: '',
            loading: true,
            authenticated: false
        }
    }
  
    componentDidMount() {
        // Configure Notifications.
        PushNotification.configure({
            onNotification: function(notification) {
                console.log('RECEIVED NOTIFICATION');
            },
            requestPermissions: true,
        })
        // Get our authToken.
        AsyncStorage.getItem('authToken', (err, authToken) => {
            if (err) console.log(err);
            // var authToken = JSON.parse(authToken);
            // If we have a token.
            if (authToken !== null){
                this.setState({ 
                    authToken: authToken
                });
                this.checkToken(authToken);
                this.handleSocket(authToken);
            // Else Login.
            } else {
                this.setState({
                    loading: false,
                    authenticated: false
                });
            }
        });
    }

    // Checks if our authToken is still valid.
    checkToken = (authToken) => {
        // Schedule a check for every 1 second.
        var tokenCheck = setInterval(() => {
            // Post our authToken to the backend.
            axios.post('http://localhost:1337/token', {
                authToken: authToken
            })
            .then((response) => {
                res = response.data;
                // Mark that we have finished loading, and store validity of our authToken.
                this.setState({
                    loading: false,
                    authenticated: res.valid
                });
                // Remove token if required.
                if (!res.valid) {
                    AsyncStorage.removeItem('authToken');
                }
                // Stop trying to check authToken.
                clearInterval(tokenCheck)
            })
            .catch((err) => {
                throw err;
            });
        }, 1000);
    }

    // Will handle connection to socket, and receiving of notifications.
    handleSocket = (authToken) => {
        console.log('tryConnectSocket')
        var socket = SocketIOClient('http://localhost:1337');
        socket.on('connect', () => {
            socket.emit('login', authToken);
        });
        socket.on('inc_notif', (data) => {
            PushNotification.localNotification({
                message: 'It is your turn to buy: \n' + data.quantity + ' of ' + data.resource
            });
            PushNotification.setApplicationIconBadgeNumber(1)
            Alert.alert('It is your turn to buy: \n' + data.quantity + ' of ' + data.resource);
            socket.emit('received_notif', data);
        })
    }

    // Posts Login details to backend.
    login = (username, password) => {
        axios.post('http://localhost:1337/login', {
            username: username,
            password: password
        })
        .then((response) => {
            res = response.data
            // If the response contains a authToken.
            if (res.authToken) {
                // Store the authToken in storage.
                AsyncStorage.setItem('authToken', res.authToken, (err) => {
                    if (err) {
                        console.log(err);
                        // Inform App we have stopped loading, but we are not authenticated.
                        this.setState({
                            loading: false,
                            authenticated: false
                        });
                    } else {
                        console.log('Stored authToken: ' + res.authToken);
                        // Inform App we have stopped loading, and we are authenticated.
                        this.setState({
                            loading: false,
                            authenticated: true
                        });
                    }
                });
            } else {
                // There was no authToken in response: Inform App we have stopped loading, and we are not authenticated.
                this.setState({
                    loading: false,
                    authenticated: false
                })
            }
        })
        .catch((error) => {
            console.error(error);
        });
    }
  
    // Posts Register details to backend.
    register = (username, password) => {
        axios.post('http://localhost:1337/register', {
            username: username,
            password: password
        })
        .then((response) => {
            res = response.data;
            // If the response contains a authToken.
            if (res.authToken) {
                // Store the tokauthTokenen in storage.
                AsyncStorage.setItem('authToken', JSON.stringify(res.authToken), (err) => {
                    if (err) {
                        console.log(err);
                        // Inform App we have stopped loading, but we are not authenticated.
                        this.setState({
                            loading: false,
                            authenticated: false
                        });
                    } else {
                        console.log('Stored authToken: ' + res.authToken);
                        // Inform App we have stopped loading, and we are authenticated.
                        this.setState({
                            loading: false,
                            authenticated: true
                        });
                    }
                });
            } else {
                // There was no authToken in response: Inform App we have stopped loading, and we are not authenticated.
                this.setState({
                    loading: false,
                    authenticated: false
                })
            }
        })
        .catch((error) => {
            console.error(error);
        });
    }

    render() {
      if (this.state.loading) {
          return (
              <View style={styles.container}>
                <ActivityIndicator
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  animating={true}
                  size={'small'}
                  color={'black'}
                />
              </View>
          );
      } else {
          if (this.state.authenticated) {
              return (
                  <Homepage authToken={this.state.authToken} />
              );
          } else {
              return (
                  <Login login={this.login} register={this.register} />
              );
          }
      }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

export default App