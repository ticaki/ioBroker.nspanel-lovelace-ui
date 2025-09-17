## Configuración Básica (MQTT)
En la pestaña `General` se debe configurar MQTT y asignar el PIN para las páginas de servicio.  

  - Al usar el servidor MQTT interno (**del adaptador**), es posible llenar automáticamente los datos usando el botón. Esta función también busca un puerto libre para evitar problemas con otros adaptadores (ej. Shelly, Sonoff). Todas las configuraciones MQTT en Tasmota se sobrescriben y se adaptan al **servidor MQTT del adaptador**.  
  - Al usar un servidor MQTT externo (mosquitto o adaptador MQTT), los campos de abajo deben llenarse de acuerdo a su configuración.  
    - IP del servidor MQTT externo -> Para el adaptador MQTT, ingresar la IP de ioBroker.  
    - Puerto MQTT -> asegurarse de que el puerto no esté ya siendo usado por otro adaptador o servicio.  
    - Nombre de usuario y contraseña -> con los que Tasmota (Panel) debe autenticarse en el servidor.  

  <img alt= "Pantalla de inicio" src="../Pictures/Installation/Installation_Start.png" width="100%" height="100%"/>
  - después de guardar, se puede cambiar a la página `Configuración del Panel`. 

## Configuración del Panel  
  
  <img alt= "Panel Paso 1" src="../Pictures/Installation/Installation_Panels_1.png" width="100%" height="100%"/>  
  
- la dirección IP, si es posible configurar una IP fija en el router  
- asignar un nombre para el panel  
- el topic MQTT bajo el cual el panel escucha  
- el tipo de panel [EU, US-P, US-L]  
- seleccionar zona horaria  

Finalmente, hacer clic en el botón `Inicialización NSPanel`.  
Los datos MQTT y configuraciones de Tasmota se envían al panel y todas las configuraciones se establecen correctamente. Además, se instala el controlador Berry, así como el firmware NSPanel (aprox. 10 minutos).  
Después de la inicialización, el panel se ingresa automáticamente en la lista.  

<img alt= "Panel Paso 2" src="../Pictures/Installation/Installation_Panels_2.png" width="100%" height="100%"/>  
_No ejecutar información_
Con las herramientas Tasmota, que están principalmente disponibles para solución de problemas, se puede instalar/reinstalar el controlador Berry y el firmware TFT. Para esto, se selecciona la IP/Panel en el campo `IP del Panel`. Adicionalmente, es posible reiniciar Tasmota y saltar a la WebUI de Tasmota. (nueva ventana / popup) 
<img alt= "Panel Paso 3" src="../Pictures/Installation/Installation_Panels_3.png" width="100%" height="100%"/>
_continuar desde aquí_
Luego guardar las configuraciones y cerrar el admin una vez. Entonces se puede continuar con la [página Maintain](#maintain).

## Maintain  

<img alt= "Panel Paso 4" src="../Pictures/Installation/Installation_Panels_4.png" width="100%" height="100%"/>  

En la página `Maintain` seleccionar el panel y crear la versión actual del script de configuración a través del botón `Script`. Se guarda en el adaptador JavaScript en una carpeta con el nombre de la instancia del adaptador. El nombre del archivo coincide con el nombre del panel. Las otras configuraciones se explican en el capítulo [**Admin del Adaptador** / Maintain](Maintain).  

<img alt= "Panel Paso 5" src="../Pictures/Installation/Installation_Panels_5.png" width="50%" height="100%"/>

- el script de configuración 

[Script de Configuración de Ejemplo](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/script/example_sendTo_script_iobroker.ts)
  
Ahora ejecutar el script una vez (se termina automáticamente) y reiniciar la instancia. Si todo se hizo correctamente, la página de servicio debería aparecer ahora en el panel.  
Más explicaciones sobre este script se pueden encontrar aquí. [**Script de Configuración** / Introducción](ScriptConfig)  

Si tienes preguntas, pregunta - Discord, Foro, aquí, Telegram, Teams - todo está disponible :)


[Alias Tabelle](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/ALIAS.md)  
