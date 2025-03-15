# PSNTracker
this is a small Tool for Trophyhunters and Streamers. It saves some Textfiles and create a HTML Overlay, to show your earned Trophies nearly (it checks in an defined interval) in realtime, by checking the Playstation Network API

What you need:
- your Playstation PSN Name
- NPSSO Cookie

To get the NPSSO Cookie - open your browser and login in to your Playstation Account: https://my.playstation.com/
then goto https://ca.account.sony.com/api/v1/ssocookie and copy the NPSSO Key

---
Start PSNTracker type in the PSNId you want to track and the copied NPSSO Key and let it run.
It looks like that:
![{E523FC26-64B6-4364-AF86-C1F30EBD2DAB}](https://github.com/user-attachments/assets/a3a0ecb9-b077-45ed-b438-23a3a1fbedb6)

When you start a Game on PS4, or PS5 the tracker recognize the Game and start tracking for trophy changes.


---

Open:
- https://localhost:port in your Browser or as a OBS Browsersource for a Trophyoverlay. You can customize the overlay by using obs custom css.
  ![{96132C8F-C1B7-4D36-BD70-FAF9360A8702}](https://github.com/user-attachments/assets/271db410-b7bb-4a5e-81da-caf9056b3694)

- https://localhost:port/trophies in your Browser to keep track of earned trophies. Toggle the Switch to show or hide earned Trophies
![{761C43D8-87EC-4ADD-B9B1-85C68D0CF945}](https://github.com/user-attachments/assets/1c3202c4-588b-4d5b-94c4-5fcfb30525eb)

- https://localhost:port/library in your Browser to load a list of your purchased PS4 and PS5 Games (for faster search) - gets updated if you purchase a new Game. Toggle the Switch to get a random Game from your collection.
![{365A3DE5-83EB-4494-9B76-57D3D09A5F06}](https://github.com/user-attachments/assets/300a8257-2f86-45ac-b3be-0308b360f6e4)


Textfiles with the necessary trophyinformations are created in the data folder. You can use this files as a textsource in obs.

---
Todo:
- make the trophy list page a little bit nicer, clean up css.
