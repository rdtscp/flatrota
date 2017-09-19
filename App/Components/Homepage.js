import NavigationBar from 'react-native-navbar'
import React, { Component, } from 'react'
import {
  Alert,
  Button,
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  SegmentedControlIOS,
} from 'react-native'

import axios from 'axios';
import Item from './Item.js';

class Homepage extends Component {

  static propTypes = {}

  static defaultProps = {}

  constructor(props) {
    super(props)
    this.state = {
      modalVisible: false,
      resources: []
    }
  }

  componentDidMount() {
    this.fetchResources();
  }

  fetchResources() {
    axios.post('http://localhost:1337/resource/all')
    .then((response) => {
      res = response.data;
      console.log('resources:')
      console.log(res)
      this.setState({
        resources: res
      });
      console.log(this.state)
    }).catch((err) => console.log(err));
  }

  toggleModal = () => {
    this.setState(previousState => {
      return { modalVisible: !previousState.modalVisible };
    });
    this.fetchResources();
  }

  render() {

    if (this.state.resources) {
      const itemList = this.state.resources.map((item) =>
          <Item key={item.id} item={item} authToken={this.props.authToken} />
      );
      return (
        <View style={{backgroundColor: "black", flex: 1}}>
          <NavigationBar
            title={{ title: 'Communal Resources', tintColor: 'white', }}
            rightButton={{
              title: 'Add Item',
              handler: () => {
                this.setState({
                  modalVisible: true
                })
              }
            }}
            style={{ backgroundColor: "black", }}
            statusBar={{ tintColor: "black", }}
          />
          <ScrollView>
            {itemList}
          </ScrollView>
          <NewItem toggle={this.toggleModal.bind(this)} visible={this.state.modalVisible} />
        </View>
      )
    }
    else {
      return (
        <View style={{backgroundColor: "black", flex: 1}}>
          <NavigationBar
            title={{ title: 'Loading...', tintColor: 'white', }}
            style={{ backgroundColor: "black", }}
            statusBar={{ tintColor: "black", }}
          />
        </View>
      );
    }
  }

}

class NewItem extends Component {

  constructor(props) {
    super(props);
  }

  create() {
    // Send network request.
    // Alert.alert('Name: ' + this.state.name + '\nPrice: £' + this.state.price + '\nDesc: ' + this.state.description + '\nQuantity: ' + this.state.quantity);
    // Post our authToken to the backend.
    axios.post('http://localhost:1337/resource/new', {
        name: this.state.name,
        price: this.state.price,
        desc: this.state.description,
        quantity: this.state.quantity
    })
    .then((response) => {
        res = response.data;
        // Mark that we have finished loading, and store validity of our authToken.
        this.setState({
            loading: false,
            authenticated: res.valid
        });
        // Stop trying to check authToken.
        clearInterval(tokenCheck)
    })
    .catch((err) => {
        throw err;
    })
    // Close modal.
    this.close();
  }

  close() {
    this.props.toggle();
  }

  render() {
      return (
        <Modal
          transparent={false}
          visible={this.props.visible}>
          <View style={styles.modal}>
              <Text>Add new Item</Text>
              <TextInput
                style={{
                  marginTop: 5,
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Name'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(name) => {this.setState({name})}}
                value={(this.state && this.state.name) || ''}
              />
              <TextInput
                style={{
                  marginTop: 5,
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Price'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(price) => {this.setState({price})}}
                value={(this.state && this.state.price) || ''}
              />
              <TextInput
                style={{
                  marginTop: 5,
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Description'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(description) => {this.setState({description})}}
                value={(this.state && this.state.description) || ''}
              />
              <TextInput
                style={{
                  marginTop: 5,
                  height: 30, 
                  width:  300 ,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.5)",
                }}
                placeholder={'Quantity'}
                placeholderTextColor={"rgba(198,198,204,1)"}
                onChangeText={(quantity) => {this.setState({quantity})}}
                value={(this.state && this.state.quantity) || ''}
              />
              <Button
                onPress={this.create.bind(this)}
                title="Submit"
                color="blue"
                accessibilityLabel="Submit"
              />
              <Button
                onPress={this.close.bind(this)}
                title="Cancel"
                color="blue"
                accessibilityLabel="Cancel"
              />
          </View>
        </Modal>
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
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  }
});

export default Homepage