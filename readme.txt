Config:
1. start PSNTracker.exe > benötigte Dateien werden erstellt > wird automatisch geschlossen, ggf. Windows Firewall zulassen.
2. NPSSO Key holen...
2.1 gehe auf https://my.playstation.com/ und logge dich ein
2.2 im selben Browser > geh auf https://ca.account.sony.com/api/v1/ssocookie und kopiere NPSSO Key (langer Schlüssel zwischen 2ten paar Anführungsstriche.)
3. öffne config.json in /data/db/ und ergänze npsso und psnId
4. PSNTracker.exe starten und offen lassen 

Steuerung über Browser:
PSNTracker: http://localhost/psn
Fehlende Trophäen: http://localhost/missing
Spielzeit: http://localhost/timer
Overlay: http://localhost/overlay

Integration in OBS durch Browser-Docks
1. OBS > Ansicht > Docks > Benutzerdefinierte Browser-Docks
2. 2 Docks erstellen (http://localhost/psn, http://localhost/missing)
3. Timer (http://localhost/timer) kann als Brwosersource in Overlay eingebunden werden


pkg server.js -o PSNTracker --config package.json --compress GZip