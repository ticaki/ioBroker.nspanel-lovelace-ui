const alexa: PageType ={
        type: 'cardMedia',
        heading: 'Alexa Wohnzimmer',
        alwaysOnDisplay: true,
        media: {
            id: 'alexa2.0.Echo-Devices.G0922J0633450KSK',
            speakerList:[],// leer heißt alle, sobald etwas drin steht, wird nur das angezeigt
            playList:['Apple-Music-Playlist.Rock'] // das vor dem . ist das Datenpunkt ende und das nach dem . was reingeschrieben werden soll
        },
        uniqueName:'alexa',
        parent:'main',
        items:[],
        scrollPresentation: 'classic'
    };
