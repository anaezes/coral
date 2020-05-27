export interface AuvJSON {
    imcid:          number;
    name:           string;
    type:           string;
    planId:         string;
    lastUpdateMillis: number;
    lastState:      LastStateJSON;
    plan:           WaypointJSON[];
}


export interface LastStateJSON {
    latitude:       number;
    longitude:      number;
    depth:          number;
    heading:        number;
    fuel:           number;
    speed:          number;
    timestamp:      number;
}

export interface WaypointJSON {
    latitude:       number;
    longitude:      number;
    depth:          number;
    eta:            number;
}

export interface Sample {
    sampleType:     string;
    timeMillis:     number;
    latitude:       number;
    longitude:      number;
    depth:          number;
    imcId:          number;
    value:          number;
}