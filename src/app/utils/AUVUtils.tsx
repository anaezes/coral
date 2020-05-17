export interface AuvJSON {
    name:           string;
    imcid:          number;
    lastState:      LastStateJSON;
    plan:           PlanJSON;
}

export interface PlanJSON {
    id:             string;
    waypoints:      WaypointJSON[];
    description:    string;
    type:           string;
}

export interface LastStateJSON {
    latitude:       number;
    longitude:      number;
    heading:        number;
    fuel:           number;
    timestamp:      number;
}

export interface WaypointJSON {
    arrivalDate:    string;
    duration:       number;
    eta:            number;
    latitude:       number;
    longitude:      number;
    depth:          number;
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