export interface PIDData {
    pid: string,
    reportedDateTimeLastUpdatedStr: string,
    geonbDateLastUpdated: string,
    found: boolean,
}

export interface GeoNBFindReturnItems {
    attributes: {
        PID_INT: string;
        LAST_UPDATE: string;
    }
}

export interface GeoNBFindReturn {
    results: GeoNBFindReturnItems[],
}