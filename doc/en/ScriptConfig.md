# Explanations for the Configuration Script for the Adapter

There are three areas in the script:  
- [Page Configuration](#page-configuration)
```typescript
        /***********************************************************************
         **                                                                   **
         **                       Page Configuration                          **
         **                                                                   **
         ***********************************************************************/
```  
  
- [Screensaver Configuration](#screensaver)
``` typescript
        /***********************************************************************
         **                                                                   **
         **                    Screensaver Configuration                      **
         **                                                                   **
         ***********************************************************************/
```
  
- Code Area  
Changes in the code area are not necessary for the user. If script updates become available, they can be applied via the [Maintain page](Maintain) of the admin interface.
```typescript
    /**
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     *  END STOP END STOP END - No more configuration - END STOP END STOP END       *
     ********************************************************************************
     *  For a update copy and paste the code below from orginal file.               *
     * ******************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     ********************************************************************************
     */
```  

## Page Configuration   
  
The configuration of the pages is almost the same as in the Panel Script. There are a few important points that differ from the Panel_Script.  
- Each page needs the property `uniqueName` -> This is a unique name for the page.   
- The main page must have **main** as `uniqueName`  
- `next`, `prev`, `home`, `parent` must be **strings** that reference one of the `uniqueName`.
- Pages that are entered in `pages` are linked together in a circle, all other pages that should be used must be listed in `subPages`. 
- The first line has also changed slightly. From `let main: Pagetype ={` becomes `const main: ScriptConfig.PageGrid = {` The Page behind `ScriptConfig` matches the type `cardxxx`. Here in the example PageGrid = cardGrid.  
- `button1` and `button2` ***have a new configuration*** more about this [here](#hardwarebutton-config)


Here is an example for a main page   
```typescript
const main: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Living Room',
    useColor: true,
    items: [
        // PageItems go here
    ]
};
```
  
Here is a subpage  
```typescript
   const lichttest: ScriptConfig.PageEntities = {
        type: 'cardEntities',
        heading: 'Light Test',
        uniqueName: 'lichttest',
        home: 'main',
        prev: 'gate',
        useColor: true,
        items: [
            // PageItems go here
        ]
    };
```  
  
* `const PageName:` -> The word _PageName_ is a placeholder here. You give the page a unique name here, but please without spaces for multiple words and avoid special characters.  
* `'type':` -> The type of the page, as already described. PageType and type always have the same postfix. With type it is CardType instead of PageType. Consequently we have here in quotes 'cardEntities' or 'cardGrid', etc.  
* `'heading':` -> The page name or title that is displayed on the page on the NSPanel at the top center. It must be enclosed in quotes.   
* `'items':` ->  Here the actual content of the page is entered. For each element to be displayed, you enter a so-called `PageItem` which then receives the parameters to be displayed.  

---  
## Optional Parameters  

        useColor?: boolean;
        subPage?: boolean;
        parent?: string;
        parentIcon?: string;
        parentIconColor?: RGB;
        prev?: string;
        prevIcon?: string;
        prevIconColor?: RGB;