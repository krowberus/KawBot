const { SlashCommandBuilder } = require('@discordjs/builders');
const fetch = require('node-fetch');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Dad jokes'),
	 	async execute(interaction) {
		await interaction.deferReply();
		const { joke } = await fetch('https://icanhazdadjoke.com', {          
            method: "GET",
            headers: { 
                'Accept': "application/json",
                'User-Agent': 'USER-AGENT' // Set Your Username Here. More Info: https://icanhazdadjoke.com/api#custom-user-agent
            },
        }).then(response => response.json());
		
        interaction.editReply({ content: joke });

	},
};

