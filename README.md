<div align="center">
  <center><h1>🤖KawBot🤖</h1></center>
</div>
<div align="center"><center>
<p>KawBot was primarily created as a basic Discord bot written using Discord.js v13. <br>

While future releases of Discord.js will release, no major updates for KawBot will follow.

It's main functions, as shown below, should still function as intended if you wish to utilize them.

Make sure to keep up-to-date with the future [Discord JS](https://discord.js.org/) releases and NPM packages.
</p></center></div>

<div align="center">
  <center><h1>⚙Functionality⚙</h1></center>
</div>

- Basic SlashCommand handling.<br> 
- User Welcome Messages and Leave Messages<br>
- SQLite3 and Sequelize Database Storage.<br> 
- Ko-Fi to Discord Notifications.<br><br>


<div align="center">
  <center><h1>📝Developer Notes📝</h1></center>
</div>

<div align="center"><center><p> 
While some minor tweaks may occur here and there, keep in mind overall code will remain <b><u>as is</u></b><br>
When working with these files, you're free to modify and update accordingly,<br>
just install and update the following:</p></center></div>

<b>📦Node Packages:</b>
- Discord.js 
- Express.js
- Sequelize
- SQLite3
- Events
<div align="center"><center><p> 

<b>Manually install the packages via</b>: <br><i>npm install package@latest --save</i> 
<br><br><b>Automatically update the packages via:</b> <br><i>npm update --save </i> <br><br>
</p></center></div>

<b>⚙[Config](https://github.com/Krowatic/KawBot/blob/main/config.json) </b>

- Add in the associated Channel ID(s).
- Add in your associated Guild ID(s).

<b>⚙[.Env](https://github.com/Krowatic/KawBot/blob/main/.env)</b>

- <b>CLIENT_TOKEN:</b> Replace the <i>"Discord Bot Token"</i> with your Client Application Token.

- <b>KOFI_TOKEN:</b> Replace the <i>"KOFI API TOKEN"</i> with your [Verification Token](https://ko-fi.com/manage/webhooks?src=sidemenu) (under Advanced)

<b>💻[Joke Command API](https://github.com/Krowatic/KawBot/blob/main/SlashCommands/joke.js)</b>

- Update the <b>'User-Agent': 'string'</b> header with your username. [Example](https://icanhazdadjoke.com/api#custom-user-agent)
