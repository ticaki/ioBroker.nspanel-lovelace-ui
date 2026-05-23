# PageConfig

**Content**
+ [General info](#general-info)
+ [Overview](#overview)
    + [New page](#add-a-new-page)
+ [Configuration](#page-configuration)
+ [Navigation and standard properties](#navigation--standard-properties)

<img alt='pageConfig' src='Pictures/pageConfig/pageQR_config.png'>

## General info
In the PageConfig tab, pages are created directly in the admin and are thus available to all panels. No config is created in the script for them. The page configuration and the navigation are defined here.

The tab is divided into three areas. On the right is the [overview](#overview) of pages, in the middle is the [configuration](#page-configuration) of the page, and on the left (the panel can be shown/hidden) the [navigation and standard properties](#navigation--standard-properties) of the page are set.

## Overview

The overview shows all pages created in the admin. You can filter by page type; available are: **All**, **Menu page** (`pageMenu`), **Alarm** (`cardAlarm`), **QR** (`cardQR`) and **Trash** (`cardTrash`). When a page is selected, the "Documentation" link jumps directly to the wiki for more info.

> [!NOTE]
> The page types **PagePower** and **PageChart** are **not** configured here, but via their own admin tabs [Page Power](en-PagePower) resp. [Page Chart](en-PageChart).

<img alt='pageConfig' src='Pictures/pageConfig/ansicht_pages.png' width="40%" height="40%">

---
### Add a new page

1. Select the page type
2. Define a name for the new page. This name **must** be unique in the **adapter**.
3. Click the plus button
4. The configuration for the page appears in the centre.

<img alt='pageConfig' src='Pictures/pageConfig/added_new_page.png' width="40%" height="40%">

## Page configuration

The page configuration is described separately for each page. You can jump to the pages via the menu or from here.

+ [Menu page (cardGrid)](en-cardGrid)
+ [pageQR](en-cardQR)
+ [pageAlarm / pageUnlock](en-cardAlarm)
+ [pageTrash](en-cardTrash)

## Navigation / standard properties

<img alt='pageConfig' src='Pictures/pageConfig/navigation_Panels.png' width="40%" height="40%">

In the left "Navigation/Panel" pane, the **"Navigation"** tab sets the position in the page hierarchy. First select the panel or "all", then choose before or after which page the current page should sit.
> [!NOTE]
> Use only one of the fields **Prev** or **Next**. For the fields **Home** and **Parent** the house symbol resp. up arrow is shown and the chosen page is defined as the target.

<img alt='pageConfig' src='Pictures/pageConfig/standardSetting_pages.png' width="40%" height="40%">

The **"Page details"** tab controls whether the page is hidden when the state **nspanel-lovelace-ui.0.panels.C0_49_XX_XX_XX_XX.cmd.hideCards** is set to true.
It also controls the screensaver behaviour for this page.
+ **Standard timeout** → screensaver appears after x seconds.
+ **never activate** → page stays visible until you manually switch to the next page.
+ **inherit from previous page** → takes over the setting of the previous page.
