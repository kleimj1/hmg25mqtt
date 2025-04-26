import { Device, MqttConfig } from './types';
import { getDeviceDefinition } from './deviceDefinition';

/**
 * Interface for device state data
 */
export type DeviceStateData = object;

/**
 * Device topic structure
 */
export interface DeviceTopics {
  deviceTopic: string;
  publishTopic: string;
  deviceControlTopic: string;
  controlSubscriptionTopic: string;
  availabilityTopic: string;
}

/**
 * Type for device key (deviceType:deviceId)
 */
type DeviceKey = `${string}:${string}`;

/**
 * Device Manager class to handle device state and topics
 */
export class DeviceManager {
  private deviceTopics: Record<DeviceKey, DeviceTopics> = {};
  private deviceStates: Record<DeviceKey, Record<string, DeviceStateData> | undefined> = {};
  private deviceResponseTimeouts: Record<DeviceKey, NodeJS.Timeout | null> = {};

  constructor(
    private config: MqttConfig,
    private readonly onUpdateState: (
      device: Device,
      path: string,
      deviceState: DeviceStateData,
    ) => void,
  ) {
    this.config.devices.forEach((device) => {
      console.log(
        '[DeviceManager] Starte Initialisierung für Gerät:',
        device.deviceType,
        'mit ID:',
        device.deviceId,
      );

      const deviceDefinition = getDeviceDefinition(device.deviceType);
      if (!deviceDefinition) {
        console.warn(
          `[DeviceManager] Unbekannter Gerätetyp: ${device.deviceType}, wird übersprungen.`,
        );
        return;
      }

      console.log('[DeviceManager] Gefundene Device Definition für Typ:', device.deviceType);

      const deviceKey = this.getDeviceKey(device);
      console.log(`[DeviceManager] Initialisiere Topics für Gerät: ${deviceKey}`);

      this.deviceTopics[deviceKey] = {
        deviceTopic: `hame_energy/${device.deviceType}/device/${device.deviceId}/ctrl`,
        publishTopic: `hame_energy/${device.deviceType}/device/${device.deviceId}`,
        deviceControlTopic: `hame_energy/${device.deviceType}/App/${device.deviceId}/ctrl`,
        controlSubscriptionTopic: `hame_energy/${device.deviceType}/control/${device.deviceId}`,
        availabilityTopic: `hame_energy/${device.deviceType}/availability/${device.deviceId}`,
      };

      this.deviceResponseTimeouts[deviceKey] = null;

      console.log(`[DeviceManager] Angelegte Topics für ${deviceKey}:`, this.deviceTopics[deviceKey]);
    });
  }

  private getDeviceKey(device: Device): DeviceKey {
    return `${device.deviceType}:${device.deviceId}`;
  }

  getDeviceTopics(device: Device): DeviceTopics | undefined {
    const deviceKey = this.getDeviceKey(device);
    return this.deviceTopics[deviceKey];
  }

  getDeviceState(device: Device): DeviceStateData | undefined {
    const deviceKey = this.getDeviceKey(device);
    const stateByPath = this.deviceStates[deviceKey];
    const mergedState = Object.values(stateByPath ?? {}).reduce(
      (acc, state) => ({ ...acc, ...state }),
      {},
    );
    return mergedState;
  }

  private getDeviceStateForPath<T extends DeviceStateData | undefined>(
    device: Device,
    publishPath: string,
  ): DeviceStateData & T {
    const deviceKey = this.getDeviceKey(device);
    const stateByPath = this.deviceStates[deviceKey] ?? {};
    return (stateByPath[publishPath] ??
      this.getDefaultDeviceState(device, publishPath)) as DeviceStateData & T;
  }

  private getDefaultDeviceState<T extends DeviceStateData | undefined>(
    device: Device,
    publishPath: string,
  ): DeviceStateData & T {
    const deviceDefinition = getDeviceDefinition(device.deviceType);
    const defaultState = deviceDefinition?.messages.find(
      (msg) => msg.publishPath === publishPath,
    )?.defaultState;
    return (defaultState ?? {}) as DeviceStateData & T;
  }

  updateDeviceState<T extends DeviceStateData | undefined>(
    device: Device,
    path: string,
    updater: (state: DeviceStateData) => T,
  ): DeviceStateData & T {
    const deviceKey = this.getDeviceKey(device);
    const newDeviceState: T = {
      ...this.getDeviceStateForPath(device, path),
      ...updater(this.getDeviceStateForPath(device, path)),
    };
    this.deviceStates[deviceKey] = {
      ...this.deviceStates[deviceKey],
      [path]: newDeviceState,
    };
    this.onUpdateState(device, path, newDeviceState);
    return newDeviceState as DeviceStateData & T;
  }

  getControlTopics(device: Device): string[] {
    const deviceKey = this.getDeviceKey(device);
    const controlTopicBase = this.deviceTopics[deviceKey].controlSubscriptionTopic;
    const deviceDefinitions = getDeviceDefinition(device.deviceType);

    return (
      deviceDefinitions?.messages?.flatMap((msg) =>
        msg.commands.map(({ command }) => `${controlTopicBase}/${command}`),
      ) ?? []
    );
  }

  hasRunningResponseTimeouts(device: Device): boolean {
    const deviceKey = this.getDeviceKey(device);
    return this.deviceResponseTimeouts[deviceKey] !== null;
  }

  setResponseTimeout(device: Device, timeout: NodeJS.Timeout): void {
    const deviceKey = this.getDeviceKey(device);
    this.clearResponseTimeout(device);
    this.deviceResponseTimeouts[deviceKey] = timeout;
  }

  clearResponseTimeout(device: Device): void {
    const deviceKey = this.getDeviceKey(device);
    if (this.deviceResponseTimeouts[deviceKey]) {
      clearTimeout(this.deviceResponseTimeouts[deviceKey]!);
      this.deviceResponseTimeouts[deviceKey] = null;
    }
  }

  getDevices(): Device[] {
    return this.config.devices;
  }

  getDeviceByKey(deviceKey: DeviceKey): Device | undefined {
    return this.config.devices.find((device) => this.getDeviceKey(device) === deviceKey);
  }

  findDeviceForTopic(topic: string):
    | {
        device: Device;
        topicType: 'device' | 'control';
      }
    | undefined {
    for (const device of this.config.devices) {
      const deviceKey = this.getDeviceKey(device);
      const topics = this.deviceTopics[deviceKey];

      if (topic === topics.deviceTopic) {
        return { device, topicType: 'device' };
      } else if (topic.startsWith(topics.controlSubscriptionTopic)) {
        return { device, topicType: 'control' };
      }
    }

    return undefined;
  }

  getPollingInterval(): number {
    const allPollingIntervals = this.getDevices().flatMap((device) => {
      return (
        getDeviceDefinition(device.deviceType)
          ?.messages.map((message) => {
            return message.pollInterval;
          })
          ?.filter((n) => n != null) ?? []
      );
    });

    function gcd2(a: number, b: number): number {
      if (b === 0) {
        return a;
      }
      return gcd2(b, a % b);
    }

    return allPollingIntervals.reduce(gcd2, allPollingIntervals[0]);
  }

  getResponseTimeout(): number {
    return this.config.responseTimeout || 15000;
  }
}
