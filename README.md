# PSNTracker
a Tool to show Live Overlays for Trophyhunters

This is Playstation Trophytracker - a Tool to show live overlays in OBS. I started coding it in 2021, fixes some Api related stuff and this is my messy Codebase. Maybe someone can make somthing nice of it.

I know, there are Bugs, no Localisation and stuff like this, but it works.

Use:
- start server.js (or PSNTacker.exe)
- close terminal > edit config file > insert npsso token & psnid > save
- start again

Frontend

http://localhost/psn
- Trophy Tracker designed to fit in an OBS Dock
- automaticly start tracking, when a ps4, or ps5 game is launched
![image](https://github.com/user-attachments/assets/1d28df09-5a1b-4cfb-901b-feb5d997f68e)

http://localhost/missing
- List of missing Trophies. Is updated when a Trophy is earned
![image](https://github.com/user-attachments/assets/4363db21-33f9-4a40-be6c-9686ff24cfdd)

http://localhost/timer
- Actual Playtime  
![image](https://github.com/user-attachments/assets/ba442e6e-8371-45bf-985a-365106bc97fe)

http://localhost/overlay
- you can change css
- overlay for earned trophies. shows different platinum picture for ps4, ps5.
![image](https://github.com/user-attachments/assets/79d7f735-c012-4bf7-8ba3-47797a9be816)
![image](https://github.com/user-attachments/assets/e26de516-cf34-442e-a3d7-be0dd977e9dc)


NOTE: Back in the days OBS wasn't capable of working with datalist html tag. I think now adays its posible to change it to datalist.

TODO: igdb implemantation & managing backlog.








