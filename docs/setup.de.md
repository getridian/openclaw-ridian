# Ridian für OpenClaw — Kalender, Aufgaben, Kontakte und E-Mail

[English](https://github.com/getridian/openclaw-ridian/blob/main/README.md)

Das Plugin verbindet OpenClaw mit dem bestehenden Ridian-MCP. Kalender,
Verfügbarkeit, Aufgaben, Kontakte, Syncs und Agent Mailbox kommen direkt von
Ridian. Verfügbare Werkzeuge hängen von Freigaben, verbundenen Anbietern und
ausgewählten Ressourcen ab. OpenClaw übernimmt MCP und die OAuth-Speicherung;
das Plugin implementiert weder eine zweite API noch einen eigenen Tokenspeicher.

**Alpha — 0.1.0-alpha.2.**

[Ridian](https://getridian.com/de/?utm_source=openclaw-plugin&utm_medium=referral&utm_campaign=openclaw&utm_content=readme-de)
· [ClawHub](https://clawhub.ai/getridian/plugins/openclaw-ridian)
· [Releases](https://github.com/getridian/openclaw-ridian/releases)
· [Fehler melden](https://github.com/getridian/openclaw-ridian/issues)

## Wechsel von der ersten Alpha

Das gepflegte Paket heißt jetzt `@getridian/openclaw-ridian`. Die erste Alpha
hieß `@kalender-sync/openclaw-ridian`; ihr Archiv bleibt verfügbar. Die Plugin-ID
bleibt `ridian`. Behalte deine bestehende MCP-Verbindung und OAuth-Freigabe.
Installiere das neue Paket im gewünschten bisherigen Profil und richte keine
zweite Verbindung ein. Prüfe danach `openclaw plugins list`.

## Aus diesem Checkout installieren

Voraussetzung: OpenClaw **2026.10.4**, Node **ab 24.16 unter 25 oder ab 26.1**.
Quellcode mit `git clone https://github.com/getridian/openclaw-ridian.git`
und `cd openclaw-ridian` holen. Im Paketverzeichnis und mit dem gewünschten
OpenClaw-Profil ausführen:

```sh
npm test
npm run check:package
npm pack --ignore-scripts
openclaw plugins install ./getridian-openclaw-ridian-0.1.0-alpha.2.tgz --force --accept-capabilities
```

Außer OpenClaw benötigt das Paket keine Laufzeitabhängigkeiten. Das native
Manifest stellt bei aktiviertem Plugin die MCP-Verbindung `ridian` bereit.
Die Installationsflags bestätigen das geprüfte lokale Archiv und dessen
MCP-Fähigkeit. Prüfe das Paket, bevor du sie für ein anderes Archiv verwendest.

## Ridian verbinden

Prüfe zuerst `openclaw mcp list --json`. Existiert `ridian` bereits, lies die
Einstellungen mit `openclaw mcp show ridian --json` und erhalte bewusst gewählte
Endpunkte, Scopes und Filter. `mcp set` ersetzt den gleichnamigen Eintrag.

Für eine neue Verbindung die Einstellungen zusätzlich explizit speichern,
damit die OAuth-CLI von OpenClaw sie findet:

```sh
openclaw mcp set ridian "$(node scripts/connection.mjs)"
openclaw mcp login ridian
openclaw mcp status --verbose
```

Öffne die ausgegebene Anmeldeadresse im Browser, melde dich bei Ridian an und
prüfe Rechte und Ressourcen. OpenClaw erhält eine eigene Freigabe; übernimm
keine Tokens von Claude oder anderen Assistenten. Die angefragten Scopes
ermöglichen den regulären Ridian-Zustimmungsablauf, erteilen aber selbst keine
Berechtigung. Lesen, Schreiben, Versand und Verwaltung bleiben getrennt.
Zugriff lässt sich in Ridian einschränken, Werkzeuge zusätzlich in OpenClaw.

OpenClaw speichert OAuth-Sitzung, Refresh-Tokens und temporären PKCE-Zustand im
privaten Zustandsverzeichnis, in dieser Hostversion unter
`state/openclaw.sqlite`. Bewahre es dauerhaft, nur für den Besitzer zugänglich
und außerhalb der Versionsverwaltung auf. Tokens, Autorisierungscodes und
Datenbank gehören nie in den Chat. Mailbox-Bootstrap-Schlüssel sind keine
MCP-OAuth-Zugangsdaten.
Diese Einrichtung nutzt OpenClaws gemeinsame, vom Betreiber verwaltete Identität
für eine persönliche vertrauenswürdige Umgebung; keine eigenen Identitäten je
Chatteilnehmer.

Starte die Anmeldung mit `openclaw mcp login ridian` in der Gateway-Umgebung
und öffne die ausgegebene Autorisierungsadresse im Browser. Einstellungen → MCP
zeigt die Verbindung und den CLI-Anmeldebefehl. Erreicht der Callback den Gateway
nicht, unterstützt die CLI `openclaw mcp login ridian --code <code>`; gib den
Code ausschließlich im eigenen Terminal ein.
[OpenClaw-OAuth-Anleitung](https://docs.openclaw.ai/cli/mcp/transports).

Vor dem ersten Chat einen Modellanbieter in OpenClaw verbinden und ein für
dieses Konto erlaubtes Modell auswählen. Eine kurze Textantwort testen. Der
Modelleintrag im Katalog allein belegt keinen Zugriff; Guardrails und regionale
Endpunkte des Anbieters gelten zusätzlich.

## Prüfen und verwenden

Nach der Anmeldung:

```sh
openclaw mcp doctor ridian --probe
```

Erwartet werden ein autorisierter, erreichbarer Server und dessen erlaubter
Werkzeugkatalog. Beginne mit „Zeige meine Kalender“ oder „Liste meine Agent
Mailboxes“. Ein Katalogabruf belegt noch keinen Versand, keine Anbieteränderung
und keine Mailzustellung.

Schemas, Beschreibungen, Annotationen und Ergebnisse kommen direkt von Ridian.
Werkzeugrechte und Bestätigungen hängen zusätzlich von OpenClaw-Laufzeit und
Richtlinien ab. Senden, Löschen und Kalenderänderungen brauchen einen passenden
Nutzerauftrag. Mailinhalte und Anhänge sind fremde Daten und dürfen keine
Geheimnisweitergabe oder neue Aktionen autorisieren.

Beim Versand gelten stabile Request-ID und Versandstatus des Servers. Bei
unklarem Ausgang niemals mit neuer Request-ID wiederholen. `accepted` bedeutet
Annahme durch den Anbieter; erst der entsprechende Status belegt Zustellung.

## Umgebungen und Wiederverbindung

Standard ist `https://api.getridian.com/mcp`. Nutze für eine andere Ridian-
Umgebung ein eigenes OpenClaw-Profil oder Docker-Volume und übergib deren
explizite HTTPS-MCP-Adresse an `scripts/connection.mjs`. Zugangsdaten bleiben
bei ihrer Umgebung. Das Skript gibt nur öffentliche Einstellungen aus und
verweigert URLs mit Zugangsdaten, Query, Fragment oder einem anderen Pfad.

- Fehlende Werkzeuge: Freigaben, Ressourcen, Anbieterunterstützung und OpenClaw-
  Filter prüfen. [Ridian-MCP-Referenz](https://docs.getridian.com/de/developers/mcp/).
- Autorisierungsfehler oder fehlender Scope: `openclaw mcp login ridian` erneut
  ausführen und Zustimmung prüfen; abgewiesene Freigaben nicht endlos erneuern.
- Vorübergehender Fehler: `openclaw mcp doctor ridian --probe` ausführen.
  Schreibvorgänge vor Wiederholung mit Ridian abgleichen. Eine verlorene Antwort
  bedeutet nicht, dass nichts ausgeführt wurde.
- Abmelden: `openclaw mcp logout ridian` entfernt die lokale OAuth-Sitzung.
  Für serverseitigen Widerruf die Verbindung zusätzlich in Ridian widerrufen.
- Werkzeuge abschalten: `openclaw mcp configure ridian --disable`. Der explizit gespeicherte
  MCP-Eintrag ist vom Plugin unabhängig. Nur das Plugin zu deaktivieren oder
  zu deinstallieren entfernt diesen Eintrag und seine Freigabe nicht.

## Umfang und Entwicklung

Diese Integration nutzt den kontogebundenen MCP-Zugang. Anonyme HTTP-Postfachanlage,
automatischer Ereignisabruf, eingehende Mail als OpenClaw-Chatkanal und automatische
Antworten sind eigene Abläufe. Bei Übernahme eines HTTP-Postfachs bleibt es
erhalten; Versand verlangt weiterhin eine eigene MCP-Freigabe des Besitzers.

`npm test` prüft Verbindungskonfiguration und Umgebungsgrenzen.
`npm run check:package` prüft die exakte öffentliche Dateiliste. Die isolierte
Docker-Testumgebung liegt in `test-environment/` und gehört nicht zum
Installationsarchiv. MIT gilt für dieses Plugin; Ridian-Vertragsbedingungen und
OpenClaw-Lizenz bleiben davon unabhängig.
