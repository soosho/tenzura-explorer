export interface KnownAddress {
  label: string;
  description?: string;
  type: 'developer' | 'exchange' | 'funding' | 'team' | 'foundation' | 'other';
  url?: string;
  verified: boolean;
}

const knownAddresses: Record<string, KnownAddress> = {

  "TpFA1tzWgz1t2G8edzi65G5UJLkNscgXHX": {
    label: "Funding Address",
    description: "Primary funding address for Tenzura project",
    type: "funding",
    verified: true
  },
  "TqExosWP37HtqVJiHwpWi1jBYpLwzAdptK": {
    label: "Dev Fee",
    description: "Developer fee collection address",
    type: "developer",
    verified: true
  },
  // Add more known addresses here
};

export default knownAddresses;

/**
 * Get information about a known address
 * @param address The address to look up
 * @returns Information about the address if known, or null if unknown
 */
export function getKnownAddress(address: string): KnownAddress | null {
  return knownAddresses[address] || null;
}

/**
 * Check if an address is known
 * @param address The address to check
 * @returns True if the address is in the known addresses list
 */
export function isKnownAddress(address: string): boolean {
  return address in knownAddresses;
}