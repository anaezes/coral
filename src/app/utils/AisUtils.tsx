
export interface AisJSON {
    id: string;
    mmsi: number;
    strtype: string;
    type: number;
    name: string;
    timestamp: number;
    cog: number;
    heading: number;
    sog: number;
    bow: number;
    stern: number;
    port:number;
    starboard: number;
    draught: number;
    dest: string;
    eta: string;
    latitude: number;
    longitude: number;
}
