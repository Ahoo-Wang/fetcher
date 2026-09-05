export type ChannelType = string;

export interface TypeCapable {
  type: ChannelType;
}

export interface Message<Payload = any> {
  title: string;
  payload: Payload;
  /** Local callback; omitted from notifications broadcast to other contexts. */
  onClick?: () => void;
}
