import React, { Component, } from 'react'
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

class Login extends Component {

    static propTypes = {}

    static defaultProps = {}

    constructor(props) {
      super(props)
      this.state = {}
    }
  
    login = () => {
      this.props.login(this.state.username, this.state.password);
    }
    register = () => {
        this.props.register(this.state.username, this.state.password);
    }

    render() {
        return (
            <View style={styles.container}>
              <Text>Enter your credentials</Text>
              <TextInput
                style={{
                  marginTop: 5,
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Username'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(username) => {this.setState({username})}}
                onSubmitEditing={this.authenticate}
                value={(this.state && this.state.username) || ''}
              />
              <TextInput
                style={{
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Password'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(password) => {this.setState({password})}}
                onSubmitEditing={this.authenticate}
                secureTextEntry={true}
                value={(this.state && this.state.password) || ''}
              />
              <Button
                onPress={this.login}
                title="Login"
                color="blue"
                accessibilityLabel="Submit Login"
              />
              <Button
                style={{
                  marginTop: 5
                }}
                onPress={this.register}
                title="Register"
                color="blue"
                accessibilityLabel="Submit Register"
              />
            </View>
        );
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

export default Login