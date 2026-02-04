import { Color } from '../../const/Color';
import * as fs from 'node:fs';
import iCal from 'node-ical';

interface ItemObject {
    icon: string;
    color: { r: number; g: number; b: number };
    text: string;
    text1: string;
    text2?: string;
}

export async function getTrashDataFromState(
    trashJSON: any,
    trashTypes: string[] = [],
    customTrash: string[] = [],
    iconColors: string[] = [],
    countItems: number = 6,
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];
    const currentDate = new Date();

    try {
        // Parse trashJSON wenn es ein String ist
        let trashData: any[];
        if (typeof trashJSON === 'string') {
            trashData = JSON.parse(trashJSON);
        } else if (Array.isArray(trashJSON)) {
            trashData = trashJSON;
        } else {
            return { messages: items, error: new Error('trashJSON must be a string or array ') };
        }

        // Prüfen ob trashData ein Array ist
        if (!Array.isArray(trashData)) {
            return { messages: items, error: new Error('trashData is not an  array') };
        }

        let entryCount = 0;

        for (const trashObject of trashData) {
            const eventName = trashObject.event;

            // Prüfen ob event existiert
            if (!eventName || eventName.trim() === '') {
                continue;
            }

            const eventDatum = trashObject.date?.trim() || '';
            const eventStartdatum = new Date(trashObject._date);

            // Nur zukünftige Events
            if (currentDate.getTime() > eventStartdatum.getTime()) {
                continue;
            }

            // Datum im Format dd.mm.yy formatieren
            const day = String(eventStartdatum.getDate()).padStart(2, '0');
            const month = String(eventStartdatum.getMonth() + 1).padStart(2, '0');
            const year = String(eventStartdatum.getFullYear()).slice(-2);
            const eventDatumFormatted = `${day}.${month}.${year}`;

            // Finde passenden Trash-Type (case-insensitive)
            let trashIndex = -1;
            for (let i = 0; i < trashTypes.length; i++) {
                if (trashTypes[i] && trashTypes[i].trim() !== '' && eventName.includes(trashTypes[i])) {
                    trashIndex = i;
                    break;
                }
            }

            if (trashIndex !== -1) {
                items.push({
                    icon: 'trash-can',
                    color: Color.ConvertHexToRgb(iconColors[trashIndex]),
                    text:
                        customTrash[trashIndex] && customTrash[trashIndex] !== ''
                            ? customTrash[trashIndex]
                            : trashTypes[trashIndex],
                    text1: countItems < 6 ? eventDatum : eventDatumFormatted,
                });

                // Maximal 6 Einträge
                entryCount++;
                if (entryCount >= 6) {
                    break;
                }
            }
        }

        return { messages: items };
    } catch (error) {
        return { messages: items, error };
    }
}

export async function getTrashDataFromFile(
    trashFile: string = '',
    trashTypes: string[] = [],
    customTrash: string[] = [],
    iconColors: string[] = [],
    countItems: number = 6,
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];

    try {
        // Prüfe ob Datei existiert
        if (!fs.existsSync(trashFile)) {
            console.warn(`.ics file ${trashFile} does not exist.`);
            return { messages: items, error: `File ${trashFile} does not exist` };
        }

        // Lese Datei
        let fileData: string;
        try {
            fileData = fs.readFileSync(trashFile, 'utf-8');
        } catch (readError) {
            console.error(`Error reading ${trashFile}:`, readError);
            return { messages: items, error: readError };
        }

        // Parse ICS-Daten (synchron mit parseICS statt parseFile)
        const data = iCal.parseICS(fileData);

        // Filter und sortiere Events nach Startdatum
        const arrayData = Object.values(data).filter(
            entry =>
                entry &&
                typeof entry === 'object' &&
                entry.type === 'VEVENT' &&
                new Date(entry.start).getTime() > Date.now(),
        );

        arrayData.sort((a: any, b: any) => {
            const dateA = new Date(a.start).getTime();
            const dateB = new Date(b.start).getTime();
            return dateA - dateB;
        });

        let entryCount = 0; // HIER: Außerhalb der Schleife deklarieren

        // Iteriere über Events
        for (const event of arrayData) {
            if (event.type === 'VEVENT') {
                const eventName = event.summary;

                // Prüfen ob event existiert
                if (!eventName || eventName.trim() === '') {
                    continue;
                }

                const eventStartdatum = new Date(event.start);

                // Datum im Format dd.mm.yy formatieren
                const day = String(eventStartdatum.getDate()).padStart(2, '0');
                const month = String(eventStartdatum.getMonth() + 1).padStart(2, '0');
                const year = String(eventStartdatum.getFullYear()).slice(-2);
                const eventDatumFormatted = `${day}.${month}.${year}`;

                // Finde passenden Trash-Type
                let trashIndex = -1;
                for (let i = 0; i < trashTypes.length; i++) {
                    if (trashTypes[i] && trashTypes[i].trim() !== '' && eventName.includes(trashTypes[i])) {
                        trashIndex = i;
                        break;
                    }
                }

                if (trashIndex !== -1) {
                    items.push({
                        icon: 'trash-can',
                        color: Color.ConvertHexToRgb(iconColors[trashIndex]),
                        text:
                            customTrash[trashIndex] && customTrash[trashIndex] !== ''
                                ? customTrash[trashIndex]
                                : trashTypes[trashIndex],
                        text1:
                            countItems < 6
                                ? eventStartdatum.toLocaleString('de-DE', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                  })
                                : eventDatumFormatted,
                    });

                    entryCount++;
                    if (entryCount >= 6) {
                        break;
                    }
                }
            }
        }

        return { messages: items };
    } catch (error) {
        console.error('Error in getTrashDataFromFile:', error);
        return { messages: items, error };
    }
}
