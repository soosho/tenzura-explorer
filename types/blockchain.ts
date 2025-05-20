export interface Peer {
  id: number;
  addr: string;
  addrlocal?: string;
  services: string;
  servicesnames?: string[];
  lastsend: number;
  lastrecv: number;
  bytessent: number;
  bytesrecv: number;
  conntime: number;
  timeoffset: number;
  ping: number;
  version: number;
  subver: string;
  inbound: boolean;
  startingheight: number;
  banscore: number;
  synced_headers: number;
  synced_blocks: number;
  
  // Additional properties from geolocation
  country?: string;
  countryCode?: string;
}