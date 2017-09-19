/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Alert,
  AppRegistry,
  Button,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TextInput,
} from 'react-native'

import App from './App/App.js';

export default class flatrota_mobile extends Component {
    render() {
        return (
          <App />
        );
    }
}

AppRegistry.registerComponent('flatrota_mobile', () => flatrota_mobile);
