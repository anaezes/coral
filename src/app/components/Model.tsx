import React from 'react';
import {ModelJSON} from "../utils/ModelUtils";


class Model extends React.Component{
    public longitude: number;
    public latitude: number;
    public assetId: number;
    public active: boolean;
    public pin: any;
    public depth: number;
    public name: string;
    public primitive: any;

    constructor(model: ModelJSON) {
        super(model)
        this.longitude = model.longitude;
        this.latitude = model.latitude;
        this.assetId = model.assetId;
        this.depth = model.depth;
        this.active = false;
        this.name = model.name;
    }


}

export default Model;