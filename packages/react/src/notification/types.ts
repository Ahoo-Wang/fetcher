export type ChannelType = string;

export interface TypeCapable {
  type: ChannelType;
}

export interface Message<Payload = any> {
  title: string;
  payload: Payload;
  onClick?: () => void;
}
