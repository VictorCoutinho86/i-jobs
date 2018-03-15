require('dotenv-extended').load();
const builder = require('botbuilder');
const restify = require('restify');
const cognitive = require('botbuilder-cognitiveservices');
const server = restify.createServer();
const request = require('request')
const port = process.env.port || 3978;

const url_busca = process.env.ENDPOINT_API;


server.listen(port, () => {
    console.log(`Servidor rodando em ${server.url}`)
});


const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

const bot = new builder.UniversalBot(connector)

bot.set('storage', new builder.MemoryBotStorage())
server.post('/api/messages', connector.listen())

const luis = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)


const intents = new builder.IntentDialog({
    recognizers: [luis]
})

/**
 * Default function
 * In case of Luis don't understand the sentence or if intent is understanded but not implemented in this program
 * @returns String = Sorry message for users
 */
intents.onDefault((session, args) => {
    console.log(JSON.stringify(args))
    session.send('Desculpe, não entendi sua solicitação!')
})

/**
 * Intent if user is looking for job
 * Luis looks if the sentence contaning the job for the person search
 * If exists, the function send to the endpoint for search on the internet
 * If not, ask users to say what jobs he search
 * @param funcao = String get by the Entities identify by Luis
 * @returns vagas = json with jobs match with funcao 
 */
intents.matches('oportunidades', (session, args, next) => {
    console.log(JSON.stringify(args))
    const funcao = builder.EntityRecognizer.findAllEntities(args.entities, 'funcao').map(m => m.entity).join(' ')
    if (funcao) {
        const endpoint = `${url_busca}${funcao}`
        session.send('Aguarde enquanto busco as oportunidades.')
        request(endpoint, (error, response, body) => {
            if (error || !body)
                return session.send('Ocorreu algum erro, tente novamente mais tarde.')
            const vagas = JSON.parse(body);
            console.log(JSON.stringify(body))
            for (vaga in vagas) {
                session.send(vagas.map(m => `${m.titulo}\n ${m.localidade}\n ${m.url}`))
            }
        })
    } else {
        session.send('Que tipo de oportunidades você procura?')
    }
})

intents.matches('cumprimento.formal', (session, args, next) => {
    console.log(JSON.stringify(args))
    const saudar = builder.EntityRecognizer.findAllEntities(args.entities, 'saudar').map(m => m.entity).join('+')
    if (saudar) {
        if (saudar == 'bom+dia') { session.send('Bom dia, em que posso lhe ajudar?') }
        if (saudar == 'boa+tarde') { session.send('Boa tarde, Em que posso ser útil?') }
        if (saudar == 'boa+noite') { session.send('Boa noite, posso lhe ajudar em algo?') }
    } else {
        session.send('Olá, eu sou um Bot buscador de vagas na internet!')
        setTimeout(function () {
            session.send('O que você deseja procurar?')
        }, 2000)
    }
})
bot.dialog('/', intents)
