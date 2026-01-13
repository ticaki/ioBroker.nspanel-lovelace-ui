const PageTrashMessageDefault = {
    event: 'entityUpd',
    headline: 'Trash Page',
    navigation: 'button~bSubPrev~~~~~button~bSubNext~~~~',
    icon1: 'trash_can',
    trashType1: '',
    trashDate1: '',
    icon2: 'trash_can',
    trashType2: '',
    trashDate2: '',
    icon3: 'trash_can',
    trashType3: '',
    trashDate3: '',
    icon4: 'trash_can',
    trashType4: '',
    trashDate4: '',
    icon5: 'trash_can',
    trashType5: '',
    trashDate5: '',
    icon6: 'trash_can',
    trashType6: '',
    trashDate6: '',
};

export async function getPageTrash(
    trashJSON: string,
    leftChar: number,
    rightChar: number,
    trashtype1: string,
    trashtype2: string,
    trashtype3: string,
    trashtype4: string,
    trashtype5: string,
    trashtype6: string,
    customEventName1?: string,
    customEventName2?: string,
    customEventName3?: string,
    customEventName4?: string,
    customEventName5?: string,
    customEventName6?: string,
): Promise<{ messages: string[]; error?: any }> {
    const messages: string[] = [];
    const pageTrashMessage = { ...PageTrashMessageDefault };
    let trashNumberOfEntries = 6;
    let farbNummer = 0;
    const datenJSON: any = {};
    try {
        for (let i = 0; i < trashJSON.length; i++) {
            if (trashNumberOfEntries === 7) {
                //if (debug) log('Alle Abfall-Datenpunkte gefüllt', 'warn');
                break;
            }

            //if (debug) log('Daten vom ical Adapter werden ausgewertet', 'info');
            let eventName = getAttr(trashJSON, `${String(i)}.event`);
            eventName = eventName.substring(leftChar, eventName.length - rightChar);
            // Leerzeichen vorne und hinten löschen
            eventName = eventName.trimEnd();
            eventName = eventName.trimStart();
            const eventDatum = getAttr(trashJSON, `${String(i)}.date`);
            const eventStartdatum = getAttr(trashJSON, `${String(i)}._date`);

            const d: Date = new Date();
            const d1: Date = new Date(eventStartdatum);

            //if (debug) log('--------- Nächster Termin wird geprüft ---------', 'info');
            //if (debug)  log(d + ' ' + d1, 'info');
            //if (debug) log('Startdatum UTC: ' + eventStartdatum, 'info');
            //if (debug) log('Datum: ' + eventDatum, 'info');
            //if (debug) log('Event: ' + eventName, 'info');
            //if (debug) log('Kontrolle Leerzeichen %' + eventName + '%', 'info');

            if (d.getTime() <= d1.getTime()) {
                if (
                    eventName == trashtype1 ||
                    eventName == trashtype2 ||
                    eventName == trashtype3 ||
                    eventName == trashtype4 ||
                    eventName == trashtype5 ||
                    eventName == trashtype6
                ) {
                    switch (eventName) {
                        case trashtype1:
                            farbNummer = 33_840;
                            if (customEventName1 != '') {
                                eventName = customEventName1;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                        case trashtype2:
                            farbNummer = 65_504;
                            if (customEventName2 != '') {
                                eventName = customEventName2;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                        case trashtype3:
                            farbNummer = 31;
                            if (customEventName3 != '') {
                                eventName = customEventName3;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                        case trashtype4:
                            farbNummer = 2016;
                            if (customEventName4 != '') {
                                eventName = customEventName4;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                        case trashtype5:
                            farbNummer = 2016;
                            if (customEventName5 != '') {
                                eventName = customEventName5;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                        case trashtype6:
                            farbNummer = 2016;
                            if (customEventName6 != '') {
                                eventName = customEventName6;
                                //if (debug) log('Event customName: ' + eventName, 'info');
                            }
                            break;
                    }

                    //if (debug) log('Abfallnummer: ' + trashNumberOfEntries, 'info');

                    datenJSON[i] = {};
                    datenJSON[i].date = eventDatum;
                    datenJSON[i].event = eventName;
                    datenJSON[i].color = farbNummer;

                    trashNumberOfEntries += 1;
                } else {
                    //if (debug) log('Kein Abfalltermin => Event passt mit keinem Abfallnamen überein.', 'warn');
                }
            } else {
                //if (debug) log('Termin liegt vor dem heutigen Tag', 'warn');
            }
        }
        return { messages };
    } catch (error) {
        return { messages, error };
    }
}
