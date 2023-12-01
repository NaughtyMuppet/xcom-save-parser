# Xcom Save Parser

## Prior art

* https://github.com/tracktwo/xcomsave
* https://wiki.nexusmods.com/index.php/Savegame_file_format_-_XCOM:EU_2012
* https://www.tapatalk.com/groups/me3explorer/xcom-eu-ew-save-structure-t978-s10.html

## Current status

* Parsing a strategy layer save seems to work completely.
* Tactical layer parse sort of works, but only parses about half of the data. I assume there's some extra info in the tactical layer that I don't know how to parse yet.

## CLI Usage

```
npx github:NaughtyMuppet/xcom-save-parser save99
```
