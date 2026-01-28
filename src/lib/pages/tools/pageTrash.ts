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
    trashtype1: string = '',
    trashtype2: string = '',
    trashtype3: string = '',
    trashtype4: string = '',
    trashtype5: string = '',
    trashtype6: string = '',
    customTrash1: string = '',
    customTrash2: string = '',
    customTrash3: string = '',
    customTrash4: string = '',
    customTrash5: string = '',
    customTrash6: string = '',
    iconColor1: string = '',
    iconColor2: string = '',
    iconColor3: string = '',
    iconColor4: string = '',
    iconColor5: string = '',
    iconColor6: string = '',
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];
    const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
    const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
    const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];
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
                    color: Color.ConvertHexToRgb(iconColor[trashIndex]),
                    text:
                        customTrash[trashIndex] && customTrash[trashIndex] !== ''
                            ? customTrash[trashIndex]
                            : trashTypes[trashIndex],
                    text1: eventDatum,
                    text2: eventDatumFormatted,
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
    trashtype1: string = '',
    trashtype2: string = '',
    trashtype3: string = '',
    trashtype4: string = '',
    trashtype5: string = '',
    trashtype6: string = '',
    customTrash1: string = '',
    customTrash2: string = '',
    customTrash3: string = '',
    customTrash4: string = '',
    customTrash5: string = '',
    customTrash6: string = '',
    iconColor1: string = '',
    iconColor2: string = '',
    iconColor3: string = '',
    iconColor4: string = '',
    iconColor5: string = '',
    iconColor6: string = '',
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];
    const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
    const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
    const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];
    const currentDate = new Date();

    try {
        // Prüfe ob Datei existiert
        if (!fs.existsSync(trashFile)) {
            console.warn(`.ics file ${trashFile} does not exist.`);
            return { messages: items, error: new Error(`File ${trashFile} does not exist`) };
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

        let entryCount = 0; // HIER: Außerhalb der Schleife deklarieren

        // Iteriere über Events
        for (const k in data) {
            if (data[k].type === 'VEVENT') {
                const event = data[k];
                const eventName = event.summary;

                // Prüfen ob event existiert
                if (!eventName || eventName.trim() === '') {
                    continue;
                }

                const eventStartdatum = new Date(event.start);

                // Nur zukünftige Events
                if (currentDate.getTime() > eventStartdatum.getTime()) {
                    continue;
                }

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
                        color: Color.ConvertHexToRgb(iconColor[trashIndex]),
                        text:
                            customTrash[trashIndex] && customTrash[trashIndex] !== ''
                                ? customTrash[trashIndex]
                                : trashTypes[trashIndex],
                        text1: eventStartdatum.toLocaleString('de-DE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                        }),
                        text2: eventDatumFormatted,
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
