# PageTrash

> **Note:** PageTrash is **not** a separate script page type. It is created in the admin **PageConfig** tab (card type **Trash**, `cardTrash`); internally the adapter turns it into a `cardEntities` resp. `cardSchedule` page.

<img alt='panel-view-4' src='Pictures/pageTrash/panel-ansicht-4.png' width="40%"><img alt='panel-view-6' src='Pictures/pageTrash/panel-ansicht-6.png' width="40%">

PageTrash replaces the [external script](https://github.com/tt-tom17/MyScripts/blob/main/Sonoff_NSPanel/Abfall_to%20NSPanel.ts) by tt-tom (tt-tom17) and the page configuration in the script as cardEntities resp. cardSchedule.
In the configuration the appointment file (ics format) from the waste collector can be loaded directly into the adapter, or the **table** state from the iCal adapter can still be used.

<img alt='pageConfigiCal' src='Pictures/pageTrash/config_ical.png' width="45%">
<img alt='pageConfig' src='Pictures/pageTrash/config.png' width="45%">

---
### Description of the fields
#### Headline
=> should be clear ;)

#### Layout
=> determines how many appointments are read in and which card is used for it. See above

#### Import type
=> here you decide whether the state from the iCal adapter is used or the .ics file is read directly

<table>
<thead>
<tr>
<th>iCal adapter</th>
<th>ics file</th>
</tr>
</thead>
<tbody>
<tr>
<td><b>JSON state - button "..."</b><br/><br/>=> via the button the state from the iCal adapter is selected that contains the waste appointments, e.g. ical.0.data.table<br/><br/><b>Button "search events"</b><br/><br/>When the state is selected, click the button to see the results from the iCal adapter.</td>
<td><b>.ics file incl. path</b><br/><br/>=> if the file is already on the ioBroker, the direct path must be specified here<br/><br/><b>Button "upload file"</b><br/><br/>Clicking the button opens a window to select the .ics file. After uploading, the path is automatically entered into the text field and the results are shown.</td>
</tr>
<tr>
<td colspan="2"><b>Found results</b><br/><br/>Select the desired waste types and apply. The data is automatically entered below in the waste types.</td>
</tr>
</tbody>
</table>

<img alt='trash_select' src='Pictures/pageTrash/trash_select.png'>

---
#### Colour field
=> selection of the icon colour

#### Waste type
=> enter the search text for the waste type here. A small example: in the data from the iCal adapter there is a value **event** containing the waste type.
```json
{"date":"03.02.2026  ","event":"Place - Street - Paper",
"_class":"ical_Abfall ","_date":"2026-02-02T23:00:00.000Z",
"_end":"2026-02-03T23:00:00.000Z", ...
}
```
To find this event, the search text **Paper** must be entered. Note that the search is case-sensitive.

#### Optional custom label
=> here a custom text can be entered to be displayed, e.g. "Paper bin" instead of Paper.

<img alt='trash_layout' src='Pictures/pageTrash/trash_layout.png'>
