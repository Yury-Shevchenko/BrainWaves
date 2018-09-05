import React, { Component } from "react";
import { isNil, debounce } from "lodash";
import { Modal, Button, Segment, Image, List, Header } from "semantic-ui-react";
import {
  DEVICE_AVAILABILITY,
  CONNECTION_STATUS
} from "../../constants/constants";

interface Props {
  open: boolean;
  client: ?any;
  connectedDevice: Object;
  signalQualityObservable: ?any;
  deviceType: DEVICES;
  deviceAvailability: DEVICE_AVAILABILITY;
  connectionStatus: CONNECTION_STATUS;
  deviceActions: Object;
  availableDevices: Array<any>;
}

interface State {
  selectedDevice: ?any;
}

export default class ConnectModal extends Component<Props, State> {
  handleConnect: () => void;
  handleSearch: () => void;
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedDevice: null
    };
    this.handleSearch = debounce(this.handleSearch.bind(this), 300, {
      leading: true,
      trailing: false
    });
    this.handleConnect = debounce(this.handleConnect.bind(this), 1000, {
      leading: true,
      trailing: false
    });
  }

  handleSearch() {
    this.props.deviceActions.setDeviceAvailability(
      DEVICE_AVAILABILITY.SEARCHING
    );
  }

  handleConnect() {
    this.props.deviceActions.connectToDevice(this.state.selectedDevice);
  }

  renderAvailableDeviceList() {
    if (this.props.deviceAvailability === DEVICE_AVAILABILITY.NONE) {
      return (
        <Segment basic>
          <Button onClick={this.handleSearch}>Search</Button>
        </Segment>
      );
    }
    return (
      <Segment basic>
        <Header as="h4">Available Devices:</Header>
        <List divided relaxed>
          {this.props.availableDevices.map((device, index) => (
            <List.Item key={index}>
              <List.Icon
                link
                name={
                  this.state.selectedDevice === device
                    ? "check circle outline"
                    : "circle outline"
                }
                size="large"
                verticalAlign="middle"
                onClick={() => this.setState({ selectedDevice: device })}
              />
              <List.Content>
                <List.Header>
                  {this.props.deviceType === DEVICES.EMOTIV
                    ? device.id
                    : device.name}
                </List.Header>
              </List.Content>
            </List.Item>
          ))}
        </List>
        <Segment basic>
          <Button
            disabled={isNil(this.state.selectedDevice)}
            onClick={this.handleConnect}
          >
            Connect
          </Button>
        </Segment>
        <Segment basic>
          <Button onClick={this.handleSearch}>Search</Button>
        </Segment>
      </Segment>
    );
  }

  renderContent() {
    return <Modal.Content>Placeholder</Modal.Content>;
  }

  render() {
    return <Modal open={this.props.open}>{this.renderContent()}</Modal>;
  }
}
